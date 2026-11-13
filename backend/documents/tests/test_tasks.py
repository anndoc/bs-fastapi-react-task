from dataclasses import dataclass, field
from datetime import UTC, datetime, timedelta
from pathlib import Path
from uuid import UUID, uuid4

import pytest
from pypdf import PdfWriter
from pypdf.generic import ContentStream, DictionaryObject, NameObject
from sqlmodel import col, select
from sqlmodel.ext.asyncio.session import AsyncSession

from common.tests import fixtures
from documents import tasks
from documents.constants import (
    EMBEDDING_DIMENSIONS,
    PROCESSING_MAX_ATTEMPTS,
    PROCESSING_STALE_AFTER,
    DocumentStatus,
)
from documents.models import Document, Embedding
from documents.tasks import process_document
from documents.tests.factories import DocumentFactory

pytestmark = pytest.mark.anyio


@dataclass
class FlakyEmbeddings:
    failing_calls: set[int] = field(default_factory=set)
    invalid_vectors: bool = False
    calls: list[list[str]] = field(default_factory=list)

    async def aembed_documents(self, texts: list[str]) -> list[list[float]]:
        self.calls.append(texts)
        if len(self.calls) in self.failing_calls:
            if self.invalid_vectors:
                return [[0.0]] * len(texts)
            raise RuntimeError("Embedding service is unavailable")
        return [[0.0] * EMBEDDING_DIMENSIONS for _ in texts]


@pytest.fixture(autouse=True)
def embeddings(monkeypatch: pytest.MonkeyPatch) -> FlakyEmbeddings:
    monkeypatch.setattr(tasks, "session_factory", fixtures.session_factory)
    monkeypatch.setattr(tasks, "PROCESSING_RETRY_DELAY_SECONDS", 0)
    fake = FlakyEmbeddings()
    monkeypatch.setattr(tasks, "embeddings", fake)
    return fake


def write_pdf(path: Path, pages: list[str]) -> Path:
    font = DictionaryObject(
        {
            NameObject("/Type"): NameObject("/Font"),
            NameObject("/Subtype"): NameObject("/Type1"),
            NameObject("/BaseFont"): NameObject("/Helvetica"),
        }
    )
    writer = PdfWriter()
    for text in pages:
        page = writer.add_blank_page(612, 792)
        page[NameObject("/Resources")] = DictionaryObject(
            {NameObject("/Font"): DictionaryObject({NameObject("/F1"): font})}
        )
        content = ContentStream(None, writer)
        content.set_data(f"BT /F1 12 Tf 72 720 Td ({text}) Tj ET".encode())
        page.replace_contents(content)
    writer.write(path)
    return path


async def reload(session: AsyncSession, document: Document) -> Document:
    reloaded = await session.get(Document, document.id, populate_existing=True)
    assert reloaded is not None
    return reloaded


async def embedded_chunks(
    session: AsyncSession, document_id: UUID
) -> list[tuple[int, str]]:
    rows = await session.exec(
        select(Embedding)
        .where(Embedding.document_id == document_id)
        .order_by(col(Embedding.page), col(Embedding.created_at))
    )
    return [(row.page, row.text) for row in rows]


async def test_process_txt_document(session: AsyncSession, tmp_path: Path) -> None:
    path = tmp_path / "notes.txt"
    path.write_text("Some notes")
    document = await DocumentFactory.create(path=str(path))

    await process_document(document.id)

    document = await reload(session, document)
    assert document.status == DocumentStatus.completed
    assert document.error == ""
    assert await embedded_chunks(session, document.id) == [(1, "Some notes")]


async def test_process_pdf_document(session: AsyncSession, tmp_path: Path) -> None:
    path = write_pdf(tmp_path / "report.pdf", ["First page", "Second page"])
    document = await DocumentFactory.create(path=str(path))

    await process_document(document.id)

    document = await reload(session, document)
    assert document.status == DocumentStatus.completed
    assert await embedded_chunks(session, document.id) == [
        (1, "First page"),
        (2, "Second page"),
    ]


async def test_process_splits_page_into_chunks(
    session: AsyncSession, tmp_path: Path
) -> None:
    text = " ".join(f"word{index}" for index in range(500))
    path = tmp_path / "long.txt"
    path.write_text(text)
    document = await DocumentFactory.create(path=str(path))

    await process_document(document.id)

    chunks = tasks.splitter.split_text(text)
    assert len(chunks) > 1
    assert await embedded_chunks(session, document.id) == [
        (1, chunk) for chunk in chunks
    ]


async def test_process_resumes_from_failed_page_after_database_error(
    session: AsyncSession, tmp_path: Path, embeddings: FlakyEmbeddings
) -> None:
    path = write_pdf(tmp_path / "report.pdf", ["Page 1", "Page 2", "Page 3"])
    document = await DocumentFactory.create(path=str(path))
    embeddings.failing_calls = {2}
    embeddings.invalid_vectors = True

    await process_document(document.id)

    document = await reload(session, document)
    assert document.status == DocumentStatus.completed
    assert embeddings.calls == [["Page 1"], ["Page 2"], ["Page 2"], ["Page 3"]]
    assert await embedded_chunks(session, document.id) == [
        (1, "Page 1"),
        (2, "Page 2"),
        (3, "Page 3"),
    ]


async def test_process_resumes_stale_document_after_last_embedded_page(
    session: AsyncSession, tmp_path: Path, embeddings: FlakyEmbeddings
) -> None:
    path = write_pdf(tmp_path / "report.pdf", ["Page 1", "Page 2", "Page 3"])
    stale_at = datetime.now(UTC) - PROCESSING_STALE_AFTER - timedelta(minutes=1)
    document = await DocumentFactory.create(
        path=str(path), status=DocumentStatus.processing, modified_at=stale_at
    )
    session.add(
        Embedding(
            document_id=document.id,
            page=1,
            text="Page 1",
            vector=[0.0] * EMBEDDING_DIMENSIONS,
        )
    )
    await session.commit()

    await process_document(document.id)

    document = await reload(session, document)
    assert document.status == DocumentStatus.completed
    assert document.modified_at > stale_at
    assert embeddings.calls == [["Page 2"], ["Page 3"]]
    assert await embedded_chunks(session, document.id) == [
        (1, "Page 1"),
        (2, "Page 2"),
        (3, "Page 3"),
    ]


async def test_process_succeeds_on_retry(
    session: AsyncSession, tmp_path: Path, embeddings: FlakyEmbeddings
) -> None:
    path = tmp_path / "notes.txt"
    path.write_text("Some notes")
    document = await DocumentFactory.create(path=str(path))
    embeddings.failing_calls = {1}

    await process_document(document.id)

    document = await reload(session, document)
    assert document.status == DocumentStatus.completed
    assert document.error == ""
    assert len(embeddings.calls) == 2
    assert await embedded_chunks(session, document.id) == [(1, "Some notes")]


async def test_process_fails_after_max_attempts(
    session: AsyncSession, tmp_path: Path, embeddings: FlakyEmbeddings
) -> None:
    path = tmp_path / "notes.txt"
    path.write_text("Some notes")
    document = await DocumentFactory.create(path=str(path))
    embeddings.failing_calls = set(range(1, PROCESSING_MAX_ATTEMPTS + 1))

    await process_document(document.id)

    document = await reload(session, document)
    assert document.status == DocumentStatus.failed
    assert document.error == "Embedding service is unavailable"
    assert len(embeddings.calls) == PROCESSING_MAX_ATTEMPTS
    assert await embedded_chunks(session, document.id) == []


async def test_process_fails_when_file_cannot_be_loaded(
    session: AsyncSession, tmp_path: Path
) -> None:
    path = tmp_path / "missing.txt"
    document = await DocumentFactory.create(path=str(path))

    await process_document(document.id)

    document = await reload(session, document)
    assert document.status == DocumentStatus.failed
    assert str(path) in document.error


@pytest.mark.parametrize(
    ("status", "modified_at"),
    [
        (DocumentStatus.processing, datetime.now(UTC)),
        (DocumentStatus.completed, datetime.now(UTC) - 2 * PROCESSING_STALE_AFTER),
        (DocumentStatus.failed, datetime.now(UTC) - 2 * PROCESSING_STALE_AFTER),
    ],
    ids=["processing", "completed", "failed"],
)
async def test_process_skips_unclaimable_document(
    session: AsyncSession,
    tmp_path: Path,
    embeddings: FlakyEmbeddings,
    status: DocumentStatus,
    modified_at: datetime,
) -> None:
    path = tmp_path / "notes.txt"
    path.write_text("Some notes")
    document = await DocumentFactory.create(
        path=str(path), status=status, modified_at=modified_at
    )

    await process_document(document.id)

    document = await reload(session, document)
    assert document.status == status
    assert embeddings.calls == []


async def test_process_skips_locked_document(
    session: AsyncSession, tmp_path: Path, embeddings: FlakyEmbeddings
) -> None:
    path = tmp_path / "notes.txt"
    path.write_text("Some notes")
    document = await DocumentFactory.create(path=str(path))
    await session.exec(
        select(Document).where(Document.id == document.id).with_for_update()
    )

    await process_document(document.id)

    await session.rollback()
    document = await reload(session, document)
    assert document.status == DocumentStatus.pending
    assert embeddings.calls == []


async def test_process_ignores_missing_document(
    session: AsyncSession, embeddings: FlakyEmbeddings
) -> None:
    await process_document(uuid4())

    assert embeddings.calls == []
    assert (await session.exec(select(Embedding))).all() == []

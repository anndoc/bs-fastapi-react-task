from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Any
from uuid import UUID, uuid4

import pytest
from httpx import AsyncClient, Response
from pydantic import TypeAdapter
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from documents import services
from documents.constants import MAX_FILE_SIZE, DocumentStatus
from documents.models import Document
from documents.tests.factories import DocumentFactory, UploadFileFactory

pytestmark = pytest.mark.anyio


@pytest.fixture(autouse=True)
def documents_dir(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> Path:
    monkeypatch.setattr(services, "DOCUMENTS_DIR", tmp_path)
    return tmp_path


async def upload(client: AsyncClient, upload_file: dict[str, Any]) -> Response:
    return await client.post(
        "/api/documents/",
        files={
            "file": (
                upload_file["filename"],
                upload_file["content"],
                upload_file["content_type"],
            )
        },
    )


@pytest.mark.parametrize(("pdf", "suffix"), [(False, ".txt"), (True, ".pdf")])
async def test_upload_saves_file_and_document(
    client: AsyncClient,
    session: AsyncSession,
    documents_dir: Path,
    pdf: bool,
    suffix: str,
) -> None:
    upload_file = UploadFileFactory.create(pdf=pdf)

    response = await upload(client, upload_file)

    assert response.status_code == 201
    body = response.json()
    assert set(body) == {"id", "file_name", "size", "status", "modified_at"}
    assert body["file_name"] == upload_file["filename"]
    assert body["size"] == len(upload_file["content"])
    assert body["status"] == DocumentStatus.pending

    document = await session.get(Document, UUID(body["id"]))
    assert document is not None
    assert document.status == DocumentStatus.pending
    assert document.file_name == upload_file["filename"]
    assert Path(document.path) == documents_dir / f"{document.id}{suffix}"
    assert Path(document.path).read_bytes() == upload_file["content"]


async def test_upload_accepts_file_of_max_size(client: AsyncClient) -> None:
    response = await upload(
        client, UploadFileFactory.create(content=b"a" * MAX_FILE_SIZE)
    )

    assert response.status_code == 201


async def test_upload_accepts_content_type_with_charset(client: AsyncClient) -> None:
    response = await upload(
        client, UploadFileFactory.create(content_type="text/plain; charset=utf-8")
    )

    assert response.status_code == 201


@pytest.mark.parametrize(
    ("upload_file", "status_code"),
    [
        (UploadFileFactory.create(content=b"a" * (MAX_FILE_SIZE + 1)), 413),
        (UploadFileFactory.create(content=b""), 422),
        (UploadFileFactory.create(filename="report.docx"), 415),
        (UploadFileFactory.create(filename="report"), 415),
        (UploadFileFactory.create(pdf=True, content_type="text/plain"), 415),
        (UploadFileFactory.create(content_type="application/octet-stream"), 415),
    ],
    ids=[
        "too_large",
        "empty",
        "unsupported_extension",
        "no_extension",
        "type_mismatch",
        "unsupported_content_type",
    ],
)
async def test_upload_rejects_invalid_file(
    client: AsyncClient,
    session: AsyncSession,
    documents_dir: Path,
    upload_file: dict[str, Any],
    status_code: int,
) -> None:
    response = await upload(client, upload_file)

    assert response.status_code == status_code
    assert (await session.exec(select(Document))).all() == []
    assert list(documents_dir.iterdir()) == []


async def test_list_documents(client: AsyncClient) -> None:
    now = datetime.now(UTC)
    oldest = await DocumentFactory.create(created_at=now - timedelta(hours=2))
    newest = await DocumentFactory.create(created_at=now)
    middle = await DocumentFactory.create(created_at=now - timedelta(hours=1))
    documents = [newest, middle, oldest]

    response = await client.get("/api/documents/")

    assert response.status_code == 200
    expected = [
        {
            "id": str(document.id),
            "file_name": document.file_name,
            "size": document.size,
            "status": document.status,
            "modified_at": TypeAdapter(datetime).dump_python(
                document.modified_at, mode="json"
            ),
        }
        for document in documents
    ]
    assert response.json() == expected


async def test_list_documents_returns_empty_list(client: AsyncClient) -> None:
    response = await client.get("/api/documents/")

    assert response.status_code == 200
    assert response.json() == []


async def test_delete_document_removes_row_and_file(
    client: AsyncClient, session: AsyncSession, documents_dir: Path
) -> None:
    path = documents_dir / "document.txt"
    document = await DocumentFactory.create(path=str(path))
    path.write_bytes(b"content")

    response = await client.delete(f"/api/documents/{document.id}")

    assert response.status_code == 204
    assert (await session.exec(select(Document))).all() == []
    assert not path.exists()


async def test_delete_document_returns_404(client: AsyncClient) -> None:
    response = await client.delete(f"/api/documents/{uuid4()}")

    assert response.status_code == 404

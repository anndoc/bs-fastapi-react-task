from datetime import UTC, datetime, timedelta
from pathlib import Path
from uuid import UUID

import pytest
from sqlmodel.ext.asyncio.session import AsyncSession

from common import worker
from common.tests import fixtures
from documents import tasks
from documents.constants import PROCESSING_STALE_AFTER, DocumentStatus
from documents.models import Document
from documents.tests.factories import DocumentFactory

pytestmark = pytest.mark.anyio


@pytest.fixture(autouse=True)
def use_test_database(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(worker, "session_factory", fixtures.session_factory)
    monkeypatch.setattr(tasks, "session_factory", fixtures.session_factory)


@pytest.fixture
def processed(monkeypatch: pytest.MonkeyPatch) -> list[UUID]:
    document_ids: list[UUID] = []

    async def record(document_id: UUID) -> None:
        document_ids.append(document_id)

    monkeypatch.setattr(worker, "process_document", record)
    return document_ids


async def test_process_picks_pending_and_stale_documents_in_upload_order(
    processed: list[UUID],
) -> None:
    now = datetime.now(UTC)
    stale_at = now - PROCESSING_STALE_AFTER - timedelta(minutes=1)
    stale = await DocumentFactory.create(
        status=DocumentStatus.processing,
        created_at=now - timedelta(hours=2),
        modified_at=stale_at,
    )
    pending = await DocumentFactory.create(created_at=now - timedelta(hours=3))
    await DocumentFactory.create(status=DocumentStatus.processing)
    await DocumentFactory.create(status=DocumentStatus.completed, modified_at=stale_at)
    await DocumentFactory.create(status=DocumentStatus.failed, modified_at=stale_at)

    await worker.process()

    assert processed == [pending.id, stale.id]


async def test_process_logs_when_nothing_to_process(
    processed: list[UUID], caplog: pytest.LogCaptureFixture
) -> None:
    await DocumentFactory.create(status=DocumentStatus.completed)

    with caplog.at_level("INFO", logger=worker.__name__):
        await worker.process()

    assert processed == []
    assert "Nothing to process." in caplog.messages


async def test_process_continues_after_document_crashes(
    monkeypatch: pytest.MonkeyPatch, caplog: pytest.LogCaptureFixture
) -> None:
    first = await DocumentFactory.create(
        created_at=datetime.now(UTC) - timedelta(minutes=1)
    )
    second = await DocumentFactory.create()
    processed: list[UUID] = []

    async def crash_on_first(document_id: UUID) -> None:
        processed.append(document_id)
        if document_id == first.id:
            raise RuntimeError("Database is unavailable")

    monkeypatch.setattr(worker, "process_document", crash_on_first)

    await worker.process()

    assert processed == [first.id, second.id]
    assert f"Processing {first.id} crashed." in caplog.messages


async def test_process_completes_pending_documents(
    session: AsyncSession, tmp_path: Path
) -> None:
    path = tmp_path / "notes.txt"
    path.write_text("Some notes")
    document = await DocumentFactory.create(path=str(path))

    await worker.process()

    processed_document = await session.get(
        Document, document.id, populate_existing=True
    )
    assert processed_document is not None
    assert processed_document.status == DocumentStatus.completed

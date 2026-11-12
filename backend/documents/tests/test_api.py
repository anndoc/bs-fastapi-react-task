from pathlib import Path
from typing import Any
from uuid import UUID

import pytest
from httpx import AsyncClient, Response
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from documents import services
from documents.constants import MAX_FILE_SIZE
from documents.models import Document, DocumentStatus
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
    client: AsyncClient, session: AsyncSession, documents_dir: Path, pdf: bool, suffix: str
) -> None:
    upload_file = UploadFileFactory(pdf=pdf)

    response = await upload(client, upload_file)

    assert response.status_code == 201
    body = response.json()
    assert set(body) == {"id", "file_name", "status"}
    assert body["file_name"] == upload_file["filename"]
    assert body["status"] == DocumentStatus.pending

    document = await session.get(Document, UUID(body["id"]))
    assert document is not None
    assert document.status == DocumentStatus.pending
    assert document.file_name == upload_file["filename"]
    assert Path(document.path) == documents_dir / f"{document.id}{suffix}"
    assert Path(document.path).read_bytes() == upload_file["content"]


async def test_upload_accepts_file_of_max_size(client: AsyncClient) -> None:
    response = await upload(client, UploadFileFactory(content=b"a" * MAX_FILE_SIZE))

    assert response.status_code == 201


async def test_upload_accepts_content_type_with_charset(client: AsyncClient) -> None:
    response = await upload(client, UploadFileFactory(content_type="text/plain; charset=utf-8"))

    assert response.status_code == 201


@pytest.mark.parametrize(
    ("upload_file", "status_code"),
    [
        (UploadFileFactory(content=b"a" * (MAX_FILE_SIZE + 1)), 413),
        (UploadFileFactory(content=b""), 422),
        (UploadFileFactory(filename="report.docx"), 415),
        (UploadFileFactory(filename="report"), 415),
        (UploadFileFactory(pdf=True, content_type="text/plain"), 415),
        (UploadFileFactory(content_type="application/octet-stream"), 415),
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
    documents = await DocumentFactory.create_batch(3)

    response = await client.get("/api/documents/")

    assert response.status_code == 200
    expected = [
        {"id": str(document.id), "file_name": document.file_name, "status": document.status}
        for document in documents
    ]
    assert sorted(response.json(), key=lambda item: item["id"]) == sorted(
        expected, key=lambda item: item["id"]
    )


async def test_list_documents_returns_empty_list(client: AsyncClient) -> None:
    response = await client.get("/api/documents/")

    assert response.status_code == 200
    assert response.json() == []

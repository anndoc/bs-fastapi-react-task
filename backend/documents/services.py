from pathlib import Path
from uuid import UUID, uuid4

from fastapi import UploadFile
from fastapi.concurrency import run_in_threadpool
from sqlmodel.ext.asyncio.session import AsyncSession

from documents.constants import DOCUMENTS_DIR
from documents.models import Document


async def create_document(session: AsyncSession, file: UploadFile) -> Document:
    file_name = file.filename or ""
    document_id = uuid4()
    path = DOCUMENTS_DIR / f"{document_id}{Path(file_name).suffix.lower()}"
    await run_in_threadpool(path.write_bytes, await file.read())

    document = Document(id=document_id, path=str(path), file_name=file_name)
    session.add(document)
    await session.commit()
    return document


async def delete_document(session: AsyncSession, document_id: UUID) -> bool:
    document = await session.get(Document, document_id)
    if document is None:
        return False
    path = Path(document.path)
    await session.delete(document)
    await session.commit()
    await run_in_threadpool(path.unlink, missing_ok=True)
    return True

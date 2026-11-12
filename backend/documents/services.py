from pathlib import Path
from uuid import uuid4

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

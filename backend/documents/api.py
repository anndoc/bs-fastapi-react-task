from fastapi import APIRouter, status
from sqlmodel import select

from common.db import SessionDep
from documents import models
from documents.dependencies import ValidatedUpload
from documents.schemas import Document
from documents.services import create_document

router = APIRouter()


@router.post("/", status_code=status.HTTP_201_CREATED)
async def documents(session: SessionDep, file: ValidatedUpload) -> Document:
    document = await create_document(session, file)
    return Document(id=document.id, file_name=document.file_name, status=document.status)


@router.get("/", status_code=status.HTTP_200_OK)
async def documents(session: SessionDep) -> list[Document]:
    rows = (await session.exec(select(models.Document))).all()
    return [Document(id=row.id, file_name=row.file_name, status=row.status) for row in rows]

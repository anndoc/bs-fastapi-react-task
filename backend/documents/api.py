from uuid import UUID

from fastapi import APIRouter, HTTPException, status
from sqlmodel import col, select

from common.db import SessionDep
from documents import models
from documents.dependencies import ValidatedUpload
from documents.schemas import Document
from documents.services import create_document, delete_document

router = APIRouter()


@router.post("/", status_code=status.HTTP_201_CREATED)
async def upload_document(session: SessionDep, file: ValidatedUpload) -> Document:
    document = await create_document(session, file)
    return Document(
        id=document.id, file_name=document.file_name, status=document.status
    )


@router.get("/", status_code=status.HTTP_200_OK)
async def list_documents(session: SessionDep) -> list[Document]:
    rows = (
        await session.exec(
            select(models.Document).order_by(col(models.Document.created_at))
        )
    ).all()
    return [
        Document(id=row.id, file_name=row.file_name, status=row.status) for row in rows
    ]


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_document(session: SessionDep, document_id: UUID) -> None:
    if not await delete_document(session, document_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Document not found")

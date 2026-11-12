from fastapi import APIRouter, status

from common.db import SessionDep
from documents.dependencies import ValidatedUpload
from documents.services import create_document

router = APIRouter()


@router.post("/", status_code=status.HTTP_201_CREATED)
async def documents(session: SessionDep, file: ValidatedUpload) -> dict[str, str]:
    document = await create_document(session, file)
    return {"id": str(document.id), "file_name": document.file_name}

from typing import Annotated

from fastapi import APIRouter, File, UploadFile

from common.db import SessionDep

router = APIRouter()


@router.post("/")
async def documents(session: SessionDep, file: Annotated[UploadFile, File()]) -> dict[str, str]:
    return {"message": "Hello World"}

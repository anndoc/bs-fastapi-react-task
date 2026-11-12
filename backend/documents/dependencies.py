from pathlib import Path
from typing import Annotated

from fastapi import Depends, File, HTTPException, UploadFile, status

from documents.constants import CONTENT_TYPES, MAX_FILE_SIZE


async def validated_upload(file: Annotated[UploadFile, File()]) -> UploadFile:
    suffix = Path(file.filename or "").suffix.lower()
    content_type = (file.content_type or "").split(";")[0].strip().lower()
    if CONTENT_TYPES.get(suffix) != content_type:
        raise HTTPException(
            status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, "Only PDF and TXT files are allowed"
        )
    if not file.size:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "File is empty")
    if file.size > MAX_FILE_SIZE:
        raise HTTPException(status.HTTP_413_CONTENT_TOO_LARGE, "File must not exceed 10 MB")
    return file


ValidatedUpload = Annotated[UploadFile, Depends(validated_upload)]

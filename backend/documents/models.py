from enum import StrEnum
from uuid import UUID, uuid4

from sqlmodel import Field, SQLModel


class DocumentStatus(StrEnum):
    pending = "pending"
    processing = "processing"
    completed = "completed"
    failed = "failed"


class Document(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    status: DocumentStatus = Field(default=DocumentStatus.pending)
    path: str
    error: str | None = None

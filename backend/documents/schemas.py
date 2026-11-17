from datetime import datetime
from uuid import UUID

from sqlmodel import SQLModel

from documents.constants import DocumentStatus


class Document(SQLModel, table=False):
    id: UUID
    file_name: str
    size: int
    status: DocumentStatus
    modified_at: datetime

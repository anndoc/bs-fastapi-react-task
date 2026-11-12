from uuid import UUID

from sqlmodel import SQLModel

from documents.models import DocumentStatus


class Document(SQLModel, table=False):
    id: UUID
    file_name: str
    status: DocumentStatus

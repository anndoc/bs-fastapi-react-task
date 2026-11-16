from datetime import datetime
from uuid import UUID

from sqlmodel import SQLModel


class SessionSummary(SQLModel, table=False):
    id: UUID
    title: str
    modified_at: datetime


class Source(SQLModel, table=False):
    document_id: UUID
    file_name: str
    page: int


class Chunk(SQLModel, table=False):
    source: Source
    text: str

from uuid import UUID

from sqlmodel import SQLModel


class Source(SQLModel, table=False):
    document_id: UUID
    file_name: str
    page: int


class Chunk(SQLModel, table=False):
    source: Source
    text: str

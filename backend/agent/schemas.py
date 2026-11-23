from datetime import datetime
from uuid import UUID

from sqlmodel import SQLModel

from agent.constants import MessageRole


class SessionSummary(SQLModel, table=False):
    id: UUID
    title: str
    modified_at: datetime


class Message(SQLModel, table=False):
    id: UUID
    role: MessageRole
    content: str
    created_at: datetime


class SessionDetail(SessionSummary):
    messages: list[Message]


class Source(SQLModel, table=False):
    document_id: UUID
    file_name: str
    page: int


class Chunk(SQLModel, table=False):
    source: Source
    text: str

from uuid import UUID, uuid4

from pgvector.sqlalchemy import Vector
from sqlalchemy import ForeignKey
from sqlmodel import Field, Relationship

from common.models import TimeStampedModel
from documents.constants import EMBEDDING_DIMENSIONS, DocumentStatus


class Document(TimeStampedModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    status: DocumentStatus = Field(default=DocumentStatus.pending)
    path: str
    file_name: str
    size: int
    error: str = Field(default="")

    embeddings: list[Embedding] = Relationship(
        back_populates="document",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
        passive_deletes=True,
    )


class Embedding(TimeStampedModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    document_id: UUID = Field(
        sa_column_args=[ForeignKey("document.id", ondelete="CASCADE")],
        index=True,
    )
    page: int
    text: str
    vector: list[float] = Field(sa_type=Vector(EMBEDDING_DIMENSIONS), nullable=False)

    document: Document = Relationship(back_populates="embeddings")

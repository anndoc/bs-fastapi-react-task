from datetime import UTC, datetime
from uuid import uuid4

from sqlalchemy import Float
from sqlmodel import col, select
from sqlmodel.ext.asyncio.session import AsyncSession

from agent.constants import MAX_COSINE_DISTANCE, RETRIEVAL_LIMIT, MessageRole
from agent.models import SessionHistory
from agent.schemas import Chunk, Message, Source
from documents.constants import DocumentStatus
from documents.models import Document, Embedding
from documents.tasks import embeddings


async def search_chunks(session: AsyncSession, query: str) -> list[Chunk]:
    vector = await embeddings.aembed_query(query)
    distance = col(Embedding.vector).op("<=>", return_type=Float)(vector)
    rows = await session.exec(
        select(
            Embedding.document_id, Document.file_name, Embedding.page, Embedding.text
        )
        .join(Document)
        .where(
            Document.status == DocumentStatus.completed,
            distance <= MAX_COSINE_DISTANCE,
        )
        .order_by(distance)
        .limit(RETRIEVAL_LIMIT)
    )
    return [
        Chunk(
            source=Source(document_id=document_id, file_name=file_name, page=page),
            text=text,
        )
        for document_id, file_name, page, text in rows
    ]


async def add_message(
    session: AsyncSession,
    chat_session: SessionHistory,
    role: MessageRole,
    content: str,
) -> None:
    message = Message(
        id=uuid4(), role=role, content=content, created_at=datetime.now(UTC)
    )
    # Reassigned, not appended: the plain JSON column doesn't track in-place changes.
    chat_session.messages = [*chat_session.messages, message.model_dump(mode="json")]
    session.add(chat_session)
    await session.commit()

import pytest
from sqlmodel.ext.asyncio.session import AsyncSession

from agent.constants import RETRIEVAL_LIMIT, MessageRole
from agent.models import SessionHistory
from agent.schemas import Message, Source
from agent.services import add_message, search_chunks
from agent.tests.factories import SessionHistoryFactory, build_message
from documents.constants import DocumentStatus
from documents.tasks import embeddings
from documents.tests.factories import DocumentFactory, EmbeddingFactory

pytestmark = pytest.mark.anyio

QUERY = "What is the capital of France?"


async def test_search_chunks_returns_relevant_chunks_closest_first(
    session: AsyncSession,
) -> None:
    document = await DocumentFactory.create(status=DocumentStatus.completed)
    vector = embeddings.embed_query(QUERY)
    half = len(vector) // 2
    await EmbeddingFactory.create(
        document_id=document.id,
        page=2,
        text="Partial match",
        vector=vector[:half] + [0.0] * half,
    )
    await EmbeddingFactory.create(
        document_id=document.id, page=1, text="Exact match", vector=vector
    )
    await EmbeddingFactory.create(
        document_id=document.id,
        page=3,
        text="Unrelated",
        vector=embeddings.embed_query("Unrelated"),
    )

    chunks = await search_chunks(session, QUERY)

    assert [(chunk.text, chunk.source) for chunk in chunks] == [
        (
            "Exact match",
            Source(document_id=document.id, file_name=document.file_name, page=1),
        ),
        (
            "Partial match",
            Source(document_id=document.id, file_name=document.file_name, page=2),
        ),
    ]


async def test_search_chunks_returns_at_most_retrieval_limit(
    session: AsyncSession,
) -> None:
    document = await DocumentFactory.create(status=DocumentStatus.completed)
    vector = embeddings.embed_query(QUERY)
    for page in range(1, RETRIEVAL_LIMIT + 2):
        await EmbeddingFactory.create(
            document_id=document.id, page=page, text=QUERY, vector=vector
        )

    assert len(await search_chunks(session, QUERY)) == RETRIEVAL_LIMIT


@pytest.mark.parametrize(
    "status", [DocumentStatus.pending, DocumentStatus.processing, DocumentStatus.failed]
)
async def test_search_chunks_skips_documents_not_completed(
    session: AsyncSession, status: DocumentStatus
) -> None:
    document = await DocumentFactory.create(status=status)
    await EmbeddingFactory.create(
        document_id=document.id, text=QUERY, vector=embeddings.embed_query(QUERY)
    )

    assert await search_chunks(session, QUERY) == []


async def test_search_chunks_returns_empty_list_without_documents(
    session: AsyncSession,
) -> None:
    assert await search_chunks(session, QUERY) == []


async def test_add_message_persists_appended_message(session: AsyncSession) -> None:
    previous = build_message(MessageRole.user, "Hi")
    chat_session = await SessionHistoryFactory.create(messages=[previous])

    await add_message(session, chat_session, MessageRole.assistant, "Hello!")

    saved = await session.get(SessionHistory, chat_session.id, populate_existing=True)
    assert saved is not None
    first, second = [Message.model_validate(message) for message in saved.messages]
    assert first == Message.model_validate(previous)
    assert (second.role, second.content) == (MessageRole.assistant, "Hello!")
    assert second.id != first.id
    assert second.created_at != first.created_at

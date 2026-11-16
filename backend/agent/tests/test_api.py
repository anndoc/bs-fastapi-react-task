import asyncio
import json
from collections.abc import AsyncIterator
from uuid import uuid4

import pytest
from httpx import AsyncClient
from langchain_core.language_models import FakeListChatModel
from langchain_core.messages import AIMessageChunk
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from agent import api
from agent.constants import NO_CONTEXT_ANSWER, ChatEvent
from agent.models import SessionHistory
from agent.tests.factories import SessionHistoryFactory
from documents.constants import DocumentStatus
from documents.models import Document
from documents.tasks import embeddings
from documents.tests.factories import DocumentFactory, EmbeddingFactory

pytestmark = pytest.mark.anyio

QUERY = "What is the capital of France?"


class ReasoningModel:
    async def astream(self, prompt: str) -> AsyncIterator[AIMessageChunk]:
        yield AIMessageChunk(content=[{"type": "reasoning", "reasoning": "Hmm"}])
        yield AIMessageChunk(content="Paris")


class FailingModel:
    async def astream(self, prompt: str) -> AsyncIterator[AIMessageChunk]:
        raise RuntimeError("LLM is unavailable")
        yield AIMessageChunk(content="")


@pytest.fixture
async def document() -> Document:
    document = await DocumentFactory.create(status=DocumentStatus.completed)
    await EmbeddingFactory.create(
        document_id=document.id,
        page=3,
        text="Paris is the capital of France.",
        vector=embeddings.embed_query(QUERY),
    )
    return document


@pytest.fixture(autouse=True)
def model(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(api, "model", FakeListChatModel(responses=["Paris"]))


async def chat(
    client: AsyncClient, query: str = QUERY, **params: str
) -> list[tuple[str, object]]:
    response = await client.post("/api/chat/", params={"query": query, **params})
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/event-stream")
    events = []
    for raw_event in response.text.strip().split("\n\n"):
        fields = dict(line.split(": ", 1) for line in raw_event.splitlines())
        data = json.loads(fields["data"]) if "data" in fields else None
        events.append((fields["event"], data))
    return events


async def test_chat_starts_session_and_streams_answer_with_sources(
    client: AsyncClient, session: AsyncSession, document: Document
) -> None:
    events = await chat(client)

    chat_session = (await session.exec(select(SessionHistory))).one()
    assert events == [
        (ChatEvent.init, {"session_id": str(chat_session.id)}),
        (
            ChatEvent.sources,
            [
                {
                    "document_id": str(document.id),
                    "file_name": document.file_name,
                    "page": 3,
                }
            ],
        ),
        *[(ChatEvent.text, char) for char in "Paris"],
        (ChatEvent.done, None),
    ]
    assert chat_session.title == QUERY
    assert chat_session.messages == [
        {"role": "user", "content": QUERY},
        {"role": "assistant", "content": "Paris"},
    ]
    assert not chat_session.cancelled


async def test_chat_continues_existing_session(
    client: AsyncClient, session: AsyncSession, document: Document
) -> None:
    previous = [
        {"role": "user", "content": "Hi"},
        {"role": "assistant", "content": "Hello!"},
    ]
    chat_session = await SessionHistoryFactory.create(title="Hi", messages=previous)

    events = await chat(client, session_id=str(chat_session.id))

    assert events[0] == (ChatEvent.init, {"session_id": str(chat_session.id)})
    saved = await session.get(SessionHistory, chat_session.id, populate_existing=True)
    assert saved is not None
    assert saved.title == "Hi"
    assert saved.messages == [
        *previous,
        {"role": "user", "content": QUERY},
        {"role": "assistant", "content": "Paris"},
    ]


async def test_chat_answers_without_model_when_no_relevant_context(
    client: AsyncClient, monkeypatch: pytest.MonkeyPatch, document: Document
) -> None:
    monkeypatch.setattr(api, "model", FailingModel())

    events = await chat(client, query="Who painted the Mona Lisa?")

    assert events[1:] == [
        (ChatEvent.sources, []),
        (ChatEvent.text, NO_CONTEXT_ANSWER),
        (ChatEvent.done, None),
    ]


async def test_chat_streams_reasoning_separately_from_answer(
    client: AsyncClient,
    session: AsyncSession,
    monkeypatch: pytest.MonkeyPatch,
    document: Document,
) -> None:
    monkeypatch.setattr(api, "model", ReasoningModel())

    events = await chat(client)

    assert events[2:] == [
        (ChatEvent.reasoning, "Hmm"),
        (ChatEvent.text, "Paris"),
        (ChatEvent.done, None),
    ]
    chat_session = (await session.exec(select(SessionHistory))).one()
    assert chat_session.messages[-1] == {"role": "assistant", "content": "Paris"}


async def test_chat_sends_stop_when_model_fails(
    client: AsyncClient,
    session: AsyncSession,
    monkeypatch: pytest.MonkeyPatch,
    document: Document,
) -> None:
    monkeypatch.setattr(api, "model", FailingModel())

    events = await chat(client)

    assert events[-1] == (ChatEvent.stop, "Failed to generate an answer")
    chat_session = (await session.exec(select(SessionHistory))).one()
    assert chat_session.messages == [{"role": "user", "content": QUERY}]


async def test_chat_saves_partial_answer_when_cancelled(
    session: AsyncSession, document: Document
) -> None:
    chat_session = SessionHistory()
    events = api.chat(session=session, chat_session=chat_session, query=QUERY)
    while (await anext(events)).event != ChatEvent.text:
        pass

    with pytest.raises(asyncio.CancelledError):
        await events.athrow(asyncio.CancelledError())

    saved = await session.get(SessionHistory, chat_session.id, populate_existing=True)
    assert saved is not None
    assert saved.cancelled
    assert saved.messages == [
        {"role": "user", "content": QUERY},
        {"role": "assistant", "content": "P"},
    ]


async def test_chat_returns_404_for_unknown_session(
    client: AsyncClient, session: AsyncSession
) -> None:
    response = await client.post(
        "/api/chat/", params={"query": QUERY, "session_id": str(uuid4())}
    )

    assert response.status_code == 404
    assert (await session.exec(select(SessionHistory))).all() == []


async def test_chat_rejects_empty_query(client: AsyncClient) -> None:
    response = await client.post("/api/chat/", params={"query": ""})

    assert response.status_code == 422

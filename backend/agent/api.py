import asyncio
import logging
from collections.abc import AsyncGenerator
from typing import Annotated

import anyio
from fastapi import APIRouter, Body, status
from fastapi.sse import EventSourceResponse, ServerSentEvent
from langchain_core.language_models import FakeListChatModel
from sqlmodel import col, select

from agent.constants import (
    NO_CONTEXT_ANSWER,
    PROMPT,
    TITLE_MAX_LENGTH,
    ChatEvent,
    MessageRole,
)
from agent.dependencies import ChatSessionDep
from agent.models import SessionHistory
from agent.schemas import Message, SessionDetail, SessionSummary
from agent.services import add_message, search_chunks
from common.db import SessionDep

logger = logging.getLogger(__name__)

router = APIRouter()

model = FakeListChatModel(  # todo change it later
    responses=[
        "Hello!",
        "How can I help you?",
        "Goodbye!",
    ]
)


@router.post("/", response_class=EventSourceResponse)
async def chat(
    session: SessionDep,
    chat_session: ChatSessionDep,
    query: Annotated[str, Body(min_length=1, embed=True)],
) -> AsyncGenerator[ServerSentEvent]:
    chat_session.title = chat_session.title or query[:TITLE_MAX_LENGTH]
    chat_session.cancelled = False
    await add_message(session, chat_session, MessageRole.user, query)
    yield ServerSentEvent(event=ChatEvent.init, data={"session_id": chat_session.id})

    answer = ""
    try:
        chunks = await search_chunks(session, query)
        sources = {(c.source.document_id, c.source.page): c.source for c in chunks}
        yield ServerSentEvent(event=ChatEvent.sources, data=list(sources.values()))

        if not chunks:
            answer = NO_CONTEXT_ANSWER
            yield ServerSentEvent(event=ChatEvent.text, data=answer)
        else:
            context = "\n\n".join(
                f"[{c.source.file_name}, page {c.source.page}]\n{c.text}"
                for c in chunks
            )
            prompt = PROMPT.format(context=context, query=query)
            async for message_chunk in model.astream(prompt):
                for block in message_chunk.content_blocks:
                    if block["type"] == "reasoning":
                        yield ServerSentEvent(
                            event=ChatEvent.reasoning, data=block.get("reasoning", "")
                        )
                    elif block["type"] == "text":
                        answer += block["text"]
                        yield ServerSentEvent(event=ChatEvent.text, data=block["text"])
    except asyncio.CancelledError:
        # Client disconnected; without the shield the commit is cancelled too.
        with anyio.CancelScope(shield=True):
            chat_session.cancelled = True
            await add_message(session, chat_session, MessageRole.assistant, answer)
        raise
    except Exception:
        logger.exception(f"Chat {chat_session.id} failed.")
        yield ServerSentEvent(event=ChatEvent.stop, data="Failed to generate an answer")
        return

    await add_message(session, chat_session, MessageRole.assistant, answer)
    yield ServerSentEvent(event=ChatEvent.done)


@router.get("/", status_code=status.HTTP_200_OK)
async def history(session: SessionDep) -> list[SessionSummary]:
    rows = (
        await session.exec(
            select(SessionHistory).order_by(col(SessionHistory.modified_at).desc())
        )
    ).all()
    return [
        SessionSummary(id=row.id, title=row.title, modified_at=row.modified_at)
        for row in rows
    ]


@router.get("/{session_id}", status_code=status.HTTP_200_OK)
async def retrieve_chat(chat_session: ChatSessionDep) -> SessionDetail:
    return SessionDetail(
        id=chat_session.id,
        title=chat_session.title,
        modified_at=chat_session.modified_at,
        messages=[Message.model_validate(message) for message in chat_session.messages],
    )


@router.delete("/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_chat(session: SessionDep, chat_session: ChatSessionDep) -> None:
    await session.delete(chat_session)
    await session.commit()

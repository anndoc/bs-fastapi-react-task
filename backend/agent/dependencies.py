from typing import Annotated
from uuid import UUID

from fastapi import Depends, HTTPException, status

from agent.models import SessionHistory
from common.db import SessionDep


async def get_chat_session(
    session: SessionDep, session_id: UUID | None = None
) -> SessionHistory:
    if session_id is None:
        return SessionHistory()
    chat_session = await session.get(SessionHistory, session_id)
    if chat_session is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Chat session not found")
    return chat_session


ChatSessionDep = Annotated[SessionHistory, Depends(get_chat_session)]

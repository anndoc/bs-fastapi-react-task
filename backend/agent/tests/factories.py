from datetime import UTC, datetime
from uuid import uuid4

from agent.constants import MessageRole
from agent.models import SessionHistory
from agent.schemas import Message
from common.tests.factories import AsyncSQLAlchemyModelFactory


class SessionHistoryFactory(AsyncSQLAlchemyModelFactory[SessionHistory]):
    class Meta:
        model = SessionHistory


def build_message(role: MessageRole, content: str) -> dict[str, str]:
    return Message(
        id=uuid4(), role=role, content=content, created_at=datetime.now(UTC)
    ).model_dump(mode="json")

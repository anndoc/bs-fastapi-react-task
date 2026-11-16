from uuid import UUID, uuid4

from sqlalchemy import JSON
from sqlmodel import Field

from agent.constants import TITLE_MAX_LENGTH
from common.models import TimeStampedModel


class SessionHistory(TimeStampedModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    title: str = Field(default="", max_length=TITLE_MAX_LENGTH)
    messages: list[dict[str, str]] = Field(default_factory=list, sa_type=JSON)
    cancelled: bool = Field(default=False)

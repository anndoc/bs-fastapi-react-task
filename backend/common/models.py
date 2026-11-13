from datetime import UTC, datetime
from functools import partial

from sqlalchemy import TIMESTAMP
from sqlmodel import Field, SQLModel


class TimeStampedModel(SQLModel, table=False):
    created_at: datetime = Field(
        default_factory=partial(datetime.now, UTC),
        sa_type=TIMESTAMP(timezone=True),
        nullable=False,
    )
    modified_at: datetime = Field(
        default_factory=partial(datetime.now, UTC),
        sa_type=TIMESTAMP(timezone=True),
        nullable=False,
        sa_column_kwargs={
            "onupdate": partial(datetime.now, UTC),
        },
    )

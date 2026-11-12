import inspect
from typing import List, TypeVar

from factory import alchemy
from factory.alchemy import SQLAlchemyModelFactory

T = TypeVar("T")


class AsyncSQLAlchemyModelFactory(SQLAlchemyModelFactory):
    class Meta:
        abstract = True
        sqlalchemy_session_persistence = alchemy.SESSION_PERSISTENCE_COMMIT

    @classmethod
    async def create(cls, **kwargs):
        session = cls._meta.sqlalchemy_session

        instance = await super().create(**kwargs)
        # one commit per build to avoid share the same connection
        await session.commit()
        return instance

    @classmethod
    async def _create(cls, model_class, *args, **kwargs) -> T:
        async def resolve(value):
            if inspect.isawaitable(value):
                return await value
            return value

        instance = super()._create(
            model_class,
            *[await resolve(value) for value in args],
            **{key: await resolve(value) for key, value in kwargs.items()},
        )
        async with cls._meta.sqlalchemy_session as session:
            await session.commit()
            await session.refresh(instance)
        return instance

    @classmethod
    async def create_batch(cls, size: int, **kwargs) -> List[T]:
        return [await cls.create(**kwargs) for _ in range(size)]

import inspect

from factory import alchemy
from factory.alchemy import SQLAlchemyModelFactory
from sqlmodel.ext.asyncio.session import AsyncSession


class AsyncSQLAlchemyOptions(alchemy.SQLAlchemyOptions):
    sqlalchemy_session: AsyncSession | None


class AsyncSQLAlchemyModelFactory[ModelT](SQLAlchemyModelFactory):
    _meta: AsyncSQLAlchemyOptions
    _options_class = AsyncSQLAlchemyOptions

    class Meta:
        abstract = True

    @classmethod
    async def create(cls, **kwargs: object) -> ModelT:
        session = cls._meta.sqlalchemy_session
        assert session is not None

        instance: ModelT = await super().create(**kwargs)
        # one commit per build to avoid share the same connection
        await session.commit()
        return instance

    @classmethod
    async def _create(cls, model_class: type[ModelT], *args: object, **kwargs: object) -> ModelT:
        resolved_args = [await value if inspect.isawaitable(value) else value for value in args]
        resolved_kwargs = {
            key: await value if inspect.isawaitable(value) else value
            for key, value in kwargs.items()
        }

        instance: ModelT = super()._create(  # type: ignore[no-untyped-call]
            model_class, *resolved_args, **resolved_kwargs
        )
        session = cls._meta.sqlalchemy_session
        assert session is not None
        async with session:
            await session.commit()
            await session.refresh(instance)
        return instance

    @classmethod
    async def acreate_batch(cls, size: int, **kwargs: object) -> list[ModelT]:
        return [await cls.create(**kwargs) for _ in range(size)]

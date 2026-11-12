from typing import AsyncGenerator, Any

import pytest
import sqlalchemy
from httpx import AsyncClient, ASGITransport
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine
from sqlmodel import SQLModel
from sqlmodel.ext.asyncio.session import AsyncSession

from .factories import AsyncSQLAlchemyModelFactory
from ..db import get_session
from ..main import app
from ..settings import settings

engine = create_async_engine(settings.test_database_url)


async def override_get_session() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSession(engine, expire_on_commit=False) as session:
        yield session


app.dependency_overrides[get_session] = override_get_session


@pytest.fixture(scope="session", autouse=True)
def anyio_backend():
    return "asyncio"


@pytest.fixture(scope="session", autouse=True)
async def setup_database():
    db_name = engine.url.database
    _engine = create_async_engine(
        engine.url._replace(database="postgres"), isolation_level="AUTOCOMMIT"
    )
    async with _engine.begin() as conn:
        is_database_exists = bool(
            await conn.scalar(
                sqlalchemy.text(f"SELECT 1 FROM pg_database WHERE datname='{db_name}'")
            )
        )
        if not is_database_exists:
            await conn.execute(sqlalchemy.text(f"CREATE DATABASE {db_name} ENCODING 'utf8' "))

    async with engine.begin() as conn:
        # Required by the pgvector columns on the embedding tables.
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        tables_to_create = [table for table in SQLModel.metadata.sorted_tables]
        await conn.run_sync(SQLModel.metadata.create_all, tables=tables_to_create)

    yield

    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.drop_all)
    await engine.dispose()


@pytest.fixture(autouse=True)
async def session() -> AsyncGenerator[AsyncSession, Any]:
    async with AsyncSession(engine, expire_on_commit=False) as session:
        # Ensure that all factories use the same session
        for factory in AsyncSQLAlchemyModelFactory.__subclasses__():
            factory._meta.sqlalchemy_session = session
            factory.reset_sequence(0)

        yield session

        await session.rollback()

        tables = ", ".join([table.name for table in SQLModel.metadata.sorted_tables])
        # truncate all tables
        await session.exec(sqlalchemy.text(f"TRUNCATE {tables} CASCADE;"))
        await session.commit()


@pytest.fixture(scope="function")
async def client() -> AsyncGenerator[AsyncClient, Any]:
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        yield client

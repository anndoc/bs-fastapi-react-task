from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI

import documents.api
from common.db import engine


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    yield
    await engine.dispose()


app = FastAPI(lifespan=lifespan)

app.include_router(documents.api.router, prefix="/api/documents")

import asyncio
import logging
from collections.abc import AsyncIterator
from datetime import UTC, datetime
from pathlib import Path
from uuid import UUID

from langchain_core.embeddings import DeterministicFakeEmbedding
from langchain_text_splitters import RecursiveCharacterTextSplitter
from pypdf import PdfReader
from sqlmodel import col, func, select, update
from sqlmodel.ext.asyncio.session import AsyncSession

from common.db import session_factory
from documents.conditions import is_claimable
from documents.constants import (
    EMBEDDING_DIMENSIONS,
    PROCESSING_MAX_ATTEMPTS,
    PROCESSING_RETRY_DELAY_SECONDS,
    DocumentStatus,
)
from documents.models import Document, Embedding

logger = logging.getLogger(__name__)

splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
embeddings = DeterministicFakeEmbedding(size=EMBEDDING_DIMENSIONS)


async def process_document(document_id: UUID) -> None:
    async with session_factory() as session:
        document = await session.scalar(
            update(Document)
            .where(
                col(Document.id).in_(
                    select(Document.id)
                    .where(Document.id == document_id, is_claimable)
                    .with_for_update(skip_locked=True)
                )
            )
            .values(status=DocumentStatus.processing)
            .returning(Document)
        )
        await session.commit()
        if document is None:
            logger.warning(
                f"Document {document_id} is missing, locked or not claimable."
            )
            return

        for attempt in range(1, PROCESSING_MAX_ATTEMPTS + 1):
            try:
                await embed_pages(session, document)
                break
            except Exception as exc:
                logger.exception(
                    f"Attempt {attempt} to process document {document_id} failed."
                )
                await session.rollback()
                await session.refresh(document)
                if attempt == PROCESSING_MAX_ATTEMPTS:
                    document.status = DocumentStatus.failed
                    document.error = str(exc)
                    await session.commit()
                    return
                await asyncio.sleep(PROCESSING_RETRY_DELAY_SECONDS)

        document.status = DocumentStatus.completed
        await session.commit()


async def read_pages(path: Path, skip: int) -> AsyncIterator[str]:
    if path.suffix.lower() == ".pdf":
        reader = await asyncio.to_thread(PdfReader, path)
        for page in reader.pages[skip:]:
            yield await asyncio.to_thread(page.extract_text)
    elif skip == 0:
        yield await asyncio.to_thread(path.read_text, encoding="utf-8")


async def embed_pages(session: AsyncSession, document: Document) -> None:
    """
    Embed pages one transaction each,
    skipping pages already embedded by an earlier attempt.
    """
    embedded_pages = (
        await session.exec(
            select(func.coalesce(func.max(Embedding.page), 0)).where(
                Embedding.document_id == document.id
            )
        )
    ).one()
    page_number = embedded_pages
    async for page in read_pages(Path(document.path), embedded_pages):
        page_number += 1
        chunks = splitter.split_text(page)
        vectors = await embeddings.aembed_documents(chunks)
        session.add_all(
            Embedding(
                document_id=document.id, page=page_number, text=chunk, vector=vector
            )
            for chunk, vector in zip(chunks, vectors, strict=True)
        )
        # Keeps the document from being reclaimed as stale
        # while it's still being processed.
        document.modified_at = datetime.now(UTC)
        await session.commit()

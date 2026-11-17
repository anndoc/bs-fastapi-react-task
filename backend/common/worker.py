import asyncio
import logging

from sqlmodel import col, select

from common.db import session_factory
from common.logging import setup_logging
from documents.conditions import is_claimable
from documents.models import Document
from documents.tasks import process_document

logger = logging.getLogger(__name__)


async def process() -> None:
    async with session_factory() as session:
        statement = (
            select(Document.id).where(is_claimable).order_by(col(Document.created_at))
        )
        document_ids = (await session.exec(statement)).all()

    if not document_ids:
        logger.info("Nothing to process.")
        return

    for document_id in document_ids:
        logger.info(f"Processing {document_id}...")
        try:
            await process_document(document_id)
        except Exception:
            logger.exception(f"Processing {document_id} crashed.")


if __name__ == "__main__":
    setup_logging()
    asyncio.run(process())

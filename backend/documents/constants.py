from datetime import timedelta
from enum import StrEnum
from pathlib import Path

DOCUMENTS_DIR = Path(__file__).resolve().parents[2] / "media" / "documents"
MAX_FILE_SIZE = 10 * 1024 * 1024
CONTENT_TYPES = {".pdf": "application/pdf", ".txt": "text/plain"}
EMBEDDING_DIMENSIONS = 4096
PROCESSING_MAX_ATTEMPTS = 5
PROCESSING_RETRY_DELAY_SECONDS = 1.0
PROCESSING_STALE_AFTER = timedelta(minutes=30)


class DocumentStatus(StrEnum):
    pending = "pending"
    processing = "processing"
    completed = "completed"
    failed = "failed"

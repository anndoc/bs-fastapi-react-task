from pathlib import Path


DOCUMENTS_DIR = Path(__file__).resolve().parents[2] / "media" / "documents"
MAX_FILE_SIZE = 10 * 1024 * 1024
CONTENT_TYPES = {".pdf": "application/pdf", ".txt": "text/plain"}

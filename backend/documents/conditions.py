from sqlmodel import and_, col, func, or_

from documents.constants import PROCESSING_STALE_AFTER, DocumentStatus
from documents.models import Document

is_claimable = or_(
    col(Document.status) == DocumentStatus.pending,
    and_(
        col(Document.status) == DocumentStatus.processing,
        col(Document.modified_at) < func.now() - PROCESSING_STALE_AFTER,
    ),
)

from agent.models import SessionHistory
from common.tests.factories import AsyncSQLAlchemyModelFactory


class SessionHistoryFactory(AsyncSQLAlchemyModelFactory[SessionHistory]):
    class Meta:
        model = SessionHistory

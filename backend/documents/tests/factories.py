from factory.base import DictFactory
from factory.declarations import LazyAttribute, Trait
from factory.faker import Faker

from common.tests.factories import AsyncSQLAlchemyModelFactory
from documents.models import Document, Embedding


class DocumentFactory(AsyncSQLAlchemyModelFactory[Document]):
    id = Faker("uuid4")  # type: ignore[no-untyped-call]
    file_name = Faker("file_name", extension="txt")  # type: ignore[no-untyped-call]
    path = LazyAttribute(  # type: ignore[no-untyped-call]
        lambda obj: f"media/documents/{obj.id}.txt"
    )

    class Meta:
        model = Document


class EmbeddingFactory(AsyncSQLAlchemyModelFactory[Embedding]):
    page = 1

    class Meta:
        model = Embedding


class UploadFileFactory(DictFactory):
    filename = Faker("file_name", extension="txt")  # type: ignore[no-untyped-call]
    content = Faker("binary", length=256)  # type: ignore[no-untyped-call]
    content_type = "text/plain"

    class Params:
        pdf = Trait(  # type: ignore[no-untyped-call]
            filename=Faker("file_name", extension="pdf"),  # type: ignore[no-untyped-call]
            content_type="application/pdf",
        )

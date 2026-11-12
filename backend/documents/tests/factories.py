import factory

from common.tests.factories import AsyncSQLAlchemyModelFactory
from documents.models import Document


class DocumentFactory(AsyncSQLAlchemyModelFactory):
    id = factory.Faker("uuid4")
    file_name = factory.Faker("file_name", extension="txt")
    path = factory.LazyAttribute(lambda obj: f"media/documents/{obj.id}.txt")

    class Meta:
        model = Document


class UploadFileFactory(factory.DictFactory):
    filename = factory.Faker("file_name", extension="txt")
    content = factory.Faker("binary", length=256)
    content_type = "text/plain"

    class Params:
        pdf = factory.Trait(
            filename=factory.Faker("file_name", extension="pdf"),
            content_type="application/pdf",
        )

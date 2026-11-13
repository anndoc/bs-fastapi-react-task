from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Anchored to this file so .env resolves regardless of the working directory.
    model_config = SettingsConfigDict(
        env_file=Path(__file__).resolve().parent.parent / ".env"
    )

    database_url: str
    test_database_url: str


settings = Settings()

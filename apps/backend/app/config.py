from __future__ import annotations

from functools import lru_cache

from pydantic import AnyHttpUrl, Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application configuration loaded from environment variables."""

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False)

    database_url: str
    allowed_origins: list[str] = Field(default_factory=list)
    supabase_jwks_url: AnyHttpUrl
    supabase_expected_aud: str = "authenticated"
    public_record_base_url: AnyHttpUrl
    environment: str = "development"
    jwks_cache_ttl_seconds: int = 3600

    @field_validator("allowed_origins", mode="before")
    def _split_origins(cls, value: list[str] | str | None) -> list[str]:
        if not value:
            return []
        if isinstance(value, list):
            return value
        return [origin.strip() for origin in value.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()

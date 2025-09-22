from __future__ import annotations

from functools import lru_cache
from typing import List

from pydantic import AnyHttpUrl, BaseSettings, Field, validator


class Settings(BaseSettings):
    """Application configuration loaded from environment variables."""

    database_url: str = Field(..., env="DATABASE_URL")
    allowed_origins: List[str] = Field(default_factory=list, env="ALLOWED_ORIGINS")
    supabase_jwks_url: AnyHttpUrl = Field(..., env="SUPABASE_JWKS_URL")
    supabase_expected_aud: str = Field("authenticated", env="SUPABASE_EXPECTED_AUD")
    public_record_base_url: AnyHttpUrl = Field(..., env="PUBLIC_RECORD_BASE_URL")
    environment: str = Field("development", env="FASTAPI_ENV")
    jwks_cache_ttl_seconds: int = Field(3600, env="JWKS_CACHE_TTL_SECONDS")

    class Config:
        env_file = ".env"
        case_sensitive = False

    @validator("allowed_origins", pre=True)
    def _split_origins(cls, value: List[str] | str | None) -> List[str]:
        if not value:
            return []
        if isinstance(value, list):
            return value
        return [origin.strip() for origin in value.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()

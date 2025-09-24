# apps/backend/app/db.py
from __future__ import annotations

import ssl
from collections.abc import AsyncIterator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from .config import get_settings


settings = get_settings()

# Normalize the DB URL to use the async driver (asyncpg)
db_url = settings.database_url
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql+asyncpg://", 1)
elif db_url.startswith("postgresql://"):
    db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)

# Supabase requires SSL; pass an SSL context to asyncpg via SQLAlchemy
ssl_ctx = ssl.create_default_context()

engine = create_async_engine(
    db_url,
    echo=(settings.environment == "development"),
    connect_args={"ssl": ssl_ctx},
)

AsyncSessionFactory = async_sessionmaker(engine, expire_on_commit=False, autoflush=False)


async def get_db_session() -> AsyncIterator[AsyncSession]:
    async with AsyncSessionFactory() as session:
        yield session

from collections.abc import AsyncGenerator
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase
from app.core.config import get_settings


class Base(DeclarativeBase):
    pass


def build_async_database_url(raw_url: str) -> str:
    if raw_url.startswith("postgresql://"):
        return raw_url.replace("postgresql://", "postgresql+asyncpg://", 1)
    if raw_url.startswith("postgresql+psycopg://"):
        return raw_url.replace("postgresql+psycopg://", "postgresql+asyncpg://", 1)
    if raw_url.startswith("sqlite://") and not raw_url.startswith("sqlite+aiosqlite://"):
        return raw_url.replace("sqlite://", "sqlite+aiosqlite://", 1)
    return raw_url


settings = get_settings()
engine: AsyncEngine = create_async_engine(
    build_async_database_url(settings.DATABASE_URL),
    echo=False,
    pool_pre_ping=True,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

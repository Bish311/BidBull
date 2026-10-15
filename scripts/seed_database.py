import asyncio
from datetime import datetime, timedelta, timezone
import sys
from pathlib import Path
from sqlalchemy import select

sys.path.append(str(Path(__file__).resolve().parent.parent / "backend"))

from app.core.database import AsyncSessionLocal, engine, Base
from app.core.logging import get_logger, setup_logging
from app.core.security import hash_password
from app.models import Item, User

setup_logging("INFO")
logger = get_logger("seed_database")


async def seed() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        existing_users = await session.execute(select(User))
        if existing_users.scalars().first() is not None:
            logger.info("Database already seeded with users, skipping seed")
            return

        user_bish1 = User(
            username="Bish1",
            email="bish1@example.com",
            password_hash=hash_password("SecurePassword123"),
        )
        user_bish2 = User(
            username="Bish2",
            email="bish2@example.com",
            password_hash=hash_password("SecurePassword123"),
        )
        user_bishwayan = User(
            username="Bishwayan1",
            email="bishwayan1@example.com",
            password_hash=hash_password("SecurePassword123"),
        )
        session.add_all([user_bish1, user_bish2, user_bishwayan])
        await session.commit()
        await session.refresh(user_bish1)
        await session.refresh(user_bish2)

        now = datetime.now(timezone.utc)
        items = [
            Item(
                seller_id=user_bish1.id,
                title="Mechanical Chronograph Watch",
                description="Vintage hand-wound mechanical chronograph with sapphire glass.",
                image_url="/images/watch.webp",
                starting_price_cents=5000,
                reserve_price_cents=10000,
                current_price_cents=5000,
                status="ACTIVE",
                starts_at=now - timedelta(hours=1),
                expires_at=now + timedelta(hours=4),
            ),
            Item(
                seller_id=user_bish1.id,
                title="Custom Anodized Aluminum Keyboard",
                description="Gasket mounted mechanical keyboard with lubricated switches.",
                image_url="/images/keyboard.webp",
                starting_price_cents=8000,
                reserve_price_cents=15000,
                current_price_cents=8000,
                status="ACTIVE",
                starts_at=now - timedelta(hours=2),
                expires_at=now + timedelta(hours=1),
            ),
            Item(
                seller_id=user_bish2.id,
                title="Nearfield Studio Audio Monitors",
                description="Pair of calibrated active studio monitors with flat frequency response.",
                image_url="/images/monitors.webp",
                starting_price_cents=12000,
                reserve_price_cents=22000,
                current_price_cents=12000,
                status="ACTIVE",
                starts_at=now - timedelta(hours=1),
                expires_at=now + timedelta(hours=6),
            ),
        ]
        session.add_all(items)
        await session.commit()
        logger.info("Successfully seeded database with Bish personas and 3 listings")


if __name__ == "__main__":
    asyncio.run(seed())

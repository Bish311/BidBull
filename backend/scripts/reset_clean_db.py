import asyncio
import sys

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

sys.path.insert(0, ".")
from sqlalchemy import text
from app.core.database import engine

async def reset_db():
    async with engine.begin() as conn:
        await conn.execute(text("ALTER TABLE items ADD COLUMN IF NOT EXISTS room_code VARCHAR(50) NOT NULL DEFAULT 'DEFAULT';"))
        await conn.execute(text("CREATE INDEX IF NOT EXISTS idx_items_room_code ON items(room_code);"))
        await conn.execute(text("DELETE FROM bids;"))
        await conn.execute(text("DELETE FROM proxy_bids;"))
        await conn.execute(text("DELETE FROM items;"))
        await conn.execute(text("DELETE FROM users;"))
    await engine.dispose()
    print("DATABASE_RESET_DONE_SUCCESSFULLY")

if __name__ == "__main__":
    asyncio.run(reset_db())

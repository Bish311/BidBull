from datetime import datetime
from typing import Optional
import uuid
import redis.asyncio as aioredis
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.engine.room_broadcaster import broadcast_room_event, send_direct_user_alert
from app.models import ProxyBid


async def get_or_create_proxy_bid(
    db: AsyncSession,
    item_id: uuid.UUID,
    bidder_id: uuid.UUID,
    max_bid_cents: int
) -> ProxyBid:
    user_proxy_q = select(ProxyBid).where(
        ProxyBid.item_id == item_id,
        ProxyBid.bidder_id == bidder_id
    )
    result = await db.execute(user_proxy_q)
    user_proxy = result.scalar_one_or_none()

    if user_proxy is None:
        new_proxy = ProxyBid(
            item_id=item_id,
            bidder_id=bidder_id,
            max_bid_cents=max_bid_cents
        )
        db.add(new_proxy)
        return new_proxy

    user_proxy.max_bid_cents = max(user_proxy.max_bid_cents, max_bid_cents)
    return user_proxy


async def notify_bid_events(
    redis_client: aioredis.Redis,
    item_id: uuid.UUID,
    amount_cents: int,
    next_min_cents: int,
    bidder_name: str,
    now_utc: datetime,
    extended: bool,
    new_expires_at: datetime,
    displaced_id: Optional[uuid.UUID]
) -> None:
    await broadcast_room_event(redis_client, item_id, "BID_ACCEPTED", {
        "amount_cents": amount_cents,
        "next_minimum_cents": next_min_cents,
        "bidder_masked": bidder_name,
        "timestamp_utc": now_utc,
    })
    if extended:
        await broadcast_room_event(redis_client, item_id, "SOFT_CLOSE_EXTENDED", {
            "new_expires_at_utc": new_expires_at,
            "seconds_added": 120,
        })
    if displaced_id is not None:
        await send_direct_user_alert(redis_client, displaced_id, "OUTBID_ALERT", {
            "item_id": item_id,
            "outbid_price_cents": amount_cents,
            "next_minimum_cents": next_min_cents,
        })

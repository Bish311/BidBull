from datetime import datetime, timedelta, timezone
import pytest
from httpx import AsyncClient
from sqlalchemy import select
from app.core.security import create_access_token
from app.models import Item, User
from tests.conftest import TestingSessionLocal


@pytest.mark.asyncio
async def test_soft_close_triggers_extension_when_under_120_seconds(
    async_client: AsyncClient,
    seed_users: dict[str, User]
) -> None:
    seller = seed_users["bish1"]
    bidder = seed_users["bish2"]
    now = datetime.now(timezone.utc)

    async with TestingSessionLocal() as session:
        item = Item(
            seller_id=seller.id,
            title="Sniping Target Item",
            description="Item ending in 30 seconds.",
            image_url="/images/target.webp",
            starting_price_cents=10000,
            reserve_price_cents=15000,
            current_price_cents=10000,
            status="ACTIVE",
            starts_at=now - timedelta(hours=1),
            expires_at=now + timedelta(seconds=30),
        )
        session.add(item)
        await session.commit()
        await session.refresh(item)
        item_id = item.id

    token = create_access_token(str(bidder.id))
    headers = {"Authorization": f"Bearer {token}"}
    response = await async_client.post(
        f"/api/items/{item_id}/bids",
        json={"max_bid_cents": 12000},
        headers=headers,
    )
    assert response.status_code == 201
    data = response.json()
    assert data["soft_close_extended"] is True

    async with TestingSessionLocal() as session:
        updated_item = (await session.execute(select(Item).where(Item.id == item_id))).scalar_one()
        assert updated_item.status == "EXTENDED"
        exp = updated_item.expires_at if updated_item.expires_at.tzinfo is not None else updated_item.expires_at.replace(tzinfo=timezone.utc)
        assert exp > now + timedelta(seconds=100)


@pytest.mark.asyncio
async def test_bid_placed_with_ample_time_does_not_extend(
    async_client: AsyncClient,
    active_item: Item,
    seed_users: dict[str, User]
) -> None:
    bidder = seed_users["bish2"]
    token = create_access_token(str(bidder.id))
    headers = {"Authorization": f"Bearer {token}"}

    response = await async_client.post(
        f"/api/items/{active_item.id}/bids",
        json={"max_bid_cents": 6000},
        headers=headers,
    )
    assert response.status_code == 201
    data = response.json()
    assert data["soft_close_extended"] is False

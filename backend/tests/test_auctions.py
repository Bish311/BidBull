from datetime import datetime, timedelta, timezone
import pytest
from httpx import AsyncClient
from app.core.security import create_access_token
from app.models import Item, User


@pytest.mark.asyncio
async def test_list_items_returns_catalog(
    async_client: AsyncClient,
    active_item: Item
) -> None:
    response = await async_client.get("/api/items")
    assert response.status_code == 200
    items = response.json()
    assert len(items) >= 1
    assert items[0]["title"] == "Collectible Mechanical Chronograph"
    assert items[0]["current_price_cents"] == 5000


@pytest.mark.asyncio
async def test_get_item_detail_calculates_next_minimum(
    async_client: AsyncClient,
    active_item: Item
) -> None:
    response = await async_client.get(f"/api/items/{active_item.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == str(active_item.id)
    assert data["next_minimum_cents"] == 5000
    assert data["status"] == "ACTIVE"


@pytest.mark.asyncio
async def test_create_item_with_authenticated_user(
    async_client: AsyncClient,
    seed_users: dict[str, User]
) -> None:
    user = seed_users["bish1"]
    token = create_access_token(str(user.id))
    headers = {"Authorization": f"Bearer {token}"}
    now = datetime.now(timezone.utc)
    payload = {
        "title": "Studio Headphones",
        "description": "Open-back reference headphones.",
        "image_url": "/images/headphones.webp",
        "starting_price_cents": 15000,
        "reserve_price_cents": 25000,
        "starts_at": now.isoformat(),
        "expires_at": (now + timedelta(days=2)).isoformat(),
    }
    response = await async_client.post("/api/items", json=payload, headers=headers)
    assert response.status_code == 201
    created = response.json()
    assert created["title"] == "Studio Headphones"
    assert created["current_price_cents"] == 15000


@pytest.mark.asyncio
async def test_unauthenticated_create_item_rejected(async_client: AsyncClient) -> None:
    now = datetime.now(timezone.utc)
    payload = {
        "title": "Unauthorized Listing",
        "description": "Should fail with 401.",
        "image_url": "/images/none.webp",
        "starting_price_cents": 1000,
        "reserve_price_cents": 2000,
        "starts_at": now.isoformat(),
        "expires_at": (now + timedelta(days=1)).isoformat(),
    }
    response = await async_client.post("/api/items", json=payload)
    assert response.status_code == 401

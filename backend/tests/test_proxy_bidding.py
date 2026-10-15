import pytest
from httpx import AsyncClient
from app.core.security import create_access_token
from app.models import Item, User


@pytest.mark.asyncio
async def test_first_bid_sets_starting_price(
    async_client: AsyncClient,
    active_item: Item,
    seed_users: dict[str, User]
) -> None:
    bidder = seed_users["bish2"]
    token = create_access_token(str(bidder.id))
    headers = {"Authorization": f"Bearer {token}"}

    response = await async_client.post(
        f"/api/items/{active_item.id}/bids",
        json={"max_bid_cents": 8000},
        headers=headers,
    )
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "ACCEPTED"
    assert data["current_price_cents"] == 5000
    assert data["is_high_bidder"] is True
    assert data["next_minimum_cents"] == 5500


@pytest.mark.asyncio
async def test_competing_proxy_bids_advance_to_correct_increment(
    async_client: AsyncClient,
    active_item: Item,
    seed_users: dict[str, User]
) -> None:
    bidder1 = seed_users["bish2"]
    token1 = create_access_token(str(bidder1.id))
    headers1 = {"Authorization": f"Bearer {token1}"}

    await async_client.post(
        f"/api/items/{active_item.id}/bids",
        json={"max_bid_cents": 10000},
        headers=headers1,
    )

    bidder2 = seed_users["bishwayan1"]
    token2 = create_access_token(str(bidder2.id))
    headers2 = {"Authorization": f"Bearer {token2}"}

    response2 = await async_client.post(
        f"/api/items/{active_item.id}/bids",
        json={"max_bid_cents": 7000},
        headers=headers2,
    )
    assert response2.status_code == 201
    data2 = response2.json()
    assert data2["current_price_cents"] == 7500
    assert data2["is_high_bidder"] is False


@pytest.mark.asyncio
async def test_outbid_displaces_previous_high_bidder(
    async_client: AsyncClient,
    active_item: Item,
    seed_users: dict[str, User]
) -> None:
    bidder1 = seed_users["bish2"]
    token1 = create_access_token(str(bidder1.id))
    headers1 = {"Authorization": f"Bearer {token1}"}

    await async_client.post(
        f"/api/items/{active_item.id}/bids",
        json={"max_bid_cents": 7000},
        headers=headers1,
    )

    bidder2 = seed_users["bishwayan1"]
    token2 = create_access_token(str(bidder2.id))
    headers2 = {"Authorization": f"Bearer {token2}"}

    response2 = await async_client.post(
        f"/api/items/{active_item.id}/bids",
        json={"max_bid_cents": 12000},
        headers=headers2,
    )
    assert response2.status_code == 201
    data2 = response2.json()
    assert data2["current_price_cents"] == 7500
    assert data2["is_high_bidder"] is True


@pytest.mark.asyncio
async def test_bid_below_minimum_rejected_with_bad_request(
    async_client: AsyncClient,
    active_item: Item,
    seed_users: dict[str, User]
) -> None:
    bidder = seed_users["bish2"]
    token = create_access_token(str(bidder.id))
    headers = {"Authorization": f"Bearer {token}"}

    response = await async_client.post(
        f"/api/items/{active_item.id}/bids",
        json={"max_bid_cents": 2000},
        headers=headers,
    )
    assert response.status_code == 400
    assert "at least" in response.json()["detail"]


@pytest.mark.asyncio
async def test_seller_bidding_on_own_item_rejected(
    async_client: AsyncClient,
    active_item: Item,
    seed_users: dict[str, User]
) -> None:
    seller = seed_users["bish1"]
    token = create_access_token(str(seller.id))
    headers = {"Authorization": f"Bearer {token}"}

    response = await async_client.post(
        f"/api/items/{active_item.id}/bids",
        json={"max_bid_cents": 10000},
        headers=headers,
    )
    assert response.status_code == 400
    assert "Sellers cannot bid" in response.json()["detail"]

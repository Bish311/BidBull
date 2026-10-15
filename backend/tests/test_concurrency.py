import asyncio
import pytest
from httpx import AsyncClient
from sqlalchemy import select
from app.core.security import create_access_token
from app.models import Bid, Item, User
from tests.conftest import TestingSessionLocal


@pytest.mark.asyncio
async def test_concurrent_bids_maintain_ledger_integrity(
    async_client: AsyncClient,
    active_item: Item,
    seed_users: dict[str, User]
) -> None:
    bidder1 = seed_users["bish2"]
    bidder2 = seed_users["bishwayan1"]
    token1 = create_access_token(str(bidder1.id))
    token2 = create_access_token(str(bidder2.id))

    headers1 = {"Authorization": f"Bearer {token1}"}
    headers2 = {"Authorization": f"Bearer {token2}"}

    async def submit_bid_task(headers: dict[str, str], amount: int):
        return await async_client.post(
            f"/api/items/{active_item.id}/bids",
            json={"max_bid_cents": amount},
            headers=headers,
        )

    tasks = [
        submit_bid_task(headers1, 6000),
        submit_bid_task(headers2, 7000),
        submit_bid_task(headers1, 8000),
        submit_bid_task(headers2, 9000),
    ]

    responses = await asyncio.gather(*tasks)
    accepted_or_conflict = 0
    for resp in responses:
        if resp.status_code in (201, 400, 409):
            accepted_or_conflict = accepted_or_conflict + 1

    assert accepted_or_conflict == len(tasks)

    async with TestingSessionLocal() as session:
        ledger_bids = (await session.execute(
            select(Bid).where(Bid.item_id == active_item.id).order_by(Bid.created_at.asc())
        )).scalars().all()
        assert len(ledger_bids) >= 1
        for i in range(len(ledger_bids) - 1):
            assert ledger_bids[i].amount_cents <= ledger_bids[i + 1].amount_cents

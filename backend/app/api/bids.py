from datetime import datetime, timezone
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.auth import get_current_user
from app.core.database import get_db
from app.core.redis import get_redis
from app.engine.bid_service import get_or_create_proxy_bid, notify_bid_events
from app.engine.bid_validator import validate_incoming_bid
from app.engine.lock_manager import acquire_auction_lock
from app.engine.price_calculator import compute_next_minimum, format_masked_username
from app.engine.proxy_engine import resolve_proxy_step
from app.engine.soft_close import check_and_extend_window
from app.models import Bid, Item, ProxyBid, User
from app.schemas import BidCreate, BidHistoryItem, BidSubmissionResult

router = APIRouter(prefix="/api/items", tags=["Bids"])


@router.get("/{item_id}/bids", response_model=list[BidHistoryItem])
async def get_bid_history(item_id: uuid.UUID, db: AsyncSession = Depends(get_db)) -> list[BidHistoryItem]:
    query = select(Bid).where(Bid.item_id == item_id).order_by(Bid.created_at.desc())
    result = await db.execute(query)
    bid_history: list[BidHistoryItem] = []
    for bid in result.scalars().all():
        bidder = await db.get(User, bid.bidder_id)
        name = format_masked_username(bidder.username) if bidder else "B***"
        bid_history.append(BidHistoryItem(
            id=bid.id, item_id=bid.item_id, amount_cents=bid.amount_cents,
            bidder_masked=name, is_proxy=bid.is_proxy, created_at=bid.created_at,
        ))
    return bid_history


@router.post("/{item_id}/bids", response_model=BidSubmissionResult, status_code=status.HTTP_201_CREATED)
async def submit_bid(
    item_id: uuid.UUID, payload: BidCreate,
    current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
) -> BidSubmissionResult:
    redis_client = get_redis()
    async with acquire_auction_lock(redis_client, item_id):
        item = (await db.execute(select(Item).where(Item.id == item_id).with_for_update())).scalar_one_or_none()
        if item is None:
            raise HTTPException(status_code=404, detail="Item not found")

        count_q = select(func.count(Bid.id)).where(Bid.item_id == item.id)
        has_bids = (await db.execute(count_q)).scalar_one() > 0
        now_utc = datetime.now(timezone.utc)
        validate_incoming_bid(item, current_user.id, payload.max_bid_cents, now_utc, has_bids)

        existing_max = item.current_price_cents
        if item.high_bidder_id is not None:
            proxy_q = select(ProxyBid).where(ProxyBid.item_id == item.id, ProxyBid.bidder_id == item.high_bidder_id)
            proxy_row = (await db.execute(proxy_q)).scalar_one_or_none()
            if proxy_row is not None:
                existing_max = proxy_row.max_bid_cents

        step = resolve_proxy_step(
            new_bidder_id=current_user.id, new_max_cents=payload.max_bid_cents,
            current_high_bidder_id=item.high_bidder_id, current_price_cents=item.current_price_cents,
            existing_proxy_max_cents=existing_max, starting_price_cents=item.starting_price_cents,
            has_prior_bids=has_bids,
        )
        item.current_price_cents = step.new_price_cents
        item.high_bidder_id = step.winning_bidder_id

        db.add(Bid(
            item_id=item.id, bidder_id=step.winning_bidder_id,
            amount_cents=step.new_price_cents, is_proxy=payload.max_bid_cents > step.new_price_cents,
        ))
        await get_or_create_proxy_bid(db, item.id, current_user.id, payload.max_bid_cents)

        extended, new_exp = check_and_extend_window(item.expires_at, now_utc)
        if extended:
            item.expires_at = new_exp
            item.status = "EXTENDED"

        await db.commit()
        await db.refresh(item)

        next_min = compute_next_minimum(item.current_price_cents, True)
        masked_winner = format_masked_username(current_user.username)
        await notify_bid_events(
            redis_client, item.id, step.new_price_cents, next_min,
            masked_winner, now_utc, extended, new_exp, step.displaced_bidder_id,
        )
        return BidSubmissionResult(
            status="ACCEPTED", item_id=item.id, current_price_cents=item.current_price_cents,
            next_minimum_cents=next_min, is_high_bidder=step.winning_bidder_id == current_user.id,
            soft_close_extended=extended, expires_at=item.expires_at,
        )

from typing import Optional
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.auth import get_current_user
from app.core.database import get_db
from app.engine.price_calculator import compute_next_minimum, format_masked_username
from app.models import Bid, Item, User
from app.schemas import ItemCreate, ItemDetailResponse, ItemResponse

router = APIRouter(prefix="/api/items", tags=["Items"])


@router.get("", response_model=list[ItemResponse])
async def list_items(
    item_status: Optional[str] = Query(None, alias="status"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db)
) -> list[ItemResponse]:
    query = select(Item).order_by(Item.created_at.desc()).offset(offset).limit(limit)
    if item_status is not None:
        query = query.where(Item.status == item_status)
    result = await db.execute(query)
    items = result.scalars().all()

    item_responses: list[ItemResponse] = []
    for item in items:
        count_q = select(func.count(Bid.id)).where(Bid.item_id == item.id)
        bid_count = (await db.execute(count_q)).scalar_one()
        high_name = None
        if item.high_bidder_id is not None:
            bidder = await db.get(User, item.high_bidder_id)
            if bidder is not None:
                high_name = format_masked_username(bidder.username)
        met = item.current_price_cents >= item.reserve_price_cents
        item_responses.append(ItemResponse(
            id=item.id, seller_id=item.seller_id, title=item.title,
            description=item.description, image_url=item.image_url,
            starting_price_cents=item.starting_price_cents,
            current_price_cents=item.current_price_cents,
            high_bidder_masked=high_name, status=item.status,
            reserve_met=met, starts_at=item.starts_at,
            expires_at=item.expires_at, bid_count=bid_count,
            created_at=item.created_at,
        ))
    return item_responses


@router.post("", response_model=ItemResponse, status_code=status.HTTP_201_CREATED)
async def create_item(
    payload: ItemCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> ItemResponse:
    item = Item(
        seller_id=current_user.id, title=payload.title,
        description=payload.description, image_url=payload.image_url,
        starting_price_cents=payload.starting_price_cents,
        reserve_price_cents=payload.reserve_price_cents,
        current_price_cents=payload.starting_price_cents,
        status="ACTIVE", starts_at=payload.starts_at,
        expires_at=payload.expires_at,
    )
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return ItemResponse(
        id=item.id, seller_id=item.seller_id, title=item.title,
        description=item.description, image_url=item.image_url,
        starting_price_cents=item.starting_price_cents,
        current_price_cents=item.current_price_cents,
        high_bidder_masked=None, status=item.status,
        reserve_met=item.current_price_cents >= item.reserve_price_cents,
        starts_at=item.starts_at, expires_at=item.expires_at,
        bid_count=0, created_at=item.created_at,
    )


@router.get("/{item_id}", response_model=ItemDetailResponse)
async def get_item_detail(
    item_id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
) -> ItemDetailResponse:
    item = await db.get(Item, item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Item not found")
    count_query = select(func.count(Bid.id)).where(Bid.item_id == item.id)
    bid_count = (await db.execute(count_query)).scalar_one()
    high_name = None
    if item.high_bidder_id is not None:
        bidder = await db.get(User, item.high_bidder_id)
        if bidder is not None:
            high_name = format_masked_username(bidder.username)
    has_bids = bid_count > 0
    next_min = compute_next_minimum(item.current_price_cents, has_bids)
    return ItemDetailResponse(
        id=item.id, seller_id=item.seller_id, title=item.title,
        description=item.description, image_url=item.image_url,
        starting_price_cents=item.starting_price_cents,
        current_price_cents=item.current_price_cents,
        high_bidder_masked=high_name, status=item.status,
        reserve_met=item.current_price_cents >= item.reserve_price_cents,
        starts_at=item.starts_at, expires_at=item.expires_at,
        bid_count=bid_count, created_at=item.created_at,
        next_minimum_cents=next_min, is_seller=False, is_high_bidder=False,
    )

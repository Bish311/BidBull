from datetime import datetime, timezone
import uuid
from app.core.errors import (
    AuctionClosedError,
    AuctionNotActiveError,
    BidTooLowError,
    SelfBiddingProhibitedError,
)
from app.engine.price_calculator import compute_next_minimum
from app.models import Item


def validate_auction_status(item: Item) -> None:
    allowed_statuses = ("ACTIVE", "EXTENDED")
    if item.status not in allowed_statuses:
        if item.status in ("CLOSED_SOLD", "CLOSED_UNMET"):
            raise AuctionClosedError()
        raise AuctionNotActiveError()


def ensure_utc_datetime(dt: datetime) -> datetime:
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


def validate_auction_timing(item: Item, now_utc: datetime) -> None:
    starts_at = ensure_utc_datetime(item.starts_at)
    expires_at = ensure_utc_datetime(item.expires_at)
    if now_utc < starts_at:
        raise AuctionNotActiveError("Auction has not started yet")
    if now_utc >= expires_at:
        raise AuctionClosedError()


def validate_bidder_identity(item: Item, bidder_id: uuid.UUID) -> None:
    if item.seller_id == bidder_id:
        raise SelfBiddingProhibitedError()


def validate_incoming_bid(
    item: Item,
    bidder_id: uuid.UUID,
    max_bid_cents: int,
    now_utc: datetime,
    has_bids: bool
) -> int:
    validate_auction_status(item)
    validate_auction_timing(item, now_utc)
    validate_bidder_identity(item, bidder_id)

    minimum_acceptable = compute_next_minimum(item.current_price_cents, has_bids)
    if max_bid_cents < minimum_acceptable:
        message = f"Bid amount must be at least {minimum_acceptable} cents"
        raise BidTooLowError(message)

    return minimum_acceptable

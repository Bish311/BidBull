import uuid
from dataclasses import dataclass
from typing import Optional
from app.engine.tiers import get_tier_increment


@dataclass
class ProxyStepResult:
    winning_bidder_id: uuid.UUID
    new_price_cents: int
    winning_proxy_max_cents: int
    displaced_bidder_id: Optional[uuid.UUID]
    outbid_bidder_id: Optional[uuid.UUID]


def resolve_proxy_step(
    new_bidder_id: uuid.UUID,
    new_max_cents: int,
    current_high_bidder_id: Optional[uuid.UUID],
    current_price_cents: int,
    existing_proxy_max_cents: int,
    starting_price_cents: int,
    has_prior_bids: bool,
    is_direct: bool = False
) -> ProxyStepResult:
    if is_direct:
        if current_high_bidder_id is None or current_high_bidder_id == new_bidder_id:
            return ProxyStepResult(
                winning_bidder_id=new_bidder_id,
                new_price_cents=new_max_cents,
                winning_proxy_max_cents=new_max_cents,
                displaced_bidder_id=None,
                outbid_bidder_id=None,
            )
        if new_max_cents > existing_proxy_max_cents:
            return ProxyStepResult(
                winning_bidder_id=new_bidder_id,
                new_price_cents=new_max_cents,
                winning_proxy_max_cents=new_max_cents,
                displaced_bidder_id=current_high_bidder_id,
                outbid_bidder_id=current_high_bidder_id,
            )
        increment = get_tier_increment(new_max_cents)
        final_price = min(existing_proxy_max_cents, new_max_cents + increment)
        return ProxyStepResult(
            winning_bidder_id=current_high_bidder_id,
            new_price_cents=final_price,
            winning_proxy_max_cents=existing_proxy_max_cents,
            displaced_bidder_id=None,
            outbid_bidder_id=new_bidder_id,
        )

    if not has_prior_bids or current_high_bidder_id is None:
        return ProxyStepResult(
            winning_bidder_id=new_bidder_id,
            new_price_cents=starting_price_cents,
            winning_proxy_max_cents=new_max_cents,
            displaced_bidder_id=None,
            outbid_bidder_id=None,
        )

    if current_high_bidder_id == new_bidder_id:
        higher_max = max(existing_proxy_max_cents, new_max_cents)
        return ProxyStepResult(
            winning_bidder_id=new_bidder_id,
            new_price_cents=current_price_cents,
            winning_proxy_max_cents=higher_max,
            displaced_bidder_id=None,
            outbid_bidder_id=None,
        )

    if new_max_cents > existing_proxy_max_cents:
        increment = get_tier_increment(existing_proxy_max_cents)
        final_price = min(new_max_cents, existing_proxy_max_cents + increment)
        return ProxyStepResult(
            winning_bidder_id=new_bidder_id,
            new_price_cents=final_price,
            winning_proxy_max_cents=new_max_cents,
            displaced_bidder_id=current_high_bidder_id,
            outbid_bidder_id=current_high_bidder_id,
        )

    increment = get_tier_increment(new_max_cents)
    final_price = min(existing_proxy_max_cents, new_max_cents + increment)
    return ProxyStepResult(
        winning_bidder_id=current_high_bidder_id,
        new_price_cents=final_price,
        winning_proxy_max_cents=existing_proxy_max_cents,
        displaced_bidder_id=None,
        outbid_bidder_id=new_bidder_id,
    )

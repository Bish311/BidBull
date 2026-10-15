from app.engine.tiers import get_tier_increment


def compute_next_minimum(current_price_cents: int, has_bids: bool) -> int:
    if not has_bids:
        return current_price_cents
    increment_cents = get_tier_increment(current_price_cents)
    return current_price_cents + increment_cents


def format_masked_username(username: str) -> str:
    cleaned = username.strip()
    length = len(cleaned)
    if length <= 2:
        return cleaned[0] + "***"
    first_char = cleaned[0]
    last_char = cleaned[length - 1]
    return first_char + "***" + last_char


def compute_quick_bid_options(current_price_cents: int, has_bids: bool) -> list[int]:
    options: list[int] = []
    base_price = compute_next_minimum(current_price_cents, has_bids)
    options.append(base_price)

    running_price = base_price
    steps_needed = 2
    step_count = 0
    while step_count < steps_needed:
        increment = get_tier_increment(running_price)
        running_price = running_price + increment
        options.append(running_price)
        step_count = step_count + 1

    return options


def is_valid_increment_step(
    bid_cents: int,
    current_price_cents: int,
    has_bids: bool
) -> bool:
    minimum_required = compute_next_minimum(current_price_cents, has_bids)
    if bid_cents < minimum_required:
        return False
    return True

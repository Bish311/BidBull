from datetime import datetime, timedelta, timezone
from app.core.config import get_settings

DEFAULT_WINDOW_SECONDS = 120
DEFAULT_EXTENSION_SECONDS = 120


def get_soft_close_parameters() -> tuple[int, int]:
    settings = get_settings()
    threshold = getattr(settings, "SOFT_CLOSE_THRESHOLD_SECONDS", DEFAULT_WINDOW_SECONDS)
    extension = getattr(settings, "SOFT_CLOSE_EXTENSION_SECONDS", DEFAULT_EXTENSION_SECONDS)
    return threshold, extension


def calculate_remaining_seconds(expires_at: datetime, now_utc: datetime) -> int:
    target_exp = expires_at if expires_at.tzinfo is not None else expires_at.replace(tzinfo=timezone.utc)
    delta = target_exp - now_utc
    total_seconds = int(delta.total_seconds())
    if total_seconds < 0:
        return 0
    return total_seconds


def is_within_soft_close_threshold(expires_at: datetime, now_utc: datetime) -> bool:
    threshold_seconds, _ = get_soft_close_parameters()
    remaining = calculate_remaining_seconds(expires_at, now_utc)
    if remaining <= threshold_seconds:
        return True
    return False


def check_and_extend_window(
    expires_at: datetime,
    now_utc: datetime
) -> tuple[bool, datetime]:
    threshold_seconds, extension_seconds = get_soft_close_parameters()
    target_exp = expires_at if expires_at.tzinfo is not None else expires_at.replace(tzinfo=timezone.utc)
    remaining_seconds = calculate_remaining_seconds(target_exp, now_utc)

    if remaining_seconds <= threshold_seconds:
        extension_delta = timedelta(seconds=extension_seconds)
        new_expires_at = now_utc + extension_delta
        if new_expires_at > target_exp:
            return True, new_expires_at

    return False, target_exp

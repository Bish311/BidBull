from datetime import datetime
import json
from typing import Any
import uuid
import redis.asyncio as aioredis


def serialize_value(raw_value: Any) -> Any:
    if isinstance(raw_value, uuid.UUID):
        return str(raw_value)
    if isinstance(raw_value, datetime):
        return raw_value.isoformat()
    return raw_value


def build_event_payload(event_type: str, raw_data: dict[str, Any]) -> str:
    cleaned_dict: dict[str, Any] = {"type": event_type}
    for key, value in raw_data.items():
        cleaned_dict[key] = serialize_value(value)
    return json.dumps(cleaned_dict)


async def broadcast_room_event(
    redis_client: aioredis.Redis,
    item_id: uuid.UUID,
    event_type: str,
    payload_data: dict[str, Any]
) -> int:
    channel = f"auction:events:{item_id}"
    message = build_event_payload(event_type, payload_data)
    receivers_count = await redis_client.publish(channel, message)
    return receivers_count


async def send_direct_user_alert(
    redis_client: aioredis.Redis,
    user_id: uuid.UUID,
    event_type: str,
    payload_data: dict[str, Any]
) -> int:
    channel = f"user:alerts:{user_id}"
    message = build_event_payload(event_type, payload_data)
    receivers_count = await redis_client.publish(channel, message)
    return receivers_count

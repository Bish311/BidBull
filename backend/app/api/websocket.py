import asyncio
import json
from typing import Optional
import uuid
from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect
from app.core.redis import get_redis
from app.core.security import decode_token

router = APIRouter(tags=["WebSocket"])


@router.websocket("/ws/auctions/{item_id}")
async def auction_websocket_endpoint(
    websocket: WebSocket,
    item_id: uuid.UUID,
    token: Optional[str] = Query(None)
) -> None:
    await websocket.accept()
    user_id: Optional[str] = None
    if token is not None:
        user_id = decode_token(token)

    redis_client = get_redis()
    pubsub = redis_client.pubsub()
    channel = f"auction:events:{item_id}"
    await pubsub.subscribe(channel)

    if user_id is not None:
        user_channel = f"user:alerts:{user_id}"
        await pubsub.subscribe(user_channel)

    async def forward_pubsub_messages() -> None:
        async for message in pubsub.listen():
            if message["type"] == "message":
                data = message["data"]
                if isinstance(data, (bytes, bytearray)):
                    data = data.decode("utf-8")
                await websocket.send_text(data)

    listener_task = asyncio.create_task(forward_pubsub_messages())

    try:
        while True:
            client_msg = await websocket.receive_text()
            if client_msg == "ping":
                await websocket.send_text(json.dumps({"type": "PONG"}))
    except WebSocketDisconnect:
        listener_task.cancel()
        await pubsub.unsubscribe()
        await pubsub.aclose()
        await redis_client.aclose()
    except Exception:
        listener_task.cancel()
        await pubsub.unsubscribe()
        await pubsub.aclose()
        await redis_client.aclose()

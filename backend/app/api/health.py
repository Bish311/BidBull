from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core import redis as redis_core
from app.schemas import HealthResponse, ReadinessResponse

router = APIRouter(tags=["Health"])


@router.get("/health", response_model=HealthResponse, status_code=status.HTTP_200_OK)
async def check_liveness() -> HealthResponse:
    return HealthResponse(status="ok")


@router.get("/ready", response_model=ReadinessResponse)
async def check_readiness(
    db_session: AsyncSession = Depends(get_db)
) -> JSONResponse:
    db_status = "unhealthy"
    try:
        await db_session.execute(text("SELECT 1"))
        db_status = "healthy"
    except Exception:
        db_status = "unhealthy"

    redis_alive = await redis_core.ping_redis()
    redis_status = "healthy" if redis_alive else "unhealthy"

    is_ready = db_status == "healthy" and redis_status == "healthy"
    status_code = status.HTTP_200_OK if is_ready else status.HTTP_503_SERVICE_UNAVAILABLE

    payload = ReadinessResponse(
        status="ready" if is_ready else "not_ready",
        database=db_status,
        redis=redis_status,
    )
    return JSONResponse(status_code=status_code, content=payload.model_dump())

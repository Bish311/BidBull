from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from prometheus_fastapi_instrumentator import Instrumentator
from app.api import auth, bids, health, items, websocket
from app.core.config import get_settings
from app.core.errors import BidBullError
from app.core.logging import get_logger, setup_logging
from app.core.redis import close_redis

setup_logging()
logger = get_logger("app.main")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    logger.info("BidBull application startup initiated")
    yield
    logger.info("BidBull application shutdown initiated")
    await close_redis()


settings = get_settings()
app = FastAPI(
    title=settings.PROJECT_NAME,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url=None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(BidBullError)
async def domain_exception_handler(_: Request, exc: BidBullError) -> JSONResponse:
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.message})


Instrumentator().instrument(app).expose(app, endpoint="/metrics")

app.include_router(health.router)
app.include_router(auth.router)
app.include_router(items.router)
app.include_router(bids.router)
app.include_router(websocket.router)

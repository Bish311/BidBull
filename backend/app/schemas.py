from datetime import datetime
import uuid
from typing import Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class HealthResponse(BaseModel):
    status: str
    service: str = "BidBull API"


class ReadinessResponse(BaseModel):
    status: str
    database: str
    redis: str


class UserCreate(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class UserResponse(BaseModel):
    id: uuid.UUID
    username: str
    email: EmailStr
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: uuid.UUID
    username: str


class UserJoinRequest(BaseModel):
    username: str = Field(min_length=2, max_length=50)


class ItemCreate(BaseModel):
    title: str = Field(min_length=1, max_length=120)
    description: str = Field(default="", max_length=5000)
    image_url: str = Field(default="/placeholder.png", max_length=255)
    starting_price_cents: int = Field(gt=0)
    reserve_price_cents: int = Field(gt=0)
    starts_at: datetime
    expires_at: datetime
    room_code: str = Field(default="DEFAULT", max_length=50)


class ItemUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    reserve_price_cents: Optional[int] = None


class ItemResponse(BaseModel):
    id: uuid.UUID
    seller_id: uuid.UUID
    title: str
    description: str
    image_url: str
    starting_price_cents: int
    current_price_cents: int
    high_bidder_masked: Optional[str] = None
    status: str
    reserve_met: bool
    starts_at: datetime
    expires_at: datetime
    bid_count: int
    room_code: str = "DEFAULT"
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ItemDetailResponse(ItemResponse):
    next_minimum_cents: int
    quick_bid_options: list[int] = []
    is_seller: bool = False
    is_high_bidder: bool = False


class BidCreate(BaseModel):
    max_bid_cents: int = Field(gt=0)
    is_direct: bool = False


class BidSubmissionResult(BaseModel):
    status: str
    item_id: uuid.UUID
    current_price_cents: int
    next_minimum_cents: int
    is_high_bidder: bool
    soft_close_extended: bool
    expires_at: datetime


class BidHistoryItem(BaseModel):
    id: uuid.UUID
    item_id: uuid.UUID
    amount_cents: int
    bidder_masked: str
    is_proxy: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class RoomStateMessage(BaseModel):
    type: str = "ROOM_STATE"
    item_id: uuid.UUID
    current_price_cents: int
    next_minimum_cents: int
    high_bidder_masked: Optional[str]
    reserve_met: bool
    status: str
    server_time_utc: datetime
    expires_at_utc: datetime
    participants: int


class BidAcceptedMessage(BaseModel):
    type: str = "BID_ACCEPTED"
    item_id: uuid.UUID
    amount_cents: int
    next_minimum_cents: int
    bidder_masked: str
    timestamp_utc: datetime


class SoftCloseExtendedMessage(BaseModel):
    type: str = "SOFT_CLOSE_EXTENDED"
    item_id: uuid.UUID
    new_expires_at_utc: datetime
    seconds_added: int


class OutbidAlertMessage(BaseModel):
    type: str = "OUTBID_ALERT"
    item_id: uuid.UUID
    outbid_price_cents: int
    next_minimum_cents: int

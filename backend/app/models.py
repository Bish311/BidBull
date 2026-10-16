import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    BigInteger,
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import TypeDecorator, CHAR
from app.core.database import Base


class GUID(TypeDecorator):
    impl = CHAR
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            return dialect.type_descriptor(PG_UUID())
        return dialect.type_descriptor(CHAR(36))

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        if dialect.name == "postgresql":
            return str(value)
        if not isinstance(value, uuid.UUID):
            return str(uuid.UUID(str(value)))
        return str(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        if not isinstance(value, uuid.UUID):
            return uuid.UUID(str(value))
        return value


def get_utc_now() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        GUID(), primary_key=True, default=uuid.uuid4
    )
    username: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=get_utc_now, nullable=False
    )

    items_listed: Mapped[list["Item"]] = relationship(
        "Item", back_populates="seller", foreign_keys="Item.seller_id"
    )
    bids: Mapped[list["Bid"]] = relationship("Bid", back_populates="bidder")
    proxy_bids: Mapped[list["ProxyBid"]] = relationship("ProxyBid", back_populates="bidder")


class Item(Base):
    __tablename__ = "items"

    id: Mapped[uuid.UUID] = mapped_column(
        GUID(), primary_key=True, default=uuid.uuid4
    )
    seller_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    title: Mapped[str] = mapped_column(String(120), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    image_url: Mapped[str] = mapped_column(String(255), nullable=False)
    starting_price_cents: Mapped[int] = mapped_column(BigInteger, nullable=False)
    reserve_price_cents: Mapped[int] = mapped_column(BigInteger, nullable=False)
    current_price_cents: Mapped[int] = mapped_column(BigInteger, nullable=False)
    high_bidder_id: Mapped[uuid.UUID | None] = mapped_column(
        GUID(), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    status: Mapped[str] = mapped_column(String(20), default="DRAFT", nullable=False)
    room_code: Mapped[str] = mapped_column(String(50), default="DEFAULT", nullable=False, index=True)
    starts_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=get_utc_now, nullable=False
    )

    seller: Mapped["User"] = relationship("User", foreign_keys=[seller_id], back_populates="items_listed")
    high_bidder: Mapped["User | None"] = relationship("User", foreign_keys=[high_bidder_id])
    bids: Mapped[list["Bid"]] = relationship("Bid", back_populates="item", cascade="all, delete-orphan")
    proxy_bids: Mapped[list["ProxyBid"]] = relationship(
        "ProxyBid", back_populates="item", cascade="all, delete-orphan"
    )

    __table_args__ = (
        CheckConstraint("starting_price_cents > 0", name="chk_starting_price_positive"),
        CheckConstraint("reserve_price_cents >= starting_price_cents", name="chk_reserve_ge_starting"),
        CheckConstraint("current_price_cents >= starting_price_cents", name="chk_current_ge_starting"),
        CheckConstraint("expires_at > starts_at", name="chk_item_expiration"),
        Index("idx_items_status_expires", "status", "expires_at"),
    )


class Bid(Base):
    __tablename__ = "bids"

    id: Mapped[uuid.UUID] = mapped_column(
        GUID(), primary_key=True, default=uuid.uuid4
    )
    item_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("items.id", ondelete="CASCADE"), nullable=False, index=True
    )
    bidder_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    amount_cents: Mapped[int] = mapped_column(BigInteger, nullable=False)
    is_proxy: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=get_utc_now, nullable=False
    )

    item: Mapped["Item"] = relationship("Item", back_populates="bids")
    bidder: Mapped["User"] = relationship("User", back_populates="bids")

    __table_args__ = (
        CheckConstraint("amount_cents > 0", name="chk_bid_amount_positive"),
        Index("idx_bids_item_created", "item_id", "created_at"),
    )


class ProxyBid(Base):
    __tablename__ = "proxy_bids"

    id: Mapped[uuid.UUID] = mapped_column(
        GUID(), primary_key=True, default=uuid.uuid4
    )
    item_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("items.id", ondelete="CASCADE"), nullable=False
    )
    bidder_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    max_bid_cents: Mapped[int] = mapped_column(BigInteger, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=get_utc_now, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=get_utc_now, onupdate=get_utc_now, nullable=False
    )

    item: Mapped["Item"] = relationship("Item", back_populates="proxy_bids")
    bidder: Mapped["User"] = relationship("User", back_populates="proxy_bids")

    __table_args__ = (
        CheckConstraint("max_bid_cents > 0", name="chk_proxy_max_positive"),
        UniqueConstraint("item_id", "bidder_id", name="uq_item_bidder_proxy"),
        Index("idx_proxy_bids_item_max", "item_id", "max_bid_cents"),
    )

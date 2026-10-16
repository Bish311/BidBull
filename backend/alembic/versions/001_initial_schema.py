"""initial schema

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-10-16 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "001_initial_schema"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.CHAR(36), primary_key=True),
        sa.Column("username", sa.String(50), nullable=False, unique=True),
        sa.Column("email", sa.String(255), nullable=False, unique=True),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_users_username", "users", ["username"])
    op.create_index("ix_users_email", "users", ["email"])

    op.create_table(
        "items",
        sa.Column("id", sa.CHAR(36), primary_key=True),
        sa.Column("seller_id", sa.CHAR(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("title", sa.String(120), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("image_url", sa.String(255), nullable=False),
        sa.Column("starting_price_cents", sa.BigInteger(), nullable=False),
        sa.Column("reserve_price_cents", sa.BigInteger(), nullable=False),
        sa.Column("current_price_cents", sa.BigInteger(), nullable=False),
        sa.Column("high_bidder_id", sa.CHAR(36), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("status", sa.String(20), server_default="DRAFT", nullable=False),
        sa.Column("room_code", sa.String(50), server_default="DEFAULT", nullable=False),
        sa.Column("starts_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint("starting_price_cents > 0", name="chk_starting_price_positive"),
        sa.CheckConstraint("reserve_price_cents >= starting_price_cents", name="chk_reserve_ge_starting"),
        sa.CheckConstraint("current_price_cents >= starting_price_cents", name="chk_current_ge_starting"),
        sa.CheckConstraint("expires_at > starts_at", name="chk_item_expiration"),
    )
    op.create_index("idx_items_status_expires", "items", ["status", "expires_at"])
    op.create_index("idx_items_room_code", "items", ["room_code"])

    op.create_table(
        "bids",
        sa.Column("id", sa.CHAR(36), primary_key=True),
        sa.Column("item_id", sa.CHAR(36), sa.ForeignKey("items.id", ondelete="CASCADE"), nullable=False),
        sa.Column("bidder_id", sa.CHAR(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("amount_cents", sa.BigInteger(), nullable=False),
        sa.Column("is_proxy", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint("amount_cents > 0", name="chk_bid_amount_positive"),
    )
    op.create_index("idx_bids_item_created", "bids", ["item_id", "created_at"])

    op.create_table(
        "proxy_bids",
        sa.Column("id", sa.CHAR(36), primary_key=True),
        sa.Column("item_id", sa.CHAR(36), sa.ForeignKey("items.id", ondelete="CASCADE"), nullable=False),
        sa.Column("bidder_id", sa.CHAR(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("max_bid_cents", sa.BigInteger(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint("max_bid_cents > 0", name="chk_proxy_max_positive"),
        sa.UniqueConstraint("item_id", "bidder_id", name="uq_item_bidder_proxy"),
    )
    op.create_index("idx_proxy_bids_item_max", "proxy_bids", ["item_id", "max_bid_cents"])


def downgrade() -> None:
    op.drop_table("proxy_bids")
    op.drop_table("bids")
    op.drop_table("items")
    op.drop_table("users")

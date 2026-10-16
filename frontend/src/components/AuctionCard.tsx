"use client";

import Link from "next/link";
import { Item } from "../lib/types";
import { formatCentsToDollars } from "../lib/format-currency";
import CountdownTimer from "./CountdownTimer";

interface AuctionCardProps {
  item: Item;
  canDelete?: boolean;
  onDelete?: (itemId: string) => void;
}

export default function AuctionCard({
  item,
  canDelete = false,
  onDelete,
}: AuctionCardProps) {
  const isExpired = new Date() >= new Date(item.expires_at);
  const isClosed =
    item.status === "CLOSED_SOLD" ||
    item.status === "CLOSED_UNMET" ||
    isExpired;
  const isExtended = !isClosed && item.status === "EXTENDED";
  const displayStatus = isClosed ? "CLOSED" : isExtended ? "EXTENDED" : "ACTIVE";

  return (
    <div className="flex flex-col justify-between rounded border border-brand-border bg-brand-card p-5 transition hover:border-brand-accent shadow-xs">
      <div>
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span
              className={`rounded px-2.5 py-0.5 text-xs font-semibold ${
                isClosed
                  ? "bg-brand-subpanel text-brand-muted border border-brand-border"
                  : isExtended
                  ? "border border-amber-600/40 bg-amber-500/10 text-amber-500"
                  : "border border-emerald-600/40 bg-emerald-500/10 text-emerald-500"
              }`}
            >
              {displayStatus}
            </span>

            {canDelete && onDelete && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDelete(item.id);
                }}
                className="rounded border border-brand-danger bg-brand-dangerBg px-2 py-0.5 text-[10px] font-mono font-bold text-brand-danger transition hover:bg-red-700 hover:text-white"
                title="Delete listing (Admin only)"
              >
                DELETE
              </button>
            )}
          </div>

          <div className="text-right">
            <CountdownTimer expiresAtUtc={item.expires_at} />
          </div>
        </div>

        <h3 className="mb-1 text-base font-semibold text-brand-text">{item.title}</h3>
        <p className="mb-4 text-xs text-brand-muted line-clamp-2">{item.description}</p>
      </div>

      <div className="border-t border-brand-border pt-4">
        <div className="mb-3 flex items-baseline justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-brand-muted">
              Current Bid
            </div>
            <div className="text-xl font-bold font-mono text-brand-text">
              {formatCentsToDollars(item.current_price_cents)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[11px] uppercase tracking-wider text-brand-muted">
              High Bidder
            </div>
            <div className="text-xs font-mono text-brand-text">
              {item.high_bidder_masked || "No bids"}
            </div>
          </div>
        </div>

        <Link
          href={`/auctions/${item.id}`}
          className="block w-full rounded bg-brand-accent py-2 text-center text-xs font-bold tracking-wider text-white transition hover:bg-brand-accentHover"
        >
          ENTER LIVE ROOM
        </Link>
      </div>
    </div>
  );
}

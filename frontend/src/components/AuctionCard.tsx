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
    <div className="flex flex-col justify-between rounded border border-[#252836] bg-[#14161f] p-5 transition hover:border-[#3b4256]">
      <div>
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span
              className={`rounded px-2 py-0.5 text-xs font-semibold ${
                isClosed
                  ? "bg-gray-800 text-gray-400"
                  : isExtended
                  ? "border border-amber-800 bg-amber-950 text-amber-400"
                  : "border border-emerald-800 bg-emerald-950 text-emerald-400"
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
                className="rounded border border-red-800/80 bg-red-950/50 px-2 py-0.5 text-[10px] font-mono font-bold text-red-300 transition hover:bg-red-800 hover:text-white"
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

        <h3 className="mb-1 text-base font-semibold text-white">{item.title}</h3>
        <p className="mb-4 text-xs text-gray-400 line-clamp-2">{item.description}</p>
      </div>

      <div className="border-t border-[#202330] pt-4">
        <div className="mb-3 flex items-baseline justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-gray-500">
              Current Bid
            </div>
            <div className="text-xl font-bold font-mono text-white">
              {formatCentsToDollars(item.current_price_cents)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[11px] uppercase tracking-wider text-gray-500">
              High Bidder
            </div>
            <div className="text-xs font-mono text-gray-300">
              {item.high_bidder_masked || "No bids"}
            </div>
          </div>
        </div>

        <Link
          href={`/auctions/${item.id}`}
          className="block w-full rounded bg-[#2563eb] py-2 text-center text-xs font-semibold tracking-wide text-white transition hover:bg-[#1d4ed8]"
        >
          ENTER LIVE ROOM
        </Link>
      </div>
    </div>
  );
}

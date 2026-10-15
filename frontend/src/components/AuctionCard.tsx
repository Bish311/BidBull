"use client";

import Link from "next/link";
import { Item } from "../lib/types";
import { formatCentsToDollars } from "../lib/format-currency";
import CountdownTimer from "./CountdownTimer";

interface AuctionCardProps {
  item: Item;
}

export default function AuctionCard({ item }: AuctionCardProps) {
  const isExtended = item.status === "EXTENDED";
  const isClosed = item.status === "CLOSED_SOLD" || item.status === "CLOSED_UNMET";

  return (
    <div className="flex flex-col justify-between rounded border border-[#252836] bg-[#14161f] p-5 transition hover:border-[#3b4256]">
      <div>
        <div className="mb-3 flex items-center justify-between">
          <span
            className={`rounded px-2 py-0.5 text-xs font-semibold ${
              isClosed
                ? "bg-gray-800 text-gray-400"
                : isExtended
                ? "bg-amber-950 text-amber-400 border border-amber-800"
                : "bg-emerald-950 text-emerald-400 border border-emerald-800"
            }`}
          >
            {item.status}
          </span>
          <CountdownTimer expiresAtUtc={item.expires_at} />
        </div>

        <h3 className="mb-1 text-base font-medium text-white">{item.title}</h3>
        <p className="mb-4 text-xs text-gray-400 line-clamp-2">{item.description}</p>
      </div>

      <div className="border-t border-[#202330] pt-4">
        <div className="mb-3 flex items-baseline justify-between">
          <div>
            <div className="text-[11px] text-gray-500 uppercase">Current Bid</div>
            <div className="text-xl font-bold font-mono text-white">
              {formatCentsToDollars(item.current_price_cents)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[11px] text-gray-500 uppercase">High Bidder</div>
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

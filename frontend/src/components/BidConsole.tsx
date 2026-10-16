"use client";

import { useState } from "react";
import { formatCentsToDollars, parseDollarsToCents } from "../lib/format-currency";

interface BidConsoleProps {
  currentPriceCents: number;
  nextMinimumCents: number;
  isSubmitting: boolean;
  onSubmitBid: (amountCents: number, isDirect: boolean) => void;
  disabled?: boolean;
  isAdmin?: boolean;
  isHighBidder?: boolean;
}

export default function BidConsole({
  nextMinimumCents,
  isSubmitting,
  onSubmitBid,
  disabled = false,
  isAdmin = false,
  isHighBidder = false,
}: BidConsoleProps) {
  const [customBidDollars, setCustomBidDollars] = useState<string>("");

  const step = nextMinimumCents < 10000 ? 500 : 1000;
  const quickBidOptions = [
    nextMinimumCents,
    nextMinimumCents + step,
    nextMinimumCents + 2 * step,
  ];

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cents = parseDollarsToCents(customBidDollars);
    if (cents >= nextMinimumCents) {
      onSubmitBid(cents, false);
      setCustomBidDollars("");
    }
  };

  if (isAdmin) {
    return (
      <div className="rounded border border-amber-900/60 bg-amber-950/20 p-5">
        <div className="flex items-center space-x-2 text-amber-400">
          <span className="text-base font-bold font-mono">ROOM ADMIN NOTICE</span>
        </div>
        <p className="mt-2 text-xs text-amber-300/80">
          You are the creator of this auction room. As administrator and seller, you can add and manage listings, but self-bidding is strictly prohibited.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded border border-[#252836] bg-[#14161f] p-5 space-y-4">
      {isHighBidder && (
        <div className="rounded border border-emerald-800 bg-emerald-950/50 p-2.5 text-xs font-mono font-bold text-emerald-300">
          HIGH BIDDER — You currently hold the winning bid on this listing.
        </div>
      )}

      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          QUICK BID INCREMENTS
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {quickBidOptions.map((amount) => (
            <button
              key={amount}
              type="button"
              disabled={disabled || isSubmitting}
              onClick={() => onSubmitBid(amount, true)}
              className="rounded border border-[#2b3042] bg-[#1c202d] py-2.5 text-xs font-mono font-bold text-gray-100 transition hover:border-blue-500 hover:bg-[#2563eb] disabled:opacity-40"
            >
              BID {formatCentsToDollars(amount)}
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-[#222533] pt-4">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
          PROXY CEILING (MAX BID)
        </div>
        <form onSubmit={handleCustomSubmit} className="flex space-x-2">
          <input
            type="text"
            disabled={disabled || isSubmitting}
            placeholder={`Min ${formatCentsToDollars(nextMinimumCents)}`}
            value={customBidDollars}
            onChange={(e) => setCustomBidDollars(e.target.value)}
            className="flex-1 rounded border border-[#2b3042] bg-[#0f1118] px-3 py-2 text-sm font-mono text-white placeholder-gray-600 outline-none focus:border-blue-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={
              disabled ||
              isSubmitting ||
              parseDollarsToCents(customBidDollars) < nextMinimumCents
            }
            className="rounded bg-[#2563eb] px-5 py-2 text-xs font-bold tracking-wider text-white transition hover:bg-[#1d4ed8] disabled:opacity-40"
          >
            {isSubmitting ? "PROCESSING" : "PLACE PROXY"}
          </button>
        </form>
      </div>
    </div>
  );
}

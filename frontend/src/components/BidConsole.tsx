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
      <div className="rounded border border-amber-600/40 bg-amber-500/10 p-5">
        <div className="flex items-center space-x-2 text-amber-500">
          <span className="text-base font-bold font-mono">ROOM ADMIN NOTICE</span>
        </div>
        <p className="mt-2 text-xs text-amber-600 dark:text-amber-300">
          You are the creator of this auction room. As administrator and seller, you can add and manage listings, but self-bidding is strictly prohibited.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded border border-brand-border bg-brand-card p-5 space-y-4">
      {isHighBidder && (
        <div className="rounded border border-emerald-600/40 bg-emerald-500/10 p-2.5 text-xs font-mono font-bold text-emerald-500">
          HIGH BIDDER — You currently hold the winning bid on this listing.
        </div>
      )}

      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-brand-muted">
          QUICK BID INCREMENTS
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {quickBidOptions.map((amount) => (
            <button
              key={amount}
              type="button"
              disabled={disabled || isSubmitting}
              onClick={() => onSubmitBid(amount, true)}
              className="rounded border border-brand-border bg-brand-subpanel py-2.5 text-xs font-mono font-bold text-brand-text transition hover:border-brand-accent hover:bg-brand-accent hover:text-white disabled:opacity-40"
            >
              BID {formatCentsToDollars(amount)}
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-brand-border pt-4">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-brand-muted">
          PROXY CEILING (MAX BID)
        </div>
        <form onSubmit={handleCustomSubmit} className="flex space-x-2">
          <input
            type="text"
            disabled={disabled || isSubmitting}
            placeholder={`Min ${formatCentsToDollars(nextMinimumCents)}`}
            value={customBidDollars}
            onChange={(e) => setCustomBidDollars(e.target.value)}
            className="flex-1 rounded border border-brand-border bg-brand-subpanel px-3 py-2 text-sm font-mono text-brand-text placeholder-brand-muted outline-none focus:border-brand-accent disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={
              disabled ||
              isSubmitting ||
              parseDollarsToCents(customBidDollars) < nextMinimumCents
            }
            className="rounded bg-brand-accent px-5 py-2 text-xs font-bold tracking-wider text-white transition hover:bg-brand-accentHover disabled:opacity-40"
          >
            {isSubmitting ? "PROCESSING" : "PLACE PROXY"}
          </button>
        </form>
      </div>
    </div>
  );
}

"use client";

import { BidHistoryEntry } from "../lib/types";
import { formatCentsToDollars } from "../lib/format-currency";

interface BidHistoryStreamProps {
  bids: BidHistoryEntry[];
}

export default function BidHistoryStream({ bids }: BidHistoryStreamProps) {
  return (
    <div className="rounded border border-brand-border bg-brand-card p-5">
      <div className="mb-3 flex items-center justify-between border-b border-brand-border pb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-brand-muted">
          LIVE AUDIT LEDGER
        </span>
        <span className="font-mono text-xs text-brand-muted">
          {bids.length} RECORDS
        </span>
      </div>

      <div className="max-h-72 overflow-y-auto space-y-2">
        {bids.length === 0 ? (
          <div className="py-6 text-center text-xs text-brand-muted">
            No bids recorded in ledger yet.
          </div>
        ) : (
          bids.map((bid) => (
            <div
              key={bid.id}
              className="flex items-center justify-between border-b border-brand-border/40 py-1.5 text-xs"
            >
              <div className="flex items-center space-x-2">
                <span className="font-mono font-medium text-brand-text">
                  {bid.bidder_masked}
                </span>
                {bid.is_proxy && (
                  <span className="rounded bg-brand-subpanel px-1.5 py-0.5 text-[10px] font-mono text-brand-accent">
                    PROXY
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-3">
                <span className="font-mono font-bold text-brand-text">
                  {formatCentsToDollars(bid.amount_cents)}
                </span>
                <span className="text-[11px] text-brand-muted">
                  {new Date(bid.created_at).toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

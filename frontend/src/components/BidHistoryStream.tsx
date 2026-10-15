"use client";

import { BidHistoryEntry } from "../lib/types";
import { formatCentsToDollars } from "../lib/format-currency";

interface BidHistoryStreamProps {
  bids: BidHistoryEntry[];
}

export default function BidHistoryStream({ bids }: BidHistoryStreamProps) {
  return (
    <div className="rounded border border-[#252836] bg-[#14161f] p-5">
      <div className="mb-3 flex items-center justify-between border-b border-[#222533] pb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          LIVE AUDIT LEDGER
        </span>
        <span className="font-mono text-xs text-gray-500">
          {bids.length} RECORDS
        </span>
      </div>

      <div className="max-h-72 overflow-y-auto space-y-2">
        {bids.length === 0 ? (
          <div className="py-6 text-center text-xs text-gray-500">
            No bids recorded in ledger yet.
          </div>
        ) : (
          bids.map((bid) => (
            <div
              key={bid.id}
              className="flex items-center justify-between border-b border-[#1b1e2a] py-1.5 text-xs"
            >
              <div className="flex items-center space-x-2">
                <span className="font-mono font-medium text-gray-300">
                  {bid.bidder_masked}
                </span>
                {bid.is_proxy && (
                  <span className="rounded bg-[#1e2333] px-1.5 py-0.2 text-[10px] font-mono text-blue-400">
                    PROXY
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-3">
                <span className="font-mono font-bold text-white">
                  {formatCentsToDollars(bid.amount_cents)}
                </span>
                <span className="text-[11px] text-gray-500">
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

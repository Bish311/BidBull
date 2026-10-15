"use client";

import { OutbidAlertEvent } from "../lib/types";
import { formatCentsToDollars } from "../lib/format-currency";

interface OutbidAlertProps {
  alert: OutbidAlertEvent | null;
  onDismiss: () => void;
}

export default function OutbidAlert({ alert, onDismiss }: OutbidAlertProps) {
  if (!alert) {
    return null;
  }

  return (
    <div className="mb-4 flex items-center justify-between rounded border border-rose-800 bg-rose-950/60 p-3 text-rose-300">
      <div className="flex items-center space-x-2">
        <span className="font-bold text-rose-400">OUTBID:</span>
        <span className="text-sm">
          Another bidder took the lead at{" "}
          <span className="font-mono font-semibold">
            {formatCentsToDollars(alert.outbid_price_cents)}
          </span>
          . Minimum to counter:{" "}
          <span className="font-mono font-semibold">
            {formatCentsToDollars(alert.next_minimum_cents)}
          </span>
          .
        </span>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="rounded px-2 py-0.5 text-xs text-rose-400 hover:bg-rose-900"
      >
        DISMISS
      </button>
    </div>
  );
}

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
    <div className="mb-4 flex items-center justify-between rounded border border-brand-danger bg-brand-dangerBg p-3 text-brand-danger">
      <div className="flex items-center space-x-2">
        <span className="font-bold">OUTBID:</span>
        <span className="text-sm">
          Another bidder took the lead at{" "}
          <span className="font-mono font-bold">
            {formatCentsToDollars(alert.outbid_price_cents)}
          </span>
          . Minimum to counter:{" "}
          <span className="font-mono font-bold">
            {formatCentsToDollars(alert.next_minimum_cents)}
          </span>
          .
        </span>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="rounded border border-brand-danger/50 px-2 py-0.5 text-xs font-bold hover:bg-brand-danger hover:text-white transition"
      >
        DISMISS
      </button>
    </div>
  );
}

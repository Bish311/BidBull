"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ActivePersona,
  BidAcceptedEvent,
  BidHistoryEntry,
  ItemDetail,
  OutbidAlertEvent,
  SessionState,
  SoftCloseExtendedEvent,
} from "../lib/types";
import { fetchBidHistory, fetchItemDetail, placeBid } from "../lib/api";
import { formatCentsToDollars } from "../lib/format-currency";
import { useAuctionSocket } from "../lib/use-auction-socket";
import BidConsole from "./BidConsole";
import BidHistoryStream from "./BidHistoryStream";
import CountdownTimer from "./CountdownTimer";
import OutbidAlert from "./OutbidAlert";

interface AuctionRoomProps {
  itemId: string;
  activePersona: ActivePersona;
  session?: SessionState | null;
}

export default function AuctionRoom({ itemId, activePersona, session }: AuctionRoomProps) {
  const [item, setItem] = useState<ItemDetail | null>(null);
  const [bids, setBids] = useState<BidHistoryEntry[]>([]);
  const [outbidAlert, setOutbidAlert] = useState<OutbidAlertEvent | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const itemDetail = await fetchItemDetail(itemId);
      setItem(itemDetail);
      const history = await fetchBidHistory(itemId);
      setBids(history);
    } catch {
      setErrorMessage("Unable to load auction room data");
    }
  }, [itemId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleBidAccepted = useCallback((event: BidAcceptedEvent) => {
    setItem((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        current_price_cents: event.amount_cents,
        next_minimum_cents: event.next_minimum_cents,
        high_bidder_masked: event.bidder_masked,
        bid_count: prev.bid_count + 1,
      };
    });

    const newEntry: BidHistoryEntry = {
      id: `${Date.now()}`,
      item_id: event.item_id,
      amount_cents: event.amount_cents,
      bidder_masked: event.bidder_masked,
      is_proxy: false,
      created_at: event.timestamp_utc,
    };
    setBids((prev) => [newEntry, ...prev]);
  }, []);

  const handleSoftCloseExtended = useCallback((event: SoftCloseExtendedEvent) => {
    setItem((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        expires_at: event.new_expires_at_utc,
        status: "EXTENDED",
      };
    });
  }, []);

  const handleOutbidAlert = useCallback((event: OutbidAlertEvent) => {
    setOutbidAlert(event);
  }, []);

  const { isConnected } = useAuctionSocket({
    itemId,
    token: activePersona.token,
    onBidAccepted: handleBidAccepted,
    onSoftCloseExtended: handleSoftCloseExtended,
    onOutbidAlert: handleOutbidAlert,
  });

  const handleSubmitBid = async (amountCents: number, isDirect: boolean = false) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await placeBid(itemId, amountCents, activePersona.token, isDirect);
      setItem((prev) => {
        if (!prev) return prev;
        const currentName = session?.username || activePersona.username;
        const masked = currentName.length > 2
          ? currentName[0] + "***" + currentName[currentName.length - 1]
          : currentName + "***";
        return {
          ...prev,
          current_price_cents: res.current_price_cents,
          next_minimum_cents: res.next_minimum_cents,
          high_bidder_id: session?.userId || activePersona.userId,
          high_bidder_masked: masked,
          bid_count: prev.bid_count + 1,
        };
      });
      const history = await fetchBidHistory(itemId).catch(() => []);
      if (history.length > 0) {
        setBids(history);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Bid submission rejected");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!item) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-brand-muted font-mono">
        CONNECTING TO AUCTION ROOM...
      </div>
    );
  }

  const isExpired = new Date() >= new Date(item.expires_at);
  const isClosed =
    item.status === "CLOSED_SOLD" ||
    item.status === "CLOSED_UNMET" ||
    isExpired;

  return (
    <div className="space-y-6">
      <OutbidAlert alert={outbidAlert} onDismiss={() => setOutbidAlert(null)} />

      {errorMessage && (
        <div className="rounded border border-brand-danger bg-brand-dangerBg p-3 text-xs text-brand-danger font-bold">
          {errorMessage}
        </div>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-brand-border pb-4">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-brand-text">{item.title}</h1>
            <span
              className={`rounded px-2.5 py-0.5 text-xs font-semibold ${
                isClosed
                  ? "bg-brand-subpanel text-brand-muted border border-brand-border"
                  : item.status === "EXTENDED"
                  ? "border border-amber-600/40 bg-amber-500/10 text-amber-500"
                  : "border border-emerald-600/40 bg-emerald-500/10 text-emerald-500"
              }`}
            >
              {isClosed ? "CLOSED" : item.status}
            </span>
          </div>
          <p className="mt-1 text-xs text-brand-muted">{item.description}</p>
        </div>

        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <span
              className={`inline-block h-2.5 w-2.5 rounded-full ${
                isConnected ? "bg-emerald-500" : "bg-brand-danger"
              }`}
            />
            <span className="text-xs font-mono text-brand-muted">
              {isConnected ? "STREAM LIVE" : "DISCONNECTED"}
            </span>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wider text-brand-muted">
              TIME REMAINING
            </div>
            <CountdownTimer expiresAtUtc={item.expires_at} className="text-xl" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <div className="grid grid-cols-3 gap-4 rounded border border-brand-border bg-brand-card p-5">
            <div>
              <div className="text-xs uppercase text-brand-muted">CURRENT PRICE</div>
              <div className="mt-1 font-mono text-3xl font-extrabold text-brand-text">
                {formatCentsToDollars(item.current_price_cents)}
              </div>
            </div>
            <div>
              <div className="text-xs uppercase text-brand-muted">NEXT MINIMUM</div>
              <div className="mt-1 font-mono text-3xl font-extrabold text-brand-accent">
                {formatCentsToDollars(item.next_minimum_cents)}
              </div>
            </div>
            <div>
              <div className="text-xs uppercase text-brand-muted">HIGH BIDDER</div>
              <div className="mt-1 font-mono text-xl font-bold text-brand-text">
                {item.high_bidder_masked || "No bids"}
              </div>
            </div>
          </div>

          {(() => {
            const currentUserId = session?.userId || activePersona?.userId;
            const currentUsername = session?.username || activePersona?.username;
            const isSellerOrAdmin =
              session?.role === "ADMIN" ||
              (currentUserId && item.seller_id === currentUserId);
            const isWinning =
              Boolean(currentUserId && item.high_bidder_id === currentUserId) ||
              Boolean(
                currentUsername &&
                item.high_bidder_masked &&
                item.high_bidder_masked.startsWith(currentUsername[0]) &&
                item.high_bidder_masked.endsWith(currentUsername[currentUsername.length - 1])
              );

            return (
              <BidConsole
                currentPriceCents={item.current_price_cents}
                nextMinimumCents={item.next_minimum_cents}
                isSubmitting={isSubmitting}
                onSubmitBid={handleSubmitBid}
                disabled={isClosed}
                isAdmin={Boolean(isSellerOrAdmin)}
                isHighBidder={Boolean(isWinning)}
              />
            );
          })()}
        </div>

        <div>
          <BidHistoryStream bids={bids} />
        </div>
      </div>
    </div>
  );
}

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
      <div className="flex h-64 items-center justify-center text-sm text-gray-500 font-mono">
        CONNECTING TO AUCTION ROOM...
      </div>
    );
  }

  const isClosed = item.status === "CLOSED_SOLD" || item.status === "CLOSED_UNMET";

  return (
    <div className="space-y-6">
      <OutbidAlert alert={outbidAlert} onDismiss={() => setOutbidAlert(null)} />

      {errorMessage && (
        <div className="rounded border border-red-800 bg-red-950/60 p-3 text-xs text-red-300">
          {errorMessage}
        </div>
      )}

      <div className="flex items-center justify-between border-b border-[#252836] pb-4">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-white">{item.title}</h1>
            <span
              className={`rounded px-2.5 py-0.5 text-xs font-semibold ${
                isClosed
                  ? "bg-gray-800 text-gray-400"
                  : item.status === "EXTENDED"
                  ? "bg-amber-950 text-amber-400 border border-amber-800"
                  : "bg-emerald-950 text-emerald-400 border border-emerald-800"
              }`}
            >
              {item.status}
            </span>
          </div>
          <p className="mt-1 text-xs text-gray-400">{item.description}</p>
        </div>

        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <span
              className={`inline-block h-2.5 w-2.5 rounded-full ${
                isConnected ? "bg-emerald-400" : "bg-rose-500"
              }`}
            />
            <span className="text-xs font-mono text-gray-400">
              {isConnected ? "STREAM LIVE" : "DISCONNECTED"}
            </span>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wider text-gray-500">
              TIME REMAINING
            </div>
            <CountdownTimer expiresAtUtc={item.expires_at} className="text-xl" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <div className="grid grid-cols-3 gap-4 rounded border border-[#252836] bg-[#14161f] p-5">
            <div>
              <div className="text-xs uppercase text-gray-500">CURRENT PRICE</div>
              <div className="mt-1 font-mono text-3xl font-extrabold text-white">
                {formatCentsToDollars(item.current_price_cents)}
              </div>
            </div>
            <div>
              <div className="text-xs uppercase text-gray-500">NEXT MINIMUM</div>
              <div className="mt-1 font-mono text-3xl font-extrabold text-blue-400">
                {formatCentsToDollars(item.next_minimum_cents)}
              </div>
            </div>
            <div>
              <div className="text-xs uppercase text-gray-500">HIGH BIDDER</div>
              <div className="mt-1 font-mono text-xl font-bold text-gray-200">
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
                quickBidOptions={item.quick_bid_options}
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

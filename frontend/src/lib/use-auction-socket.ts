"use client";

import { useEffect, useRef, useState } from "react";
import {
  BidAcceptedEvent,
  OutbidAlertEvent,
  RoomStateEvent,
  SoftCloseExtendedEvent,
} from "./types";

interface UseAuctionSocketOptions {
  itemId: string;
  token?: string;
  onBidAccepted?: (event: BidAcceptedEvent) => void;
  onSoftCloseExtended?: (event: SoftCloseExtendedEvent) => void;
  onOutbidAlert?: (event: OutbidAlertEvent) => void;
  onRoomState?: (event: RoomStateEvent) => void;
}

export function useAuctionSocket({
  itemId,
  token,
  onBidAccepted,
  onSoftCloseExtended,
  onOutbidAlert,
  onRoomState,
}: UseAuctionSocketOptions) {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!itemId) {
      return;
    }

    const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = process.env.NEXT_PUBLIC_WS_HOST || "localhost:8000";
    const tokenQuery = token ? `?token=${encodeURIComponent(token)}` : "";
    const wsUrl = `${wsProtocol}//${host}/ws/auctions/${itemId}${tokenQuery}`;

    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      setIsConnected(true);
    };

    socket.onclose = () => {
      setIsConnected(false);
    };

    socket.onerror = () => {
      setIsConnected(false);
    };

    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === "BID_ACCEPTED" && onBidAccepted) {
          onBidAccepted(payload);
        } else if (payload.type === "SOFT_CLOSE_EXTENDED" && onSoftCloseExtended) {
          onSoftCloseExtended(payload);
        } else if (payload.type === "OUTBID_ALERT" && onOutbidAlert) {
          onOutbidAlert(payload);
        } else if (payload.type === "ROOM_STATE" && onRoomState) {
          onRoomState(payload);
        }
      } catch {
        // Silently ignore malformed frames
      }
    };

    const pingInterval = setInterval(() => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send("ping");
      }
    }, 25000);

    return () => {
      clearInterval(pingInterval);
      socket.close();
      socketRef.current = null;
    };
  }, [itemId, token, onBidAccepted, onSoftCloseExtended, onOutbidAlert, onRoomState]);

  return { isConnected };
}

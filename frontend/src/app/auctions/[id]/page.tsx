"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import NavigationBar from "../../../components/NavigationBar";
import AuctionRoom from "../../../components/AuctionRoom";
import { ActivePersona, SessionState } from "../../../lib/types";

export default function AuctionRoomPage() {
  const params = useParams();
  const router = useRouter();
  const itemId = typeof params.id === "string" ? params.id : "";
  const [session, setSession] = useState<SessionState | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("bidbull_session");
    if (saved) {
      try {
        setSession(JSON.parse(saved));
      } catch {
        // Fallback
      }
    }
  }, []);

  const handleLeaveRoom = () => {
    localStorage.removeItem("bidbull_session");
    setSession(null);
    router.push("/");
  };

  const activePersona: ActivePersona = {
    username: session?.username || "Guest",
    token: session?.token || "",
    userId: session?.userId || "",
  };

  return (
    <div className="min-h-screen flex flex-col bg-brand-bg transition-colors">
      <NavigationBar session={session} onLeaveRoom={handleLeaveRoom} />

      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8">
        <div className="mb-4">
          <Link
            href="/"
            className="inline-flex items-center space-x-1 text-xs font-mono text-brand-muted hover:text-brand-text transition"
          >
            <span>&larr;</span>
            <span>BACK TO ROOM {session ? `(${session.roomKey})` : "HOME"}</span>
          </Link>
        </div>

        {itemId ? (
          <AuctionRoom
            itemId={itemId}
            activePersona={activePersona}
            session={session}
          />
        ) : (
          <div className="font-mono text-xs text-brand-danger">
            INVALID AUCTION ITEM IDENTIFIER
          </div>
        )}
      </main>
    </div>
  );
}

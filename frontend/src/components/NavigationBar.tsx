"use client";

import Link from "next/link";
import { SessionState } from "../lib/types";

interface NavigationBarProps {
  session: SessionState | null;
  onLeaveRoom?: () => void;
}

export default function NavigationBar({
  session,
  onLeaveRoom,
}: NavigationBarProps) {
  const handleCopyRoom = () => {
    if (session?.roomKey && typeof navigator !== "undefined") {
      navigator.clipboard.writeText(session.roomKey);
    }
  };

  return (
    <header className="border-b border-[#252836] bg-[#12141a] px-6 py-4">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/" className="text-xl font-bold tracking-wider text-white">
            BIDBULL
          </Link>
          <span className="hidden sm:inline-block rounded border border-[#232736] bg-[#171a23] px-2.5 py-0.5 text-[10px] font-mono tracking-widest text-gray-400">
            HIGH-FREQUENCY AUCTION ENGINE
          </span>
        </div>

        {session ? (
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={handleCopyRoom}
              title="Click to copy Room Key"
              className="flex items-center space-x-1.5 rounded border border-[#2e3344] bg-[#181b24] px-3 py-1 text-xs font-mono text-gray-200 hover:border-blue-500 transition"
            >
              <span className="text-gray-500">ROOM:</span>
              <span className="font-bold text-white">{session.roomKey}</span>
            </button>

            <div className="rounded border border-[#2e3344] bg-[#181b24] px-3 py-1 text-xs font-mono text-gray-200">
              <span className="text-gray-500">USER:</span>{" "}
              <span className="font-bold text-white">{session.username}</span>
            </div>

            <span
              className={`rounded px-2.5 py-1 text-[11px] font-mono font-bold uppercase tracking-wider ${
                session.role === "ADMIN"
                  ? "border border-amber-800 bg-amber-950/60 text-amber-300"
                  : "border border-blue-800 bg-blue-950/60 text-blue-300"
              }`}
            >
              {session.role === "ADMIN" ? "ROOM ADMIN" : "BIDDER"}
            </span>

            {onLeaveRoom && (
              <button
                type="button"
                onClick={onLeaveRoom}
                className="rounded border border-[#3b4154] bg-[#202430] px-3 py-1 text-xs text-gray-300 hover:bg-[#2c3244] hover:text-white transition"
              >
                EXIT
              </button>
            )}
          </div>
        ) : (
          <div className="text-xs font-mono text-gray-500">NOT CONNECTED</div>
        )}
      </div>
    </header>
  );
}

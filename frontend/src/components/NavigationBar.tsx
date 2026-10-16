"use client";

import Link from "next/link";
import { SessionState } from "../lib/types";
import { useTheme } from "../lib/use-theme";

interface NavigationBarProps {
  session: SessionState | null;
  onLeaveRoom?: () => void;
}

export default function NavigationBar({
  session,
  onLeaveRoom,
}: NavigationBarProps) {
  const { theme, toggleTheme } = useTheme();

  const handleCopyRoom = () => {
    if (session?.roomKey && typeof navigator !== "undefined") {
      navigator.clipboard.writeText(session.roomKey);
    }
  };

  return (
    <header className="border-b border-brand-border bg-brand-card px-6 py-4 transition-colors">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/"
            className="text-xl font-bold tracking-wider text-brand-text hover:text-brand-accent transition"
          >
            BIDBULL
          </Link>
          <span className="hidden sm:inline-block rounded border border-brand-border bg-brand-subpanel px-2.5 py-0.5 text-[10px] font-mono tracking-widest text-brand-muted">
            HIGH-FREQUENCY AUCTION ENGINE
          </span>
        </div>

        <div className="flex items-center space-x-3">
          {/* Theme Switcher */}
          <button
            type="button"
            onClick={toggleTheme}
            className="flex items-center space-x-1.5 rounded border border-brand-border bg-brand-subpanel px-2.5 py-1 text-xs font-mono font-medium text-brand-text hover:border-brand-accent transition"
            title={`Switch to ${theme === "dark" ? "Light" : "Dark"} mode`}
          >
            <span>{theme === "dark" ? "☀️" : "🌙"}</span>
            <span className="uppercase text-[11px] font-bold">
              {theme === "dark" ? "LIGHT" : "DARK"}
            </span>
          </button>

          {session ? (
            <>
              <button
                type="button"
                onClick={handleCopyRoom}
                title="Click to copy Room Key"
                className="flex items-center space-x-1.5 rounded border border-brand-border bg-brand-subpanel px-3 py-1 text-xs font-mono text-brand-text hover:border-brand-accent transition"
              >
                <span className="text-brand-muted">ROOM:</span>
                <span className="font-bold">{session.roomKey}</span>
              </button>

              <div className="rounded border border-brand-border bg-brand-subpanel px-3 py-1 text-xs font-mono text-brand-text">
                <span className="text-brand-muted">USER:</span>{" "}
                <span className="font-bold">{session.username}</span>
              </div>

              <span
                className={`rounded px-2.5 py-1 text-[11px] font-mono font-bold uppercase tracking-wider ${
                  session.role === "ADMIN"
                    ? "border border-amber-800 bg-amber-950/30 text-amber-500"
                    : "border border-blue-800 bg-blue-950/30 text-blue-400"
                }`}
              >
                {session.role === "ADMIN" ? "ROOM ADMIN" : "BIDDER"}
              </span>

              {onLeaveRoom && (
                <button
                  type="button"
                  onClick={onLeaveRoom}
                  className="rounded border border-brand-border bg-brand-subpanel px-3 py-1 text-xs text-brand-muted hover:bg-brand-card hover:text-brand-text transition"
                >
                  EXIT
                </button>
              )}
            </>
          ) : (
            <div className="text-xs font-mono text-brand-muted">NOT CONNECTED</div>
          )}
        </div>
      </div>
    </header>
  );
}

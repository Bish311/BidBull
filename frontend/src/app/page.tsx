"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import NavigationBar from "../components/NavigationBar";
import AuctionCard from "../components/AuctionCard";
import { Item, SessionState } from "../lib/types";
import { createItemListing, deleteItemListing, fetchItems, joinUser } from "../lib/api";
import { parseDollarsToCents } from "../lib/format-currency";

export default function CatalogPage() {
  const [session, setSession] = useState<SessionState | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Onboarding form state
  const [handle, setHandle] = useState<string>("");
  const [roomKey, setRoomKey] = useState<string>("");
  const [mode, setMode] = useState<"CREATE" | "JOIN">("CREATE");
  const [onboardingError, setOnboardingError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Admin listing creation modal
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>("");
  const [newDescription, setNewDescription] = useState<string>("");
  const [newStartingDollars, setNewStartingDollars] = useState<string>("100.00");
  const [newReserveDollars, setNewReserveDollars] = useState<string>("150.00");
  const [newDurationMinutes, setNewDurationMinutes] = useState<string>("15");
  const [createItemError, setCreateItemError] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("bidbull_session");
    if (saved) {
      try {
        setSession(JSON.parse(saved));
      } catch {
        localStorage.removeItem("bidbull_session");
      }
    }
  }, []);

  const refreshCatalog = (activeRoom: string) => {
    setIsLoading(true);
    fetchItems(activeRoom, statusFilter === "ALL" ? undefined : statusFilter)
      .then((data) => {
        setItems(data);
        setIsLoading(false);
      })
      .catch(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    if (session?.roomKey) {
      refreshCatalog(session.roomKey);
    }
  }, [session, statusFilter]);

  const handleJoinOrCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setOnboardingError(null);
    if (!handle.trim()) {
      setOnboardingError("Please enter your name");
      return;
    }
    if (!roomKey.trim()) {
      setOnboardingError("Please enter a room key");
      return;
    }

    setIsSubmitting(true);
    try {
      const auth = await joinUser(handle.trim());
      const cleanKey = roomKey.trim().toUpperCase();
      const newSession: SessionState = {
        username: auth.username,
        token: auth.access_token,
        userId: auth.user_id,
        roomKey: cleanKey,
        role: mode === "CREATE" ? "ADMIN" : "BIDDER",
      };
      localStorage.setItem("bidbull_session", JSON.stringify(newSession));
      setSession(newSession);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setOnboardingError(err.message);
      } else {
        setOnboardingError("Unable to join room");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLeaveRoom = () => {
    localStorage.removeItem("bidbull_session");
    setSession(null);
    setItems([]);
  };

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    setCreateItemError(null);

    const startCents = parseDollarsToCents(newStartingDollars);
    const reserveCents = parseDollarsToCents(newReserveDollars);
    const duration = parseInt(newDurationMinutes, 10) || 15;

    if (startCents <= 0) {
      setCreateItemError("Starting price must be positive");
      return;
    }
    if (reserveCents < startCents) {
      setCreateItemError("Reserve price must be greater than or equal to starting price");
      return;
    }

    const now = new Date();
    const expires = new Date(now.getTime() + duration * 60 * 1000);

    setIsSubmitting(true);
    try {
      await createItemListing(
        {
          title: newTitle.trim(),
          description: newDescription.trim() || "Auction item listed by room admin",
          image_url: "/placeholder.png",
          starting_price_cents: startCents,
          reserve_price_cents: reserveCents,
          starts_at: now.toISOString(),
          expires_at: expires.toISOString(),
          room_code: session.roomKey,
        },
        session.token
      );
      setShowCreateModal(false);
      setNewTitle("");
      setNewDescription("");
      refreshCatalog(session.roomKey);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setCreateItemError(err.message);
      } else {
        setCreateItemError("Failed to list item");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!session || session.role !== "ADMIN") return;
    try {
      await deleteItemListing(itemId, session.token);
      refreshCatalog(session.roomKey);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to delete listing");
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col bg-[#0c0d11]">
        <NavigationBar session={null} />

        <main className="mx-auto flex flex-1 w-full max-w-md items-center justify-center px-4 py-12">
          <div className="w-full rounded border border-[#252836] bg-[#12141a] p-6 sm:p-8">
            <div className="mb-6 border-b border-[#222533] pb-4">
              <h1 className="text-xl font-bold tracking-wider text-white">
                ENTER AUCTION ENGINE
              </h1>
              <p className="mt-1 text-xs text-gray-400">
                Identify yourself and create or enter an isolated bidding room.
              </p>
            </div>

            {onboardingError && (
              <div className="mb-4 rounded border border-red-900 bg-red-950/60 p-3 text-xs text-red-300">
                {onboardingError}
              </div>
            )}

            <div className="mb-5 flex rounded border border-[#2e3344] bg-[#0c0d11] p-1">
              <button
                type="button"
                onClick={() => setMode("CREATE")}
                className={`flex-1 rounded py-1.5 text-xs font-mono font-bold transition ${
                  mode === "CREATE"
                    ? "bg-[#2563eb] text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                CREATE NEW ROOM (ADMIN)
              </button>
              <button
                type="button"
                onClick={() => setMode("JOIN")}
                className={`flex-1 rounded py-1.5 text-xs font-mono font-bold transition ${
                  mode === "JOIN"
                    ? "bg-[#2563eb] text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                JOIN EXISTING ROOM
              </button>
            </div>

            <form onSubmit={handleJoinOrCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300">
                  YOUR NAME / HANDLE
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bishwayan"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  className="mt-1 w-full rounded border border-[#2e3344] bg-[#0c0d11] px-3 py-2 text-sm font-mono text-white placeholder-gray-600 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300">
                  {mode === "CREATE" ? "ROOM IDENTIFIER / KEY" : "ROOM KEY TO JOIN"}
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. TECH-VAULT"
                  value={roomKey}
                  onChange={(e) => setRoomKey(e.target.value)}
                  className="mt-1 w-full rounded border border-[#2e3344] bg-[#0c0d11] px-3 py-2 text-sm font-mono text-white placeholder-gray-600 outline-none focus:border-blue-500"
                />
                <span className="mt-1 block text-[11px] text-gray-500">
                  {mode === "CREATE"
                    ? "You will be the Room Admin (able to put items up for auction)."
                    : "Enter as a participant bidder to place bids in this room."}
                </span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded bg-[#2563eb] py-2.5 text-xs font-bold tracking-wider text-white transition hover:bg-[#1d4ed8] disabled:opacity-50"
              >
                {isSubmitting
                  ? "INITIALIZING..."
                  : mode === "CREATE"
                  ? "CREATE ROOM & ENTER AS ADMIN"
                  : "JOIN ROOM AS BIDDER"}
              </button>
            </form>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0c0d11]">
      <NavigationBar session={session} onLeaveRoom={handleLeaveRoom} />

      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#252836] pb-5">
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-xl font-bold tracking-wide text-white">
                ROOM: {session.roomKey}
              </h1>
              <span
                className={`rounded px-2.5 py-0.5 text-xs font-mono font-bold ${
                  session.role === "ADMIN"
                    ? "border border-amber-800 bg-amber-950/60 text-amber-300"
                    : "border border-blue-800 bg-blue-950/60 text-blue-300"
                }`}
              >
                {session.role === "ADMIN" ? "ADMINISTRATOR" : "BIDDER"}
              </span>
            </div>
            <p className="mt-1 text-xs text-gray-400">
              {session.role === "ADMIN"
                ? "You manage this room. Add auction items below. Self-bidding is restricted."
                : "Real-time proxy bidding and anti-sniping room."}
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {session.role === "ADMIN" && (
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="rounded border border-emerald-700 bg-emerald-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-emerald-500"
              >
                + LIST NEW AUCTION ITEM
              </button>
            )}

            <div className="flex space-x-1 rounded bg-[#161822] p-1 border border-[#252836]">
              {["ALL", "ACTIVE", "CLOSED"].map((statusName) => (
                <button
                  key={statusName}
                  type="button"
                  onClick={() => setStatusFilter(statusName)}
                  className={`rounded px-3 py-1 text-xs font-semibold tracking-wider transition ${
                    statusFilter === statusName
                      ? "bg-[#2563eb] text-white"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  {statusName}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Modal for Admin Adding Listing */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
            <div className="w-full max-w-lg rounded border border-[#2e3344] bg-[#12141a] p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-[#252836] pb-3">
                <h2 className="text-base font-bold text-white">LIST NEW AUCTION ITEM</h2>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="text-xs text-gray-400 hover:text-white"
                >
                  CLOSE
                </button>
              </div>

              {createItemError && (
                <div className="rounded border border-red-900 bg-red-950/60 p-2.5 text-xs text-red-300">
                  {createItemError}
                </div>
              )}

              <form onSubmit={handleCreateItem} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-300">ITEM TITLE</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Vintage Mechanical Chronograph"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="mt-1 w-full rounded border border-[#2b3042] bg-[#0c0d11] px-3 py-2 text-xs font-mono text-white outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300">DESCRIPTION</label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Provide details about the lot..."
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    className="mt-1 w-full rounded border border-[#2b3042] bg-[#0c0d11] px-3 py-2 text-xs font-mono text-white outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-300">START ($)</label>
                    <input
                      type="text"
                      required
                      placeholder="100.00"
                      value={newStartingDollars}
                      onChange={(e) => setNewStartingDollars(e.target.value)}
                      className="mt-1 w-full rounded border border-[#2b3042] bg-[#0c0d11] px-3 py-2 text-xs font-mono text-white outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-300">RESERVE ($)</label>
                    <input
                      type="text"
                      required
                      placeholder="150.00"
                      value={newReserveDollars}
                      onChange={(e) => setNewReserveDollars(e.target.value)}
                      className="mt-1 w-full rounded border border-[#2b3042] bg-[#0c0d11] px-3 py-2 text-xs font-mono text-white outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-300">MINUTES</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={newDurationMinutes}
                      onChange={(e) => setNewDurationMinutes(e.target.value)}
                      className="mt-1 w-full rounded border border-[#2b3042] bg-[#0c0d11] px-3 py-2 text-xs font-mono text-white outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="rounded border border-[#3b4154] bg-[#1e2230] px-4 py-2 text-xs text-gray-300 hover:text-white"
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded bg-[#2563eb] px-5 py-2 text-xs font-bold text-white hover:bg-[#1d4ed8] disabled:opacity-50"
                  >
                    {isSubmitting ? "LISTING..." : "PUBLISH ITEM"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex h-64 items-center justify-center font-mono text-xs text-gray-500">
            LOADING ROOM ITEMS...
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 space-y-3 rounded border border-dashed border-[#252836] p-8 text-center">
            <span className="font-mono text-xs text-gray-500">
              NO AUCTION ITEMS IN ROOM &quot;{session.roomKey}&quot;
            </span>
            {session.role === "ADMIN" ? (
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="rounded bg-[#2563eb] px-4 py-2 text-xs font-bold text-white hover:bg-[#1d4ed8]"
              >
                + LIST THE FIRST ITEM NOW
              </button>
            ) : (
              <span className="text-xs text-gray-600">
                Waiting for the Room Admin to publish items.
              </span>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <AuctionCard
                key={item.id}
                item={item}
                canDelete={session.role === "ADMIN" && item.bid_count === 0}
                onDelete={handleDeleteItem}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

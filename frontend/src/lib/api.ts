import {
  BidHistoryEntry,
  BidSubmissionResponse,
  Item,
  ItemDetail,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function fetchItems(
  roomCode?: string,
  statusFilter?: string
): Promise<Item[]> {
  const params = new URLSearchParams();
  if (roomCode) {
    params.set("room_code", roomCode);
  }
  if (statusFilter) {
    params.set("status", statusFilter);
  }
  const query = params.toString();
  const url = query ? `${API_BASE}/api/items?${query}` : `${API_BASE}/api/items`;

  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to fetch items: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchItemDetail(itemId: string): Promise<ItemDetail> {
  const response = await fetch(`${API_BASE}/api/items/${itemId}`, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch item details: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchBidHistory(
  itemId: string
): Promise<BidHistoryEntry[]> {
  const response = await fetch(`${API_BASE}/api/items/${itemId}/bids`, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch bid history: ${response.statusText}`);
  }
  return response.json();
}

export async function placeBid(
  itemId: string,
  maxBidCents: number,
  token: string
): Promise<BidSubmissionResponse> {
  const response = await fetch(`${API_BASE}/api/items/${itemId}/bids`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ max_bid_cents: maxBidCents }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || "Bid submission failed");
  }
  return data;
}

export async function joinUser(username: string): Promise<{
  access_token: string;
  user_id: string;
  username: string;
}> {
  const response = await fetch(`${API_BASE}/api/auth/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: username.trim() }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Unable to join with specified handle");
  }
  return response.json();
}

export async function createItemListing(
  payload: {
    title: string;
    description: string;
    image_url: string;
    starting_price_cents: number;
    reserve_price_cents: number;
    starts_at: string;
    expires_at: string;
    room_code: string;
  },
  token: string
): Promise<Item> {
  const response = await fetch(`${API_BASE}/api/items`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || "Listing creation failed");
  }
  return data;
}

export async function deleteItemListing(
  itemId: string,
  token: string
): Promise<void> {
  const response = await fetch(`${API_BASE}/api/items/${itemId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error("Failed to delete listing");
  }
}

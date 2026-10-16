export interface User {
  id: string;
  username: string;
  email: string;
  created_at: string;
}

export interface Item {
  id: string;
  seller_id: string;
  title: string;
  description: string;
  image_url: string;
  starting_price_cents: number;
  current_price_cents: number;
  high_bidder_masked: string | null;
  status: "DRAFT" | "ACTIVE" | "EXTENDED" | "CLOSED_SOLD" | "CLOSED_UNMET";
  reserve_met: boolean;
  starts_at: string;
  expires_at: string;
  bid_count: number;
  room_code: string;
  created_at: string;
}

export interface ItemDetail extends Item {
  high_bidder_id?: string | null;
  next_minimum_cents: number;
  quick_bid_options?: number[];
  is_seller: boolean;
  is_high_bidder: boolean;
}

export interface BidHistoryEntry {
  id: string;
  item_id: string;
  amount_cents: number;
  bidder_masked: string;
  is_proxy: boolean;
  created_at: string;
}

export interface BidSubmissionResponse {
  status: string;
  item_id: string;
  current_price_cents: number;
  next_minimum_cents: number;
  is_high_bidder: boolean;
  soft_close_extended: boolean;
  expires_at: string;
}

export interface RoomStateEvent {
  type: "ROOM_STATE";
  item_id: string;
  current_price_cents: number;
  next_minimum_cents: number;
  high_bidder_masked: string | null;
  reserve_met: boolean;
  status: string;
  server_time_utc: string;
  expires_at_utc: string;
  participants: number;
}

export interface BidAcceptedEvent {
  type: "BID_ACCEPTED";
  item_id: string;
  amount_cents: number;
  next_minimum_cents: number;
  bidder_masked: string;
  timestamp_utc: string;
}

export interface SoftCloseExtendedEvent {
  type: "SOFT_CLOSE_EXTENDED";
  item_id: string;
  new_expires_at_utc: string;
  seconds_added: number;
}

export interface OutbidAlertEvent {
  type: "OUTBID_ALERT";
  item_id: string;
  outbid_price_cents: number;
  next_minimum_cents: number;
}

export interface ActivePersona {
  username: string;
  token: string;
  userId: string;
}

export interface SessionState {
  username: string;
  token: string;
  userId: string;
  roomKey: string;
  role: "ADMIN" | "BIDDER";
}

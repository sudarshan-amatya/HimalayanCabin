import { apiRequest } from "./api";
import type { Gift, GiftStatus, User } from "../types";

export type CreateGiftData = {
  giftType: "VOUCHER" | "CABIN";
  recipientName: string;
  recipientEmail: string;
  senderName: string;
  amount?: number;
  cabinId?: string;
  checkInDate?: string;
  checkOutDate?: string;
  travellers?: number;
  message?: string;
  deliveryDate?: string;
};

type GiftResponse = {
  message: string;
  gift: Gift;
  booking?: unknown;
  user?: User | null;
};

type GiftsResponse = {
  message: string;
  gifts: Gift[];
};

export function createGift(data: CreateGiftData) {
  return apiRequest<GiftResponse>("/gifts", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function getReceivedGifts() {
  return apiRequest<GiftsResponse>("/gifts/received");
}

export function getSentGifts() {
  return apiRequest<GiftsResponse>("/gifts/sent");
}

export function acceptGift(id: string) {
  return apiRequest<GiftResponse>(`/gifts/${id}/accept`, {
    method: "PATCH",
  });
}

export function declineGift(id: string) {
  return apiRequest<GiftResponse>(`/gifts/${id}/decline`, {
    method: "PATCH",
  });
}

export function getOwnerGiftRequests() {
  return apiRequest<GiftsResponse>("/gifts/owner/requests");
}

export function updateOwnerGiftStatus(id: string, status: Extract<GiftStatus, "SENT" | "REJECTED">) {
  return apiRequest<GiftResponse>(`/gifts/owner/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

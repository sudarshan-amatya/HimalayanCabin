import { apiRequest } from "./api";
import type { GiftType } from "../types";

export type EsewaPayload = {
  amount: string;
  tax_amount: string;
  total_amount: string;
  transaction_uuid: string;
  product_code: string;
  product_service_charge: string;
  product_delivery_charge: string;
  success_url: string;
  failure_url: string;
  signed_field_names: string;
  signature: string;
};

export type EsewaInitiationResponse = {
  message: string;
  actionUrl: string;
  payload: EsewaPayload;
};

export type InitiateGiftEsewaData = {
  giftType: GiftType;
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

export function initiateBookingEsewaPayment(bookingId: string) {
  return apiRequest<EsewaInitiationResponse>(`/payments/esewa/bookings/${bookingId}`, {
    method: "POST",
  });
}

export function initiateGiftEsewaPayment(data: InitiateGiftEsewaData) {
  return apiRequest<EsewaInitiationResponse>("/payments/esewa/gifts", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function submitEsewaForm(actionUrl: string, payload: EsewaPayload) {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = actionUrl;

  Object.entries(payload).forEach(([name, value]) => {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = String(value);
    form.appendChild(input);
  });

  document.body.appendChild(form);
  form.submit();
}

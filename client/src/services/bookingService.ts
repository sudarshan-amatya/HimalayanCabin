import { apiRequest } from "./api";
import type { Booking, BookingStatus, PaymentMethod, User } from "../types";

export type CreateBookingData = {
  cabinId: string;
  fullName: string;
  phone: string;
  email: string;
  checkInDate: string;
  checkOutDate: string;
  travellers: number;
  specialRequest?: string;
};

type BookingResponse = {
  message: string;
  booking: Booking;
  user?: User | null;
};

type BookingsResponse = {
  message: string;
  bookings: Booking[];
};

export function createBooking(data: CreateBookingData) {
  return apiRequest<BookingResponse>("/bookings", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function getMyBookings() {
  return apiRequest<BookingsResponse>("/bookings/my-bookings");
}

export function getMyBookingById(id: string) {
  return apiRequest<BookingResponse>(`/bookings/my-bookings/${id}`);
}

export function cancelBooking(id: string) {
  return apiRequest<BookingResponse>(`/bookings/${id}/cancel`, {
    method: "PATCH",
  });
}

export function updateBookingPayment(id: string, paymentMethod: Extract<PaymentMethod, "PAY_AT_PROPERTY" | "GIFT_CREDIT">) {
  return apiRequest<BookingResponse>(`/bookings/${id}/payment`, {
    method: "PATCH",
    body: JSON.stringify({ paymentMethod }),
  });
}

export function getAllBookings() {
  return apiRequest<BookingsResponse>("/bookings");
}

export function getAdminBookingById(id: string) {
  return apiRequest<BookingResponse>(`/bookings/admin/${id}`);
}

export function getOwnerBookings() {
  return apiRequest<BookingsResponse>("/bookings/owner/my-bookings");
}

export function getOwnerBookingById(id: string) {
  return apiRequest<BookingResponse>(`/bookings/owner/my-bookings/${id}`);
}

export function updateBookingStatus(id: string, status: BookingStatus) {
  return apiRequest<BookingResponse>(`/bookings/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export function updateOwnerBookingStatus(id: string, status: BookingStatus) {
  return apiRequest<BookingResponse>(`/bookings/owner/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

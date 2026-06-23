import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router";
import { getApiAssetUrl } from "../services/api";
import {
  getAdminBookingById,
  getMyBookingById,
  getOwnerBookingById,
  updateBookingPayment,
  updateBookingStatus,
  updateOwnerBookingStatus,
} from "../services/bookingService";
import { initiateBookingEsewaPayment, submitEsewaForm } from "../services/paymentService";
import type { Booking, PaymentMethod } from "../types";
import { saveUser } from "../utils/auth";

function formatDate(date?: string | null) {
  if (!date) return "-";
  return new Intl.DateTimeFormat("en", { year: "numeric", month: "short", day: "numeric" }).format(new Date(date));
}

function formatDateTime(date?: string | null) {
  if (!date) return "-";
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function statusClass(status: Booking["status"]) {
  if (status === "CONFIRMED") return "bg-green-100 text-green-700";
  if (status === "COMPLETED") return "bg-blue-100 text-blue-700";
  if (status === "CANCELLED") return "bg-red-100 text-red-700";
  return "bg-yellow-100 text-yellow-700";
}

function paymentLabel(method: PaymentMethod) {
  if (method === "PAY_AT_PROPERTY") return "Pay at the property";
  if (method === "GIFT_CREDIT") return "Gift credit";
  if (method === "ESEWA") return "eSewa";
  if (method === "FAKE_ESEWA") return "Fake eSewa (old test)";
  if (method === "GIFT") return "Cabin gift";
  return "Not selected yet";
}

type PaymentAction = "PAY_AT_PROPERTY" | "GIFT_CREDIT" | "ESEWA" | "CONFIRMED" | "CANCELLED" | "PENDING";

function BookingDetails() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const mode = useMemo(() => {
    if (location.pathname.startsWith("/admin")) return "ADMIN";
    if (location.pathname.startsWith("/owner")) return "OWNER";
    return "USER";
  }, [location.pathname]);

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<PaymentAction | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function fetchBooking() {
      if (!id) return;

      try {
        const data =
          mode === "ADMIN"
            ? await getAdminBookingById(id)
            : mode === "OWNER"
              ? await getOwnerBookingById(id)
              : await getMyBookingById(id);

        setBooking(data.booking);
      } catch (error) {
        setError(error instanceof Error ? error.message : "Failed to load booking details");
      } finally {
        setLoading(false);
      }
    }

    fetchBooking();
  }, [id, mode]);

  async function handleOfflinePayment(method: Extract<PaymentMethod, "PAY_AT_PROPERTY" | "GIFT_CREDIT">) {
    if (!booking) return;

    try {
      setError("");
      setSuccess("");
      setActionLoading(method);
      const data = await updateBookingPayment(booking.id, method);
      setBooking(data.booking);
      if (data.user) saveUser(data.user);
      setSuccess(data.message);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to update payment");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleEsewaPayment() {
    if (!booking) return;

    try {
      setError("");
      setSuccess("");
      setActionLoading("ESEWA");
      const data = await initiateBookingEsewaPayment(booking.id);
      submitEsewaForm(data.actionUrl, data.payload);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to start eSewa payment");
      setActionLoading(null);
    }
  }

  async function handleStatusChange(status: Extract<Booking["status"], "PENDING" | "CONFIRMED" | "CANCELLED">) {
    if (!booking || mode === "USER") return;

    try {
      setError("");
      setSuccess("");
      setActionLoading(status);
      const data = mode === "ADMIN"
        ? await updateBookingStatus(booking.id, status)
        : await updateOwnerBookingStatus(booking.id, status);
      setBooking(data.booking);
      setSuccess(`Booking marked as ${status.toLowerCase()}.`);
      window.dispatchEvent(new Event("notifications-changed"));
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to update booking status");
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) return <p className="px-4 py-20 text-center">Loading booking details...</p>;

  if (!booking) {
    return (
      <section className="mx-auto max-w-4xl px-4 py-20 text-center">
        <p className="text-red-600">{error || "Booking not found"}</p>
        <button type="button" onClick={() => navigate(-1)} className="mt-5 cursor-pointer text-[#24472f] underline">
          Go back
        </button>
      </section>
    );
  }

  const canChoosePayment = mode === "USER" && booking.status === "CONFIRMED" && booking.paymentStatus !== "PAID";
  const canAdminManageBooking = mode === "ADMIN" && booking.status !== "COMPLETED";
  const canOwnerManageBooking = mode === "OWNER" && booking.status === "PENDING";
  const showOwnerLockedMessage = mode === "OWNER" && booking.status === "CONFIRMED";
  const canManageBooking = canAdminManageBooking || canOwnerManageBooking;
  const backTo = mode === "ADMIN" ? "/admin/bookings" : mode === "OWNER" ? "/owner/bookings" : "/my-bookings";

  return (
    <section className="mx-auto max-w-6xl overflow-hidden px-4 py-20">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-semibold text-[#17703a]">Booking details</p>
          <h1 className="mt-3 break-words font-serif text-4xl font-bold text-[#101918]">{booking.cabin.name}</h1>
          <p className="mt-3 text-sm text-gray-600">
            {booking.cabin.location} · {formatDate(booking.checkInDate)} → {formatDate(booking.checkOutDate)}
          </p>
        </div>
        <Link to={backTo} className="w-fit rounded-md border border-[#24472f] px-5 py-3 text-sm font-semibold text-[#24472f]">
          Back to {mode === "ADMIN" ? "admin bookings" : mode === "OWNER" ? "owner bookings" : "my bookings"}
        </Link>
      </div>

      {error && <p className="mb-6 rounded-md bg-red-100 px-4 py-3 text-sm text-red-700">{error}</p>}
      {success && <p className="mb-6 rounded-md bg-green-100 px-4 py-3 text-sm text-green-700">{success}</p>}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-6">
          <div className="overflow-hidden rounded-md bg-[#eff8f5]">
            {booking.cabin.image && (
              <img src={getApiAssetUrl(booking.cabin.image)} alt={booking.cabin.name} className="h-72 w-full object-cover" />
            )}
            <div className="p-6">
              <div className="flex flex-wrap gap-3">
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(booking.status)}`}>{booking.status}</span>
                {booking.isGift && <span className="rounded-full bg-[#f4b855]/25 px-3 py-1 text-xs font-bold text-[#8a5a00]">Gift booking</span>}
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#24472f]">{booking.paymentStatus}</span>
              </div>

              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Guest</p>
                  <p className="mt-2 break-words font-semibold text-[#101918]">{booking.fullName}</p>
                  <p className="mt-1 break-words text-sm text-gray-600">{booking.email}</p>
                  <p className="break-words text-sm text-gray-600">{booking.phone}</p>
                  {booking.user && (mode === "ADMIN" || mode === "OWNER") && (
                    <p className="mt-2 rounded-md bg-white px-3 py-2 text-xs text-gray-600">
                      Account completed bookings: <strong>{booking.user.successfulBookings || 0}</strong>
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">Stay</p>
                  <p className="mt-2 text-sm text-gray-700">Check-in: {formatDate(booking.checkInDate)}</p>
                  <p className="text-sm text-gray-700">Check-out: {formatDate(booking.checkOutDate)}</p>
                  <p className="text-sm text-gray-700">Travellers: {booking.travellers}</p>
                </div>
              </div>

              {booking.specialRequest && (
                <div className="mt-6 rounded-md bg-white p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Special request</p>
                  <p className="mt-2 break-words text-sm leading-6 text-gray-700">{booking.specialRequest}</p>
                </div>
              )}
            </div>
          </div>

          {mode === "USER" && (booking.status === "CONFIRMED" || booking.status === "COMPLETED") && booking.cabin.owner && (
            <div className="rounded-md border border-gray-200 p-6">
              <h2 className="font-serif text-2xl font-bold">Property contact</h2>
              <p className="mt-3 text-sm text-gray-600">Visible after confirmation.</p>
              <div className="mt-4 rounded-md bg-[#eff8f5] p-4 text-sm text-gray-700">
                <p className="font-semibold text-[#101918]">{booking.cabin.owner.firstName} {booking.cabin.owner.lastName}</p>
                <p className="mt-1 break-words">{booking.cabin.owner.email}</p>
                <p>{booking.cabin.owner.phone || "No phone added"}</p>
              </div>
            </div>
          )}
        </div>

        <aside className="h-fit rounded-md bg-[#202b29] p-6 text-white">
          {canManageBooking && (
            <div className="mb-6 rounded-md bg-white/10 p-4">
              <p className="text-xs uppercase tracking-wide text-[#f4b855]">Booking action</p>
              <h2 className="mt-2 font-serif text-2xl font-bold">Confirm or reject</h2>
              <p className="mt-2 text-sm leading-6 text-gray-200">
                {mode === "OWNER"
                  ? "Owners can confirm or reject only while the request is pending. After confirmation, only the main admin can change it."
                  : "Admin can confirm, cancel, or move active bookings back to pending when needed."}
              </p>
              <div className="mt-4 grid gap-2">
                <button type="button" disabled={actionLoading === "CONFIRMED" || booking.status === "CONFIRMED"} onClick={() => handleStatusChange("CONFIRMED")} className="w-full cursor-pointer rounded-md bg-[#f4b855] px-4 py-3 text-sm font-semibold text-[#101918] disabled:cursor-not-allowed disabled:opacity-50">Confirm booking</button>
                <button type="button" disabled={actionLoading === "CANCELLED" || booking.status === "CANCELLED"} onClick={() => handleStatusChange("CANCELLED")} className="w-full cursor-pointer rounded-md border border-red-200 px-4 py-3 text-sm font-semibold text-red-100 disabled:cursor-not-allowed disabled:opacity-50">Reject / Cancel</button>
                {mode === "ADMIN" && (
                  <button type="button" disabled={actionLoading === "PENDING" || booking.status === "PENDING"} onClick={() => handleStatusChange("PENDING")} className="w-full cursor-pointer rounded-md border border-white/20 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">Move to pending</button>
                )}
              </div>
            </div>
          )}

          {showOwnerLockedMessage && (
            <div className="mb-6 rounded-md bg-white/10 p-4">
              <p className="text-xs uppercase tracking-wide text-[#f4b855]">Booking locked</p>
              <h2 className="mt-2 font-serif text-2xl font-bold">Confirmed booking</h2>
              <p className="mt-2 text-sm leading-6 text-gray-200">
                This booking is already confirmed. Owners cannot cancel it or move it back to pending. Ask the main admin if a confirmed booking needs to be changed.
              </p>
            </div>
          )}

          <p className="text-xs uppercase tracking-wide text-[#f4b855]">Payment summary</p>
          <h2 className="mt-3 text-3xl font-bold">Rs. {booking.totalPrice.toLocaleString()}</h2>

          <div className="mt-6 space-y-3 break-words text-sm text-gray-200">
            <p>Method: <span className="font-semibold text-white">{paymentLabel(booking.paymentMethod)}</span></p>
            <p>Status: <span className="font-semibold text-white">{booking.paymentStatus}</span></p>
            {booking.giftCreditUsed ? <p>Gift credit used: Rs. {booking.giftCreditUsed.toLocaleString()}</p> : null}
            {booking.paymentReference && <p>Reference: {booking.paymentReference}</p>}
            {booking.paymentReference === "AUTO-PAY-AT-PROPERTY" && (
              <p className="rounded-md bg-white/10 px-3 py-2 text-xs text-[#f4b855]">
                The guest did not choose a payment method before checkout passed, so the system automatically set this booking to Pay at the property.
              </p>
            )}
            {booking.paidAt && <p>Paid at: {formatDateTime(booking.paidAt)}</p>}
          </div>

          {canChoosePayment ? (
            <div className="mt-6 space-y-3">
              <p className="text-sm leading-6 text-gray-200">Your booking is confirmed. Choose how you want to pay.</p>
              <button
                type="button"
                disabled={actionLoading === "PAY_AT_PROPERTY"}
                onClick={() => handleOfflinePayment("PAY_AT_PROPERTY")}
                className="w-full cursor-pointer rounded-md bg-white px-4 py-3 text-sm font-semibold text-[#101918] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Pay at property
              </button>
              <button
                type="button"
                disabled={actionLoading === "GIFT_CREDIT"}
                onClick={() => handleOfflinePayment("GIFT_CREDIT")}
                className="w-full cursor-pointer rounded-md bg-[#f4b855] px-4 py-3 text-sm font-semibold text-[#101918] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Pay using gift credit
              </button>
              <button
                type="button"
                disabled={actionLoading === "ESEWA"}
                onClick={handleEsewaPayment}
                className="w-full cursor-pointer rounded-md border border-white/30 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {actionLoading === "ESEWA" ? "Redirecting..." : "Pay with eSewa"}
              </button>
            </div>
          ) : (
            <p className="mt-6 rounded-md bg-white/10 p-4 text-sm leading-6 text-gray-200">
              {mode !== "USER"
                ? "Payment details are visible here for admin/owner review."
                : booking.status !== "CONFIRMED"
                  ? "Payment choices unlock after the owner confirms your booking."
                  : "Payment is already selected for this booking."}
            </p>
          )}
        </aside>
      </div>
    </section>
  );
}

export default BookingDetails;

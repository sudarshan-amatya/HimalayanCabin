import { useEffect, useState } from "react";
import { Link } from "react-router";
import { getOwnerBookings, updateOwnerBookingStatus } from "../services/bookingService";
import { getOwnerGiftRequests, updateOwnerGiftStatus } from "../services/giftService";
import type { Booking, BookingStatus, Gift as GiftType } from "../types";

function formatDate(date: string | null) {
  if (!date) return "Not selected";
  return new Intl.DateTimeFormat("en", { year: "numeric", month: "short", day: "numeric" }).format(new Date(date));
}

function getStatusClass(status: BookingStatus | GiftType["status"]) {
  if (status === "CONFIRMED" || status === "ACCEPTED" || status === "SENT") return "bg-green-100 text-green-700";
  if (status === "COMPLETED") return "bg-blue-100 text-blue-700";
  if (status === "CANCELLED" || status === "DECLINED" || status === "REJECTED") return "bg-red-100 text-red-700";
  return "bg-yellow-100 text-yellow-700";
}

function paymentLabel(booking: Booking) {
  if (booking.paymentMethod === "PAY_AT_PROPERTY") return "Pay at property";
  if (booking.paymentMethod === "GIFT_CREDIT") return "Gift credit";
  if (booking.paymentMethod === "ESEWA") return "eSewa";
  if (booking.paymentMethod === "FAKE_ESEWA") return "Fake eSewa";
  if (booking.paymentMethod === "GIFT") return "Gift";
  return "Not selected";
}

function OwnerBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [giftRequests, setGiftRequests] = useState<GiftType[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function fetchBookings() {
      try {
        const [bookingData, giftData] = await Promise.all([getOwnerBookings(), getOwnerGiftRequests()]);
        setBookings(bookingData.bookings);
        setGiftRequests(giftData.gifts);
      } catch (error) {
        setError(error instanceof Error ? error.message : "Failed to load owner requests");
      } finally {
        setLoading(false);
      }
    }
    fetchBookings();
  }, []);

  async function handleStatusChange(id: string, status: BookingStatus) {
    try {
      setActionId(id);
      setError("");
      setSuccess("");
      const data = await updateOwnerBookingStatus(id, status);
      setBookings((current) => current.map((booking) => (booking.id === id ? data.booking : booking)));
      setSuccess(`Booking marked as ${status.toLowerCase()}.`);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to update booking");
    } finally {
      setActionId(null);
    }
  }

  async function handleGiftStatusChange(id: string, status: "SENT" | "REJECTED") {
    try {
      setActionId(id);
      setError("");
      setSuccess("");
      const data = await updateOwnerGiftStatus(id, status);
      setGiftRequests((current) => current.map((gift) => (gift.id === id ? data.gift : gift)));
      setSuccess(data.message);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to update gift request");
    } finally {
      setActionId(null);
    }
  }

  return (
    <section className="mx-auto max-w-6xl overflow-hidden px-4 py-20">
      <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-semibold text-[#17703a]">Cabin Owner</p>
          <h1 className="mt-3 font-serif text-4xl font-bold">Booking requests</h1>
          <p className="mt-3 text-sm text-gray-600">Confirm or cancel booking requests and cabin gifts only for cabins that belong to you.</p>
        </div>
        <Link to="/owner" className="w-fit rounded-md border border-[#24472f] px-5 py-3 text-sm font-semibold text-[#24472f]">
          Back to owner dashboard
        </Link>
      </div>

      {error && <p className="mb-5 rounded-md bg-red-100 px-4 py-3 text-sm text-red-700">{error}</p>}
      {success && <p className="mb-5 rounded-md bg-green-100 px-4 py-3 text-sm text-green-700">{success}</p>}

      <div className="mb-10 rounded-md border border-[#f4b855]/40 bg-[#fffaf0] p-5">
        <h2 className="font-serif text-2xl font-bold text-[#101918]">Cabin gift confirmation requests</h2>
        <p className="mt-2 text-sm text-gray-600">Cabin gifts are paid first through eSewa, then sent to recipients only after you confirm availability.</p>

        {loading ? (
          <p className="mt-5 text-sm text-gray-600">Loading gift requests...</p>
        ) : giftRequests.length === 0 ? (
          <p className="mt-5 text-sm text-gray-600">No cabin gift requests yet.</p>
        ) : (
          <div className="mt-5 grid gap-4">
            {giftRequests.map((gift) => (
              <article key={gift.id} className="rounded-md border bg-white p-4">
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="break-words font-serif text-xl font-bold text-[#101918]">{gift.cabin?.name}</h3>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(gift.status)}`}>{gift.status.replaceAll("_", " ")}</span>
                    </div>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <div><p className="text-xs uppercase text-gray-400">Recipient</p><p className="mt-1 break-words text-sm font-semibold">{gift.recipientName}</p><p className="break-words text-xs text-gray-500">{gift.recipientEmail}</p></div>
                      <div><p className="text-xs uppercase text-gray-400">Sender</p><p className="mt-1 text-sm font-semibold">{gift.senderName}</p></div>
                      <div><p className="text-xs uppercase text-gray-400">Dates</p><p className="mt-1 text-sm font-semibold">{formatDate(gift.checkInDate)} → {formatDate(gift.checkOutDate)}</p><p className="text-xs text-gray-500">{gift.travellers || 1} traveller(s)</p></div>
                      <div><p className="text-xs uppercase text-gray-400">Paid value</p><p className="mt-1 text-sm font-semibold">Rs. {(gift.totalPrice || 0).toLocaleString()}</p><p className="text-xs text-gray-500">eSewa · {gift.paymentStatus || "PAID"}</p></div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 lg:block lg:space-y-2">
                    <button disabled={actionId === gift.id || gift.status !== "PENDING_OWNER_CONFIRMATION"} onClick={() => handleGiftStatusChange(gift.id, "SENT")} className="cursor-pointer rounded-md bg-[#24472f] px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40">Confirm gift</button>
                    <button disabled={actionId === gift.id || gift.status !== "PENDING_OWNER_CONFIRMATION"} onClick={() => handleGiftStatusChange(gift.id, "REJECTED")} className="cursor-pointer rounded-md border border-red-200 px-4 py-3 text-sm font-semibold text-red-600 disabled:cursor-not-allowed disabled:opacity-40">Reject</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <p className="rounded-md border p-6 text-sm text-gray-600">Loading booking requests...</p>
      ) : bookings.length === 0 ? (
        <p className="rounded-md border p-6 text-sm text-gray-600">No booking requests for your cabins yet.</p>
      ) : (
        <div className="grid gap-5">
          {bookings.map((booking) => (
            <article key={booking.id} className="rounded-md border border-gray-200 bg-white p-5 shadow-sm">
              <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_260px]">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="break-words font-serif text-2xl font-bold text-[#101918]">{booking.cabin.name}</h2>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(booking.status)}`}>{booking.status}</span>
                    {booking.isGift && <span className="rounded-full bg-[#f4b855]/25 px-3 py-1 text-xs font-bold text-[#8a5a00]">Gift booking</span>}
                  </div>

                  <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div><p className="text-xs uppercase text-gray-400">Guest</p><p className="mt-1 break-words text-sm font-semibold">{booking.fullName}</p><p className="break-words text-xs text-gray-500">{booking.email}</p><p className="text-xs text-gray-500">{booking.phone}</p></div>
                    <div><p className="text-xs uppercase text-gray-400">Dates</p><p className="mt-1 text-sm font-semibold">{formatDate(booking.checkInDate)} → {formatDate(booking.checkOutDate)}</p><p className="text-xs text-gray-500">{booking.travellers} traveller(s)</p></div>
                    <div><p className="text-xs uppercase text-gray-400">Total</p><p className="mt-1 text-sm font-semibold">Rs. {booking.totalPrice.toLocaleString()}</p></div>
                    <div><p className="text-xs uppercase text-gray-400">Payment</p><p className="mt-1 text-sm font-semibold">{paymentLabel(booking)}</p><p className="text-xs text-gray-500">{booking.paymentStatus}</p></div>
                  </div>

                  {booking.user && <p className="mt-4 w-fit rounded bg-[#eff8f5] px-3 py-2 text-xs text-gray-600">Completed stays: <strong>{booking.user.successfulBookings || 0}</strong></p>}
                </div>

                <div className="space-y-3">
                  <Link to={`/owner/bookings/${booking.id}`} className="block rounded-md bg-[#24472f] px-3 py-2 text-center text-xs font-semibold text-white">Details</Link>
                  {booking.status === "PENDING" ? (
                    <div className="grid grid-cols-2 gap-2 text-center">
                      <button disabled={actionId === booking.id} onClick={() => handleStatusChange(booking.id, "CONFIRMED")} className="cursor-pointer rounded-md bg-[#eff8f5] px-2 py-2 text-xs font-semibold text-[#24472f] disabled:cursor-not-allowed disabled:opacity-40">Confirm</button>
                      <button disabled={actionId === booking.id} onClick={() => handleStatusChange(booking.id, "CANCELLED")} className="cursor-pointer rounded-md bg-red-50 px-2 py-2 text-xs font-semibold text-red-600 disabled:cursor-not-allowed disabled:opacity-40">Reject</button>
                    </div>
                  ) : booking.status === "CONFIRMED" ? (
                    <p className="rounded-md bg-[#eff8f5] px-3 py-3 text-xs leading-5 text-gray-600">
                      Confirmed bookings are locked for owners. Only the main admin can cancel or move them back to pending.
                    </p>
                  ) : (
                    <p className="rounded-md bg-gray-50 px-3 py-3 text-xs leading-5 text-gray-600">No owner action available for this status.</p>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default OwnerBookings;

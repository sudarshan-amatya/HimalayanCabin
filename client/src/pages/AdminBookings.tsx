import { useEffect, useState } from "react";
import { Link } from "react-router";
import { getAllBookings, updateBookingStatus } from "../services/bookingService";
import type { Booking, BookingStatus } from "../types";

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en", { year: "numeric", month: "short", day: "numeric" }).format(new Date(date));
}

function getStatusClass(status: BookingStatus) {
  if (status === "CONFIRMED") return "bg-green-100 text-green-700";
  if (status === "COMPLETED") return "bg-blue-100 text-blue-700";
  if (status === "CANCELLED") return "bg-red-100 text-red-700";
  return "bg-yellow-100 text-yellow-700";
}

function getPaymentLabel(booking: Booking) {
  if (booking.paymentMethod === "PAY_AT_PROPERTY") return "Pay at property";
  if (booking.paymentMethod === "GIFT_CREDIT") return "Gift credit";
  if (booking.paymentMethod === "ESEWA") return "eSewa";
  if (booking.paymentMethod === "FAKE_ESEWA") return "Fake eSewa";
  if (booking.paymentMethod === "GIFT") return "Gift";
  return "Not selected";
}

function AdminBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function fetchBookings() {
      try {
        const data = await getAllBookings();
        setBookings(data.bookings);
      } catch (error) {
        setError(error instanceof Error ? error.message : "Failed to load bookings");
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
      const data = await updateBookingStatus(id, status);
      setBookings((current) => current.map((booking) => (booking.id === id ? data.booking : booking)));
      setSuccess(`Booking marked as ${status.toLowerCase()}.`);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to update booking");
    } finally {
      setActionId(null);
    }
  }

  return (
    <section className="mx-auto max-w-6xl overflow-hidden px-4 py-20">
      <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-semibold text-[#17703a]">Admin</p>
          <h1 className="mt-3 font-serif text-4xl font-bold">Manage bookings</h1>
          <p className="mt-3 text-sm text-gray-600">Review guest requests, payment methods, and user booking history.</p>
        </div>
        <Link to="/admin" className="w-fit rounded-md border border-[#24472f] px-5 py-3 text-sm font-semibold text-[#24472f]">
          Back to admin dashboard
        </Link>
      </div>

      {error && <p className="mb-5 rounded-md bg-red-100 px-4 py-3 text-sm text-red-700">{error}</p>}
      {success && <p className="mb-5 rounded-md bg-green-100 px-4 py-3 text-sm text-green-700">{success}</p>}

      {loading ? (
        <p className="rounded-md border p-6 text-sm text-gray-600">Loading bookings...</p>
      ) : bookings.length === 0 ? (
        <p className="rounded-md border p-6 text-sm text-gray-600">No bookings yet.</p>
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
                  <p className="mt-2 text-sm text-gray-600">{booking.cabin.location}</p>

                  <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div><p className="text-xs uppercase text-gray-400">Guest</p><p className="mt-1 break-words text-sm font-semibold">{booking.fullName}</p><p className="break-words text-xs text-gray-500">{booking.email}</p><p className="text-xs text-gray-500">{booking.phone}</p></div>
                    <div><p className="text-xs uppercase text-gray-400">Dates</p><p className="mt-1 text-sm font-semibold">{formatDate(booking.checkInDate)} → {formatDate(booking.checkOutDate)}</p><p className="text-xs text-gray-500">{booking.travellers} traveller(s)</p></div>
                    <div><p className="text-xs uppercase text-gray-400">Total</p><p className="mt-1 text-sm font-semibold">Rs. {booking.totalPrice.toLocaleString()}</p></div>
                    <div><p className="text-xs uppercase text-gray-400">Payment</p><p className="mt-1 text-sm font-semibold">{getPaymentLabel(booking)}</p><p className="text-xs text-gray-500">{booking.paymentStatus}</p></div>
                  </div>

                  {booking.user && (
                    <p className="mt-4 w-fit rounded bg-[#eff8f5] px-3 py-2 text-xs text-gray-600">
                      Completed stays: <strong>{booking.user.successfulBookings || 0}</strong>
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <Link to={`/admin/bookings/${booking.id}`} className="block rounded-md bg-[#24472f] px-3 py-2 text-center text-xs font-semibold text-white">Details</Link>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <button type="button" disabled={actionId === booking.id || booking.status === "CONFIRMED" || booking.status === "COMPLETED"} onClick={() => handleStatusChange(booking.id, "CONFIRMED")} className="cursor-pointer rounded-md bg-[#eff8f5] px-2 py-2 text-xs font-semibold text-[#24472f] disabled:cursor-not-allowed disabled:opacity-40">Confirm</button>
                    <button type="button" disabled={actionId === booking.id || booking.status === "CANCELLED" || booking.status === "COMPLETED"} onClick={() => handleStatusChange(booking.id, "CANCELLED")} className="cursor-pointer rounded-md bg-red-50 px-2 py-2 text-xs font-semibold text-red-600 disabled:cursor-not-allowed disabled:opacity-40">Cancel</button>
                    <button type="button" disabled={actionId === booking.id || booking.status === "PENDING" || booking.status === "COMPLETED"} onClick={() => handleStatusChange(booking.id, "PENDING")} className="cursor-pointer rounded-md bg-gray-100 px-2 py-2 text-xs font-semibold text-gray-700 disabled:cursor-not-allowed disabled:opacity-40">Pending</button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default AdminBookings;

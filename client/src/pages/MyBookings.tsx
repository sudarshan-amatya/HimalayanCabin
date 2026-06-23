import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { cancelBooking, getMyBookings } from "../services/bookingService";
import type { Booking } from "../types";

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en", { year: "numeric", month: "short", day: "numeric" }).format(new Date(date));
}

function getStatusClass(status: Booking["status"]) {
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

function MyBookings() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function fetchMyBookings() {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const data = await getMyBookings();
        setBookings(data.bookings);
      } catch (error) {
        setError(error instanceof Error ? error.message : "Failed to load bookings");
      } finally {
        setLoading(false);
      }
    }

    fetchMyBookings();
  }, [navigate]);

  async function handleCancelBooking(id: string) {
    const confirmCancel = window.confirm("Are you sure you want to cancel this booking?");
    if (!confirmCancel) return;

    try {
      setError("");
      setSuccess("");
      setActionLoadingId(id);
      const data = await cancelBooking(id);
      setBookings((currentBookings) => currentBookings.map((booking) => (booking.id === id ? data.booking : booking)));
      setSuccess("Booking cancelled successfully.");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to cancel booking");
    } finally {
      setActionLoadingId(null);
    }
  }

  if (loading) return <p className="px-4 py-20 text-center">Loading your bookings...</p>;

  return (
    <section className="mx-auto max-w-6xl overflow-hidden px-4 py-20">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-semibold text-[#17703a]">My bookings</p>
          <h1 className="mt-3 font-serif text-4xl font-bold text-[#101918]">Your cabin stays</h1>
          <p className="mt-3 text-gray-600">View booking requests, payment methods, gifted stays, and property contact details.</p>
        </div>
        <Link to="/cabins" className="inline-flex w-fit rounded-md bg-[#24472f] px-5 py-3 text-sm font-semibold text-white">
          Book another cabin
        </Link>
      </div>

      {error && <p className="mt-8 rounded-md bg-red-100 px-4 py-3 text-sm text-red-700">{error}</p>}
      {success && <p className="mt-8 rounded-md bg-green-100 px-4 py-3 text-sm text-green-700">{success}</p>}

      {bookings.length === 0 ? (
        <div className="mt-10 rounded-md bg-[#eff8f5] p-8 text-center">
          <h2 className="font-serif text-2xl font-bold text-[#101918]">No bookings yet</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-gray-600">Start by choosing a peaceful cabin stay in Nepal.</p>
          <Link to="/cabins" className="mt-6 inline-flex rounded-md bg-[#24472f] px-5 py-3 text-sm font-semibold text-white">
            Explore cabins
          </Link>
        </div>
      ) : (
        <div className="mt-10 grid gap-5">
          {bookings.map((booking) => {
            const showOwnerContact = booking.status === "CONFIRMED" || booking.status === "COMPLETED";
            const canCancel = (booking.status === "PENDING" || booking.status === "CONFIRMED") && booking.paymentStatus !== "PAID";

            return (
              <article key={booking.id} className="rounded-md border border-gray-200 bg-white p-5 shadow-sm">
                <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_230px]">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="break-words font-serif text-2xl font-bold text-[#101918]">{booking.cabin.name}</h2>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(booking.status)}`}>{booking.status}</span>
                      {booking.isGift && <span className="rounded-full bg-[#f4b855]/25 px-3 py-1 text-xs font-bold text-[#8a5a00]">Gift booking</span>}
                    </div>
                    <p className="mt-2 text-sm text-gray-600">{booking.cabin.location}</p>

                    <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <div><p className="text-xs uppercase text-gray-400">Dates</p><p className="mt-1 text-sm font-semibold">{formatDate(booking.checkInDate)} → {formatDate(booking.checkOutDate)}</p></div>
                      <div><p className="text-xs uppercase text-gray-400">Travellers</p><p className="mt-1 text-sm font-semibold">{booking.travellers}</p></div>
                      <div><p className="text-xs uppercase text-gray-400">Total</p><p className="mt-1 text-sm font-semibold">Rs. {booking.totalPrice.toLocaleString()}</p></div>
                      <div><p className="text-xs uppercase text-gray-400">Payment</p><p className="mt-1 text-sm font-semibold">{getPaymentLabel(booking)} · {booking.paymentStatus}</p></div>
                    </div>

                    <div className="mt-5 rounded-md bg-[#eff8f5] p-4 text-sm text-gray-700">
                      <p className="text-xs uppercase text-gray-400">Contact after confirmation</p>
                      {showOwnerContact ? (
                        booking.cabin.owner ? (
                          <div className="mt-2 space-y-1 break-words">
                            <p className="font-semibold text-[#101918]">{booking.cabin.owner.firstName} {booking.cabin.owner.lastName}</p>
                            <p>{booking.cabin.owner.email}</p>
                            <p>{booking.cabin.owner.phone || "No phone added"}</p>
                          </div>
                        ) : <span className="mt-2 block">Owner details unavailable</span>
                      ) : <span className="mt-2 block">Shown after confirmation</span>}
                    </div>
                  </div>

                  <div className="space-y-3 lg:text-right">
                    <Link to={`/my-bookings/${booking.id}`} className="block rounded-md bg-[#24472f] px-4 py-3 text-center text-sm font-semibold text-white">
                      View details
                    </Link>
                    {canCancel ? (
                      <button
                        type="button"
                        onClick={() => handleCancelBooking(booking.id)}
                        disabled={actionLoadingId === booking.id}
                        className="w-full cursor-pointer rounded-md border border-red-200 px-4 py-3 text-sm font-semibold text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {actionLoadingId === booking.id ? "Cancelling..." : "Cancel"}
                      </button>
                    ) : (
                      <p className="rounded-md bg-gray-50 px-4 py-3 text-center text-xs text-gray-500">
                        {booking.status === "COMPLETED" ? "Completed" : booking.paymentStatus === "PAID" ? "Paid" : "Cancelled"}
                      </p>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default MyBookings;

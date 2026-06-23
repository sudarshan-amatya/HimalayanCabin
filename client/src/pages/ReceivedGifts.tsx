import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Gift as GiftIcon, WalletCards } from "lucide-react";
import { acceptGift, declineGift, getReceivedGifts } from "../services/giftService";
import type { Gift } from "../types";
import { saveUser } from "../utils/auth";

function formatDate(date?: string | null) {
  if (!date) return "Not selected";
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

function getStatusClass(status: Gift["status"]) {
  if (status === "ACCEPTED") return "bg-green-100 text-green-700";
  if (status === "DECLINED" || status === "REJECTED") return "bg-red-100 text-red-700";
  if (status === "PENDING_OWNER_CONFIRMATION") return "bg-yellow-100 text-yellow-700";
  return "bg-[#eff8f5] text-[#24472f]";
}

function ReceivedGifts() {
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function fetchGifts() {
      try {
        const data = await getReceivedGifts();
        setGifts(data.gifts);
      } catch (error) {
        setError(error instanceof Error ? error.message : "Failed to load gifts");
      } finally {
        setLoading(false);
      }
    }

    fetchGifts();
  }, []);

  async function handleAccept(id: string) {
    try {
      setActionId(id);
      setError("");
      setSuccess("");
      const data = await acceptGift(id);
      if (data.user) saveUser(data.user);
      setGifts((current) => current.map((gift) => (gift.id === id ? data.gift : gift)));
      setSuccess(data.message);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to accept gift");
    } finally {
      setActionId(null);
    }
  }

  async function handleDecline(id: string) {
    const confirmed = window.confirm("Decline this gift?");
    if (!confirmed) return;

    try {
      setActionId(id);
      setError("");
      setSuccess("");
      const data = await declineGift(id);
      setGifts((current) => current.map((gift) => (gift.id === id ? data.gift : gift)));
      setSuccess("Gift declined.");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to decline gift");
    } finally {
      setActionId(null);
    }
  }

  return (
    <section className="mx-auto max-w-6xl overflow-hidden px-4 py-20">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-semibold text-[#17703a]">Gifts received</p>
          <h1 className="mt-3 font-serif text-4xl font-bold text-[#101918]">
            Cabin gifts and voucher credits
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-gray-600">
            Gifts are matched by your email address. The recipient name is only for display, so the name can be different as long as the email is correct.
          </p>
        </div>
        <Link to="/profile" className="rounded-md border border-[#24472f] px-5 py-3 text-sm font-semibold text-[#24472f]">
          Back to profile
        </Link>
      </div>

      {error && <p className="mt-8 rounded-md bg-red-100 px-4 py-3 text-sm text-red-700">{error}</p>}
      {success && <p className="mt-8 rounded-md bg-green-100 px-4 py-3 text-sm text-green-700">{success}</p>}

      {loading ? (
        <p className="mt-10 rounded-md bg-[#eff8f5] p-6 text-sm text-gray-600">Loading received gifts...</p>
      ) : gifts.length === 0 ? (
        <div className="mt-10 rounded-md bg-[#eff8f5] p-8 text-center">
          <GiftIcon className="mx-auto text-[#24472f]" size={32} />
          <h2 className="mt-4 font-serif text-2xl font-bold">No gifts received yet</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-gray-600">
            When someone sends a cabin gift or voucher to your email, it will appear here.
          </p>
        </div>
      ) : (
        <div className="mt-10 grid gap-5">
          {gifts.map((gift) => {
            const isVoucher = gift.giftType === "VOUCHER";
            const canRespond = gift.status === "SENT";

            return (
              <article key={gift.id} className="rounded-md border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <span className="inline-flex items-center gap-2 rounded-full bg-[#eff8f5] px-3 py-1 text-xs font-semibold text-[#24472f]">
                      {isVoucher ? <WalletCards size={14} /> : <GiftIcon size={14} />}
                      {isVoucher ? "Money voucher" : "Cabin gift"}
                    </span>
                    <h2 className="mt-4 font-serif text-2xl font-bold text-[#101918]">
                      {isVoucher ? `Rs. ${(gift.amount || 0).toLocaleString()} gift credit` : gift.cabin?.name || "Cabin gift"}
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                      From {gift.senderName} · Sent to {gift.recipientEmail} · Paid by {gift.paymentMethod === "ESEWA" ? "eSewa" : gift.paymentMethod || "gift"}
                    </p>
                    {gift.message && (
                      <p className="mt-4 rounded-md bg-[#eff8f5] p-4 text-sm leading-6 text-gray-700">
                        “{gift.message}”
                      </p>
                    )}

                    {!isVoucher && (
                      <div className="mt-4 grid gap-2 text-sm text-gray-600 sm:grid-cols-2">
                        <p>Location: {gift.cabin?.location}</p>
                        <p>Travellers: {gift.travellers || 1}</p>
                        <p>Check-in: {formatDate(gift.checkInDate)}</p>
                        <p>Check-out: {formatDate(gift.checkOutDate)}</p>
                        <p>Total gift value: Rs. {(gift.totalPrice || 0).toLocaleString()}</p>
                        {gift.cabin?.owner && (
                          <p>
                            Owner: {gift.cabin.owner.firstName} {gift.cabin.owner.lastName}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="w-full text-left md:w-auto md:text-right">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(gift.status)}`}>
                      {gift.status.replaceAll("_", " ")}
                    </span>
                    {gift.status === "PENDING_OWNER_CONFIRMATION" && (
                      <p className="mt-3 text-xs leading-5 text-gray-500">
                        Waiting for cabin owner confirmation before this gift can be accepted.
                      </p>
                    )}
                    {canRespond && (
                      <div className="mt-4 flex gap-2 md:justify-end">
                        <button
                          type="button"
                          disabled={actionId === gift.id}
                          onClick={() => handleAccept(gift.id)}
                          className="cursor-pointer rounded-md bg-[#24472f] px-4 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          disabled={actionId === gift.id}
                          onClick={() => handleDecline(gift.id)}
                          className="cursor-pointer rounded-md border border-red-200 px-4 py-2 text-xs font-semibold text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Deny
                        </button>
                      </div>
                    )}
                    {gift.status === "ACCEPTED" && gift.giftType === "CABIN" && (
                      <Link to="/my-bookings" className="mt-4 inline-block text-xs font-semibold text-[#24472f] underline">
                        View in My bookings
                      </Link>
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

export default ReceivedGifts;

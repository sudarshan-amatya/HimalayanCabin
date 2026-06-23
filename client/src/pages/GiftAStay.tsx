import type React from "react";
import { Gift, Mail, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import { Link, useNavigate } from "react-router";
import { getCabins } from "../services/cabinService";
import { initiateGiftEsewaPayment, submitEsewaForm } from "../services/paymentService";
import type { Cabin } from "../types";
import { getStoredUser } from "../utils/auth";
import { getTodayDateInputValue } from "../utils/date";

type GiftMode = "VOUCHER" | "CABIN";

type GiftFormData = {
  giftType: GiftMode;
  recipientName: string;
  recipientEmail: string;
  senderName: string;
  amount: string;
  cabinId: string;
  checkInDate: string;
  checkOutDate: string;
  travellers: string;
  occasion: string;
  deliveryDate: string;
  message: string;
};

const giftAmounts = ["3000", "5000", "10000", "15000"];
const occasions = ["Birthday", "Anniversary", "Family break", "Thank you", "Rest day", "Other"];

function getNights(checkIn: string, checkOut: string) {
  if (!checkIn || !checkOut) return 1;
  const start = new Date(checkIn).getTime();
  const end = new Date(checkOut).getTime();
  const nights = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  return nights > 0 ? nights : 1;
}

function GiftAStay() {
  const today = getTodayDateInputValue();
  const navigate = useNavigate();
  const user = getStoredUser();

  const [cabins, setCabins] = useState<Cabin[]>([]);
  const [formData, setFormData] = useState<GiftFormData>({
    giftType: "VOUCHER",
    recipientName: "",
    recipientEmail: "",
    senderName: user ? `${user.firstName} ${user.lastName}`.trim() : "",
    amount: "5000",
    cabinId: "",
    checkInDate: today,
    checkOutDate: "",
    travellers: "2",
    occasion: "Birthday",
    deliveryDate: today,
    message: "Hope this gives you a peaceful break in nature.",
  });
  const [loadingCabins, setLoadingCabins] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchCabins() {
      try {
        const data = await getCabins();
        setCabins(data.cabins);
        if (data.cabins[0]) {
          setFormData((current) => ({ ...current, cabinId: current.cabinId || data.cabins[0].id }));
        }
      } catch {
        setError("Failed to load cabins for gifting");
      } finally {
        setLoadingCabins(false);
      }
    }

    fetchCabins();
  }, []);

  const selectedCabin = cabins.find((cabin) => cabin.id === formData.cabinId);
  const estimatedCabinTotal = useMemo(() => {
    if (!selectedCabin) return 0;
    return selectedCabin.price * Number(formData.travellers || 1) * getNights(formData.checkInDate, formData.checkOutDate);
  }, [formData.checkInDate, formData.checkOutDate, formData.travellers, selectedCabin]);

  function handleChange(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  }

  function handleGiftTypeChange(giftType: GiftMode) {
    setFormData((current) => ({ ...current, giftType }));
    setError("");
  }

  async function handleSubmit(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();

    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    if (!formData.recipientName || !formData.recipientEmail || !formData.senderName) {
      setError("Please fill recipient name, recipient email, and sender name.");
      return;
    }

    if (formData.giftType === "VOUCHER" && Number(formData.amount) < 1000) {
      setError("Gift amount should be at least Rs. 1,000.");
      return;
    }

    if (formData.giftType === "CABIN") {
      if (!formData.cabinId || !formData.checkInDate || !formData.checkOutDate) {
        setError("Please choose cabin, check-in, and check-out date for cabin gift.");
        return;
      }
      if (new Date(formData.checkOutDate) <= new Date(formData.checkInDate)) {
        setError("Check-out date must be after check-in date.");
        return;
      }
    }

    try {
      setSubmitting(true);
      setError("");

      const data = await initiateGiftEsewaPayment({
        giftType: formData.giftType,
        recipientName: formData.recipientName.trim(),
        recipientEmail: formData.recipientEmail.trim(),
        senderName: formData.senderName.trim(),
        amount: formData.giftType === "VOUCHER" ? Number(formData.amount) : undefined,
        cabinId: formData.giftType === "CABIN" ? formData.cabinId : undefined,
        checkInDate: formData.giftType === "CABIN" ? formData.checkInDate : undefined,
        checkOutDate: formData.giftType === "CABIN" ? formData.checkOutDate : undefined,
        travellers: formData.giftType === "CABIN" ? Number(formData.travellers || 1) : undefined,
        message: formData.message.trim(),
        deliveryDate: formData.deliveryDate,
      });

      submitEsewaForm(data.actionUrl, data.payload);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to start eSewa payment for gift");
      setSubmitting(false);
    }
  }

  return (
    <section className="mx-auto max-w-6xl overflow-hidden px-4 py-20">
      <div className="grid gap-10 rounded-md bg-[#eff8f5] p-8 md:grid-cols-[minmax(0,1fr)_430px] md:p-14">
        <div className="min-w-0">
          <p className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[#17703a]">
            <Gift size={15} /> Gift a stay
          </p>
          <h1 className="mt-5 max-w-xl font-serif text-5xl font-bold leading-tight text-[#101918]">
            Send a cabin stay or gift credit with eSewa
          </h1>
          <p className="mt-6 max-w-xl leading-7 text-gray-600">
            Gift vouchers and cabin gifts are created only after successful eSewa payment. Cabin gifts still wait for cabin owner confirmation before the recipient can accept them.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { title: "Registered guest only", text: "You can gift only to an existing USER account." },
              { title: "eSewa first", text: "Payment happens before the gift request is created." },
              { title: "Cabin owner confirms", text: "Cabin gifts wait for owner approval." },
              { title: "Recipient accepts", text: "Voucher becomes credit. Cabin gift becomes a booking." },
            ].map((item) => (
              <div key={item.title} className="rounded-md bg-white p-4 shadow-sm">
                <Sparkles size={18} className="text-[#f4b855]" />
                <h3 className="mt-3 text-sm font-bold text-[#101918]">{item.title}</h3>
                <p className="mt-2 text-xs leading-5 text-gray-500">{item.text}</p>
              </div>
            ))}
          </div>

          <Link to="/my-gifts" className="mt-8 inline-flex rounded-md border border-[#24472f] px-5 py-3 text-sm font-semibold text-[#24472f]">
            View gifts received
          </Link>
        </div>

        <div className="min-w-0 rounded-md bg-white p-6 shadow-sm">
          <div className="mb-5 grid grid-cols-2 gap-3 rounded-md bg-[#eff8f5] p-2">
            <button
              type="button"
              onClick={() => handleGiftTypeChange("VOUCHER")}
              className={`cursor-pointer rounded-md px-4 py-3 text-sm font-semibold ${formData.giftType === "VOUCHER" ? "bg-[#24472f] text-white" : "text-[#24472f]"}`}
            >
              Money voucher
            </button>
            <button
              type="button"
              onClick={() => handleGiftTypeChange("CABIN")}
              className={`cursor-pointer rounded-md px-4 py-3 text-sm font-semibold ${formData.giftType === "CABIN" ? "bg-[#24472f] text-white" : "text-[#24472f]"}`}
            >
              Cabin gift
            </button>
          </div>

          {error && <p className="mb-5 rounded-md bg-red-100 px-4 py-3 text-sm text-red-700">{error}</p>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-semibold text-[#101918]">
                Recipient name
                <input name="recipientName" value={formData.recipientName} onChange={handleChange} className="mt-2 w-full rounded-md border px-4 py-3 font-normal" />
              </label>
              <label className="text-sm font-semibold text-[#101918]">
                Recipient email
                <input name="recipientEmail" type="email" value={formData.recipientEmail} onChange={handleChange} className="mt-2 w-full rounded-md border px-4 py-3 font-normal" />
              </label>
            </div>

            <label className="block text-sm font-semibold text-[#101918]">
              Sender name
              <input name="senderName" value={formData.senderName} onChange={handleChange} className="mt-2 w-full rounded-md border px-4 py-3 font-normal" />
            </label>

            {formData.giftType === "VOUCHER" ? (
              <div>
                <p className="text-sm font-semibold text-[#101918]">Voucher amount</p>
                <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {giftAmounts.map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => setFormData((current) => ({ ...current, amount }))}
                      className={`cursor-pointer rounded-md border px-3 py-3 text-sm font-semibold ${formData.amount === amount ? "border-[#24472f] bg-[#24472f] text-white" : "border-gray-200 text-[#24472f]"}`}
                    >
                      Rs. {Number(amount).toLocaleString()}
                    </button>
                  ))}
                </div>
                <input name="amount" type="number" min="1000" value={formData.amount} onChange={handleChange} className="mt-3 w-full rounded-md border px-4 py-3" />
              </div>
            ) : (
              <div className="space-y-4">
                <label className="block text-sm font-semibold text-[#101918]">
                  Cabin
                  <select name="cabinId" value={formData.cabinId} onChange={handleChange} disabled={loadingCabins} className="mt-2 w-full rounded-md border px-4 py-3 font-normal">
                    {cabins.map((cabin) => (
                      <option key={cabin.id} value={cabin.id}>{cabin.name} · {cabin.location}</option>
                    ))}
                  </select>
                </label>
                <div className="grid gap-4 sm:grid-cols-3">
                  <label className="text-sm font-semibold text-[#101918]">
                    Check-in
                    <input name="checkInDate" type="date" min={today} value={formData.checkInDate} onChange={handleChange} className="mt-2 w-full rounded-md border px-4 py-3 font-normal" />
                  </label>
                  <label className="text-sm font-semibold text-[#101918]">
                    Check-out
                    <input name="checkOutDate" type="date" min={formData.checkInDate || today} value={formData.checkOutDate} onChange={handleChange} className="mt-2 w-full rounded-md border px-4 py-3 font-normal" />
                  </label>
                  <label className="text-sm font-semibold text-[#101918]">
                    Travellers
                    <input name="travellers" type="number" min="1" value={formData.travellers} onChange={handleChange} className="mt-2 w-full rounded-md border px-4 py-3 font-normal" />
                  </label>
                </div>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-semibold text-[#101918]">
                Occasion
                <select name="occasion" value={formData.occasion} onChange={handleChange} className="mt-2 w-full rounded-md border px-4 py-3 font-normal">
                  {occasions.map((occasion) => <option key={occasion}>{occasion}</option>)}
                </select>
              </label>
              <label className="text-sm font-semibold text-[#101918]">
                Delivery date
                <input name="deliveryDate" type="date" min={today} value={formData.deliveryDate} onChange={handleChange} className="mt-2 w-full rounded-md border px-4 py-3 font-normal" />
              </label>
            </div>

            <label className="block text-sm font-semibold text-[#101918]">
              Message
              <textarea name="message" rows={4} value={formData.message} onChange={handleChange} className="mt-2 w-full resize-none rounded-md border px-4 py-3 font-normal" />
            </label>

            <button disabled={submitting} type="submit" className="w-full cursor-pointer rounded-md bg-[#24472f] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">
              {submitting ? "Redirecting to eSewa..." : `Pay Rs. ${(formData.giftType === "CABIN" ? estimatedCabinTotal : Number(formData.amount || 0)).toLocaleString()} with eSewa`}
            </button>
          </form>
        </div>
      </div>

      <div className="mt-10 rounded-md bg-[#202b29] p-6 text-white shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-[#f4b855]">Gift preview</p>
            <h3 className="mt-1 font-serif text-2xl font-bold">
              {formData.giftType === "CABIN" ? selectedCabin?.name || "Cabin gift" : `Rs. ${Number(formData.amount || 0).toLocaleString()}`}
            </h3>
          </div>
          <Mail className="text-[#f4b855]" />
        </div>
        <p className="mt-5 break-words text-sm leading-6 text-gray-100">
          To {formData.recipientName || "Recipient"}, from {formData.senderName || "You"}
        </p>
        <p className="mt-3 rounded-md bg-white/10 p-4 break-words text-sm leading-6 text-gray-100">
          {formData.message || "Your personal message will appear here."}
        </p>
        <p className="mt-4 text-xs text-gray-300">
          {formData.giftType === "CABIN"
            ? `Cabin gift · eSewa payment first · owner confirmation required · Rs. ${estimatedCabinTotal.toLocaleString()}`
            : `Voucher · eSewa payment first · Occasion: ${formData.occasion} · Delivery: ${formData.deliveryDate || today}`}
        </p>
      </div>
    </section>
  );
}

export default GiftAStay;

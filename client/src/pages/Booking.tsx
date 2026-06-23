import type React from "react";
import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { createBooking } from "../services/bookingService";
import { getApiAssetUrl } from "../services/api";
import { getCabinById } from "../services/cabinService";
import type { Cabin, User } from "../types";
import { addDaysToDateInputValue, getTodayDateInputValue, isBeforeToday } from "../utils/date";

type BookingFormData = {
  fullName: string;
  phone: string;
  email: string;
  checkInDate: string;
  checkOutDate: string;
  travellers: string;
  specialRequest: string;
};

function getStoredUser(): User | null {
  const storedUser = localStorage.getItem("user");

  if (!storedUser) return null;

  try {
    return JSON.parse(storedUser) as User;
  } catch {
    return null;
  }
}

function getNights(checkInDate: string, checkOutDate: string) {
  if (!checkInDate || !checkOutDate) return 1;

  const checkIn = new Date(`${checkInDate}T00:00:00`);
  const checkOut = new Date(`${checkOutDate}T00:00:00`);
  const difference = checkOut.getTime() - checkIn.getTime();
  const nights = Math.ceil(difference / (1000 * 60 * 60 * 24));

  return nights > 0 ? nights : 1;
}

function Booking() {
  const { cabinId } = useParams<{ cabinId: string }>();
  const navigate = useNavigate();
  const today = getTodayDateInputValue();

  const storedUser = getStoredUser();

  const [cabin, setCabin] = useState<Cabin | null>(null);
  const [formData, setFormData] = useState<BookingFormData>({
    fullName: storedUser ? `${storedUser.firstName} ${storedUser.lastName}` : "",
    phone: storedUser?.phone || "",
    email: storedUser?.email || "",
    checkInDate: "",
    checkOutDate: "",
    travellers: "1",
    specialRequest: "",
  });

  const [pageLoading, setPageLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function fetchCabin() {
      if (!cabinId) {
        setError("Cabin ID is missing");
        setPageLoading(false);
        return;
      }

      try {
        const data = await getCabinById(cabinId);
        setCabin(data.cabin);
      } catch (error) {
        setError(error instanceof Error ? error.message : "Failed to load cabin");
      } finally {
        setPageLoading(false);
      }
    }

    fetchCabin();
  }, [cabinId]);

  const nights = useMemo(
    () => getNights(formData.checkInDate, formData.checkOutDate),
    [formData.checkInDate, formData.checkOutDate],
  );

  const travellers = Number(formData.travellers) || 1;
  const totalPrice = cabin ? cabin.price * travellers * nights : 0;
  const checkoutMinDate = formData.checkInDate ? addDaysToDateInputValue(formData.checkInDate, 1) : addDaysToDateInputValue(today, 1);

  function handleChange(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = event.target;

    setFormData((previousData) => {
      if (name === "checkInDate") {
        return {
          ...previousData,
          checkInDate: value,
          checkOutDate: previousData.checkOutDate && previousData.checkOutDate <= value ? "" : previousData.checkOutDate,
        };
      }

      return {
        ...previousData,
        [name]: value,
      };
    });
  }

  async function handleSubmit(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();

    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    if (!cabinId || !cabin) {
      setError("Cabin not found");
      return;
    }

    if (
      !formData.fullName ||
      !formData.phone ||
      !formData.email ||
      !formData.checkInDate ||
      !formData.checkOutDate ||
      !formData.travellers
    ) {
      setError("Please fill all required fields");
      return;
    }

    if (isBeforeToday(formData.checkInDate)) {
      setError("Check-in date cannot be in the past. Please choose today or a future date.");
      return;
    }

    if (formData.checkOutDate <= formData.checkInDate) {
      setError("Check-out date must be after check-in date");
      return;
    }

    if (Number(formData.travellers) < 1) {
      setError("Travellers must be at least 1");
      return;
    }

    try {
      setError("");
      setSuccess("");
      setSubmitLoading(true);

      await createBooking({
        cabinId,
        fullName: formData.fullName,
        phone: formData.phone,
        email: formData.email,
        checkInDate: formData.checkInDate,
        checkOutDate: formData.checkOutDate,
        travellers: Number(formData.travellers),
        specialRequest: formData.specialRequest || undefined,
      });

      setSuccess("Booking request sent successfully. The cabin owner will confirm availability.");

      setTimeout(() => {
        navigate("/my-bookings");
      }, 800);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Booking failed");
    } finally {
      setSubmitLoading(false);
    }
  }

  if (pageLoading) {
    return <p className="px-4 py-20 text-center">Loading booking page...</p>;
  }

  if (!cabin) {
    return (
      <section className="mx-auto max-w-4xl px-4 py-20 text-center">
        <p className="text-red-600">{error || "Cabin not found"}</p>
        <Link to="/cabins" className="mt-4 inline-block text-[#24472f] underline">
          Back to cabins
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-5xl px-4 py-20">
      <div className="mb-10">
        <p className="font-semibold text-[#17703a]">Booking request</p>
        <h1 className="mt-3 font-serif text-4xl font-bold text-[#101918]">Book {cabin.name}</h1>
        <p className="mt-3 text-sm text-gray-600">
          {cabin.location} · Rs. {cabin.price} per person per night
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <form onSubmit={handleSubmit} className="grid gap-5 rounded-md bg-[#eff8f5] p-6 md:grid-cols-2">
          {error && <p className="rounded-md bg-red-100 px-4 py-3 text-sm text-red-700 md:col-span-2">{error}</p>}

          {success && <p className="rounded-md bg-green-100 px-4 py-3 text-sm text-green-700 md:col-span-2">{success}</p>}

          <div>
            <label htmlFor="fullName" className="mb-2 block text-sm font-medium">Full name</label>
            <input
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Full name"
              className="w-full rounded-md border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#24472f]"
            />
          </div>

          <div>
            <label htmlFor="phone" className="mb-2 block text-sm font-medium">Phone number</label>
            <input
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Phone number"
              className="w-full rounded-md border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#24472f]"
            />
          </div>

          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email"
              className="w-full rounded-md border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#24472f]"
            />
          </div>

          <div>
            <label htmlFor="travellers" className="mb-2 block text-sm font-medium">Travellers</label>
            <input
              id="travellers"
              name="travellers"
              type="number"
              min="1"
              value={formData.travellers}
              onChange={handleChange}
              placeholder="Travellers"
              className="w-full rounded-md border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#24472f]"
            />
          </div>

          <div>
            <label htmlFor="checkInDate" className="mb-2 block text-sm font-medium">Check-in date</label>
            <input
              id="checkInDate"
              name="checkInDate"
              type="date"
              min={today}
              value={formData.checkInDate}
              onChange={handleChange}
              className="w-full rounded-md border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#24472f]"
            />
            <p className="mt-2 text-xs text-gray-500">You can book from today onward only.</p>
          </div>

          <div>
            <label htmlFor="checkOutDate" className="mb-2 block text-sm font-medium">Check-out date</label>
            <input
              id="checkOutDate"
              name="checkOutDate"
              type="date"
              min={checkoutMinDate}
              value={formData.checkOutDate}
              onChange={handleChange}
              className="w-full rounded-md border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#24472f]"
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="specialRequest" className="mb-2 block text-sm font-medium">Special request</label>
            <textarea
              id="specialRequest"
              name="specialRequest"
              value={formData.specialRequest}
              onChange={handleChange}
              placeholder="Any food, timing, pet, or travel request?"
              className="h-32 w-full rounded-md border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#24472f]"
            />
          </div>

          <button
            type="submit"
            disabled={submitLoading}
            className="rounded-md bg-[#24472f] px-6 py-3 font-medium text-white disabled:cursor-not-allowed disabled:opacity-70 md:col-span-2"
          >
            {submitLoading ? "Sending request..." : "Send booking request"}
          </button>
        </form>

        <aside className="h-fit rounded-md bg-[#202b29] p-5 text-white">
          <img
            src={getApiAssetUrl(cabin.image) || "https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?q=80&w=1200&auto=format&fit=crop"}
            alt={cabin.name}
            className="h-44 w-full rounded-md object-cover"
          />

          <h2 className="mt-5 font-serif text-2xl font-bold">{cabin.name}</h2>
          <p className="mt-1 text-sm text-gray-300">{cabin.location}</p>

          <div className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between"><span>Price</span><span>Rs. {cabin.price}pp</span></div>
            <div className="flex justify-between"><span>Nights</span><span>{nights}</span></div>
            <div className="flex justify-between"><span>Travellers</span><span>{travellers}</span></div>
            <div className="flex justify-between border-t border-white/20 pt-3 font-semibold text-[#f4b855]"><span>Total</span><span>Rs. {totalPrice}</span></div>
          </div>

          <p className="mt-5 rounded-md bg-white/10 p-3 text-xs leading-5 text-gray-200">
            This is only a request. The cabin owner will confirm availability before the booking becomes confirmed.
          </p>
        </aside>
      </div>
    </section>
  );
}

export default Booking;

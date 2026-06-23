import type React from "react";
import { CalendarDays, Star } from "lucide-react";
import { useEffect, useState } from "react";

import { Link, useNavigate } from "react-router";
import CabinCard from "../components/CabinCard";
import ExperienceCard from "../components/ExperienceCard";
import LocationSuggestInput from "../components/LocationSuggestInput";
import SectionTitle from "../components/SectionTitle";
import { experiences } from "../data/experiences";
import { getCabins } from "../services/cabinService";
import type { Cabin } from "../types";
import { getTodayDateInputValue } from "../utils/date";

const faqItems = [
  {
    title: "About our cabins",
    question: "How does cabin confirmation work?",
    answer:
      "Users send a booking request first. The cabin owner checks availability and confirms or cancels the request from their owner dashboard.",
  },
  {
    title: "Verified stays",
    question: "Are all cabins approved?",
    answer:
      "Yes. Owner-submitted cabins stay pending until the main HimalayanCabins admin checks and approves them for the public website.",
  },
  {
    title: "Pets, family & friends",
    question: "Can I bring my dog?",
    answer:
      "Some stays can be pet friendly. Check the cabin details or add a request while booking so the owner can confirm it.",
  },
];

function Home() {
  const navigate = useNavigate();
  const today = getTodayDateInputValue();

  const [featuredCabins, setFeaturedCabins] = useState<Cabin[]>([]);
  const [loadingCabins, setLoadingCabins] = useState(true);
  const [activeFaq, setActiveFaq] = useState(faqItems[0].title);
  const [searchForm, setSearchForm] = useState({
    search: "",
    checkIn: "",
    checkOut: "",
  });

  useEffect(() => {
    async function fetchFeaturedCabins() {
      try {
        const data = await getCabins();
        setFeaturedCabins(data.cabins.slice(0, 3));
      } catch {
        setFeaturedCabins([]);
      } finally {
        setLoadingCabins(false);
      }
    }

    fetchFeaturedCabins();
  }, []);

  function handleSearchSubmit(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();

    const searchParams = new URLSearchParams();

    if (searchForm.search.trim()) {
      searchParams.set("search", searchForm.search.trim());
    }

    if (searchForm.checkIn) searchParams.set("checkIn", searchForm.checkIn);
    if (searchForm.checkOut) searchParams.set("checkOut", searchForm.checkOut);

    navigate(`/cabins${searchParams.toString() ? `?${searchParams}` : ""}`);
  }

  function handleCheckInChange(value: string) {
    setSearchForm((current) => ({
      ...current,
      checkIn: value,
      checkOut: current.checkOut && current.checkOut <= value ? "" : current.checkOut,
    }));
  }

  const selectedFaq = faqItems.find((item) => item.title === activeFaq) || faqItems[0];
  const featuredExperiences = experiences.slice(0, 3);

  return (
    <>
      <section className="relative bg-[#101918]">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?q=80&w=1600&auto=format&fit=crop"
            alt="Cabin in forest"
            className="h-full w-full object-cover opacity-65"
          />
          <div className="absolute inset-0 bg-linear-to-r from-black/80 via-black/50 to-black/10" />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 py-24 text-white md:py-28">
          <h1 className="max-w-xl font-serif text-5xl font-bold leading-tight md:text-6xl">
            Leave the city behind and <span className="text-[#f4b855]">unwind</span>
          </h1>

          <p className="mt-6 max-w-xl text-sm leading-7 text-gray-100">
            Welcome to our cozy cabins nestled in the hills of Nepal. Find a peaceful getaway for rest, nature, and beautiful mountain views.
          </p>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex -space-x-3">
              {["N", "P", "C", "B"].map((item) => (
                <div key={item} className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-[#173f2a] text-xs font-bold">
                  {item}
                </div>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Star size={16} fill="#14b67a" className="text-[#14b67a]" />
              Guest rated
              <span className="rounded-sm bg-[#14b67a] px-2 py-1 text-xs">★★★★★</span>
              4.8 / 5
            </div>
          </div>
        </div>

        <div className="relative mx-auto max-w-5xl px-4">
          <form onSubmit={handleSearchSubmit} className="-mb-12 grid gap-3 rounded-md bg-white p-5 shadow-2xl md:grid-cols-5">
            <div className="rounded bg-gray-100 px-4 py-4 text-sm text-gray-600 md:col-span-2">
              <LocationSuggestInput
                value={searchForm.search}
                onChange={(value) => setSearchForm((current) => ({ ...current, search: value }))}
                placeholder="Where in Nepal?"
              />
            </div>

            <label className="flex items-center gap-3 rounded bg-gray-100 px-4 py-4 text-sm text-gray-600">
              <CalendarDays size={18} />
              <input
                type="date"
                min={today}
                value={searchForm.checkIn}
                onChange={(event) => handleCheckInChange(event.target.value)}
                className="w-full bg-transparent outline-none"
                aria-label="Check in"
              />
            </label>

            <label className="flex items-center gap-3 rounded bg-gray-100 px-4 py-4 text-sm text-gray-600">
              <CalendarDays size={18} />
              <input
                type="date"
                min={searchForm.checkIn || today}
                value={searchForm.checkOut}
                onChange={(event) => setSearchForm((current) => ({ ...current, checkOut: event.target.value }))}
                className="w-full bg-transparent outline-none"
                aria-label="Check out"
              />
            </label>

            <button type="submit" className="rounded bg-[#24472f] px-4 py-4 text-sm font-medium text-white">
              Find cabins
            </button>
          </form>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20 pt-28">
        <SectionTitle
          title="Discover our peaceful Nepal cabins"
          subtitle="Approved cabins with nature views, owner-managed booking confirmation, and easy access to peaceful routes."
          linkText="View all cabins"
          href="/cabins"
        />

        {loadingCabins ? (
          <p className="rounded-md bg-[#eff8f5] p-6 text-sm text-gray-600">Loading cabins...</p>
        ) : featuredCabins.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-3">
            {featuredCabins.map((cabin) => (
              <CabinCard key={cabin.id} cabin={cabin} />
            ))}
          </div>
        ) : (
          <div className="rounded-md bg-[#eff8f5] p-8 text-center">
            <p className="text-gray-600">No approved cabins found yet. Owners can submit cabins from the owner dashboard.</p>
            <Link to="/cabins" className="mt-4 inline-block rounded-md bg-[#24472f] px-5 py-3 text-sm text-white">
              Browse cabins
            </Link>
          </div>
        )}
      </section>

      <section className="bg-[#eff8f5] py-20">
        <div className="mx-auto max-w-6xl px-4">
          <SectionTitle
            title="Inspiration for your next getaway"
            subtitle="Choose a travel mood and jump directly into matching Nepal cabin ideas."
            linkText="View all experiences"
            href="/get-inspired"
          />

          <div className="grid gap-6 md:grid-cols-3">
            {featuredExperiences.map((experience) => (
              <ExperienceCard key={experience.id} experience={experience} />
            ))}
          </div>
        </div>
      </section>

      <section className="relative min-h-130 bg-[url('https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?q=80&w=1600&auto=format&fit=crop')] bg-cover bg-center">
        <div className="absolute inset-0 bg-black/45" />
        <div className="relative mx-auto flex min-h-130 max-w-6xl items-center justify-end px-4 text-white">
          <div className="max-w-lg">
            <h2 className="font-serif text-5xl font-bold">A truly wonderful experience</h2>
            <p className="mt-6 text-sm leading-7">
              Brilliant for anyone looking to get away from the rush of Kathmandu for a few days. The cabin was calm, clean, and close to nature.
            </p>
          </div>
        </div>
      </section>

      <section id="faq" className="mx-auto max-w-6xl px-4 py-20">
        <SectionTitle title="Frequently asked questions" />

        <div className="grid gap-8 md:grid-cols-2">
          <div className="rounded-md bg-[#eff8f5] p-6 text-sm">
            <h3 className="font-bold text-[#173f2a]">{selectedFaq.question}</h3>
            <p className="mt-4 leading-7 text-gray-600">{selectedFaq.answer}</p>
          </div>

          <div className="space-y-6">
            {faqItems.map((item) => (
              <button
                key={item.title}
                type="button"
                onClick={() => setActiveFaq(item.title)}
                className={`flex w-full items-center justify-between rounded-md px-6 py-5 text-left text-sm font-semibold shadow ${
                  activeFaq === item.title ? "bg-[#f4b855] text-[#101918]" : "bg-white text-[#101918]"
                }`}
              >
                {item.title}
                <span>→</span>
              </button>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

export default Home;

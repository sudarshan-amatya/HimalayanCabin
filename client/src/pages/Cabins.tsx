import type React from "react";
import { useEffect, useMemo, useState } from "react";

import { useSearchParams } from "react-router";
import CabinCard from "../components/CabinCard";
import LocationSuggestInput from "../components/LocationSuggestInput";
import SectionTitle from "../components/SectionTitle";
import { nepalLocationSuggestions } from "../data/nepalLocations";
import { getCabins } from "../services/cabinService";
import type { Cabin } from "../types";

function Cabins() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [cabins, setCabins] = useState<Cabin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [location, setLocation] = useState(searchParams.get("location") || "");

  const locations = useMemo(() => {
    const cabinLocations = cabins.map((cabin) => cabin.location.split(",")[0].trim());
    return Array.from(new Set([...nepalLocationSuggestions, ...cabinLocations])).filter(Boolean);
  }, [cabins]);

  useEffect(() => {
    const querySearch = searchParams.get("search") || "";
    const queryLocation = searchParams.get("location") || "";

    setSearch(querySearch);
    setLocation(queryLocation);

    async function fetchCabins() {
      try {
        setError("");
        setLoading(true);
        const data = await getCabins({ search: querySearch, location: queryLocation });
        setCabins(data.cabins);
      } catch (error) {
        setError(error instanceof Error ? error.message : "Failed to load cabins");
      } finally {
        setLoading(false);
      }
    }

    fetchCabins();
  }, [searchParams]);

  function handleSearchSubmit(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextParams = new URLSearchParams();
    if (search.trim()) nextParams.set("search", search.trim());
    if (location.trim()) nextParams.set("location", location.trim());

    setSearchParams(nextParams);
  }

  function handleQuickLocation(selectedLocation: string) {
    setSearch("");
    setLocation(selectedLocation);
    setSearchParams({ location: selectedLocation });
  }

  function handleReset() {
    setSearch("");
    setLocation("");
    setSearchParams({});
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-20">
      <SectionTitle
        title="Our cabins in Nepal"
        subtitle="Choose from approved peaceful cabins and countryside stays across Nepal. Use the suggestion box to quickly search locations."
      />

      <form onSubmit={handleSearchSubmit} className="mb-6 grid gap-4 rounded-md bg-[#eff8f5] p-5 md:grid-cols-5">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search cabin, view, facility, or description"
          className="rounded-md border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-[#24472f] md:col-span-2"
        />

        <div className="rounded-md border border-black/10 bg-white px-4 py-3 text-sm md:col-span-1">
          <LocationSuggestInput
            value={location}
            onChange={setLocation}
            suggestions={locations}
            placeholder="Where in Nepal?"
            showIcon={false}
          />
        </div>

        <button type="submit" className="rounded-md bg-[#24472f] px-4 py-3 text-sm font-medium text-white">
          Search
        </button>
        <button type="button" onClick={handleReset} className="rounded-md border border-[#24472f] px-4 py-3 text-sm font-medium text-[#24472f]">
          Reset
        </button>
      </form>

      <div className="mb-10 flex flex-wrap gap-2">
        {locations.slice(0, 8).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => handleQuickLocation(item)}
            className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${
              location === item
                ? "border-[#24472f] bg-[#24472f] text-white"
                : "border-[#24472f]/20 bg-white text-[#24472f] hover:bg-[#eff8f5]"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      {loading && <p className="px-4 py-20 text-center">Loading cabins...</p>}

      {error && !loading && <p className="px-4 py-20 text-center text-red-600">{error}</p>}

      {!loading && !error && cabins.length === 0 && (
        <div className="rounded-md bg-[#eff8f5] p-10 text-center">
          <h2 className="font-serif text-2xl font-bold">No cabins found</h2>
          <p className="mt-3 text-sm text-gray-600">Try another Nepal location or search keyword.</p>
          <button type="button" onClick={handleReset} className="mt-5 rounded-md bg-[#24472f] px-5 py-3 text-sm text-white">
            Show all cabins
          </button>
        </div>
      )}

      {!loading && !error && cabins.length > 0 && (
        <div className="grid gap-6 md:grid-cols-3">
          {cabins.map((cabin) => (
            <CabinCard key={cabin.id} cabin={cabin} />
          ))}
        </div>
      )}
    </section>
  );
}

export default Cabins;

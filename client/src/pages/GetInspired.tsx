import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import CabinCard from "../components/CabinCard";
import ExperienceCard from "../components/ExperienceCard";
import LocationSuggestInput from "../components/LocationSuggestInput";
import SectionTitle from "../components/SectionTitle";
import { experiences } from "../data/experiences";
import type { ExperienceCategory } from "../data/experiences";
import { getCabins } from "../services/cabinService";
import type { Cabin } from "../types";

type CategoryFilter = "All" | ExperienceCategory;

function GetInspired() {
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("All");
  const [location, setLocation] = useState("");
  const [query, setQuery] = useState("");
  const [relatedCabins, setRelatedCabins] = useState<Cabin[]>([]);
  const [loadingCabins, setLoadingCabins] = useState(false);

  const categories = useMemo<CategoryFilter[]>(() => {
    return ["All", ...Array.from(new Set(experiences.map((experience) => experience.category)))] as CategoryFilter[];
  }, []);

  const locations = useMemo(() => Array.from(new Set(experiences.map((experience) => experience.location))), []);

  const filteredExperiences = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const normalizedLocation = location.trim().toLowerCase();

    return experiences.filter((experience) => {
      const categoryMatches = activeCategory === "All" || experience.category === activeCategory;
      const locationMatches = !normalizedLocation || experience.location.toLowerCase().includes(normalizedLocation);
      const queryMatches =
        !normalizedQuery ||
        experience.title.toLowerCase().includes(normalizedQuery) ||
        experience.description.toLowerCase().includes(normalizedQuery) ||
        experience.search.toLowerCase().includes(normalizedQuery) ||
        experience.tips.some((tip) => tip.toLowerCase().includes(normalizedQuery));

      return categoryMatches && locationMatches && queryMatches;
    });
  }, [activeCategory, location, query]);

  useEffect(() => {
    async function fetchRelatedCabins() {
      const searchValue = query.trim() || (activeCategory === "All" ? "" : activeCategory);
      const locationValue = location.trim();

      if (!searchValue && !locationValue) {
        setRelatedCabins([]);
        return;
      }

      try {
        setLoadingCabins(true);
        const data = await getCabins({ search: searchValue, location: locationValue });
        setRelatedCabins(data.cabins.slice(0, 3));
      } catch {
        setRelatedCabins([]);
      } finally {
        setLoadingCabins(false);
      }
    }

    fetchRelatedCabins();
  }, [activeCategory, location, query]);

  function resetFilters() {
    setActiveCategory("All");
    setLocation("");
    setQuery("");
  }

  return (
    <section className="bg-[#eff8f5]">
      <div className="relative bg-[#101918]">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?q=80&w=1600&auto=format&fit=crop')] bg-cover bg-center opacity-45" />
        <div className="relative mx-auto max-w-6xl px-4 py-20 text-white">
          <p className="font-semibold text-[#f4b855]">Get inspired</p>
          <h1 className="mt-3 max-w-2xl font-serif text-5xl font-bold leading-tight">
            Choose a mood, place, or travel idea for your next cabin stay
          </h1>
          <p className="mt-5 max-w-xl text-sm leading-7 text-gray-100">
            Filter Nepal cabin ideas by nature, rest, family, adventure, or local culture. Then jump directly into matching cabins.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-16">
        <SectionTitle
          title="Plan by experience"
        />

        <div className="mb-8 grid gap-4 rounded-md bg-white p-5 shadow-sm md:grid-cols-[1fr_280px_auto]">
          <label className="flex items-center gap-3 rounded-md border border-black/10 px-4 py-3 text-sm">
            <Search size={18} className="text-[#24472f]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search hiking, family, food, lake, forest..."
              className="w-full outline-none"
            />
          </label>

          <div className="rounded-md border border-black/10 px-4 py-3 text-sm">
            <LocationSuggestInput
              value={location}
              onChange={setLocation}
              suggestions={locations}
              placeholder="Where in Nepal?"
              showIcon={false}
            />
          </div>

          <button type="button" onClick={resetFilters} className="rounded-md border border-[#24472f] px-5 py-3 text-sm font-semibold text-[#24472f]">
            Reset
          </button>
        </div>

        <div className="mb-8 flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                activeCategory === category
                  ? "bg-[#24472f] text-white"
                  : "bg-white text-[#24472f] hover:bg-[#dff3ee]"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {filteredExperiences.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-3">
            {filteredExperiences.map((experience) => (
              <ExperienceCard key={experience.id} experience={experience} />
            ))}
          </div>
        ) : (
          <div className="rounded-md bg-white p-10 text-center">
            <h2 className="font-serif text-2xl font-bold text-[#101918]">No inspiration found</h2>
            <p className="mt-3 text-sm text-gray-600">Try another location or remove a filter.</p>
            <button type="button" onClick={resetFilters} className="mt-5 rounded-md bg-[#24472f] px-5 py-3 text-sm text-white">
              Show all ideas
            </button>
          </div>
        )}

        {(query || location || activeCategory !== "All") && (
          <section className="mt-16">
            <SectionTitle title="Matching cabins" subtitle="Approved cabins related to your current inspiration filters." />

            {loadingCabins ? (
              <p className="rounded-md bg-white p-6 text-sm text-gray-600">Loading matching cabins...</p>
            ) : relatedCabins.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-3">
                {relatedCabins.map((cabin) => (
                  <CabinCard key={cabin.id} cabin={cabin} />
                ))}
              </div>
            ) : (
              <p className="rounded-md bg-white p-6 text-sm text-gray-600">
                No approved cabins matched this idea yet. You can still browse all cabins from the main cabins page.
              </p>
            )}
          </section>
        )}
      </div>
    </section>
  );
}

export default GetInspired;

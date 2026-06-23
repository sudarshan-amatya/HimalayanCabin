import { ArrowRight, Clock, MapPin } from "lucide-react";
import { Link } from "react-router";
import type { Experience } from "../data/experiences";

type ExperienceCardProps = {
  experience: Experience;
};

function ExperienceCard({ experience }: ExperienceCardProps) {
  const cabinUrl = `/cabins?search=${encodeURIComponent(experience.search)}&location=${encodeURIComponent(experience.location)}`;

  return (
    <article className="overflow-hidden rounded-md bg-[#5f6d67] text-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
      <img src={experience.image} alt={experience.title} className="h-64 w-full object-cover" />

      <div className="p-5">
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase text-gray-100">
          <span>{experience.subtitle}</span>
          <span className="rounded-full bg-white/15 px-2 py-1">{experience.category}</span>
        </div>

        <h3 className="mt-2 font-serif text-xl font-bold">{experience.title}</h3>

        <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-100">
          <span className="inline-flex items-center gap-1"><MapPin size={14} /> {experience.location}</span>
          <span className="inline-flex items-center gap-1"><Clock size={14} /> {experience.duration}</span>
        </div>

        <p className="mt-4 text-sm leading-6 text-gray-100">{experience.description}</p>

        <Link to={cabinUrl} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#f4b855] hover:text-white">
          Find matching cabins <ArrowRight size={16} />
        </Link>
      </div>
    </article>
  );
}

export default ExperienceCard;

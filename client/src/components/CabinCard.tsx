import { Heart, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { getApiAssetUrl } from "../services/api";
import { addBookmark, getBookmarkStatus, removeBookmark } from "../services/bookmarkService";
import type { Cabin, User } from "../types";
import { getStoredUser } from "../utils/auth";

type CabinCardProps = {
  cabin: Cabin;
};

function CabinCard({ cabin }: CabinCardProps) {
  const navigate = useNavigate();
  const [bookmarked, setBookmarked] = useState(false);
  const [bookmarking, setBookmarking] = useState(false);
  const [user, setUser] = useState<User | null>(() => getStoredUser());

  useEffect(() => {
    function syncUser() {
      setUser(getStoredUser());
    }

    window.addEventListener("auth-changed", syncUser);
    window.addEventListener("storage", syncUser);

    return () => {
      window.removeEventListener("auth-changed", syncUser);
      window.removeEventListener("storage", syncUser);
    };
  }, []);

  useEffect(() => {
    async function fetchBookmarkStatus() {
      if (user?.role !== "USER") {
        setBookmarked(false);
        return;
      }

      try {
        const data = await getBookmarkStatus(cabin.id);
        setBookmarked(data.bookmarked);
      } catch {
        setBookmarked(false);
      }
    }

    fetchBookmarkStatus();
  }, [cabin.id, user?.role]);

  const canBook = !user || user.role === "USER";
  const canBookmark = !user || user.role === "USER";
  const imageUrl = getApiAssetUrl(
    cabin.image || "https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?q=80&w=1200&auto=format&fit=crop",
  );

  async function handleBookmarkClick() {
    if (!user) {
      navigate("/login");
      return;
    }

    if (user.role !== "USER") return;

    try {
      setBookmarking(true);
      if (bookmarked) {
        await removeBookmark(cabin.id);
        setBookmarked(false);
      } else {
        await addBookmark(cabin.id);
        setBookmarked(true);
      }
    } finally {
      setBookmarking(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-md bg-[#202b29] text-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
      <div className="relative h-64">
        <img src={imageUrl} alt={cabin.name} className="h-full w-full object-cover" />

        {canBookmark && (
          <button
            type="button"
            onClick={handleBookmarkClick}
            disabled={bookmarking}
            className="absolute right-4 top-4 rounded-full bg-black/50 p-2 transition hover:bg-black/70 disabled:opacity-60"
            aria-label={bookmarked ? "Remove from bookmarks" : "Add to bookmarks"}
          >
            <Heart size={18} fill={bookmarked ? "currentColor" : "none"} />
          </button>
        )}
      </div>

      <div className="p-5">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-300">
          {cabin.location}
        </p>

        <div className="mt-2 flex items-center justify-between gap-4">
          <h3 className="font-serif text-xl font-bold">{cabin.name}</h3>
          <p className="font-semibold">Rs. {cabin.price}pp</p>
        </div>

        <p className="mt-4 line-clamp-3 text-sm leading-6 text-gray-200">
          {cabin.description}
        </p>

        <div className="mt-5 flex items-center gap-2 text-sm">
          <div className="flex text-[#d7f5e7]">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star key={star} size={14} fill="currentColor" />
            ))}
          </div>
          <span className="text-gray-300">{cabin.reviews} reviews</span>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            to={`/cabins/${cabin.id}`}
            className="rounded-md bg-[#f4b855] px-4 py-2 text-sm font-semibold text-[#101918]"
          >
            View details
          </Link>
          {canBook ? (
            <Link
              to={`/booking/${cabin.id}`}
              className="rounded-md border border-white/30 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
            >
              Book now
            </Link>
          ) : (
            <span className="rounded-md border border-white/15 px-4 py-2 text-sm font-semibold text-gray-300">
              Guest booking only
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default CabinCard;

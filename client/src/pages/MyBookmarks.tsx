import { Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import CabinCard from "../components/CabinCard";
import { getMyBookmarks, removeBookmark } from "../services/bookmarkService";
import type { Bookmark } from "../types";
import { getStoredUser } from "../utils/auth";

function MyBookmarks() {
  const navigate = useNavigate();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const user = getStoredUser();

    if (!user) {
      navigate("/login");
      return;
    }

    if (user.role !== "USER") {
      navigate("/");
      return;
    }

    async function fetchBookmarks() {
      try {
        setError("");
        const data = await getMyBookmarks();
        setBookmarks(data.bookmarks);
      } catch (error) {
        setError(error instanceof Error ? error.message : "Failed to load bookmarks");
      } finally {
        setLoading(false);
      }
    }

    fetchBookmarks();
  }, [navigate]);

  async function handleRemove(cabinId: string) {
    try {
      await removeBookmark(cabinId);
      setBookmarks((current) => current.filter((bookmark) => bookmark.cabinId !== cabinId));
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to remove bookmark");
    }
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-20">
      <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-semibold text-[#17703a]">Saved stays</p>
          <h1 className="mt-3 font-serif text-4xl font-bold">My bookmarks</h1>
          <p className="mt-3 text-sm text-gray-600">
            Keep your favourite Nepal cabins in one place before booking.
          </p>
        </div>

        <Link to="/cabins" className="rounded-md bg-[#24472f] px-5 py-3 text-sm font-semibold text-white">
          Explore cabins
        </Link>
      </div>

      {error && <p className="mb-6 rounded-md bg-red-100 px-4 py-3 text-sm text-red-700">{error}</p>}

      {loading ? (
        <p className="rounded-md bg-[#eff8f5] p-6 text-sm text-gray-600">Loading bookmarks...</p>
      ) : bookmarks.length === 0 ? (
        <div className="rounded-md bg-[#eff8f5] p-10 text-center">
          <Heart className="mx-auto text-[#24472f]" size={42} />
          <h2 className="mt-4 font-serif text-3xl font-bold">No bookmarked cabins yet</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-gray-600">
            Tap the heart icon on a cabin card or cabin detail page to save it here.
          </p>
          <Link to="/cabins" className="mt-6 inline-block rounded-md bg-[#f4b855] px-5 py-3 text-sm font-semibold text-[#101918]">
            Browse cabins
          </Link>
        </div>
      ) : (
        <div className="grid gap-7 md:grid-cols-2 lg:grid-cols-3">
          {bookmarks.map((bookmark) => (
            <div key={bookmark.id}>
              <CabinCard cabin={bookmark.cabin} />
              <button
                type="button"
                onClick={() => handleRemove(bookmark.cabinId)}
                className="mt-3 text-sm font-semibold text-red-600 underline"
              >
                Remove from bookmarks
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default MyBookmarks;

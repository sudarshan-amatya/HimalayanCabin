import type React from "react";
import { Heart, Star } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router";
import { useEffect, useMemo, useState } from "react";

import { getApiAssetUrl } from "../services/api";
import { addBookmark, getBookmarkStatus, removeBookmark } from "../services/bookmarkService";
import { getCabinById } from "../services/cabinService";
import {
  deleteMyCabinReview,
  getCabinReviews,
  getMyCabinReview,
  saveCabinReview,
} from "../services/reviewService";
import type { Cabin, Review, User } from "../types";
import { getStoredUser } from "../utils/auth";

const fallbackImage =
  "https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?q=80&w=1200&auto=format&fit=crop";

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

function StarsDisplay({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-1 text-[#f4b855]">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={18}
          fill={star <= Math.round(value) ? "currentColor" : "none"}
        />
      ))}
    </div>
  );
}

function CabinDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [cabin, setCabin] = useState<Cabin | null>(null);
  const [selectedImage, setSelectedImage] = useState("");
  const [user, setUser] = useState<User | null>(() => getStoredUser());
  const [bookmarked, setBookmarked] = useState(false);
  const [bookmarking, setBookmarking] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSaving, setReviewSaving] = useState(false);
  const [reviewDeleting, setReviewDeleting] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [reviewSuccess, setReviewSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchReviews(cabinId: string) {
    const data = await getCabinReviews(cabinId);
    setReviews(data.reviews);
  }

  useEffect(() => {
    async function fetchCabin() {
      if (!id) return;

      try {
        const data = await getCabinById(id);
        setCabin(data.cabin);
        setSelectedImage(data.cabin.image || data.cabin.images?.[0] || fallbackImage);
        await fetchReviews(id);
      } catch (error) {
        setError(error instanceof Error ? error.message : "Failed to load cabin");
      } finally {
        setLoading(false);
      }
    }

    fetchCabin();
  }, [id]);

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
      if (!id || user?.role !== "USER") {
        setBookmarked(false);
        return;
      }

      try {
        const data = await getBookmarkStatus(id);
        setBookmarked(data.bookmarked);
      } catch {
        setBookmarked(false);
      }
    }

    fetchBookmarkStatus();
  }, [id, user?.role]);

  useEffect(() => {
    async function fetchMyReview() {
      if (!id || user?.role !== "USER") {
        setReviewRating(5);
        setReviewComment("");
        return;
      }

      try {
        const data = await getMyCabinReview(id);
        if (data.review) {
          setReviewRating(data.review.rating);
          setReviewComment(data.review.comment || "");
        } else {
          setReviewRating(5);
          setReviewComment("");
        }
      } catch {
        setReviewRating(5);
        setReviewComment("");
      }
    }

    fetchMyReview();
  }, [id, user?.role]);

  const galleryImages = useMemo(() => {
    if (!cabin) return [];

    const urls = [cabin.image, ...(cabin.images || [])]
      .filter((image): image is string => Boolean(image))
      .filter((image, index, array) => array.indexOf(image) === index);

    return urls.length > 0 ? urls : [fallbackImage];
  }, [cabin]);

  async function handleBookmarkClick() {
    if (!cabin) return;

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

  async function handleReviewSubmit(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!cabin || !id) return;

    if (!user) {
      navigate("/login");
      return;
    }

    if (user.role !== "USER") return;

    try {
      setReviewSaving(true);
      setReviewError("");
      setReviewSuccess("");

      const data = await saveCabinReview(id, {
        rating: reviewRating,
        comment: reviewComment.trim(),
      });

      setCabin(data.cabin);
      await fetchReviews(id);
      setReviewSuccess("Your review has been saved.");
    } catch (error) {
      setReviewError(error instanceof Error ? error.message : "Failed to save review");
    } finally {
      setReviewSaving(false);
    }
  }

  async function handleDeleteReview() {
    if (!id) return;

    try {
      setReviewDeleting(true);
      setReviewError("");
      setReviewSuccess("");

      const data = await deleteMyCabinReview(id);
      setCabin(data.cabin);
      setReviewRating(5);
      setReviewComment("");
      await fetchReviews(id);
      setReviewSuccess("Your review has been removed.");
    } catch (error) {
      setReviewError(error instanceof Error ? error.message : "Failed to remove review");
    } finally {
      setReviewDeleting(false);
    }
  }

  if (loading) {
    return <p className="px-4 py-20 text-center">Loading cabin...</p>;
  }

  if (error || !cabin) {
    return (
      <p className="px-4 py-20 text-center text-red-600">
        {error || "Cabin not found"}
      </p>
    );
  }

  const canBook = !user || user.role === "USER";
  const canBookmark = !user || user.role === "USER";
  const canReview = user?.role === "USER";
  const userReview = reviews.find((review) => review.userId === user?.id);

  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <div className="grid gap-10 md:grid-cols-2">
        <div>
          <div className="relative">
            <img
              src={getApiAssetUrl(selectedImage)}
              alt={cabin.name}
              className="h-130 w-full rounded-md object-cover"
            />

            {canBookmark && (
              <button
                type="button"
                onClick={handleBookmarkClick}
                disabled={bookmarking}
                className="absolute right-5 top-5 flex items-center gap-2 rounded-full bg-black/55 px-4 py-3 text-sm font-semibold text-white transition hover:bg-black/75 disabled:opacity-60"
              >
                <Heart size={18} fill={bookmarked ? "currentColor" : "none"} />
                {bookmarked ? "Saved" : "Save"}
              </button>
            )}
          </div>

          {galleryImages.length > 1 && (
            <div className="mt-4 grid grid-cols-4 gap-3">
              {galleryImages.map((image) => (
                <button
                  key={image}
                  type="button"
                  onClick={() => setSelectedImage(image)}
                  className={`h-24 overflow-hidden rounded-md border-2 ${
                    selectedImage === image ? "border-[#f4b855]" : "border-transparent"
                  }`}
                >
                  <img src={getApiAssetUrl(image)} alt="Cabin gallery" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="text-sm font-semibold uppercase text-[#17703a]">
            {cabin.location}
          </p>

          <h1 className="mt-3 font-serif text-5xl font-bold">{cabin.name}</h1>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <StarsDisplay value={cabin.rating || 0} />
            <span className="text-sm font-semibold text-[#24472f]">
              {cabin.rating ? cabin.rating.toFixed(1) : "No rating yet"}
            </span>
            <span className="text-sm text-gray-500">
              {cabin.reviews} {cabin.reviews === 1 ? "review" : "reviews"}
            </span>
          </div>

          <p className="mt-5 text-2xl font-bold text-[#24472f]">
            Rs. {cabin.price} per person
          </p>

          <p className="mt-6 leading-8 text-gray-600">{cabin.description}</p>

          <div className="mt-8">
            <h2 className="font-serif text-2xl font-bold">Facilities</h2>
            <div className="mt-4 flex flex-wrap gap-3">
              {cabin.facilities.map((facility) => (
                <span key={facility} className="rounded-full bg-[#eff8f5] px-4 py-2 text-sm">
                  {facility}
                </span>
              ))}
            </div>
          </div>

          {canBook ? (
            <Link
              to={`/booking/${cabin.id}`}
              className="mt-10 inline-block rounded-md bg-[#24472f] px-8 py-4 text-sm font-semibold text-white"
            >
              Book this cabin
            </Link>
          ) : (
            <p className="mt-10 rounded-md bg-[#eff8f5] px-5 py-4 text-sm font-semibold text-[#24472f]">
              Admin and owner accounts cannot book cabins. Use a guest account for booking.
            </p>
          )}
        </div>
      </div>

      <div className="mt-16 grid gap-8 lg:grid-cols-[0.95fr_1.25fr]">
        <div className="rounded-md bg-[#eff8f5] p-6">
          <h2 className="font-serif text-3xl font-bold">Rate your stay</h2>
          <p className="mt-2 text-sm text-gray-600">
            Share a simple rating and review to help other guests choose better cabins.
          </p>

          {!user && (
            <div className="mt-5 rounded-md bg-white p-4 text-sm text-gray-600">
              Please login with a user account to rate this cabin.
              <Link to="/login" className="ml-1 font-semibold text-[#24472f] underline">
                Login
              </Link>
            </div>
          )}

          {user && user.role !== "USER" && (
            <div className="mt-5 rounded-md bg-white p-4 text-sm text-gray-600">
              Owner and admin accounts cannot rate cabins.
            </div>
          )}

          {canReview && (
            <form onSubmit={handleReviewSubmit} className="mt-5">
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewRating(star)}
                    className="text-[#f4b855]"
                    aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
                  >
                    <Star size={28} fill={star <= reviewRating ? "currentColor" : "none"} />
                  </button>
                ))}
              </div>

              <textarea
                value={reviewComment}
                onChange={(event) => setReviewComment(event.target.value)}
                maxLength={600}
                placeholder="Write your review..."
                className="mt-4 h-32 w-full rounded-md border bg-white px-4 py-3 text-sm outline-none focus:border-[#24472f]"
              />
              <p className="mt-1 text-xs text-gray-500">{reviewComment.length}/600 characters</p>

              {reviewError && <p className="mt-3 rounded-md bg-red-100 px-4 py-3 text-sm text-red-700">{reviewError}</p>}
              {reviewSuccess && <p className="mt-3 rounded-md bg-green-100 px-4 py-3 text-sm text-green-700">{reviewSuccess}</p>}

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={reviewSaving}
                  className="rounded-md bg-[#24472f] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {reviewSaving ? "Saving..." : userReview ? "Update review" : "Submit review"}
                </button>

                {userReview && (
                  <button
                    type="button"
                    onClick={handleDeleteReview}
                    disabled={reviewDeleting}
                    className="rounded-md border border-red-200 px-5 py-3 text-sm font-semibold text-red-600 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {reviewDeleting ? "Removing..." : "Remove review"}
                  </button>
                )}
              </div>
            </form>
          )}
        </div>

        <div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase text-[#17703a]">Guest reviews</p>
              <h2 className="mt-2 font-serif text-3xl font-bold">What guests say</h2>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <StarsDisplay value={cabin.rating || 0} />
              <span>{cabin.rating ? cabin.rating.toFixed(1) : "0.0"} average</span>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {reviews.length === 0 ? (
              <p className="rounded-md border p-5 text-sm text-gray-600">
                No reviews yet. Be the first guest to review this cabin.
              </p>
            ) : (
              reviews.map((review) => (
                <article key={review.id} className="rounded-md border p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-semibold text-[#24472f]">
                        {review.user?.firstName} {review.user?.lastName}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">{formatDate(review.updatedAt)}</p>
                    </div>
                    <StarsDisplay value={review.rating} />
                  </div>
                  {review.comment && (
                    <p className="mt-4 leading-7 text-gray-600">{review.comment}</p>
                  )}
                </article>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default CabinDetails;

import { useEffect, useState } from "react";
import { Link } from "react-router";
import { getApiAssetUrl } from "../services/api";
import { deleteFeedback, getFeedbacks } from "../services/feedbackService";
import type { Feedback } from "../types";

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function AdminFeedbacks() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function fetchFeedbacks() {
      try {
        const data = await getFeedbacks();
        setFeedbacks(data.feedbacks);
      } catch (error) {
        setError(error instanceof Error ? error.message : "Failed to load feedback messages");
      } finally {
        setLoading(false);
      }
    }

    fetchFeedbacks();
  }, []);

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this feedback message?")) return;

    try {
      setActionId(id);
      setError("");
      setSuccess("");
      await deleteFeedback(id);
      setFeedbacks((current) => current.filter((item) => item.id !== id));
      setSuccess("Feedback deleted successfully.");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to delete feedback");
    } finally {
      setActionId(null);
    }
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-20">
      <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-semibold text-[#17703a]">Admin</p>
          <h1 className="mt-3 font-serif text-4xl font-bold">Feedback messages</h1>
          <p className="mt-3 text-sm text-gray-600">Read user and owner feedback, screenshots, and issue reports.</p>
        </div>
        <Link to="/admin" className="rounded-md border border-[#24472f] px-5 py-3 text-sm font-semibold text-[#24472f]">
          Back to admin dashboard
        </Link>
      </div>

      {error && <p className="mb-5 rounded-md bg-red-100 px-4 py-3 text-sm text-red-700">{error}</p>}
      {success && <p className="mb-5 rounded-md bg-green-100 px-4 py-3 text-sm text-green-700">{success}</p>}

      {loading ? (
        <p className="rounded-md bg-[#eff8f5] p-6 text-sm text-gray-600">Loading feedback...</p>
      ) : feedbacks.length === 0 ? (
        <p className="rounded-md bg-[#eff8f5] p-6 text-sm text-gray-600">No feedback messages yet.</p>
      ) : (
        <div className="grid gap-6">
          {feedbacks.map((feedback) => (
            <article key={feedback.id} className="rounded-md border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-[#17703a]">{feedback.user?.role || "USER"} feedback</p>
                  <h2 className="mt-2 font-serif text-2xl font-bold text-[#101918]">{feedback.subject}</h2>
                  <p className="mt-2 text-xs text-gray-500">Sent on {formatDate(feedback.createdAt)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(feedback.id)}
                  disabled={actionId === feedback.id}
                  className="cursor-pointer rounded-md border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Delete
                </button>
              </div>

              <div className="mt-5 rounded-md bg-[#eff8f5] p-4 text-sm text-gray-700">
                <p className="font-semibold text-[#101918]">
                  {feedback.user?.firstName} {feedback.user?.lastName}
                </p>
                <p>{feedback.user?.email}</p>
                <p>{feedback.user?.phone || "No phone added"}</p>
              </div>

              <p className="mt-5 whitespace-pre-line text-sm leading-7 text-gray-700">{feedback.message}</p>

              {feedback.screenshot && (
                <a href={getApiAssetUrl(feedback.screenshot)} target="_blank" rel="noreferrer" className="mt-5 block">
                  <img src={getApiAssetUrl(feedback.screenshot)} alt="Feedback screenshot" className="max-h-[360px] rounded-md border object-contain" />
                </a>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default AdminFeedbacks;

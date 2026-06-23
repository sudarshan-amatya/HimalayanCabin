import type React from "react";
import { useState } from "react";
import type { ChangeEvent } from "react";
import SectionTitle from "../components/SectionTitle";
import { createFeedback } from "../services/feedbackService";
import { getStoredUser } from "../utils/auth";

function About() {
  const user = getStoredUser();
  const canSendFeedback = user?.role === "USER" || user?.role === "OWNER";

  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function handleScreenshotChange(event: ChangeEvent<HTMLInputElement>) {
    setScreenshot(event.target.files?.[0] || null);
  }

  async function handleFeedbackSubmit(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSendFeedback) {
      setError("Only guest and owner accounts can send feedback.");
      return;
    }

    if (!subject.trim() || !message.trim()) {
      setError("Subject and message are required.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");
      await createFeedback({ subject: subject.trim(), message: message.trim(), screenshot });
      setSubject("");
      setMessage("");
      setScreenshot(null);
      setSuccess("Thank you. Your feedback has been sent to the HimalayanCabins admin team.");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to send feedback");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-20">
      <div className="grid gap-12 md:grid-cols-2">
        <div>
          <p className="font-semibold text-[#17703a]">About us</p>
          <h1 className="mt-3 font-serif text-5xl font-bold">Peaceful cabin stays around Nepal</h1>
          <p className="mt-6 leading-8 text-gray-600">
            HimalayanCabins helps people find simple, peaceful, and beautiful cabin stays across Nepal. Our goal is to make short nature getaways easy, comfortable, and memorable.
          </p>
        </div>

        <img
          src="https://images.unsplash.com/photo-1470770841072-f978cf4d019e?q=80&w=1200&auto=format&fit=crop"
          alt="Nepal cabin"
          className="h-[420px] w-full rounded-md object-cover"
        />
      </div>

      <div className="mt-20">
        <SectionTitle title="Why choose us" />
        <div className="grid gap-6 md:grid-cols-3">
          {["Nature focused", "Simple booking", "Local experiences"].map((item) => (
            <div key={item} className="rounded-md bg-[#eff8f5] p-6">
              <h3 className="font-serif text-2xl font-bold">{item}</h3>
              <p className="mt-4 text-sm leading-6 text-gray-600">
                We keep things simple, beautiful, and useful so guests can enjoy their stay without confusion.
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-20 grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-md bg-[#202b29] p-8 text-white">
          <p className="text-sm font-semibold text-[#f4b855]">Feedback</p>
          <h2 className="mt-3 font-serif text-3xl font-bold">Tell us what to improve</h2>
          <p className="mt-4 text-sm leading-7 text-gray-200">
            Guests and cabin owners can send feedback, issues, or design suggestions. You can attach a screenshot if something looks wrong.
          </p>
          {!user && <p className="mt-5 rounded-md bg-white/10 p-4 text-sm text-gray-100">Please login as a guest or owner to send feedback.</p>}
          {user?.role === "ADMIN" && <p className="mt-5 rounded-md bg-white/10 p-4 text-sm text-gray-100">Admins can read feedback from the dashboard.</p>}
        </div>

        <form onSubmit={handleFeedbackSubmit} className="rounded-md bg-[#eff8f5] p-6 shadow-sm">
          <h2 className="font-serif text-2xl font-bold text-[#101918]">Send feedback</h2>

          {error && <p className="mt-5 rounded-md bg-red-100 px-4 py-3 text-sm text-red-700">{error}</p>}
          {success && <p className="mt-5 rounded-md bg-green-100 px-4 py-3 text-sm text-green-700">{success}</p>}

          <div className="mt-5 space-y-4">
            <input
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              placeholder="Subject"
              disabled={!canSendFeedback}
              className="w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-[#24472f] disabled:opacity-60"
            />
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Write your feedback or issue here"
              disabled={!canSendFeedback}
              className="h-36 w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-[#24472f] disabled:opacity-60"
            />
            <input
              type="file"
              accept="image/*"
              onChange={handleScreenshotChange}
              disabled={!canSendFeedback}
              className="w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-sm disabled:opacity-60"
            />
            <button
              disabled={!canSendFeedback || submitting}
              className="cursor-pointer rounded-md bg-[#24472f] px-6 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Sending..." : "Send feedback"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

export default About;

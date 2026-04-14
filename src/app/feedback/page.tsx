// src/app/feedback/page.tsx
"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, Star } from "lucide-react";

function FeedbackForm() {
  const searchParams  = useSearchParams();
  const router        = useRouter();
  const token         = searchParams.get("token") ?? "";
  const initialRating = parseInt(searchParams.get("rating") ?? "0");

  const [rating,    setRating]    = useState(initialRating);
  const [hovered,   setHovered]   = useState(0);
  const [comment,   setComment]   = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");

  useEffect(() => {
    if (initialRating >= 1 && initialRating <= 5) setRating(initialRating);
  }, [initialRating]);

  async function handleSubmit() {
    if (!rating) { setError("Please select a rating."); return; }
    if (!token)  { setError("Invalid feedback link."); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/feedback/respond", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ token, rating, comment: comment.trim() || undefined }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      // Redirect based on sentiment
      if (rating >= 4) {
        router.push(`/feedback/thank-you?responseId=${data.data.responseId}`);
      } else {
        router.push(`/feedback/received?responseId=${data.data.responseId}`);
      }
    } catch (e: any) {
      setError(e.message ?? "Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  const starLabels = ["", "Poor", "Below Average", "Average", "Good", "Exceptional"];
  const displayRating = hovered || rating;

  return (
    <div className="min-h-screen bg-brand-black flex items-center justify-center p-4">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gold-500/4 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="font-display text-2xl font-bold text-white tracking-widest uppercase">
            BEYOND VISION
          </div>
          <div className="text-gold-500 text-xs tracking-[0.5em] uppercase mt-1">OPTOMETRY</div>
        </div>

        <div className="bg-brand-card border border-brand-border rounded-2xl p-8 shadow-2xl shadow-black/60">
          <h1 className="font-display text-2xl text-white text-center mb-2">
            How was your experience?
          </h1>
          <p className="text-brand-text text-sm text-center mb-8">
            Your feedback helps us provide exceptional care.
          </p>

          {/* Star selector */}
          <div className="flex justify-center gap-3 mb-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onMouseEnter={() => setHovered(star)}
                onMouseLeave={() => setHovered(0)}
                onClick={() => setRating(star)}
                className="group transition-transform hover:scale-110 active:scale-95"
                aria-label={`${star} star${star > 1 ? "s" : ""}`}
              >
                <Star
                  size={44}
                  className="transition-colors duration-150"
                  fill={star <= displayRating ? "#C9A84C" : "transparent"}
                  stroke={star <= displayRating ? "#C9A84C" : "#3a3a3a"}
                  strokeWidth={1.5}
                />
              </button>
            ))}
          </div>

          <p className="text-center text-sm mb-8 h-5 transition-all duration-150">
            {displayRating > 0
              ? <span className="text-gold-500 font-medium">{starLabels[displayRating]}</span>
              : <span className="text-brand-text/50">Tap a star to rate</span>
            }
          </p>

          {/* Comment box */}
          <div className="mb-6">
            <label className="block text-xs text-brand-text uppercase tracking-wider mb-2">
              Additional comments <span className="text-brand-text/40 normal-case tracking-normal">(optional)</span>
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              maxLength={2000}
              placeholder="Tell us more about your visit…"
              className="w-full bg-brand-dark border border-brand-border rounded-lg px-4 py-3 text-white text-sm placeholder:text-brand-text/40 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500/20 transition resize-none"
            />
            <div className="text-right text-xs text-brand-text/30 mt-1">{comment.length}/2000</div>
          </div>

          {error && (
            <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading || !rating}
            className="w-full gold-gradient text-black font-semibold py-3.5 rounded-lg text-sm tracking-wide uppercase transition hover:opacity-90 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={15} className="animate-spin" />}
            {loading ? "Submitting…" : "Submit Feedback"}
          </button>

          <p className="text-center text-xs text-brand-text/30 mt-4">
            Your feedback is private and helps us improve our service.
          </p>
        </div>

        <p className="text-center text-brand-text/30 text-xs mt-5">
          © {new Date().getFullYear()} Beyond Vision Optometry · Edmonton, Alberta
        </p>
      </div>
    </div>
  );
}

export default function FeedbackPage() {
  return (
    <Suspense>
      <FeedbackForm />
    </Suspense>
  );
}

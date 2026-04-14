"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

function FeedbackForm() {
  const searchParams  = useSearchParams();
  const router        = useRouter();
  const token         = searchParams.get("token") ?? "";
  const initialRating = parseInt(searchParams.get("rating") ?? "0");

  const [rating,    setRating]    = useState(initialRating);
  const [hovered,   setHovered]   = useState(0);
  const [comment,   setComment]   = useState("");
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");
  const [mounted,   setMounted]   = useState(false);

  useEffect(() => {
    setMounted(true);
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
    <div className="min-h-screen bg-brand-black flex items-center justify-center p-4 relative overflow-hidden">
      {/* Glow orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-gold-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-gold-600/3 rounded-full blur-3xl" />
      </div>

      <div
        className="relative w-full max-w-md"
        style={{ opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(16px)", transition: "opacity 0.5s ease, transform 0.5s ease" }}
      >
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex flex-col items-center">
            <div className="w-10 h-px mb-3 bg-gold-500/50" />
            <span className="font-display text-2xl font-bold text-white tracking-widest uppercase">BEYOND VISION</span>
            <span className="text-gold-500 text-[10px] tracking-[0.5em] uppercase mt-1">OPTOMETRY</span>
            <div className="w-10 h-px mt-3 bg-gold-500/50" />
          </div>
        </div>

        {/* Card */}
        <div className="bg-brand-card border border-brand-border rounded-2xl p-8 shadow-2xl shadow-black/60">
          <div className="text-center mb-8">
            <h1 className="font-display text-2xl font-semibold text-white mb-2">How was your visit?</h1>
            <p className="text-brand-text text-sm">Your experience matters to us. Share how we did.</p>
          </div>

          {/* Stars */}
          <div className="flex justify-center gap-2 mb-3">
            {[1, 2, 3, 4, 5].map((star) => {
              const isActive = star <= displayRating;
              return (
                <button
                  key={star}
                  onMouseEnter={() => setHovered(star)}
                  onMouseLeave={() => setHovered(0)}
                  onClick={() => setRating(star)}
                  className="p-1 transition-transform active:scale-95"
                  style={{
                    transform: isActive ? "scale(1.15)" : "scale(1)",
                    filter: isActive ? "drop-shadow(0 0 8px rgba(201,168,76,0.6))" : "none",
                    transition: "transform 0.2s cubic-bezier(0.34,1.56,0.64,1), filter 0.2s ease",
                    background: "none", border: "none", cursor: "pointer",
                  }}
                  aria-label={`${star} stars`}
                >
                  <svg width="44" height="44" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                      fill={isActive ? "#C9A84C" : "transparent"}
                      stroke={isActive ? "#C9A84C" : "#3a3a3a"}
                      strokeWidth={1.5}
                      strokeLinejoin="round"
                      style={{ transition: "all 0.15s ease" }}
                    />
                  </svg>
                </button>
              );
            })}
          </div>

          {/* Star label */}
          <div className="text-center h-6 mb-8">
            {displayRating > 0
              ? <span className="text-gold-500 text-xs font-medium tracking-widest uppercase">{starLabels[displayRating]}</span>
              : <span className="text-brand-text/40 text-sm">Tap a star to rate your experience</span>
            }
          </div>

          {/* Divider */}
          <div className="h-px bg-brand-border mb-7" />

          {/* Comment */}
          <div className="mb-6">
            <label className="block text-[11px] text-brand-text/60 uppercase tracking-wider mb-2 font-medium">
              Additional Comments <span className="normal-case tracking-normal text-brand-text/30 font-normal">(optional)</span>
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              maxLength={2000}
              placeholder="Tell us more about your visit…"
              className="w-full bg-brand-dark border border-brand-border rounded-xl px-4 py-3 text-white text-sm placeholder:text-brand-text/30 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500/20 transition resize-none"
            />
            <div className="text-right text-xs text-brand-text/30 mt-1">{comment.length}/2000</div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">{error}</div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={loading || !rating}
            className="w-full font-semibold py-4 rounded-xl text-xs tracking-widest uppercase transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: !rating || loading ? "#1e1e1e" : "linear-gradient(135deg, #C9A84C, #a8862e)",
              color: !rating || loading ? "#555" : "#000",
              boxShadow: !rating || loading ? "none" : "0 4px 24px rgba(201,168,76,0.3)",
            }}
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            {loading ? "Submitting…" : "Submit Feedback"}
          </button>

          <p className="text-center text-xs text-brand-text/25 mt-4">
            Your feedback is private and helps us improve.
          </p>
        </div>

        <p className="text-center text-brand-text/20 text-xs mt-6">
          © {new Date().getFullYear()} Beyond Vision Optometry · Edmonton, Alberta
        </p>
      </div>
    </div>
  );
}

export default function FeedbackPage() {
  return <Suspense><FeedbackForm /></Suspense>;
}

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
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ backgroundColor: "#0a0a0a" }}
    >
      {/* Glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full blur-3xl"
          style={{ background: "radial-gradient(ellipse, rgba(201,168,76,0.07) 0%, transparent 70%)" }} />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full blur-3xl"
          style={{ background: "radial-gradient(ellipse, rgba(201,168,76,0.04) 0%, transparent 70%)" }} />
      </div>

      <div
        className="relative w-full max-w-md"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(16px)",
          transition: "opacity 0.5s ease, transform 0.5s ease",
          fontFamily: "var(--font-inter, system-ui, sans-serif)",
        }}
      >
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex flex-col items-center">
            <div className="w-10 h-px mb-3" style={{ background: "linear-gradient(90deg, transparent, #C9A84C, transparent)" }} />
            <span
              className="text-white text-2xl font-bold uppercase"
              style={{ fontFamily: "var(--font-playfair, Georgia, serif)", letterSpacing: "0.25em" }}
            >
              BEYOND VISION
            </span>
            <span className="text-xs uppercase mt-1" style={{ color: "#C9A84C", letterSpacing: "0.5em" }}>
              OPTOMETRY
            </span>
            <div className="w-10 h-px mt-3" style={{ background: "linear-gradient(90deg, transparent, #C9A84C, transparent)" }} />
          </div>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-8"
          style={{
            backgroundColor: "#1a1a1a",
            border: "1px solid #2a2a2a",
            boxShadow: "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(201,168,76,0.05)",
          }}
        >
          {/* Heading */}
          <div className="text-center mb-8">
            <h1
              className="text-white text-2xl font-semibold mb-2"
              style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}
            >
              How was your visit?
            </h1>
            <p style={{ color: "#b0b0b0", fontSize: 14 }}>
              Your experience matters to us. Share how we did.
            </p>
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
                  style={{
                    background: "none", border: "none", cursor: "pointer", padding: 4,
                    transform: isActive ? "scale(1.15)" : "scale(1)",
                    filter: isActive ? "drop-shadow(0 0 10px rgba(201,168,76,0.6))" : "none",
                    transition: "transform 0.2s cubic-bezier(0.34,1.56,0.64,1), filter 0.2s ease",
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
          <div className="text-center mb-8" style={{ height: 24 }}>
            {displayRating > 0
              ? <span style={{ color: "#C9A84C", fontSize: 12, fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase" }}>{starLabels[displayRating]}</span>
              : <span style={{ color: "#555", fontSize: 13 }}>Tap a star to rate your experience</span>
            }
          </div>

          {/* Divider */}
          <div className="mb-7" style={{ height: 1, background: "linear-gradient(90deg, transparent, #2a2a2a, transparent)" }} />

          {/* Comment */}
          <div className="mb-6">
            <label style={{ display: "block", fontSize: 11, color: "#666", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8, fontWeight: 500 }}>
              Additional Comments <span style={{ color: "#444", textTransform: "none", letterSpacing: 0, fontWeight: 400 }}>(optional)</span>
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              maxLength={2000}
              placeholder="Tell us more about your visit…"
              className="w-full rounded-xl px-4 py-3 text-white text-sm resize-none focus:outline-none transition"
              style={{
                backgroundColor: "#111",
                border: "1px solid #2a2a2a",
                color: "#fff",
                fontFamily: "inherit",
              }}
              onFocus={(e) => { e.target.style.borderColor = "#C9A84C"; e.target.style.boxShadow = "0 0 0 1px rgba(201,168,76,0.2)"; }}
              onBlur={(e) => { e.target.style.borderColor = "#2a2a2a"; e.target.style.boxShadow = "none"; }}
            />
            <div className="text-right mt-1" style={{ fontSize: 11, color: "#444" }}>{comment.length}/2000</div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 rounded-lg px-4 py-3 text-sm" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}>
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={loading || !rating}
            className="w-full rounded-xl py-4 text-xs font-bold uppercase flex items-center justify-center gap-2 transition-all duration-200"
            style={{
              letterSpacing: "0.12em",
              background: !rating || loading ? "#1e1e1e" : "linear-gradient(135deg, #C9A84C, #a8862e)",
              color: !rating || loading ? "#555" : "#000",
              border: "none",
              cursor: !rating || loading ? "not-allowed" : "pointer",
              boxShadow: !rating || loading ? "none" : "0 4px 24px rgba(201,168,76,0.3)",
              opacity: !rating || loading ? 0.6 : 1,
              fontFamily: "inherit",
            }}
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            {loading ? "Submitting…" : "Submit Feedback"}
          </button>

          <p className="text-center mt-4" style={{ fontSize: 11, color: "#3a3a3a" }}>
            Your feedback is private and helps us improve.
          </p>
        </div>

        <p className="text-center mt-6" style={{ fontSize: 11, color: "#333" }}>
          © {new Date().getFullYear()} Beyond Vision Optometry · Edmonton, Alberta
        </p>
      </div>
    </div>
  );
}

export default function FeedbackPage() {
  return <Suspense><FeedbackForm /></Suspense>;
}

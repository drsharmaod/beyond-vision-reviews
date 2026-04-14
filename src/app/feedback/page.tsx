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
  const ff = "var(--font-inter, system-ui, sans-serif)";
  const ffDisplay = "var(--font-playfair, Georgia, serif)";

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "#0a0a0a",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px 16px",
      fontFamily: ff,
      position: "relative",
      overflow: "hidden",
      boxSizing: "border-box",
    }}>
      {/* Glow orbs */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
        <div style={{
          position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
          width: 700, height: 400, borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(201,168,76,0.08) 0%, transparent 70%)",
          filter: "blur(40px)",
        }} />
        <div style={{
          position: "absolute", bottom: 0, right: 0,
          width: 400, height: 400, borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(201,168,76,0.04) 0%, transparent 70%)",
          filter: "blur(40px)",
        }} />
      </div>

      {/* Content */}
      <div style={{
        position: "relative",
        width: "100%",
        maxWidth: 480,
        opacity: mounted ? 1 : 0,
        transform: mounted ? "translateY(0)" : "translateY(16px)",
        transition: "opacity 0.5s ease, transform 0.5s ease",
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ width: 40, height: 1, marginBottom: 12, background: "linear-gradient(90deg, transparent, #C9A84C, transparent)" }} />
            <span style={{ fontFamily: ffDisplay, fontSize: 22, fontWeight: 700, color: "#ffffff", letterSpacing: "0.25em", textTransform: "uppercase" as const }}>
              BEYOND VISION
            </span>
            <span style={{ fontSize: 10, color: "#C9A84C", letterSpacing: "0.5em", textTransform: "uppercase" as const, marginTop: 4 }}>
              OPTOMETRY
            </span>
            <div style={{ width: 40, height: 1, marginTop: 12, background: "linear-gradient(90deg, transparent, #C9A84C, transparent)" }} />
          </div>
        </div>

        {/* Card */}
        <div style={{
          backgroundColor: "#1a1a1a",
          border: "1px solid #2a2a2a",
          borderRadius: 20,
          padding: "40px 36px",
          boxShadow: "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(201,168,76,0.05)",
        }}>
          {/* Heading */}
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <h1 style={{ fontFamily: ffDisplay, fontSize: 26, fontWeight: 600, color: "#ffffff", margin: "0 0 8px" }}>
              How was your visit?
            </h1>
            <p style={{ color: "#b0b0b0", fontSize: 14, margin: 0 }}>
              Your experience matters to us. Share how we did.
            </p>
          </div>

          {/* Stars */}
          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 12 }}>
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
                    transform: isActive ? "scale(1.18)" : "scale(1)",
                    filter: isActive ? "drop-shadow(0 0 10px rgba(201,168,76,0.65))" : "none",
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
          <div style={{ textAlign: "center", height: 24, marginBottom: 28 }}>
            {displayRating > 0
              ? <span style={{ color: "#C9A84C", fontSize: 11, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase" as const }}>{starLabels[displayRating]}</span>
              : <span style={{ color: "#555", fontSize: 13 }}>Tap a star to rate your experience</span>
            }
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: "linear-gradient(90deg, transparent, #2a2a2a, transparent)", marginBottom: 24 }} />

          {/* Comment */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", fontSize: 10, color: "#666", letterSpacing: "0.15em", textTransform: "uppercase" as const, marginBottom: 8, fontWeight: 600 }}>
              Additional Comments{" "}
              <span style={{ color: "#444", textTransform: "none" as const, letterSpacing: 0, fontWeight: 400 }}>(optional)</span>
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              maxLength={2000}
              placeholder="Tell us more about your visit…"
              style={{
                width: "100%", boxSizing: "border-box" as const,
                backgroundColor: "#111",
                border: "1px solid #2a2a2a",
                borderRadius: 10,
                padding: "12px 16px",
                color: "#ffffff", fontSize: 14,
                lineHeight: 1.6, resize: "none" as const,
                outline: "none", fontFamily: ff,
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => { e.target.style.borderColor = "#C9A84C"; }}
              onBlur={(e) => { e.target.style.borderColor = "#2a2a2a"; }}
            />
            <div style={{ textAlign: "right", fontSize: 11, color: "#444", marginTop: 4 }}>{comment.length}/2000</div>
          </div>

          {/* Error */}
          {error && (
            <div style={{ marginBottom: 20, padding: "12px 16px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, color: "#f87171", fontSize: 13 }}>
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={loading || !rating}
            style={{
              width: "100%",
              background: !rating || loading ? "#1e1e1e" : "linear-gradient(135deg, #C9A84C, #a8862e)",
              color: !rating || loading ? "#555" : "#000",
              border: "none", borderRadius: 10,
              padding: "15px 24px",
              fontSize: 12, fontWeight: 700,
              letterSpacing: "0.15em", textTransform: "uppercase" as const,
              cursor: !rating || loading ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              transition: "all 0.2s ease",
              boxShadow: !rating || loading ? "none" : "0 4px 24px rgba(201,168,76,0.3)",
              opacity: !rating || loading ? 0.5 : 1,
              fontFamily: ff,
            }}
          >
            {loading && <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />}
            {loading ? "Submitting…" : "Submit Feedback"}
          </button>

          <p style={{ textAlign: "center", fontSize: 11, color: "#3a3a3a", marginTop: 16, marginBottom: 0 }}>
            Your feedback is private and helps us improve.
          </p>
        </div>

        <p style={{ textAlign: "center", fontSize: 11, color: "#333", marginTop: 24 }}>
          © {new Date().getFullYear()} Beyond Vision Optometry · Edmonton, Alberta
        </p>
      </div>
    </div>
  );
}

export default function FeedbackPage() {
  return <Suspense><FeedbackForm /></Suspense>;
}

// src/app/feedback/page.tsx
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

  const starColors = {
    filled:   ["#C9A84C", "#C9A84C", "#C9A84C", "#C9A84C", "#C9A84C"],
    glow:     ["rgba(201,168,76,0.4)", "rgba(201,168,76,0.4)", "rgba(201,168,76,0.4)", "rgba(201,168,76,0.5)", "rgba(201,168,76,0.6)"],
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#080808",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px 16px",
      fontFamily: "'Inter', system-ui, sans-serif",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Ambient background orbs */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", top: "-10%", left: "50%", transform: "translateX(-50%)",
          width: 700, height: 400,
          background: "radial-gradient(ellipse, rgba(201,168,76,0.07) 0%, transparent 70%)",
          borderRadius: "50%",
        }} />
        <div style={{
          position: "absolute", bottom: "-5%", right: "-10%",
          width: 500, height: 500,
          background: "radial-gradient(ellipse, rgba(201,168,76,0.04) 0%, transparent 70%)",
          borderRadius: "50%",
        }} />
        {/* Subtle grid */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "linear-gradient(rgba(201,168,76,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,0.03) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }} />
      </div>

      <div style={{
        position: "relative", width: "100%", maxWidth: 480,
        opacity: mounted ? 1 : 0,
        transform: mounted ? "translateY(0)" : "translateY(16px)",
        transition: "opacity 0.5s ease, transform 0.5s ease",
      }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{
            display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 4,
          }}>
            <div style={{
              width: 48, height: 1,
              background: "linear-gradient(90deg, transparent, #C9A84C, transparent)",
              marginBottom: 12,
            }} />
            <span style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 22, fontWeight: 700, color: "#ffffff",
              letterSpacing: "0.25em", textTransform: "uppercase",
            }}>
              BEYOND VISION
            </span>
            <span style={{
              fontSize: 10, color: "#C9A84C",
              letterSpacing: "0.5em", textTransform: "uppercase",
              fontWeight: 500,
            }}>
              OPTOMETRY
            </span>
            <div style={{
              width: 48, height: 1,
              background: "linear-gradient(90deg, transparent, #C9A84C, transparent)",
              marginTop: 12,
            }} />
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: "linear-gradient(145deg, #141414, #111111)",
          border: "1px solid #242424",
          borderRadius: 20,
          padding: "44px 40px",
          boxShadow: "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(201,168,76,0.05)",
        }}>

          {/* Heading */}
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <h1 style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 28, fontWeight: 600, color: "#ffffff",
              margin: "0 0 10px", lineHeight: 1.2,
            }}>
              How was your visit?
            </h1>
            <p style={{
              color: "#888888", fontSize: 14, margin: 0, lineHeight: 1.6,
            }}>
              Your experience matters to us. Share how we did.
            </p>
          </div>

          {/* Stars */}
          <div style={{ display: "flex", justifyContent: "center", gap: 12, marginBottom: 16 }}>
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
                    transition: "transform 0.2s cubic-bezier(0.34,1.56,0.64,1)",
                    filter: isActive ? `drop-shadow(0 0 8px ${starColors.glow[star - 1]})` : "none",
                  }}
                  aria-label={`${star} star`}
                >
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                      fill={isActive ? starColors.filled[star - 1] : "transparent"}
                      stroke={isActive ? starColors.filled[star - 1] : "#333333"}
                      strokeWidth={1.5}
                      strokeLinejoin="round"
                      style={{ transition: "fill 0.15s ease, stroke 0.15s ease" }}
                    />
                  </svg>
                </button>
              );
            })}
          </div>

          {/* Star label */}
          <div style={{ textAlign: "center", height: 24, marginBottom: 32 }}>
            {displayRating > 0 ? (
              <span style={{
                color: "#C9A84C", fontSize: 13, fontWeight: 500,
                letterSpacing: "0.1em", textTransform: "uppercase",
              }}>
                {starLabels[displayRating]}
              </span>
            ) : (
              <span style={{ color: "#444444", fontSize: 13 }}>
                Tap a star to rate your experience
              </span>
            )}
          </div>

          {/* Divider */}
          <div style={{
            height: 1,
            background: "linear-gradient(90deg, transparent, #242424, transparent)",
            marginBottom: 28,
          }} />

          {/* Comment */}
          <div style={{ marginBottom: 28 }}>
            <label style={{
              display: "block", fontSize: 11, color: "#666666",
              letterSpacing: "0.12em", textTransform: "uppercase",
              marginBottom: 10, fontWeight: 500,
            }}>
              Additional Comments{" "}
              <span style={{ color: "#444444", textTransform: "none", letterSpacing: 0 }}>
                (optional)
              </span>
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              maxLength={2000}
              placeholder="Tell us more about your visit…"
              style={{
                width: "100%", boxSizing: "border-box",
                background: "#0d0d0d",
                border: "1px solid #242424",
                borderRadius: 10,
                padding: "12px 16px",
                color: "#ffffff", fontSize: 14,
                lineHeight: 1.6,
                resize: "none", outline: "none",
                fontFamily: "inherit",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => e.target.style.borderColor = "#C9A84C"}
              onBlur={(e) => e.target.style.borderColor = "#242424"}
            />
            <div style={{ textAlign: "right", fontSize: 11, color: "#444444", marginTop: 4 }}>
              {comment.length}/2000
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              marginBottom: 20, padding: "12px 16px",
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.2)",
              borderRadius: 8, color: "#f87171", fontSize: 13,
            }}>
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={loading || !rating}
            style={{
              width: "100%",
              background: loading || !rating
                ? "#1e1e1e"
                : "linear-gradient(135deg, #C9A84C 0%, #a8862e 100%)",
              color: loading || !rating ? "#555555" : "#000000",
              border: "none", borderRadius: 10,
              padding: "15px 24px",
              fontSize: 13, fontWeight: 700,
              letterSpacing: "0.12em", textTransform: "uppercase",
              cursor: loading || !rating ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              transition: "all 0.2s ease",
              boxShadow: !rating || loading ? "none" : "0 4px 20px rgba(201,168,76,0.25)",
              fontFamily: "inherit",
            }}
            onMouseEnter={(e) => {
              if (!loading && rating) (e.target as HTMLButtonElement).style.opacity = "0.9";
            }}
            onMouseLeave={(e) => {
              if (!loading && rating) (e.target as HTMLButtonElement).style.opacity = "1";
            }}
          >
            {loading && (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: "spin 1s linear infinite" }}>
                <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity="0.25"/>
                <path d="M21 12a9 9 0 00-9-9"/>
              </svg>
            )}
            {loading ? "Submitting…" : "Submit Feedback"}
          </button>

          <p style={{
            textAlign: "center", fontSize: 11,
            color: "#444444", marginTop: 16, marginBottom: 0,
          }}>
            Your feedback is private and helps us improve.
          </p>
        </div>

        {/* Footer */}
        <p style={{
          textAlign: "center", color: "#333333", fontSize: 11, marginTop: 24,
        }}>
          © {new Date().getFullYear()} Beyond Vision Optometry · Edmonton, Alberta
        </p>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Inter:wght@400;500;700&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        textarea::placeholder { color: #444444; }
      `}</style>
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

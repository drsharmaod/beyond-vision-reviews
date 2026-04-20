"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ExternalLink } from "lucide-react";

function ThankYouContent() {
  const searchParams = useSearchParams();
  const responseId   = searchParams.get("responseId") ?? "";
  const [reviewUrl, setReviewUrl] = useState<string | null>(null);
  const [clicked,   setClicked]   = useState(false);
  const [mounted,   setMounted]   = useState(false);

  useEffect(() => {
    setMounted(true);
    if (responseId) setReviewUrl(`/api/review/${responseId}`);
  }, [responseId]);

  function handleReviewClick() {
    setClicked(true);
    if (reviewUrl) window.open(reviewUrl, "_blank", "noopener");
  }

  const ff = "var(--font-inter, system-ui, sans-serif)";
  const ffDisplay = "var(--font-playfair, Georgia, serif)";

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "#0a0a0a",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "24px 16px", fontFamily: ff,
      position: "relative", overflow: "hidden", boxSizing: "border-box",
    }}>
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
        <div style={{
          position: "absolute", top: "30%", left: "50%", transform: "translateX(-50%)",
          width: 700, height: 400, borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(201,168,76,0.07) 0%, transparent 70%)",
          filter: "blur(40px)",
        }} />
      </div>

      <div style={{
        position: "relative", width: "100%", maxWidth: 480, textAlign: "center",
        opacity: mounted ? 1 : 0,
        transform: mounted ? "translateY(0)" : "translateY(16px)",
        transition: "opacity 0.5s ease, transform 0.5s ease",
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <img
            src="https://beyondvision.ca/wp-content/uploads/2017/08/logo-white.png"
            alt="Beyond Vision"
            style={{ width: "160px", maxWidth: "100%", display: "block", margin: "0 auto 8px" }}
          />
          <div style={{ fontSize: 9, color: "#C9A84C", letterSpacing: "0.5em", textTransform: "uppercase" as const }}>
            OPTOMETRY
          </div>
        </div>

        {/* Card */}
        <div style={{ backgroundColor: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 20, padding: "44px 36px", boxShadow: "0 32px 80px rgba(0,0,0,0.6)" }}>

          {/* Stars */}
          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 28 }}>
            {[1,2,3,4,5].map((s) => (
              <div key={s} style={{
                opacity: mounted ? 1 : 0,
                transform: mounted ? "scale(1) translateY(0)" : "scale(0.5) translateY(8px)",
                transition: `opacity 0.4s ease ${s * 80}ms, transform 0.4s cubic-bezier(0.34,1.56,0.64,1) ${s * 80}ms`,
                filter: "drop-shadow(0 0 8px rgba(201,168,76,0.6))",
              }}>
                <svg width="28" height="28" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                    fill="#C9A84C" stroke="#C9A84C" strokeWidth={1} strokeLinejoin="round" />
                </svg>
              </div>
            ))}
          </div>

          <h1 style={{ fontFamily: ffDisplay, fontSize: 32, fontWeight: 700, color: "#ffffff", margin: "0 0 12px" }}>Thank you!</h1>
          <p style={{ color: "#b0b0b0", fontSize: 14, lineHeight: 1.7, margin: "0 0 32px" }}>
            We're delighted you had a wonderful experience.<br />
            Your kind words mean everything to our team.
          </p>

          <div style={{ height: 1, background: "linear-gradient(90deg, transparent, #2a2a2a, transparent)", marginBottom: 28 }} />

          {/* Google CTA */}
          <div style={{ background: "rgba(201,168,76,0.05)", border: "1px solid rgba(201,168,76,0.15)", borderRadius: 14, padding: "28px 24px", marginBottom: 16 }}>
            <p style={{ color: "#ffffff", fontSize: 15, fontWeight: 600, margin: "0 0 8px" }}>Would you share your experience?</p>
            <p style={{ color: "#888", fontSize: 13, lineHeight: 1.6, margin: "0 0 24px" }}>
              A quick Google review helps other Edmontonians discover quality eye care. It takes less than 60 seconds.
            </p>
            <button
              onClick={handleReviewClick}
              disabled={clicked}
              style={{
                width: "100%",
                background: clicked ? "#1e1e1e" : "linear-gradient(135deg, #C9A84C, #a8862e)",
                color: clicked ? "#555" : "#000",
                border: "none", borderRadius: 10,
                padding: "14px 24px",
                fontSize: 12, fontWeight: 700,
                letterSpacing: "0.15em", textTransform: "uppercase" as const,
                cursor: clicked ? "default" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                boxShadow: clicked ? "none" : "0 4px 20px rgba(201,168,76,0.3)",
                transition: "all 0.2s ease",
                fontFamily: ff,
              }}
            >
              <ExternalLink size={13} />
              {clicked ? "Opening Google Reviews…" : "Leave a Google Review"}
            </button>
          </div>

          <p style={{ fontSize: 11, color: "#3a3a3a" }}>No account required · Takes less than a minute</p>
        </div>

        <p style={{ textAlign: "center", fontSize: 11, color: "#333", marginTop: 24 }}>
          © {new Date().getFullYear()} Beyond Vision Optometry · Edmonton, Alberta
        </p>
      </div>
    </div>
  );
}

export default function ThankYouPage() {
  return <Suspense><ThankYouContent /></Suspense>;
}

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

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ backgroundColor: "#0a0a0a", fontFamily: "var(--font-inter, system-ui, sans-serif)" }}
    >
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full blur-3xl"
          style={{ background: "radial-gradient(ellipse, rgba(201,168,76,0.07) 0%, transparent 70%)" }} />
      </div>

      <div
        className="relative w-full max-w-md text-center"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(16px)",
          transition: "opacity 0.5s ease, transform 0.5s ease",
        }}
      >
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex flex-col items-center">
            <div className="w-10 h-px mb-3" style={{ background: "linear-gradient(90deg, transparent, #C9A84C, transparent)" }} />
            <span className="text-white text-2xl font-bold uppercase" style={{ fontFamily: "var(--font-playfair, Georgia, serif)", letterSpacing: "0.25em" }}>
              BEYOND VISION
            </span>
            <span className="text-xs uppercase mt-1" style={{ color: "#C9A84C", letterSpacing: "0.5em" }}>OPTOMETRY</span>
            <div className="w-10 h-px mt-3" style={{ background: "linear-gradient(90deg, transparent, #C9A84C, transparent)" }} />
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-10" style={{ backgroundColor: "#1a1a1a", border: "1px solid #2a2a2a", boxShadow: "0 32px 80px rgba(0,0,0,0.6)" }}>

          {/* Stars */}
          <div className="flex justify-center gap-2 mb-7">
            {[1,2,3,4,5].map((s) => (
              <div key={s} style={{
                opacity: mounted ? 1 : 0,
                transform: mounted ? "scale(1) translateY(0)" : "scale(0.5) translateY(8px)",
                transition: `opacity 0.4s ease ${s * 80}ms, transform 0.4s cubic-bezier(0.34,1.56,0.64,1) ${s * 80}ms`,
                filter: "drop-shadow(0 0 6px rgba(201,168,76,0.5))",
              }}>
                <svg width="28" height="28" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                    fill="#C9A84C" stroke="#C9A84C" strokeWidth={1} strokeLinejoin="round" />
                </svg>
              </div>
            ))}
          </div>

          <h1 className="text-white text-3xl font-bold mb-3" style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}>
            Thank you!
          </h1>
          <p className="text-sm leading-relaxed mb-8" style={{ color: "#b0b0b0" }}>
            We're delighted you had a wonderful experience.<br />
            Your kind words mean everything to our team.
          </p>

          <div className="mb-7" style={{ height: 1, background: "linear-gradient(90deg, transparent, #2a2a2a, transparent)" }} />

          {/* Google CTA */}
          <div className="rounded-xl p-6 mb-4" style={{ background: "rgba(201,168,76,0.05)", border: "1px solid rgba(201,168,76,0.15)" }}>
            <p className="text-white font-semibold text-base mb-2">Would you share your experience?</p>
            <p className="text-sm leading-relaxed mb-6" style={{ color: "#888" }}>
              A quick Google review helps other Edmontonians discover quality eye care. It takes less than 60 seconds.
            </p>
            <button
              onClick={handleReviewClick}
              disabled={clicked}
              className="w-full rounded-xl py-3.5 text-xs font-bold uppercase flex items-center justify-center gap-2 transition-all duration-200"
              style={{
                letterSpacing: "0.12em",
                background: clicked ? "#1e1e1e" : "linear-gradient(135deg, #C9A84C, #a8862e)",
                color: clicked ? "#555" : "#000",
                border: "none",
                cursor: clicked ? "default" : "pointer",
                boxShadow: clicked ? "none" : "0 4px 20px rgba(201,168,76,0.3)",
                fontFamily: "inherit",
              }}
            >
              <ExternalLink size={13} />
              {clicked ? "Opening Google Reviews…" : "Leave a Google Review"}
            </button>
          </div>

          <p style={{ fontSize: 11, color: "#3a3a3a" }}>No account required · Takes less than a minute</p>
        </div>

        <p className="text-center mt-6" style={{ fontSize: 11, color: "#333" }}>
          © {new Date().getFullYear()} Beyond Vision Optometry · Edmonton, Alberta
        </p>
      </div>
    </div>
  );
}

export default function ThankYouPage() {
  return <Suspense><ThankYouContent /></Suspense>;
}

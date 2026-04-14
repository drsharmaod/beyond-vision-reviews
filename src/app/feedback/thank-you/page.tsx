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
    <div className="min-h-screen bg-brand-black flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-gold-500/6 rounded-full blur-3xl" />
      </div>

      <div
        className="relative w-full max-w-md text-center"
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
        <div className="bg-brand-card border border-brand-border rounded-2xl p-10 shadow-2xl shadow-black/60">

          {/* Animated stars */}
          <div className="flex justify-center gap-2 mb-7">
            {[1,2,3,4,5].map((s) => (
              <div
                key={s}
                style={{
                  opacity: mounted ? 1 : 0,
                  transform: mounted ? "scale(1) translateY(0)" : "scale(0.5) translateY(8px)",
                  transition: `opacity 0.4s ease ${s * 80}ms, transform 0.4s cubic-bezier(0.34,1.56,0.64,1) ${s * 80}ms`,
                  filter: "drop-shadow(0 0 6px rgba(201,168,76,0.5))",
                }}
              >
                <svg width="26" height="26" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                    fill="#C9A84C" stroke="#C9A84C" strokeWidth={1} strokeLinejoin="round" />
                </svg>
              </div>
            ))}
          </div>

          <h1 className="font-display text-3xl font-bold text-white mb-3">Thank you!</h1>
          <p className="text-brand-text text-sm leading-relaxed mb-8">
            We're delighted you had a wonderful experience.<br />
            Your kind words mean everything to our team.
          </p>

          <div className="h-px bg-brand-border mb-7" />

          {/* Google CTA */}
          <div className="border border-gold-500/20 rounded-xl p-6 bg-gold-500/5 mb-4">
            <p className="text-white font-semibold text-base mb-2">Would you share your experience?</p>
            <p className="text-brand-text text-sm mb-6 leading-relaxed">
              A quick Google review helps other Edmontonians discover quality eye care. It takes less than 60 seconds.
            </p>
            <button
              onClick={handleReviewClick}
              disabled={clicked}
              className="w-full font-bold py-3.5 rounded-xl text-xs tracking-widest uppercase transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60"
              style={{
                background: clicked ? "#1e1e1e" : "linear-gradient(135deg, #C9A84C, #a8862e)",
                color: clicked ? "#555" : "#000",
                boxShadow: clicked ? "none" : "0 4px 20px rgba(201,168,76,0.3)",
              }}
            >
              <ExternalLink size={13} />
              {clicked ? "Opening Google Reviews…" : "Leave a Google Review"}
            </button>
          </div>

          <p className="text-xs text-brand-text/30">No account required · Takes less than a minute</p>
        </div>

        <p className="text-center text-brand-text/20 text-xs mt-6">
          © {new Date().getFullYear()} Beyond Vision Optometry · Edmonton, Alberta
        </p>
      </div>
    </div>
  );
}

export default function ThankYouPage() {
  return <Suspense><ThankYouContent /></Suspense>;
}

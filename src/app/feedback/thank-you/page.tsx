// src/app/feedback/thank-you/page.tsx
"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Star, ExternalLink, Loader2 } from "lucide-react";

function ThankYouContent() {
  const searchParams = useSearchParams();
  const responseId   = searchParams.get("responseId") ?? "";
  const [reviewUrl, setReviewUrl] = useState<string | null>(null);
  const [clicked,   setClicked]   = useState(false);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    if (!responseId) { setLoading(false); return; }
    // Build review redirect URL through our tracking endpoint
    setReviewUrl(`/api/review/${responseId}`);
    setLoading(false);
  }, [responseId]);

  function handleReviewClick() {
    setClicked(true);
    if (reviewUrl) window.open(reviewUrl, "_blank", "noopener");
  }

  return (
    <div className="min-h-screen bg-brand-black flex items-center justify-center p-4">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-gold-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-lg text-center">
        <div className="font-display text-2xl font-bold text-white tracking-widest uppercase mb-1">
          BEYOND VISION
        </div>
        <div className="text-gold-500 text-xs tracking-[0.5em] uppercase mb-8">OPTOMETRY</div>

        <div className="bg-brand-card border border-brand-border rounded-2xl p-10 shadow-2xl shadow-black/60">
          {/* Star animation */}
          <div className="flex justify-center gap-1 mb-6">
            {[1,2,3,4,5].map((s) => (
              <Star
                key={s}
                size={28}
                fill="#C9A84C"
                stroke="#C9A84C"
                className="animate-fadeIn"
                style={{ animationDelay: `${s * 80}ms`, opacity: 0 }}
              />
            ))}
          </div>

          <h1 className="font-display text-3xl text-white mb-3">Thank you!</h1>
          <p className="text-brand-text text-base mb-8 leading-relaxed">
            We're so glad you had a great experience at Beyond Vision.<br />
            Your feedback means the world to our team.
          </p>

          <div className="border border-gold-500/20 rounded-xl p-6 bg-gold-500/5 mb-6">
            <p className="text-white font-medium mb-2">Would you share your experience?</p>
            <p className="text-brand-text text-sm mb-5">
              A quick Google review helps other Edmontonians find quality eye care. It only takes 60 seconds.
            </p>

            {loading ? (
              <div className="flex justify-center"><Loader2 size={20} className="animate-spin text-gold-500" /></div>
            ) : reviewUrl ? (
              <button
                onClick={handleReviewClick}
                disabled={clicked}
                className="w-full gold-gradient text-black font-semibold py-3.5 rounded-lg text-sm tracking-wide uppercase transition hover:opacity-90 active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
              >
                <ExternalLink size={15} />
                {clicked ? "Opening Google Reviews…" : "Leave a Google Review →"}
              </button>
            ) : null}
          </div>

          <p className="text-xs text-brand-text/40">
            No account required. Takes less than a minute.
          </p>
        </div>

        <p className="text-center text-brand-text/30 text-xs mt-5">
          © {new Date().getFullYear()} Beyond Vision Optometry · Edmonton, Alberta
        </p>
      </div>
    </div>
  );
}

export default function ThankYouPage() {
  return (
    <Suspense>
      <ThankYouContent />
    </Suspense>
  );
}

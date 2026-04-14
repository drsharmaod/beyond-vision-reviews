// src/app/feedback/thank-you/page.tsx
"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

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
    <div style={{
      minHeight: "100vh",
      background: "#080808",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "24px 16px",
      fontFamily: "'Inter', system-ui, sans-serif",
      position: "relative", overflow: "hidden",
    }}>
      {/* Background */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
        <div style={{
          position: "absolute", top: "20%", left: "50%", transform: "translateX(-50%)",
          width: 800, height: 500,
          background: "radial-gradient(ellipse, rgba(201,168,76,0.08) 0%, transparent 65%)",
          borderRadius: "50%",
        }} />
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "linear-gradient(rgba(201,168,76,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,0.025) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }} />
      </div>

      <div style={{
        position: "relative", width: "100%", maxWidth: 480, textAlign: "center",
        opacity: mounted ? 1 : 0,
        transform: mounted ? "translateY(0)" : "translateY(20px)",
        transition: "opacity 0.6s ease, transform 0.6s ease",
      }}>

        {/* Logo */}
        <div style={{ marginBottom: 36 }}>
          <div style={{ width: 48, height: 1, background: "linear-gradient(90deg, transparent, #C9A84C, transparent)", margin: "0 auto 12px" }} />
          <div style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 22, fontWeight: 700, color: "#ffffff",
            letterSpacing: "0.25em", textTransform: "uppercase",
          }}>BEYOND VISION</div>
          <div style={{ fontSize: 10, color: "#C9A84C", letterSpacing: "0.5em", textTransform: "uppercase", marginTop: 4 }}>OPTOMETRY</div>
          <div style={{ width: 48, height: 1, background: "linear-gradient(90deg, transparent, #C9A84C, transparent)", margin: "12px auto 0" }} />
        </div>

        {/* Card */}
        <div style={{
          background: "linear-gradient(145deg, #141414, #111111)",
          border: "1px solid #242424",
          borderRadius: 20,
          padding: "48px 40px",
          boxShadow: "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(201,168,76,0.05)",
        }}>

          {/* Animated stars */}
          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 28 }}>
            {[1,2,3,4,5].map((s) => (
              <div key={s} style={{
                opacity: mounted ? 1 : 0,
                transform: mounted ? "scale(1) translateY(0)" : "scale(0.5) translateY(8px)",
                transition: `opacity 0.4s ease ${s * 80}ms, transform 0.4s cubic-bezier(0.34,1.56,0.64,1) ${s * 80}ms`,
                filter: "drop-shadow(0 0 6px rgba(201,168,76,0.5))",
              }}>
                <svg width="28" height="28" viewBox="0 0 24 24">
                  <path
                    d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                    fill="#C9A84C" stroke="#C9A84C" strokeWidth={1} strokeLinejoin="round"
                  />
                </svg>
              </div>
            ))}
          </div>

          <h1 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 32, fontWeight: 700, color: "#ffffff",
            margin: "0 0 12px", lineHeight: 1.2,
          }}>
            Thank you!
          </h1>
          <p style={{
            color: "#888888", fontSize: 15, lineHeight: 1.7,
            margin: "0 0 36px",
          }}>
            We're delighted you had a wonderful experience.<br/>
            Your kind words mean everything to our team.
          </p>

          {/* Divider */}
          <div style={{ height: 1, background: "linear-gradient(90deg, transparent, #242424, transparent)", marginBottom: 32 }} />

          {/* Google review CTA */}
          <div style={{
            background: "linear-gradient(135deg, rgba(201,168,76,0.06), rgba(201,168,76,0.03))",
            border: "1px solid rgba(201,168,76,0.15)",
            borderRadius: 14,
            padding: "28px 24px",
            marginBottom: 8,
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: "50%",
              background: "rgba(201,168,76,0.1)",
              border: "1px solid rgba(201,168,76,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 16px",
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="2">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
              </svg>
            </div>

            <p style={{
              color: "#ffffff", fontSize: 15, fontWeight: 600,
              margin: "0 0 8px",
            }}>
              Would you share your experience?
            </p>
            <p style={{
              color: "#777777", fontSize: 13, lineHeight: 1.6,
              margin: "0 0 24px",
            }}>
              A quick Google review helps other Edmontonians discover quality eye care. It only takes 60 seconds.
            </p>

            <button
              onClick={handleReviewClick}
              disabled={clicked}
              style={{
                width: "100%",
                background: clicked ? "#1e1e1e" : "linear-gradient(135deg, #C9A84C 0%, #a8862e 100%)",
                color: clicked ? "#666666" : "#000000",
                border: "none", borderRadius: 10,
                padding: "14px 24px",
                fontSize: 13, fontWeight: 700,
                letterSpacing: "0.12em", textTransform: "uppercase",
                cursor: clicked ? "default" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                boxShadow: clicked ? "none" : "0 4px 20px rgba(201,168,76,0.3)",
                transition: "all 0.2s ease",
                fontFamily: "inherit",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
                <polyline points="15,3 21,3 21,9"/>
                <line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
              {clicked ? "Opening Google Reviews…" : "Leave a Google Review"}
            </button>
          </div>

          <p style={{ fontSize: 11, color: "#3a3a3a", margin: "16px 0 0" }}>
            No account required · Takes less than a minute
          </p>
        </div>

        <p style={{ color: "#333333", fontSize: 11, marginTop: 24 }}>
          © {new Date().getFullYear()} Beyond Vision Optometry · Edmonton, Alberta
        </p>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Inter:wght@400;500;600;700&display=swap');
      `}</style>
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

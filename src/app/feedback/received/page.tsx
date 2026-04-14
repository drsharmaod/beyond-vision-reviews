"use client";
import { useState, useEffect } from "react";

export default function FeedbackReceivedPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const ff = "var(--font-inter, system-ui, sans-serif)";
  const ffDisplay = "var(--font-playfair, Georgia, serif)";

  const items = [
    { path: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z", text: "Your feedback has been shared with our clinic team" },
    { path: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z", text: "We will be in touch with you shortly" },
    { path: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z", text: "We are committed to improving your experience" },
  ];

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
          width: 600, height: 400, borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(201,168,76,0.05) 0%, transparent 70%)",
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
          <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ width: 40, height: 1, marginBottom: 12, background: "linear-gradient(90deg, transparent, #C9A84C, transparent)" }} />
            <span style={{ fontFamily: ffDisplay, fontSize: 22, fontWeight: 700, color: "#ffffff", letterSpacing: "0.25em", textTransform: "uppercase" as const }}>BEYOND VISION</span>
            <span style={{ fontSize: 10, color: "#C9A84C", letterSpacing: "0.5em", textTransform: "uppercase" as const, marginTop: 4 }}>OPTOMETRY</span>
            <div style={{ width: 40, height: 1, marginTop: 12, background: "linear-gradient(90deg, transparent, #C9A84C, transparent)" }} />
          </div>
        </div>

        {/* Card */}
        <div style={{ backgroundColor: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 20, padding: "44px 36px", boxShadow: "0 32px 80px rgba(0,0,0,0.6)" }}>

          {/* Icon */}
          <div style={{
            width: 64, height: 64, borderRadius: "50%",
            background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 28px",
            opacity: mounted ? 1 : 0,
            transform: mounted ? "scale(1)" : "scale(0.8)",
            transition: "opacity 0.4s ease 0.1s, transform 0.4s cubic-bezier(0.34,1.56,0.64,1) 0.1s",
          }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>

          <h1 style={{ fontFamily: ffDisplay, fontSize: 30, fontWeight: 700, color: "#ffffff", margin: "0 0 12px" }}>Feedback received</h1>
          <p style={{ color: "#b0b0b0", fontSize: 14, lineHeight: 1.7, margin: "0 0 32px" }}>
            Thank you for taking the time to share your experience. Your feedback has been sent directly to our clinic team.
          </p>

          <div style={{ height: 1, background: "linear-gradient(90deg, transparent, #2a2a2a, transparent)", marginBottom: 28 }} />

          {/* Items */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16, textAlign: "left" }}>
            {items.map((item, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 12,
                opacity: mounted ? 1 : 0,
                transform: mounted ? "translateX(0)" : "translateX(-8px)",
                transition: `opacity 0.4s ease ${0.2 + i * 0.1}s, transform 0.4s ease ${0.2 + i * 0.1}s`,
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                  background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.15)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d={item.path} />
                  </svg>
                </div>
                <p style={{ color: "#888", fontSize: 13, lineHeight: 1.5, margin: 0, flex: 1 }}>{item.text}</p>
              </div>
            ))}
          </div>
        </div>

        <p style={{ textAlign: "center", fontSize: 11, color: "#333", marginTop: 24 }}>
          © {new Date().getFullYear()} Beyond Vision Optometry · Edmonton, Alberta
        </p>
      </div>
    </div>
  );
}

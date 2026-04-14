"use client";
import { useState, useEffect } from "react";

export default function FeedbackReceivedPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const items = [
    {
      path: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
      text: "Your feedback has been shared with our clinic team",
    },
    {
      path: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
      text: "We will be in touch with you shortly",
    },
    {
      path: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z",
      text: "We are committed to improving your experience",
    },
  ];

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ backgroundColor: "#0a0a0a", fontFamily: "var(--font-inter, system-ui, sans-serif)" }}
    >
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full blur-3xl"
          style={{ background: "radial-gradient(ellipse, rgba(201,168,76,0.05) 0%, transparent 70%)" }} />
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

          {/* Icon */}
          <div
            className="mx-auto mb-7 flex items-center justify-center rounded-full"
            style={{
              width: 64, height: 64,
              background: "rgba(201,168,76,0.08)",
              border: "1px solid rgba(201,168,76,0.2)",
              opacity: mounted ? 1 : 0,
              transform: mounted ? "scale(1)" : "scale(0.8)",
              transition: "opacity 0.4s ease 0.1s, transform 0.4s cubic-bezier(0.34,1.56,0.64,1) 0.1s",
            }}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>

          <h1 className="text-white text-3xl font-bold mb-3" style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}>
            Feedback received
          </h1>
          <p className="text-sm leading-relaxed mb-8" style={{ color: "#b0b0b0" }}>
            Thank you for taking the time to share your experience. Your feedback has been sent directly to our clinic team.
          </p>

          <div className="mb-7" style={{ height: 1, background: "linear-gradient(90deg, transparent, #2a2a2a, transparent)" }} />

          {/* Items */}
          <div className="flex flex-col gap-4 text-left">
            {items.map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-3"
                style={{
                  opacity: mounted ? 1 : 0,
                  transform: mounted ? "translateX(0)" : "translateX(-8px)",
                  transition: `opacity 0.4s ease ${0.2 + i * 0.1}s, transform 0.4s ease ${0.2 + i * 0.1}s`,
                }}
              >
                <div
                  className="flex items-center justify-center rounded-lg flex-shrink-0"
                  style={{ width: 32, height: 32, background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.15)" }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d={item.path} />
                  </svg>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: "#888", flex: 1 }}>{item.text}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-center mt-6" style={{ fontSize: 11, color: "#333" }}>
          © {new Date().getFullYear()} Beyond Vision Optometry · Edmonton, Alberta
        </p>
      </div>
    </div>
  );
}

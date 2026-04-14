// src/app/feedback/received/page.tsx
"use client";
import { useState, useEffect } from "react";

export default function FeedbackReceivedPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

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
          width: 700, height: 400,
          background: "radial-gradient(ellipse, rgba(59,130,246,0.05) 0%, transparent 65%)",
          borderRadius: "50%",
        }} />
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)",
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
          boxShadow: "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.03)",
        }}>

          {/* Icon */}
          <div style={{
            width: 64, height: 64, borderRadius: "50%",
            background: "rgba(201,168,76,0.08)",
            border: "1px solid rgba(201,168,76,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 28px",
            opacity: mounted ? 1 : 0,
            transform: mounted ? "scale(1)" : "scale(0.8)",
            transition: "opacity 0.4s ease 0.1s, transform 0.4s cubic-bezier(0.34,1.56,0.64,1) 0.1s",
          }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>

          <h1 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 30, fontWeight: 700, color: "#ffffff",
            margin: "0 0 12px", lineHeight: 1.2,
          }}>
            Feedback received
          </h1>

          <p style={{
            color: "#888888", fontSize: 15, lineHeight: 1.7,
            margin: "0 0 32px",
          }}>
            Thank you for taking the time to share your experience with us. Your feedback has been sent directly to our clinic team.
          </p>

          {/* Divider */}
          <div style={{ height: 1, background: "linear-gradient(90deg, transparent, #242424, transparent)", marginBottom: 28 }} />

          {/* Commitment message */}
          <div style={{
            display: "flex", flexDirection: "column", gap: 16,
            textAlign: "left",
          }}>
            {[
              { icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z", text: "Your feedback has been shared with our clinic team" },
              { icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z", text: "We will be in touch with you shortly" },
              { icon: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z", text: "We are committed to improving your experience" },
            ].map((item, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "flex-start", gap: 12,
                opacity: mounted ? 1 : 0,
                transform: mounted ? "translateX(0)" : "translateX(-8px)",
                transition: `opacity 0.4s ease ${0.2 + i * 0.1}s, transform 0.4s ease ${0.2 + i * 0.1}s`,
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                  background: "rgba(201,168,76,0.08)",
                  border: "1px solid rgba(201,168,76,0.15)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d={item.icon}/>
                  </svg>
                </div>
                <p style={{ color: "#888888", fontSize: 13, lineHeight: 1.5, margin: "6px 0 0", flex: 1 }}>
                  {item.text}
                </p>
              </div>
            ))}
          </div>
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

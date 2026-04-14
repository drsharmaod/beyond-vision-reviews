"use client";
import { useState, useEffect } from "react";
import { CheckCircle, MessageSquare, Heart } from "lucide-react";

export default function FeedbackReceivedPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const items = [
    { icon: CheckCircle,    text: "Your feedback has been shared with our clinic team" },
    { icon: MessageSquare,  text: "We will be in touch with you shortly" },
    { icon: Heart,          text: "We are committed to improving your experience" },
  ];

  return (
    <div className="min-h-screen bg-brand-black flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gold-500/4 rounded-full blur-3xl" />
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

          {/* Icon */}
          <div
            className="w-16 h-16 rounded-full bg-gold-500/10 border border-gold-500/20 flex items-center justify-center mx-auto mb-7"
            style={{
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

          <h1 className="font-display text-3xl font-bold text-white mb-3">Feedback received</h1>
          <p className="text-brand-text text-sm leading-relaxed mb-8">
            Thank you for taking the time to share your experience. Your feedback has been sent directly to our clinic team.
          </p>

          <div className="h-px bg-brand-border mb-7" />

          {/* Commitment list */}
          <div className="flex flex-col gap-4 text-left">
            {items.map(({ icon: Icon, text }, i) => (
              <div
                key={i}
                className="flex items-center gap-3"
                style={{
                  opacity: mounted ? 1 : 0,
                  transform: mounted ? "translateX(0)" : "translateX(-8px)",
                  transition: `opacity 0.4s ease ${0.2 + i * 0.1}s, transform 0.4s ease ${0.2 + i * 0.1}s`,
                }}
              >
                <div className="w-8 h-8 rounded-lg bg-gold-500/10 border border-gold-500/15 flex items-center justify-center flex-shrink-0">
                  <Icon size={13} className="text-gold-500" />
                </div>
                <p className="text-brand-text text-sm leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-center text-brand-text/20 text-xs mt-6">
          © {new Date().getFullYear()} Beyond Vision Optometry · Edmonton, Alberta
        </p>
      </div>
    </div>
  );
}

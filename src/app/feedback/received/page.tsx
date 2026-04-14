// src/app/feedback/received/page.tsx
export default function FeedbackReceivedPage() {
  return (
    <div className="min-h-screen bg-brand-black flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg text-center">
        <div className="font-display text-2xl font-bold text-white tracking-widest uppercase mb-1">BEYOND VISION</div>
        <div className="text-gold-500 text-xs tracking-[0.5em] uppercase mb-8">OPTOMETRY</div>
        <div className="bg-brand-card border border-brand-border rounded-2xl p-10 shadow-2xl shadow-black/60">
          <div className="text-5xl mb-6">💙</div>
          <h1 className="font-display text-3xl text-white mb-3">Feedback received</h1>
          <p className="text-brand-text text-base leading-relaxed">
            Thank you for taking the time to share your experience. Your feedback has been sent to our clinic team and we will be in touch shortly.
          </p>
          <div className="mt-8 pt-6 border-t border-brand-border">
            <p className="text-sm text-brand-text/60">
              We take every concern seriously and are committed to improving your experience.
            </p>
          </div>
        </div>
        <p className="text-center text-brand-text/30 text-xs mt-5">
          © {new Date().getFullYear()} Beyond Vision Optometry · Edmonton, Alberta
        </p>
      </div>
    </div>
  );
}

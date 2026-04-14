// src/app/(auth)/login/page.tsx
"use client";
import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";

const schema = z.object({
  email:    z.string().email("Invalid email"),
  password: z.string().min(1, "Password required"),
});
type Form = z.infer<typeof schema>;

function LoginForm() {
  const router       = useRouter();
  const params       = useSearchParams();
  const errorParam   = params.get("error");
  const [showPass, setShowPass] = useState(false);
  const [authError, setAuthError] = useState(errorParam === "CredentialsSignin" ? "Invalid email or password." : "");
  const [loading, setLoading]   = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: Form) {
    setLoading(true);
    setAuthError("");
    const result = await signIn("credentials", {
      email:    data.email,
      password: data.password,
      redirect: false,
    });
    if (result?.error) {
      setAuthError("Invalid email or password.");
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div className="min-h-screen bg-brand-black flex items-center justify-center p-4">
      {/* Background texture */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gold-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-gold-600/3 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo block */}
        <div className="text-center mb-10">
          <div className="inline-flex flex-col items-center gap-1">
            <span className="font-display text-3xl font-bold text-white tracking-widest uppercase">
              BEYOND VISION
            </span>
            <span className="text-gold-500 text-xs tracking-[0.5em] uppercase font-sans">
              OPTOMETRY
            </span>
          </div>
          <div className="mt-2 w-16 h-px bg-gold-500/40 mx-auto" />
          <p className="mt-4 text-brand-text text-sm">Review Management Portal</p>
        </div>

        {/* Card */}
        <div className="bg-brand-card border border-brand-border rounded-2xl p-8 shadow-2xl shadow-black/60">
          <h1 className="text-xl font-display font-semibold text-white mb-1">Sign In</h1>
          <p className="text-brand-text text-sm mb-7">Access your clinic dashboard</p>

          {authError && (
            <div className="mb-5 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {authError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-xs text-brand-text uppercase tracking-wider mb-2">
                Email Address
              </label>
              <input
                {...register("email")}
                type="email"
                autoComplete="email"
                placeholder="you@beyondvision.ca"
                className="w-full bg-brand-dark border border-brand-border rounded-lg px-4 py-3 text-white text-sm placeholder:text-brand-text/40 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500/20 transition"
              />
              {errors.email && <p className="mt-1.5 text-xs text-red-400">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs text-brand-text uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  {...register("password")}
                  type={showPass ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full bg-brand-dark border border-brand-border rounded-lg px-4 py-3 text-white text-sm placeholder:text-brand-text/40 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500/20 transition pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-text hover:text-white transition"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="mt-1.5 text-xs text-red-400">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full gold-gradient text-black font-semibold py-3 rounded-lg text-sm tracking-wide uppercase transition hover:opacity-90 active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={15} className="animate-spin" />}
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>
        </div>

        <p className="text-center text-brand-text/40 text-xs mt-6">
          © {new Date().getFullYear()} Beyond Vision Optometry. All rights reserved.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-brand-black" />}>
      <LoginForm />
    </Suspense>
  );
}

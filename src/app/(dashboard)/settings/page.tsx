// src/app/(dashboard)/settings/page.tsx
"use client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useEffect } from "react";
import { Save, Loader2, Check, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const schema = z.object({
  defaultSenderEmail:       z.string().email("Valid email required"),
  defaultSenderName:        z.string().min(1, "Sender name required"),
  duplicateSuppressionDays: z.coerce.number().int().min(1).max(365),
  sendDelayDays:            z.coerce.number().int().min(0).max(30),
  immediateSendEnabled:     z.boolean(),
  brandingPrimaryColor:     z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Valid hex color e.g. #C9A84C"),
  feedbackPageTitle:        z.string().min(1).max(200),
});

type FormData = z.infer<typeof schema>;

function SettingSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card-dark overflow-hidden">
      <div className="px-5 py-4 border-b border-brand-border">
        <h3 className="text-sm font-medium text-white">{title}</h3>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-brand-text uppercase tracking-wider mb-1.5">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-brand-text/40">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}

const inputClass = "w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500/20 transition placeholder:text-brand-text/40";

export default function SettingsPage() {
  const [saved,  setSaved]  = useState(false);
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState("");
  const qc = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn:  async () => (await (await fetch("/api/settings")).json()).data,
  });

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (settings) reset(settings);
  }, [settings, reset]);

  const colorVal = watch("brandingPrimaryColor");
  const immediate = watch("immediateSendEnabled");

  async function onSubmit(data: FormData) {
    setSaving(true);
    setServerError("");
    try {
      const r = await fetch("/api/settings", {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(data),
      });
      const j = await r.json();
      if (!j.success) throw new Error(j.error);
      qc.invalidateQueries({ queryKey: ["settings"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e: any) {
      setServerError(e.message);
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) return (
    <div className="card-dark p-8 text-center text-brand-text/40 text-sm">Loading settings…</div>
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-white">Settings</h1>
          <p className="text-brand-text text-sm mt-0.5">System configuration for Beyond Vision Reviews</p>
        </div>
        <button
          type="submit"
          disabled={saving}
          className={cn(
            "flex items-center gap-2 text-sm px-4 py-2.5 rounded-lg border transition font-medium",
            saved
              ? "bg-green-500/10 text-green-400 border-green-500/20"
              : "gold-gradient text-black border-transparent hover:opacity-90 disabled:opacity-50"
          )}
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <Check size={14} /> : <Save size={14} />}
          {saving ? "Saving…" : saved ? "Saved!" : "Save Changes"}
        </button>
      </div>

      {serverError && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          <AlertCircle size={14} />
          {serverError}
        </div>
      )}

      <SettingSection title="Email Sender">
        <Field label="Sender Name" hint="Displayed as the 'From' name in email clients" error={errors.defaultSenderName?.message}>
          <input {...register("defaultSenderName")} className={inputClass} placeholder="Beyond Vision Optometry" />
        </Field>
        <Field label="Sender Email" hint="Must be a verified domain in your Resend account" error={errors.defaultSenderEmail?.message}>
          <input {...register("defaultSenderEmail")} type="email" className={inputClass} placeholder="feedback@beyondvision.ca" />
        </Field>
      </SettingSection>

      <SettingSection title="Send Timing">
        <Field
          label="Send Delay (days after exam)"
          hint="0 = same day as exam. Recommended: 1–2 days after to allow patient to settle."
          error={errors.sendDelayDays?.message}
        >
          <input {...register("sendDelayDays")} type="number" min={0} max={30} className={inputClass} />
        </Field>

        <div className="flex items-start gap-3 p-4 bg-gold-500/5 border border-gold-500/15 rounded-lg">
          <input
            {...register("immediateSendEnabled")}
            type="checkbox"
            id="immediate"
            className="mt-0.5 rounded border-brand-border bg-brand-dark text-gold-500 focus:ring-gold-500/20"
          />
          <div>
            <label htmlFor="immediate" className="text-sm text-white cursor-pointer font-medium">
              Immediate Send Mode
            </label>
            <p className="text-xs text-brand-text/60 mt-0.5">
              Ignore send delay — queue all emails immediately on import. Useful for catch-up campaigns.
            </p>
          </div>
        </div>
      </SettingSection>

      <SettingSection title="Duplicate Suppression">
        <Field
          label="Suppression Window (days)"
          hint="A patient at the same location will not receive another feedback email within this window."
          error={errors.duplicateSuppressionDays?.message}
        >
          <input {...register("duplicateSuppressionDays")} type="number" min={1} max={365} className={inputClass} />
        </Field>
      </SettingSection>

      <SettingSection title="Branding">
        <Field label="Feedback Page Title" error={errors.feedbackPageTitle?.message}>
          <input {...register("feedbackPageTitle")} className={inputClass} placeholder="How was your experience?" />
        </Field>
        <Field label="Primary Brand Color" hint="Used for buttons and accents on the patient-facing feedback page" error={errors.brandingPrimaryColor?.message}>
          <div className="flex items-center gap-3">
            <input {...register("brandingPrimaryColor")} className={cn(inputClass, "flex-1")} placeholder="#C9A84C" />
            <div
              className="w-10 h-10 rounded-lg border border-brand-border shrink-0"
              style={{ backgroundColor: colorVal ?? "#C9A84C" }}
            />
          </div>
        </Field>
      </SettingSection>
    </form>
  );
}

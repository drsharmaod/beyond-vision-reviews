"use client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useEffect } from "react";
import { Save, Loader2, Check, AlertCircle, Lock } from "lucide-react";

const ff = "var(--font-inter, system-ui, sans-serif)";

const schema = z.object({
  defaultSenderEmail:       z.string().email("Valid email required"),
  defaultSenderName:        z.string().min(1, "Sender name required"),
  duplicateSuppressionDays: z.coerce.number().int().min(1).max(365),
  sendDelayDays:            z.coerce.number().int().min(0).max(30),
  immediateSendEnabled:     z.boolean(),
  brandingPrimaryColor:     z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Valid hex color e.g. #C9A84C"),
  feedbackPageTitle:        z.string().min(1).max(200),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password required"),
  newPassword:     z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type FormData = z.infer<typeof schema>;
type PasswordForm = z.infer<typeof passwordSchema>;

const inputStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box" as const,
  backgroundColor: "#141414", border: "1px solid #2a2a2a",
  borderRadius: 8, padding: "10px 14px",
  color: "#ffffff", fontSize: 13, fontFamily: ff,
  outline: "none", transition: "border-color 0.2s",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ backgroundColor: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 12, overflow: "hidden", marginBottom: 20 }}>
      <div style={{ padding: "14px 20px", borderBottom: "1px solid #2a2a2a" }}>
        <h3 style={{ fontSize: 13, fontWeight: 500, color: "#ffffff", margin: 0, fontFamily: ff }}>{title}</h3>
      </div>
      <div style={{ padding: 20, display: "flex", flexDirection: "column" as const, gap: 16 }}>{children}</div>
    </div>
  );
}

function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 10, color: "#666", letterSpacing: "0.12em", textTransform: "uppercase" as const, marginBottom: 6, fontWeight: 500, fontFamily: ff }}>
        {label}
      </label>
      {children}
      {hint  && <p style={{ marginTop: 4, fontSize: 11, color: "#555", fontFamily: ff }}>{hint}</p>}
      {error && <p style={{ marginTop: 4, fontSize: 11, color: "#f87171", fontFamily: ff }}>{error}</p>}
    </div>
  );
}

export default function SettingsPage() {
  const [saved,        setSaved]        = useState(false);
  const [saving,       setSaving]       = useState(false);
  const [serverError,  setServerError]  = useState("");
  const [pwSaved,      setPwSaved]      = useState(false);
  const [pwSaving,     setPwSaving]     = useState(false);
  const [pwError,      setPwError]      = useState("");
  const qc = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn:  async () => (await (await fetch("/api/settings")).json()).data,
  });

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const {
    register: registerPw,
    handleSubmit: handleSubmitPw,
    reset: resetPw,
    formState: { errors: pwErrors },
  } = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) });

  useEffect(() => { if (settings) reset(settings); }, [settings, reset]);

  const colorVal  = watch("brandingPrimaryColor");
  const immediate = watch("immediateSendEnabled");

  async function onSubmit(data: FormData) {
    setSaving(true); setServerError("");
    try {
      const r = await fetch("/api/settings", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const j = await r.json();
      if (!j.success) throw new Error(j.error);
      qc.invalidateQueries({ queryKey: ["settings"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e: any) {
      setServerError(e.message);
    } finally { setSaving(false); }
  }

  async function onPasswordSubmit(data: PasswordForm) {
    setPwSaving(true); setPwError("");
    try {
      const r = await fetch("/api/auth/change-password", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: data.currentPassword, newPassword: data.newPassword }),
      });
      const j = await r.json();
      if (!j.success) throw new Error(j.error ?? "Failed to change password");
      resetPw();
      setPwSaved(true);
      setTimeout(() => setPwSaved(false), 2500);
    } catch (e: any) {
      setPwError(e.message);
    } finally { setPwSaving(false); }
  }

  if (isLoading) return (
    <div style={{ backgroundColor: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 12, padding: 32, textAlign: "center", color: "#444", fontSize: 13, fontFamily: ff }}>
      Loading settings…
    </div>
  );

  return (
    <div style={{ maxWidth: 680, fontFamily: ff }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: 26, fontWeight: 600, color: "#ffffff", margin: "0 0 4px" }}>Settings</h1>
          <p style={{ fontSize: 13, color: "#888", margin: 0 }}>System configuration for Beyond Vision Reviews</p>
        </div>
        <button
          onClick={handleSubmit(onSubmit)}
          disabled={saving}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "10px 18px", fontSize: 13, fontWeight: 600,
            background: saved ? "rgba(34,197,94,0.1)" : "linear-gradient(135deg, #C9A84C, #a8862e)",
            color: saved ? "#4ade80" : "#000",
            border: saved ? "1px solid rgba(34,197,94,0.2)" : "none",
            borderRadius: 8, cursor: saving ? "not-allowed" : "pointer",
            opacity: saving ? 0.6 : 1, fontFamily: ff,
          }}
        >
          {saving ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />
            : saved ? <Check size={13} />
            : <Save size={13} />}
          {saving ? "Saving…" : saved ? "Saved!" : "Save Changes"}
        </button>
      </div>

      {serverError && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 16px", marginBottom: 20, backgroundColor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, color: "#f87171", fontSize: 13 }}>
          <AlertCircle size={13} /> {serverError}
        </div>
      )}

      {/* Email Sender */}
      <Section title="Email Sender">
        <Field label="Sender Name" hint="Displayed as the 'From' name in email clients" error={errors.defaultSenderName?.message}>
          <input {...register("defaultSenderName")} style={inputStyle} placeholder="Beyond Vision Optometry"
            onFocus={(e) => e.target.style.borderColor = "#C9A84C"}
            onBlur={(e) => e.target.style.borderColor = "#2a2a2a"} />
        </Field>
        <Field label="Sender Email" hint="Must be a verified domain in your Resend account" error={errors.defaultSenderEmail?.message}>
          <input {...register("defaultSenderEmail")} type="email" style={inputStyle} placeholder="feedback@beyondvision.ca"
            onFocus={(e) => e.target.style.borderColor = "#C9A84C"}
            onBlur={(e) => e.target.style.borderColor = "#2a2a2a"} />
        </Field>
      </Section>

      {/* Send Timing */}
      <Section title="Send Timing">
        <Field label="Send Delay (days after exam)" hint="0 = same day as exam. Recommended: 1–2 days after to allow patient to settle." error={errors.sendDelayDays?.message}>
          <input {...register("sendDelayDays")} type="number" min={0} max={30} style={inputStyle}
            onFocus={(e) => e.target.style.borderColor = "#C9A84C"}
            onBlur={(e) => e.target.style.borderColor = "#2a2a2a"} />
        </Field>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: 16, backgroundColor: "rgba(201,168,76,0.05)", border: "1px solid rgba(201,168,76,0.15)", borderRadius: 8 }}>
          <input {...register("immediateSendEnabled")} type="checkbox" id="immediate" style={{ marginTop: 2, accentColor: "#C9A84C" }} />
          <div>
            <label htmlFor="immediate" style={{ fontSize: 13, color: "#ffffff", cursor: "pointer", fontWeight: 500, fontFamily: ff }}>
              Immediate Send Mode
            </label>
            <p style={{ fontSize: 11, color: "#666", marginTop: 4, fontFamily: ff }}>
              Ignore send delay — send all emails immediately on import. Useful for catch-up campaigns.
            </p>
          </div>
        </div>
      </Section>

      {/* Duplicate Suppression */}
      <Section title="Duplicate Suppression">
        <Field label="Suppression Window (days)" hint="A patient at the same location will not receive another feedback email within this window." error={errors.duplicateSuppressionDays?.message}>
          <input {...register("duplicateSuppressionDays")} type="number" min={1} max={365} style={inputStyle}
            onFocus={(e) => e.target.style.borderColor = "#C9A84C"}
            onBlur={(e) => e.target.style.borderColor = "#2a2a2a"} />
        </Field>
      </Section>

      {/* Branding */}
      <Section title="Branding">
        <Field label="Feedback Page Title" error={errors.feedbackPageTitle?.message}>
          <input {...register("feedbackPageTitle")} style={inputStyle} placeholder="How was your experience?"
            onFocus={(e) => e.target.style.borderColor = "#C9A84C"}
            onBlur={(e) => e.target.style.borderColor = "#2a2a2a"} />
        </Field>
        <Field label="Primary Brand Color" hint="Used for buttons and accents on the patient-facing feedback page" error={errors.brandingPrimaryColor?.message}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <input {...register("brandingPrimaryColor")} style={{ ...inputStyle, flex: 1 }} placeholder="#C9A84C"
              onFocus={(e) => e.target.style.borderColor = "#C9A84C"}
              onBlur={(e) => e.target.style.borderColor = "#2a2a2a"} />
            <div style={{ width: 40, height: 40, borderRadius: 8, border: "1px solid #2a2a2a", flexShrink: 0, backgroundColor: colorVal ?? "#C9A84C" }} />
          </div>
        </Field>
      </Section>

      {/* ── Change Password ── */}
      <Section title="Change Password">
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <Lock size={14} color="#C9A84C" />
          <p style={{ fontSize: 13, color: "#888", margin: 0, fontFamily: ff }}>Update your account password</p>
        </div>

        {pwError && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 16px", backgroundColor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, color: "#f87171", fontSize: 13 }}>
            <AlertCircle size={13} /> {pwError}
          </div>
        )}

        {pwSaved && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 16px", backgroundColor: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 8, color: "#4ade80", fontSize: 13 }}>
            <Check size={13} /> Password changed successfully!
          </div>
        )}

        <Field label="Current Password" error={pwErrors.currentPassword?.message}>
          <input {...registerPw("currentPassword")} type="password" style={inputStyle} placeholder="Enter current password"
            onFocus={(e) => e.target.style.borderColor = "#C9A84C"}
            onBlur={(e) => e.target.style.borderColor = "#2a2a2a"} />
        </Field>
        <Field label="New Password" hint="Minimum 8 characters" error={pwErrors.newPassword?.message}>
          <input {...registerPw("newPassword")} type="password" style={inputStyle} placeholder="Enter new password"
            onFocus={(e) => e.target.style.borderColor = "#C9A84C"}
            onBlur={(e) => e.target.style.borderColor = "#2a2a2a"} />
        </Field>
        <Field label="Confirm New Password" error={pwErrors.confirmPassword?.message}>
          <input {...registerPw("confirmPassword")} type="password" style={inputStyle} placeholder="Confirm new password"
            onFocus={(e) => e.target.style.borderColor = "#C9A84C"}
            onBlur={(e) => e.target.style.borderColor = "#2a2a2a"} />
        </Field>

        <button
          onClick={handleSubmitPw(onPasswordSubmit)}
          disabled={pwSaving}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "10px 18px", fontSize: 13, fontWeight: 600,
            backgroundColor: "#1e1e1e", border: "1px solid #2a2a2a",
            color: "#b0b0b0", borderRadius: 8,
            cursor: pwSaving ? "not-allowed" : "pointer",
            opacity: pwSaving ? 0.6 : 1, fontFamily: ff,
            width: "fit-content",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#C9A84C"; (e.currentTarget as HTMLElement).style.color = "#C9A84C"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#2a2a2a"; (e.currentTarget as HTMLElement).style.color = "#b0b0b0"; }}
        >
          {pwSaving ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : <Lock size={13} />}
          {pwSaving ? "Updating…" : "Update Password"}
        </button>
      </Section>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

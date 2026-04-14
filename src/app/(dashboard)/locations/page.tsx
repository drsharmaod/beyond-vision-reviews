"use client";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, MapPin, Edit3, ExternalLink, Loader2, Check, X } from "lucide-react";

const ff = "var(--font-inter, system-ui, sans-serif)";

const schema = z.object({
  name:         z.string().min(1, "Name required"),
  code:         z.string().min(1).regex(/^[a-z0-9_]+$/, "Lowercase, no spaces"),
  reviewLink:   z.string().url("Must be a valid URL"),
  managerEmail: z.string().email("Valid email required"),
  managerName:  z.string().optional(),
  alertEmails:  z.string().optional(),
  isActive:     z.boolean().default(true),
});
type FormData = z.infer<typeof schema>;

const inputStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box",
  backgroundColor: "#141414", border: "1px solid #2a2a2a",
  borderRadius: 8, padding: "10px 14px",
  color: "#ffffff", fontSize: 13, fontFamily: ff,
  outline: "none", transition: "border-color 0.2s",
};

function Field({ name, label, placeholder, type = "text", disabled = false, register, errors }: any) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 10, color: "#666", letterSpacing: "0.12em", textTransform: "uppercase" as const, marginBottom: 6, fontWeight: 500 }}>
        {label}
      </label>
      <input
        {...register(name)}
        type={type}
        placeholder={placeholder}
        disabled={disabled}
        style={{ ...inputStyle, opacity: disabled ? 0.5 : 1, cursor: disabled ? "not-allowed" : "text" }}
        onFocus={(e) => { e.target.style.borderColor = "#C9A84C"; }}
        onBlur={(e) => { e.target.style.borderColor = errors[name] ? "rgba(239,68,68,0.5)" : "#2a2a2a"; }}
      />
      {errors[name] && <p style={{ fontSize: 11, color: "#f87171", marginTop: 4 }}>{errors[name]?.message}</p>}
    </div>
  );
}

function LocationForm({ defaultValues, onSubmit, onCancel, isEdit }: any) {
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues ?? { isActive: true },
  });

  async function onSave(data: FormData) {
    setSaving(true);
    try {
      const alertEmails = data.alertEmails
        ? data.alertEmails.split(",").map((e: string) => e.trim()).filter(Boolean)
        : [];
      await onSubmit({ ...data, alertEmails });
    } finally { setSaving(false); }
  }

  return (
    <form onSubmit={handleSubmit(onSave)}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <Field name="name"         label="Clinic Name"                    placeholder="Beyond Vision Millwoods"           register={register} errors={errors} />
        <Field name="code"         label="Location Code"                   placeholder="millwoods" disabled={isEdit}       register={register} errors={errors} />
        <Field name="reviewLink"   label="Google Review URL" type="url"    placeholder="https://g.page/r/..."              register={register} errors={errors} />
        <Field name="managerEmail" label="Manager Email"     type="email"  placeholder="manager@beyondvision.ca"           register={register} errors={errors} />
        <Field name="managerName"  label="Manager Name"                    placeholder="Dr. Smith (optional)"              register={register} errors={errors} />
        <Field name="alertEmails"  label="Alert Emails (comma-separated)"  placeholder="extra@clinic.ca, admin@clinic.ca"  register={register} errors={errors} />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
        <input {...register("isActive")} type="checkbox" id="isActive" style={{ accentColor: "#C9A84C" }} />
        <label htmlFor="isActive" style={{ fontSize: 13, color: "#b0b0b0", cursor: "pointer" }}>Active</label>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <button type="submit" disabled={saving} style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "10px 20px",
          background: "linear-gradient(135deg, #C9A84C, #a8862e)",
          color: "#000", border: "none", borderRadius: 8,
          fontSize: 13, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer",
          opacity: saving ? 0.6 : 1, fontFamily: ff,
        }}>
          {saving ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : <Check size={13} />}
          {saving ? "Saving…" : isEdit ? "Update Location" : "Add Location"}
        </button>
        <button type="button" onClick={onCancel} style={{
          padding: "10px 20px", fontSize: 13, color: "#888",
          border: "1px solid #2a2a2a", borderRadius: 8,
          background: "transparent", cursor: "pointer", fontFamily: ff,
        }}>
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function LocationsPage() {
  const [showForm, setShowForm] = useState(false);
  const [editing,  setEditing]  = useState<any>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const qc = useQueryClient();

  const locationsQ = useQuery({
    queryKey: ["locations"],
    queryFn: async () => (await (await fetch("/api/locations")).json()).data ?? [],
  });

  async function handleCreate(data: any) {
    const r = await fetch("/api/locations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    const j = await r.json();
    if (!j.success) throw new Error(j.error);
    qc.invalidateQueries({ queryKey: ["locations"] });
    setShowForm(false);
    setFeedback("Location created successfully");
    setTimeout(() => setFeedback(null), 4000);
  }

  async function handleUpdate(id: string, data: any) {
    const r = await fetch(`/api/locations/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    const j = await r.json();
    if (!j.success) throw new Error(j.error);
    qc.invalidateQueries({ queryKey: ["locations"] });
    setEditing(null);
    setFeedback("Location updated successfully");
    setTimeout(() => setFeedback(null), 4000);
  }

  const locations = locationsQ.data ?? [];

  return (
    <div style={{ maxWidth: 900, fontFamily: ff }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: 26, fontWeight: 600, color: "#ffffff", margin: "0 0 4px" }}>Locations</h1>
          <p style={{ fontSize: 13, color: "#888", margin: 0 }}>Manage Beyond Vision clinic locations and alert routing</p>
        </div>
        {!showForm && (
          <button onClick={() => { setShowForm(true); setEditing(null); }} style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "10px 18px",
            background: "linear-gradient(135deg, #C9A84C, #a8862e)",
            color: "#000", border: "none", borderRadius: 8,
            fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: ff,
          }}>
            <Plus size={14} /> Add Location
          </button>
        )}
      </div>

      {/* Success banner */}
      {feedback && (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "12px 16px", marginBottom: 20,
          backgroundColor: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)",
          borderRadius: 10, color: "#4ade80", fontSize: 13,
        }}>
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}><Check size={13} /> {feedback}</span>
          <button onClick={() => setFeedback(null)} style={{ background: "none", border: "none", color: "#4ade80", cursor: "pointer" }}><X size={13} /></button>
        </div>
      )}

      {/* Add form */}
      {showForm && !editing && (
        <div style={{ backgroundColor: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 12, padding: 24, marginBottom: 20 }}>
          <h3 style={{ fontSize: 13, fontWeight: 500, color: "#ffffff", margin: "0 0 16px" }}>New Location</h3>
          <LocationForm isEdit={false} onSubmit={handleCreate} onCancel={() => setShowForm(false)} />
        </div>
      )}

      {/* Location list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {locationsQ.isLoading ? (
          <div style={{ backgroundColor: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 12, padding: 32, textAlign: "center", color: "#444", fontSize: 13 }}>
            Loading…
          </div>
        ) : locations.map((loc: any) => (
          <div key={loc.id} style={{ backgroundColor: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 12, overflow: "hidden" }}>
            {editing?.id === loc.id ? (
              <div style={{ padding: 24 }}>
                <h3 style={{ fontSize: 13, fontWeight: 500, color: "#ffffff", margin: "0 0 16px" }}>Editing: {loc.name}</h3>
                <LocationForm
                  isEdit
                  defaultValues={{ ...loc, alertEmails: loc.alertEmails?.join(", ") ?? "" }}
                  onSubmit={(data: any) => handleUpdate(loc.id, data)}
                  onCancel={() => setEditing(null)}
                />
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 20px" }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  backgroundColor: loc.isActive ? "rgba(201,168,76,0.1)" : "#141414",
                  border: `1px solid ${loc.isActive ? "rgba(201,168,76,0.2)" : "#2a2a2a"}`,
                  color: loc.isActive ? "#C9A84C" : "#555",
                }}>
                  <MapPin size={16} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <p style={{ color: "#ffffff", fontWeight: 500, fontSize: 14, margin: 0 }}>{loc.name}</p>
                    {!loc.isActive && (
                      <span style={{ fontSize: 10, color: "#555", border: "1px solid #2a2a2a", padding: "2px 6px", borderRadius: 4 }}>Inactive</span>
                    )}
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 12, fontSize: 11, color: "#666" }}>
                    <span>Code: <code style={{ color: "#b0b0b0" }}>{loc.code}</code></span>
                    <span>Manager: {loc.managerEmail}</span>
                    <span>{loc._count?.patients ?? 0} patients</span>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <a href={loc.reviewLink} target="_blank" rel="noopener noreferrer" style={{
                    display: "flex", alignItems: "center", justifyContent: "center",
                    width: 32, height: 32, borderRadius: 6, color: "#555",
                    textDecoration: "none", transition: "color 0.15s",
                  }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#C9A84C")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "#555")}
                  >
                    <ExternalLink size={14} />
                  </a>
                  <button onClick={() => { setEditing(loc); setShowForm(false); }} style={{
                    display: "flex", alignItems: "center", justifyContent: "center",
                    width: 32, height: 32, borderRadius: 6,
                    background: "none", border: "none", color: "#555", cursor: "pointer",
                    transition: "color 0.15s",
                  }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "#555")}
                  >
                    <Edit3 size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

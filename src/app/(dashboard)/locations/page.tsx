// src/app/(dashboard)/locations/page.tsx
"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, MapPin, Edit3, X, ExternalLink, Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const schema = z.object({
  name:         z.string().min(1, "Name required"),
  code:         z.string().min(1).regex(/^[a-z0-9_]+$/, "Lowercase, no spaces"),
  reviewLink:   z.string().url("Must be a valid URL"),
  managerEmail: z.string().email("Valid email required"),
  managerName:  z.string().optional(),
  alertEmails:  z.string().optional(), // comma-separated
  isActive:     z.boolean().default(true),
});

type FormData = z.infer<typeof schema>;

function LocationForm({
  defaultValues,
  onSubmit,
  onCancel,
  isEdit,
}: {
  defaultValues?: Partial<FormData & { alertEmails: string }>;
  onSubmit: (d: any) => Promise<void>;
  onCancel: () => void;
  isEdit: boolean;
}) {
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues ?? { isActive: true },
  });

  async function onSave(data: FormData) {
    setSaving(true);
    try {
      const alertEmails = data.alertEmails
        ? data.alertEmails.split(",").map((e) => e.trim()).filter(Boolean)
        : [];
      await onSubmit({ ...data, alertEmails });
    } finally {
      setSaving(false);
    }
  }

  const Field = ({ name, label, placeholder, type = "text", disabled = false }: any) => (
    <div>
      <label className="block text-xs text-brand-text uppercase tracking-wider mb-1.5">{label}</label>
      <input
        {...register(name)}
        type={type}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          "w-full bg-brand-dark border rounded-lg px-3 py-2.5 text-white text-sm placeholder:text-brand-text/40 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500/20 transition",
          errors[name as keyof FormData] ? "border-red-500/50" : "border-brand-border",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      />
      {errors[name as keyof FormData] && (
        <p className="mt-1 text-xs text-red-400">{errors[name as keyof FormData]?.message as string}</p>
      )}
    </div>
  );

  return (
    <form onSubmit={handleSubmit(onSave)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field name="name"         label="Clinic Name"        placeholder="Beyond Vision Millwoods" />
        <Field name="code"         label="Location Code"      placeholder="millwoods" disabled={isEdit} />
        <Field name="reviewLink"   label="Google Review URL"  placeholder="https://g.page/r/..." type="url" />
        <Field name="managerEmail" label="Manager Email"      placeholder="manager@beyondvision.ca" type="email" />
        <Field name="managerName"  label="Manager Name"       placeholder="Dr. Smith (optional)" />
        <Field name="alertEmails"  label="Alert Emails (comma-separated)" placeholder="extra@clinic.ca, admin@clinic.ca" />
      </div>
      <div className="flex items-center gap-2">
        <input {...register("isActive")} type="checkbox" id="isActive" className="rounded border-brand-border bg-brand-dark text-gold-500 focus:ring-gold-500/20" />
        <label htmlFor="isActive" className="text-sm text-brand-text cursor-pointer">Active</label>
      </div>
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 gold-gradient text-black text-sm font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 transition"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
          {saving ? "Saving…" : isEdit ? "Update Location" : "Add Location"}
        </button>
        <button type="button" onClick={onCancel} className="px-5 py-2.5 text-sm text-brand-text border border-brand-border rounded-lg hover:text-white hover:border-brand-muted transition">
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function LocationsPage() {
  const [showForm, setShowForm]   = useState(false);
  const [editing,  setEditing]    = useState<any>(null);
  const [feedback, setFeedback]   = useState<{ id: string; msg: string } | null>(null);
  const qc = useQueryClient();

  const locationsQ = useQuery({
    queryKey: ["locations"],
    queryFn:  async () => (await (await fetch("/api/locations")).json()).data ?? [],
  });

  async function handleCreate(data: any) {
    const r = await fetch("/api/locations", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
    });
    const j = await r.json();
    if (!j.success) throw new Error(j.error);
    qc.invalidateQueries({ queryKey: ["locations"] });
    setShowForm(false);
    setFeedback({ id: j.data.id, msg: "Location created successfully" });
  }

  async function handleUpdate(id: string, data: any) {
    const r = await fetch(`/api/locations/${id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
    });
    const j = await r.json();
    if (!j.success) throw new Error(j.error);
    qc.invalidateQueries({ queryKey: ["locations"] });
    setEditing(null);
    setFeedback({ id: j.data.id, msg: "Location updated successfully" });
  }

  const locations = locationsQ.data ?? [];

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-white">Locations</h1>
          <p className="text-brand-text text-sm mt-0.5">Manage Beyond Vision clinic locations and alert routing</p>
        </div>
        {!showForm && (
          <button
            onClick={() => { setShowForm(true); setEditing(null); }}
            className="flex items-center gap-2 px-4 py-2 gold-gradient text-black text-sm font-semibold rounded-lg hover:opacity-90 transition"
          >
            <Plus size={14} /> Add Location
          </button>
        )}
      </div>

      {feedback && (
        <div className="flex items-center justify-between px-4 py-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm">
          <span className="flex items-center gap-2"><Check size={13} /> {feedback.msg}</span>
          <button onClick={() => setFeedback(null)}><X size={13} /></button>
        </div>
      )}

      {/* Add form */}
      {showForm && !editing && (
        <div className="card-dark p-6 animate-fadeIn">
          <h3 className="text-sm font-medium text-white mb-4">New Location</h3>
          <LocationForm
            isEdit={false}
            onSubmit={handleCreate}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {/* Location cards */}
      <div className="space-y-3">
        {locationsQ.isLoading
          ? <div className="card-dark p-8 text-center text-brand-text/40 text-sm">Loading…</div>
          : locations.map((loc: any) => (
            <div key={loc.id} className="card-dark overflow-hidden">
              {editing?.id === loc.id ? (
                <div className="p-6 animate-fadeIn">
                  <h3 className="text-sm font-medium text-white mb-4">Editing: {loc.name}</h3>
                  <LocationForm
                    isEdit
                    defaultValues={{
                      ...loc,
                      alertEmails: loc.alertEmails?.join(", ") ?? "",
                    }}
                    onSubmit={(data) => handleUpdate(loc.id, data)}
                    onCancel={() => setEditing(null)}
                  />
                </div>
              ) : (
                <div className="flex items-center gap-4 px-5 py-4">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center border shrink-0",
                    loc.isActive
                      ? "bg-gold-500/10 border-gold-500/20 text-gold-400"
                      : "bg-brand-dark border-brand-border text-brand-text/40"
                  )}>
                    <MapPin size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-white font-medium">{loc.name}</p>
                      {!loc.isActive && (
                        <span className="text-xs text-brand-text/40 border border-brand-border px-1.5 py-0.5 rounded">Inactive</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-brand-text/60">
                      <span>Code: <code className="text-brand-text">{loc.code}</code></span>
                      <span>Manager: {loc.managerEmail}</span>
                      <span>{loc._count?.patients ?? 0} patients</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={loc.reviewLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-brand-text/50 hover:text-gold-400 transition"
                      title="Google Review Link"
                    >
                      <ExternalLink size={14} />
                    </a>
                    <button
                      onClick={() => { setEditing(loc); setShowForm(false); }}
                      className="p-2 text-brand-text/50 hover:text-white transition"
                    >
                      <Edit3 size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        }
      </div>
    </div>
  );
}

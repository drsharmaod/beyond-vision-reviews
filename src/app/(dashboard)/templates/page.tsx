// src/app/(dashboard)/templates/page.tsx
"use client";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Save, Eye, EyeOff, Code, Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const TEMPLATE_LABELS: Record<string, { label: string; desc: string; vars: string[] }> = {
  FEEDBACK_REQUEST: {
    label: "Feedback Request",
    desc:  "Sent to patients asking them to rate their visit",
    vars:  ["first_name", "location_name", "exam_date", "patient_email",
            "rating_1_url", "rating_2_url", "rating_3_url", "rating_4_url", "rating_5_url"],
  },
  POSITIVE_FOLLOWUP: {
    label: "Positive Follow-up",
    desc:  "Sent after 4–5 star rating, asking for a Google review",
    vars:  ["first_name", "location_name", "rating", "review_link", "comment"],
  },
  NEGATIVE_ALERT: {
    label: "Internal Alert",
    desc:  "Sent to location manager on 1–3 star rating",
    vars:  ["first_name", "last_name", "patient_email", "location_name",
            "exam_date", "rating", "comment", "timestamp", "dashboard_url"],
  },
};

function TemplateEditor({ template }: { template: any }) {
  const [subject,  setSubject]  = useState(template.subject);
  const [htmlBody, setHtmlBody] = useState(template.htmlBody);
  const [textBody, setTextBody] = useState(template.textBody);
  const [tab,      setTab]      = useState<"html" | "text" | "preview">("html");
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);
  const qc = useQueryClient();

  const meta = TEMPLATE_LABELS[template.templateType] ?? {};

  async function handleSave() {
    setSaving(true);
    try {
      const r = await fetch(`/api/templates/${template.id}`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ subject, htmlBody, textBody }),
      });
      const j = await r.json();
      if (!j.success) throw new Error(j.error);
      qc.invalidateQueries({ queryKey: ["templates"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  }

  function insertVar(v: string) {
    const cursor = `{{${v}}}`;
    if (tab === "html") setHtmlBody((prev: string) => prev + cursor);
    else if (tab === "text") setTextBody((prev: string) => prev + cursor);
    else setSubject((prev: string) => prev + cursor);
  }

  return (
    <div className="card-dark overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-brand-border flex items-start justify-between gap-4">
        <div>
          <p className="text-white font-medium">{meta.label}</p>
          <p className="text-brand-text/60 text-xs mt-0.5">{meta.desc}</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className={cn(
            "flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border transition shrink-0",
            saved
              ? "bg-green-500/10 text-green-400 border-green-500/20"
              : "gold-gradient text-black font-semibold border-transparent hover:opacity-90 disabled:opacity-50"
          )}
        >
          {saving ? <Loader2 size={12} className="animate-spin" /> : saved ? <Check size={12} /> : <Save size={12} />}
          {saving ? "Saving…" : saved ? "Saved" : "Save"}
        </button>
      </div>

      <div className="p-5 space-y-4">
        {/* Subject */}
        <div>
          <label className="block text-xs text-brand-text uppercase tracking-wider mb-1.5">Subject Line</label>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500/20 transition"
          />
        </div>

        {/* Variable chips */}
        <div>
          <p className="text-xs text-brand-text/50 mb-2">Available variables (click to insert into active tab):</p>
          <div className="flex flex-wrap gap-1.5">
            {meta.vars?.map((v) => (
              <button
                key={v}
                onClick={() => insertVar(v)}
                className="text-xs font-mono px-2 py-1 bg-gold-500/10 text-gold-400 border border-gold-500/20 rounded hover:bg-gold-500/20 transition"
              >
                {`{{${v}}}`}
              </button>
            ))}
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1 border-b border-brand-border pb-0">
          {(["html", "text", "preview"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "flex items-center gap-1.5 text-xs px-3 py-2 border-b-2 -mb-px transition",
                tab === t
                  ? "border-gold-500 text-gold-400"
                  : "border-transparent text-brand-text hover:text-white"
              )}
            >
              {t === "preview" ? <Eye size={11} /> : <Code size={11} />}
              {t.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Editor area */}
        {tab === "html" && (
          <textarea
            value={htmlBody}
            onChange={(e) => setHtmlBody(e.target.value)}
            rows={20}
            className="w-full bg-brand-dark border border-brand-border rounded-lg px-4 py-3 text-white text-xs font-mono focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500/20 transition resize-y"
          />
        )}
        {tab === "text" && (
          <textarea
            value={textBody}
            onChange={(e) => setTextBody(e.target.value)}
            rows={12}
            className="w-full bg-brand-dark border border-brand-border rounded-lg px-4 py-3 text-white text-sm font-mono focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500/20 transition resize-y"
          />
        )}
        {tab === "preview" && (
          <div className="rounded-xl overflow-hidden border border-brand-border bg-white" style={{ height: 480 }}>
            <iframe
              srcDoc={htmlBody}
              title="Email Preview"
              className="w-full h-full border-0"
              sandbox="allow-same-origin"
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default function TemplatesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["templates"],
    queryFn:  async () => (await (await fetch("/api/templates")).json()).data ?? [],
  });

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="font-display text-2xl text-white">Email Templates</h1>
        <p className="text-brand-text text-sm mt-0.5">Edit the HTML and text versions of each automated email</p>
      </div>

      {isLoading ? (
        <div className="card-dark p-8 text-center text-brand-text/40 text-sm">Loading templates…</div>
      ) : (
        <div className="space-y-6">
          {(data ?? []).map((t: any) => <TemplateEditor key={t.id} template={t} />)}
        </div>
      )}
    </div>
  );
}

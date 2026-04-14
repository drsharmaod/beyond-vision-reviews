// src/app/(dashboard)/imports/page.tsx
"use client";
import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Upload, FileText, CheckCircle2, XCircle, AlertCircle,
  Download, RefreshCw, ChevronDown, ChevronUp,
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";

// ── Upload zone ───────────────────────────────────────────────────────────────
function UploadZone({ onResult }: { onResult: (r: any) => void }) {
  const [uploading, setUploading] = useState(false);
  const [error,     setError]     = useState("");

  const onDrop = useCallback(async (files: File[]) => {
    const file = files[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/imports", { method: "POST", body: fd });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      onResult(json.data);
    } catch (e: any) {
      setError(e.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  }, [onResult]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "text/csv": [".csv"] },
    maxFiles: 1,
    disabled: uploading,
  });

  return (
    <div>
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all",
          isDragActive
            ? "border-gold-500 bg-gold-500/5"
            : "border-brand-border hover:border-gold-500/50 hover:bg-brand-card",
          uploading && "pointer-events-none opacity-60"
        )}
      >
        <input {...getInputProps()} />
        <div className={cn(
          "mx-auto mb-4 w-14 h-14 rounded-full flex items-center justify-center transition-colors",
          isDragActive ? "bg-gold-500/20 border border-gold-500/30" : "bg-brand-dark border border-brand-border"
        )}>
          {uploading
            ? <RefreshCw size={22} className="text-gold-400 animate-spin" />
            : <Upload size={22} className={isDragActive ? "text-gold-400" : "text-brand-text"} />
          }
        </div>
        <p className="text-white font-medium mb-1">
          {uploading ? "Processing CSV…" : isDragActive ? "Drop it here" : "Drop your CSV file here"}
        </p>
        <p className="text-brand-text text-sm mb-4">
          or <span className="text-gold-400 underline">browse to upload</span>
        </p>
        <p className="text-brand-text/50 text-xs">
          CSV only · Max 10MB · Required columns: first_name, last_name, email, location, exam_date
        </p>
      </div>
      {error && (
        <div className="mt-3 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-center gap-2">
          <XCircle size={14} />
          {error}
        </div>
      )}
    </div>
  );
}

// ── Import result card ────────────────────────────────────────────────────────
function ImportResultCard({ result }: { result: any }) {
  const [showErrors, setShowErrors] = useState(false);
  const hasErrors = result.errors?.length > 0;

  return (
    <div className="card-dark p-5 animate-fadeIn">
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2 bg-green-500/10 border border-green-500/20 rounded-lg">
          <CheckCircle2 size={16} className="text-green-400" />
        </div>
        <div>
          <p className="text-white font-medium">Import complete</p>
          <p className="text-brand-text text-xs">{result.fileName}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {[
          { label: "Total Rows",   value: result.totalRows,    color: "text-white" },
          { label: "Imported",     value: result.validRows,    color: "text-green-400" },
          { label: "Skipped",      value: result.duplicateRows, color: "text-yellow-400" },
          { label: "Invalid",      value: result.invalidRows,  color: result.invalidRows > 0 ? "text-red-400" : "text-brand-text/40" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-brand-dark rounded-lg p-3 border border-brand-border">
            <div className={cn("text-xl font-display font-semibold", color)}>{value}</div>
            <div className="text-xs text-brand-text/60 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      <div className="bg-gold-500/5 border border-gold-500/15 rounded-lg px-4 py-2.5 text-sm text-gold-400">
        ✓ {result.queued} feedback email{result.queued !== 1 ? "s" : ""} queued for delivery
      </div>

      {hasErrors && (
        <div className="mt-3">
          <button
            onClick={() => setShowErrors(!showErrors)}
            className="flex items-center gap-2 text-xs text-brand-text/60 hover:text-white transition"
          >
            {showErrors ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {result.errors.length} row error{result.errors.length !== 1 ? "s" : ""}
          </button>
          {showErrors && (
            <div className="mt-2 bg-red-500/5 border border-red-500/15 rounded-lg overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-red-500/10">
                    <th className="text-left px-3 py-2 text-red-400/70 font-normal">Row</th>
                    <th className="text-left px-3 py-2 text-red-400/70 font-normal">Field</th>
                    <th className="text-left px-3 py-2 text-red-400/70 font-normal">Error</th>
                  </tr>
                </thead>
                <tbody>
                  {result.errors.slice(0, 20).map((e: any, i: number) => (
                    <tr key={i} className="border-b border-red-500/5">
                      <td className="px-3 py-1.5 text-brand-text">{e.row}</td>
                      <td className="px-3 py-1.5 text-brand-text font-mono">{e.field}</td>
                      <td className="px-3 py-1.5 text-red-400/80">{e.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Import history table ──────────────────────────────────────────────────────
function ImportHistory() {
  const { data, isLoading } = useQuery({
    queryKey: ["imports"],
    queryFn:  async () => {
      const r = await fetch("/api/imports");
      return (await r.json()).data;
    },
  });

  if (isLoading) return (
    <div className="card-dark p-8 text-center text-brand-text/40 text-sm">Loading history…</div>
  );

  const imports = data?.imports ?? [];

  return (
    <div className="card-dark overflow-hidden">
      <div className="px-5 py-4 border-b border-brand-border">
        <h3 className="text-sm font-medium text-white">Upload History</h3>
      </div>
      {imports.length === 0 ? (
        <div className="p-8 text-center text-brand-text/40 text-sm">No imports yet</div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-brand-border">
              {["File", "Status", "Total", "Imported", "Skipped", "Errors", "Uploaded by", "Date"].map((h) => (
                <th key={h} className="text-left px-5 py-3 text-xs text-brand-text/50 uppercase tracking-wider font-normal">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {imports.map((imp: any) => (
              <tr key={imp.id} className="border-b border-brand-border/40 hover:bg-brand-card/50 transition">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <FileText size={13} className="text-brand-text/50" />
                    <span className="text-white truncate max-w-[180px]">{imp.fileName}</span>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <span className={cn(
                    "text-xs px-2 py-0.5 rounded-full border",
                    imp.status === "COMPLETE" ? "badge-positive"
                    : imp.status === "FAILED"  ? "badge-negative"
                    : "badge-neutral"
                  )}>
                    {imp.status}
                  </span>
                </td>
                <td className="px-5 py-3 text-brand-text">{imp.totalRows}</td>
                <td className="px-5 py-3 text-green-400">{imp.validRows}</td>
                <td className="px-5 py-3 text-yellow-400">{imp.duplicateRows}</td>
                <td className="px-5 py-3">
                  <span className={imp.invalidRows > 0 ? "text-red-400" : "text-brand-text/40"}>{imp.invalidRows}</span>
                </td>
                <td className="px-5 py-3 text-brand-text/70">{imp.uploadedBy?.name ?? "—"}</td>
                <td className="px-5 py-3 text-brand-text/60 text-xs">{formatDate(imp.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ── Example CSV download ──────────────────────────────────────────────────────
function downloadExampleCSV() {
  const csv = [
    "first_name,last_name,email,location,exam_date,patient_id,doctor_name,phone,appointment_type",
    "Sarah,Mitchell,sarah.mitchell@example.com,millwoods,2024-03-15,P001,Dr. Lu,780-555-0100,Comprehensive",
    "James,Okafor,james.okafor@example.com,crystallina,2024-03-15,P002,Dr. Poon,780-555-0101,Contact Lens",
    "Priya,Sharma,priya.sharma@example.com,grange,2024-03-14,,,,",
    "Michael,Chen,michael.chen@example.com,terwillegar,2024-03-14,P004,,,Dry Eye",
    "Emily,Tremblay,emily.tremblay@example.com,millwoods,2024-03-13,P005,Dr. Lu,,",
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = "beyond_vision_patients_example.csv"; a.click();
  URL.revokeObjectURL(url);
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ImportsPage() {
  const [lastResult, setLastResult] = useState<any>(null);
  const queryClient = useQueryClient();

  function handleResult(result: any) {
    setLastResult(result);
    queryClient.invalidateQueries({ queryKey: ["imports"] });
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-white">CSV Import</h1>
          <p className="text-brand-text text-sm mt-0.5">Upload a patient list to trigger feedback emails</p>
        </div>
        <button
          onClick={downloadExampleCSV}
          className="flex items-center gap-2 text-sm text-brand-text hover:text-gold-400 border border-brand-border hover:border-gold-500/40 px-3 py-2 rounded-lg transition"
        >
          <Download size={14} />
          Example CSV
        </button>
      </div>

      <UploadZone onResult={handleResult} />

      {lastResult && <ImportResultCard result={lastResult} />}

      <ImportHistory />
    </div>
  );
}

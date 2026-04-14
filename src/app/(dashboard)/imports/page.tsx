"use client";
import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Upload, FileText, CheckCircle2, XCircle, RefreshCw, ChevronDown, ChevronUp, Download } from "lucide-react";

const ff = "var(--font-inter, system-ui, sans-serif)";

function formatDate(d: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" });
}

function UploadZone({ onResult }: { onResult: (r: any) => void }) {
  const [uploading, setUploading] = useState(false);
  const [error,     setError]     = useState("");

  const onDrop = useCallback(async (files: File[]) => {
    const file = files[0];
    if (!file) return;
    setUploading(true); setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res  = await fetch("/api/imports", { method: "POST", body: fd });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      onResult(json.data);
    } catch (e: any) {
      setError(e.message ?? "Upload failed");
    } finally { setUploading(false); }
  }, [onResult]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { "text/csv": [".csv"] }, maxFiles: 1, disabled: uploading,
  });

  return (
    <div>
      <div {...getRootProps()} style={{
        border: `2px dashed ${isDragActive ? "#C9A84C" : "#2a2a2a"}`,
        borderRadius: 14, padding: "48px 24px", textAlign: "center",
        cursor: uploading ? "not-allowed" : "pointer",
        backgroundColor: isDragActive ? "rgba(201,168,76,0.04)" : "transparent",
        opacity: uploading ? 0.6 : 1,
        transition: "all 0.2s ease",
      }}>
        <input {...getInputProps()} />
        <div style={{
          width: 56, height: 56, borderRadius: "50%", margin: "0 auto 16px",
          display: "flex", alignItems: "center", justifyContent: "center",
          backgroundColor: isDragActive ? "rgba(201,168,76,0.15)" : "#141414",
          border: `1px solid ${isDragActive ? "rgba(201,168,76,0.3)" : "#2a2a2a"}`,
          transition: "all 0.2s",
        }}>
          {uploading
            ? <RefreshCw size={22} color="#C9A84C" style={{ animation: "spin 1s linear infinite" }} />
            : <Upload size={22} color={isDragActive ? "#C9A84C" : "#666"} />
          }
        </div>
        <p style={{ color: "#ffffff", fontWeight: 500, fontSize: 15, margin: "0 0 6px" }}>
          {uploading ? "Processing CSV…" : isDragActive ? "Drop it here" : "Drop your CSV file here"}
        </p>
        <p style={{ color: "#888", fontSize: 13, margin: "0 0 16px" }}>
          or <span style={{ color: "#C9A84C", textDecoration: "underline" }}>browse to upload</span>
        </p>
        <p style={{ color: "#444", fontSize: 11, margin: 0 }}>
          CSV only · Max 10MB · Required columns: first_name, last_name, email, location, exam_date
        </p>
      </div>
      {error && (
        <div style={{
          marginTop: 12, padding: "12px 16px", display: "flex", alignItems: "center", gap: 8,
          backgroundColor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
          borderRadius: 8, color: "#f87171", fontSize: 13,
        }}>
          <XCircle size={13} /> {error}
        </div>
      )}
    </div>
  );
}

function ImportResultCard({ result }: { result: any }) {
  const [showErrors, setShowErrors] = useState(false);
  const hasErrors = result.errors?.length > 0;

  return (
    <div style={{ backgroundColor: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 12, padding: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <div style={{ padding: 8, backgroundColor: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 8 }}>
          <CheckCircle2 size={16} color="#4ade80" />
        </div>
        <div>
          <p style={{ color: "#ffffff", fontWeight: 500, fontSize: 14, margin: 0 }}>Import complete</p>
          <p style={{ color: "#888", fontSize: 11, margin: 0 }}>{result.fileName}</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 14 }}>
        {[
          { label: "Total Rows", value: result.totalRows,    color: "#ffffff" },
          { label: "Imported",   value: result.validRows,    color: "#4ade80" },
          { label: "Skipped",    value: result.duplicateRows, color: "#facc15" },
          { label: "Invalid",    value: result.invalidRows,  color: result.invalidRows > 0 ? "#f87171" : "#444" },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ backgroundColor: "#141414", borderRadius: 8, padding: 14, border: "1px solid #2a2a2a" }}>
            <div style={{ fontSize: 22, fontWeight: 600, color, marginBottom: 2 }}>{value}</div>
            <div style={{ fontSize: 11, color: "#666" }}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{ backgroundColor: "rgba(201,168,76,0.05)", border: "1px solid rgba(201,168,76,0.15)", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#C9A84C" }}>
        ✓ {result.queued} feedback email{result.queued !== 1 ? "s" : ""} queued for delivery
      </div>

      {hasErrors && (
        <div style={{ marginTop: 12 }}>
          <button onClick={() => setShowErrors(!showErrors)} style={{
            display: "flex", alignItems: "center", gap: 6,
            fontSize: 11, color: "#666", background: "none", border: "none", cursor: "pointer",
            padding: 0, fontFamily: ff,
          }}>
            {showErrors ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            {result.errors.length} row error{result.errors.length !== 1 ? "s" : ""}
          </button>
          {showErrors && (
            <div style={{ marginTop: 8, backgroundColor: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 8, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(239,68,68,0.1)" }}>
                    {["Row", "Field", "Error"].map((h) => (
                      <th key={h} style={{ textAlign: "left", padding: "8px 12px", color: "rgba(248,113,113,0.7)", fontWeight: 400 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.errors.slice(0, 20).map((e: any, i: number) => (
                    <tr key={i} style={{ borderBottom: "1px solid rgba(239,68,68,0.05)" }}>
                      <td style={{ padding: "6px 12px", color: "#b0b0b0" }}>{e.row}</td>
                      <td style={{ padding: "6px 12px", color: "#b0b0b0", fontFamily: "monospace" }}>{e.field}</td>
                      <td style={{ padding: "6px 12px", color: "rgba(248,113,113,0.8)" }}>{e.message}</td>
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

function ImportHistory() {
  const { data, isLoading } = useQuery({
    queryKey: ["imports"],
    queryFn: async () => (await (await fetch("/api/imports")).json()).data,
  });

  const imports = data?.imports ?? [];

  return (
    <div style={{ backgroundColor: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 12, overflow: "hidden" }}>
      <div style={{ padding: "16px 20px", borderBottom: "1px solid #2a2a2a" }}>
        <h3 style={{ fontSize: 13, fontWeight: 500, color: "#ffffff", margin: 0 }}>Upload History</h3>
      </div>
      {isLoading ? (
        <div style={{ padding: 32, textAlign: "center", color: "#444", fontSize: 13 }}>Loading history…</div>
      ) : imports.length === 0 ? (
        <div style={{ padding: 32, textAlign: "center", color: "#444", fontSize: 13 }}>No imports yet</div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #2a2a2a" }}>
                {["File", "Status", "Total", "Imported", "Skipped", "Errors", "Uploaded by", "Date"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "10px 16px", fontSize: 10, color: "#555", textTransform: "uppercase" as const, letterSpacing: "0.1em", fontWeight: 400 }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {imports.map((imp: any) => {
                const statusColor = imp.status === "COMPLETE"
                  ? { text: "#4ade80", bg: "rgba(34,197,94,0.1)", border: "rgba(34,197,94,0.2)" }
                  : imp.status === "FAILED"
                  ? { text: "#f87171", bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.2)" }
                  : { text: "#facc15", bg: "rgba(234,179,8,0.1)", border: "rgba(234,179,8,0.2)" };
                return (
                  <tr key={imp.id} style={{ borderBottom: "1px solid rgba(42,42,42,0.5)" }}>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <FileText size={12} color="#555" />
                        <span style={{ color: "#ffffff", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{imp.fileName}</span>
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 9999, color: statusColor.text, backgroundColor: statusColor.bg, border: `1px solid ${statusColor.border}` }}>
                        {imp.status}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", color: "#b0b0b0" }}>{imp.totalRows}</td>
                    <td style={{ padding: "12px 16px", color: "#4ade80" }}>{imp.validRows}</td>
                    <td style={{ padding: "12px 16px", color: "#facc15" }}>{imp.duplicateRows}</td>
                    <td style={{ padding: "12px 16px", color: imp.invalidRows > 0 ? "#f87171" : "#444" }}>{imp.invalidRows}</td>
                    <td style={{ padding: "12px 16px", color: "#666" }}>{imp.uploadedBy?.name ?? "—"}</td>
                    <td style={{ padding: "12px 16px", color: "#555", fontSize: 11 }}>{formatDate(imp.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

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

export default function ImportsPage() {
  const [lastResult, setLastResult] = useState<any>(null);
  const queryClient = useQueryClient();

  function handleResult(result: any) {
    setLastResult(result);
    queryClient.invalidateQueries({ queryKey: ["imports"] });
  }

  return (
    <div style={{ maxWidth: 900, fontFamily: ff }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: 26, fontWeight: 600, color: "#ffffff", margin: "0 0 4px" }}>CSV Import</h1>
          <p style={{ fontSize: 13, color: "#888", margin: 0 }}>Upload a patient list to trigger feedback emails</p>
        </div>
        <button onClick={downloadExampleCSV} style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "9px 16px", fontSize: 12, color: "#888",
          border: "1px solid #2a2a2a", borderRadius: 8,
          background: "transparent", cursor: "pointer", fontFamily: ff,
          transition: "all 0.15s",
        }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#C9A84C"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(201,168,76,0.4)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#888"; (e.currentTarget as HTMLElement).style.borderColor = "#2a2a2a"; }}
        >
          <Download size={13} /> Example CSV
        </button>
      </div>

      <div style={{ marginBottom: 20 }}><UploadZone onResult={handleResult} /></div>
      {lastResult && <div style={{ marginBottom: 20 }}><ImportResultCard result={lastResult} /></div>}
      <ImportHistory />

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

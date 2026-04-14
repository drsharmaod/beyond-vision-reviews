// src/lib/csv/validator.ts
import Papa from "papaparse";
import { isValid, parseISO, parse } from "date-fns";
import prisma from "@/lib/prisma";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface RawPatientRow {
  first_name?:        string;
  last_name?:         string;
  email?:             string;
  location?:          string;
  exam_date?:         string;
  patient_id?:        string;
  doctor_name?:       string;
  phone?:             string;
  appointment_type?:  string;
  [key: string]: string | undefined;
}

export interface ValidatedPatientRow {
  firstName:       string;
  lastName:        string;
  email:           string;
  locationCode:    string;
  examDate:        Date;
  patientId?:      string;
  doctorName?:     string;
  phone?:          string;
  appointmentType?: string;
}

export interface ValidationError {
  row:     number;
  field:   string;
  message: string;
}

export interface ParsedImportResult {
  valid:       ValidatedPatientRow[];
  invalid:     { row: number; data: RawPatientRow; errors: ValidationError[] }[];
  duplicates:  number;
  totalRows:   number;
}

// ── Validation ─────────────────────────────────────────────────────────────

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseExamDate(raw: string): Date | null {
  const formats = ["yyyy-MM-dd", "MM/dd/yyyy", "dd/MM/yyyy", "MMM dd yyyy", "MMMM dd yyyy"];
  // Try ISO first
  const iso = parseISO(raw);
  if (isValid(iso)) return iso;
  // Try common formats
  for (const fmt of formats) {
    try {
      const d = parse(raw, fmt, new Date());
      if (isValid(d)) return d;
    } catch {}
  }
  return null;
}

function normalizeHeader(header: string): string {
  return header.toLowerCase().trim().replace(/\s+/g, "_").replace(/-/g, "_");
}

export async function parseAndValidateCSV(
  csvContent: string,
  validLocationCodes: string[]
): Promise<ParsedImportResult> {
  const result = Papa.parse<RawPatientRow>(csvContent, {
    header:          true,
    skipEmptyLines:  true,
    transformHeader: normalizeHeader,
    transform:       (v) => v.trim(),
  });

  const valid:    ValidatedPatientRow[] = [];
  const invalid:  ParsedImportResult["invalid"] = [];
  const seenEmails = new Set<string>();
  let duplicates = 0;

  for (let i = 0; i < result.data.length; i++) {
    const row = result.data[i];
    const rowNum = i + 2; // +2 for header + 1-based
    const errors: ValidationError[] = [];

    // Required field checks
    const firstName = row.first_name ?? "";
    const lastName  = row.last_name  ?? "";
    const email     = (row.email ?? "").toLowerCase();
    const location  = (row.location ?? "").toLowerCase().replace(/\s+/g, "_");
    const examDateRaw = row.exam_date ?? "";

    if (!firstName && !lastName) {
      errors.push({ row: rowNum, field: "first_name/last_name", message: "At least one of first_name or last_name is required" });
    }

    if (!email) {
      errors.push({ row: rowNum, field: "email", message: "Email is required" });
    } else if (!EMAIL_REGEX.test(email)) {
      errors.push({ row: rowNum, field: "email", message: `Invalid email format: ${email}` });
    }

    if (!location) {
      errors.push({ row: rowNum, field: "location", message: "Location is required" });
    } else if (!validLocationCodes.includes(location)) {
      errors.push({
        row: rowNum,
        field: "location",
        message: `Unknown location: "${location}". Valid: ${validLocationCodes.join(", ")}`,
      });
    }

    if (!examDateRaw) {
      errors.push({ row: rowNum, field: "exam_date", message: "exam_date is required" });
    }

    let examDate: Date | null = null;
    if (examDateRaw) {
      examDate = parseExamDate(examDateRaw);
      if (!examDate) {
        errors.push({ row: rowNum, field: "exam_date", message: `Cannot parse date: "${examDateRaw}"` });
      }
    }

    if (errors.length > 0) {
      invalid.push({ row: rowNum, data: row, errors });
      continue;
    }

    // Duplicate detection within CSV
    const dedupeKey = `${email}:${location}`;
    if (seenEmails.has(dedupeKey)) {
      duplicates++;
      continue;
    }
    seenEmails.add(dedupeKey);

    valid.push({
      firstName:      firstName || lastName,
      lastName:       lastName  || "",
      email,
      locationCode:   location,
      examDate:       examDate!,
      patientId:      row.patient_id   || undefined,
      doctorName:     row.doctor_name  || undefined,
      phone:          row.phone        || undefined,
      appointmentType: row.appointment_type || undefined,
    });
  }

  return {
    valid,
    invalid,
    duplicates,
    totalRows: result.data.length,
  };
}

// ── Suppression check ─────────────────────────────────────────────────────────

export async function checkSuppressionWindow(
  email: string,
  locationCode: string,
  suppressionDays: number
): Promise<boolean> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - suppressionDays);

  const existing = await prisma.examVisit.findFirst({
    where: {
      patient: { email: email.toLowerCase() },
      location: { code: locationCode },
      createdAt: { gte: cutoff },
      sendStatus: { notIn: ["SUPPRESSED"] },
    },
    orderBy: { createdAt: "desc" },
  });

  return !!existing; // returns true if should be suppressed
}

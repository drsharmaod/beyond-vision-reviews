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
  firstName:        string;
  lastName:         string;
  email:            string;
  locationCode:     string;
  examDate:         Date;
  patientId?:       string;
  doctorName?:      string;
  phone?:           string;
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
  detectedFormat?: "standard" | "visual_eyes";
}

// ── Doctor name lookup (last name → full name) ────────────────────────────────

const DOCTOR_LAST_NAME_MAP: Record<string, string> = {
  "sharma":   "Dr. Suraj Sharma",
  "poon":     "Dr. Tom-Harley Poon",
  "bain":     "Dr. Colin Bain",
  "la":       "Dr. Maggie La",
  "ubhi":     "Dr. Mona Ubhi",
  "baba":     "Dr. Victoria Baba",
  "hans":     "Dr. Navneet Hans",
  "kohli":    "Dr. Rohan Kohli",
  "vo":       "Dr. Julia Vo",
  "lu":       "Dr. Johnny Lu",
};

// ── Location alias lookup ─────────────────────────────────────────────────────

const LOCATION_ALIAS_MAP: Record<string, string> = {
  "millwoods":   "millwoods",
  "mill_woods":  "millwoods",
  "millwood":    "millwoods",
  "crystallina": "crystallina",
  "crystal":     "crystallina",
  "grange":      "grange",
  "terwillegar": "terwillegar",
  "terwill":     "terwillegar",
  "leduc":       "leduc",
  "oxford":      "oxford",
  "therapy":     "therapy",
  "vision_therapy": "therapy",
};

// ── Visual Eyes filename parser ───────────────────────────────────────────────
// Format: DoctorLastnameLocation_Day_Mon_DD_of_YYYY.CSV
// e.g. BainMillwoods_Tuesday_Apr_07_of_2026.CSV

export interface VisualEyesFileMeta {
  doctorName:   string;
  locationCode: string;
  examDate:     Date;
}

export function parseVisualEyesFilename(filename: string): VisualEyesFileMeta | null {
  try {
    // Remove extension
    const base = filename.replace(/\.[^.]+$/, "");

    // Split on first underscore to get "DoctorLocation" and rest
    const firstUnderscore = base.indexOf("_");
    if (firstUnderscore === -1) return null;

    const doctorLocation = base.substring(0, firstUnderscore); // e.g. "BainMillwoods"
    const dateSection    = base.substring(firstUnderscore + 1); // e.g. "Tuesday_Apr_07_of_2026"

    // Extract location — match against known location names
    let doctorLastName = doctorLocation;
    let locationCode   = "";

    // Try to find location at end of doctorLocation string
    const sortedLocations = Object.keys(LOCATION_ALIAS_MAP).sort((a, b) => b.length - a.length);
    for (const loc of sortedLocations) {
      const locCapitalized = loc.charAt(0).toUpperCase() + loc.slice(1);
      if (doctorLocation.toLowerCase().endsWith(loc.toLowerCase())) {
        locationCode   = LOCATION_ALIAS_MAP[loc];
        doctorLastName = doctorLocation.slice(0, doctorLocation.length - loc.length);
        break;
      }
      // Try capitalized version
      if (doctorLocation.endsWith(locCapitalized)) {
        locationCode   = LOCATION_ALIAS_MAP[loc];
        doctorLastName = doctorLocation.slice(0, doctorLocation.length - locCapitalized.length);
        break;
      }
    }

    if (!locationCode || !doctorLastName) return null;

    // Parse doctor name from last name
    const doctorName = DOCTOR_LAST_NAME_MAP[doctorLastName.toLowerCase()] ?? `Dr. ${doctorLastName}`;

    // Parse date from "Tuesday_Apr_07_of_2026" → "Apr 07 2026"
    const dateParts = dateSection.split("_").filter(p => p !== "of" && !["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"].includes(p));
    const dateStr   = dateParts.join(" "); // "Apr 07 2026"
    const examDate  = parse(dateStr, "MMM dd yyyy", new Date());

    if (!isValid(examDate)) return null;

    return { doctorName, locationCode, examDate };
  } catch {
    return null;
  }
}

// ── Detect CSV format ─────────────────────────────────────────────────────────

export function detectCSVFormat(headers: string[]): "standard" | "visual_eyes" {
  const normalized = headers.map(h => h.toLowerCase().trim());
  if (normalized.includes("firstname") || normalized.includes("first name")) {
    return "visual_eyes";
  }
  return "standard";
}

// ── Date parsing ──────────────────────────────────────────────────────────────

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseExamDate(raw: string): Date | null {
  const formats = ["yyyy-MM-dd", "MM/dd/yyyy", "dd/MM/yyyy", "MMM dd yyyy", "MMMM dd yyyy"];
  const iso = parseISO(raw);
  if (isValid(iso)) return iso;
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

// ── Main CSV parser ───────────────────────────────────────────────────────────

export async function parseAndValidateCSV(
  csvContent: string,
  validLocationCodes: string[],
  filename?: string
): Promise<ParsedImportResult> {
  const result = Papa.parse<Record<string, string>>(csvContent, {
    header:          true,
    skipEmptyLines:  true,
    transformHeader: normalizeHeader,
    transform:       (v) => v.trim().replace(/^"|"$/g, ""), // strip surrounding quotes
  });

  const headers = Object.keys(result.data[0] ?? {});
  const format  = detectCSVFormat(headers);

  // Parse Visual Eyes filename metadata
  let veMeta: VisualEyesFileMeta | null = null;
  if (format === "visual_eyes" && filename) {
    veMeta = parseVisualEyesFilename(filename);
  }

  const valid:    ValidatedPatientRow[] = [];
  const invalid:  ParsedImportResult["invalid"] = [];
  const seenEmails = new Set<string>();
  let duplicates = 0;

  for (let i = 0; i < result.data.length; i++) {
    const row    = result.data[i];
    const rowNum = i + 2;
    const errors: ValidationError[] = [];
    // Skip completely empty rows (Visual Eyes exports trailing empty rows)
    const rowValues = Object.values(row).map(v => (v ?? "").trim());
    if (rowValues.every(v => v === "")) continue;

    // Skip rows with no email AND no name (fully empty Visual Eyes rows)
    const hasEmail = !!(row["email"] ?? "").trim();
    const hasName  = !!(row["firstname"] ?? row["first_name"] ?? "").trim();
    if (!hasEmail && !hasName) continue;

    // Debug — remove after testing
    console.log(`Row ${rowNum} email: "${row["email"]}" firstname: "${row["firstname"]}" format: ${format}`);

    let firstName: string;
    let lastName:  string;
    let email:     string;
    let locationCode: string;
    let examDate:  Date | null;
    let doctorName: string | undefined;
    let phone:     string | undefined;

    if (format === "visual_eyes") {
      // ── Visual Eyes format ─────────────────────────────────────────────────
      firstName = row["firstname"] ?? row["first_name"] ?? "";
      lastName  = row["lastname"]  ?? row["last_name"]  ?? "";
      email     = (row["email"] ?? "").toLowerCase();
      phone     = row["cellphone"] ?? row["first_phone"] ?? row["familyphone"] ?? "";

      // Location and doctor come from filename
      if (veMeta) {
        locationCode = veMeta.locationCode;
        examDate     = veMeta.examDate;
        doctorName   = veMeta.doctorName;
      } else {
        // Fallback if filename couldn't be parsed
        errors.push({ row: rowNum, field: "filename", message: "Could not parse location/date from filename" });
        locationCode = "";
        examDate     = null;
        doctorName   = undefined;
      }

      // Validate email
      if (!email) {
        errors.push({ row: rowNum, field: "email", message: "Email is required" });
      } else if (!EMAIL_REGEX.test(email)) {
        errors.push({ row: rowNum, field: "email", message: `Invalid email: ${email}` });
      }

      if (!firstName && !lastName) {
        errors.push({ row: rowNum, field: "name", message: "First or last name is required" });
      }

      if (!locationCode) {
        errors.push({ row: rowNum, field: "location", message: "Could not determine location from filename" });
      } else if (!validLocationCodes.includes(locationCode)) {
        errors.push({ row: rowNum, field: "location", message: `Unknown location: ${locationCode}` });
      }

      if (!examDate) {
        errors.push({ row: rowNum, field: "exam_date", message: "Could not parse exam date from filename" });
      }

    } else {
      // ── Standard format ────────────────────────────────────────────────────
      firstName = row["first_name"] ?? "";
      lastName  = row["last_name"]  ?? "";
      email     = (row["email"] ?? "").toLowerCase();
      phone     = row["phone"]      ?? undefined;
      doctorName = row["doctor_name"] || undefined;

      const locationRaw = (row["location"] ?? "").toLowerCase().replace(/\s+/g, "_");
      locationCode = LOCATION_ALIAS_MAP[locationRaw] ?? locationRaw;

      const examDateRaw = row["exam_date"] ?? "";
      examDate = examDateRaw ? parseExamDate(examDateRaw) : null;

      if (!firstName && !lastName) {
        errors.push({ row: rowNum, field: "first_name/last_name", message: "At least one name field is required" });
      }
      if (!email) {
        errors.push({ row: rowNum, field: "email", message: "Email is required" });
      } else if (!EMAIL_REGEX.test(email)) {
        errors.push({ row: rowNum, field: "email", message: `Invalid email format: ${email}` });
      }
      if (!locationCode) {
        errors.push({ row: rowNum, field: "location", message: "Location is required" });
      } else if (!validLocationCodes.includes(locationCode)) {
        errors.push({ row: rowNum, field: "location", message: `Unknown location: "${locationCode}"` });
      }
      if (!examDateRaw) {
        errors.push({ row: rowNum, field: "exam_date", message: "exam_date is required" });
      } else if (!examDate) {
        errors.push({ row: rowNum, field: "exam_date", message: `Cannot parse date: "${examDateRaw}"` });
      }
    }
if (errors.length > 0) {
  console.error(`Row ${rowNum} errors:`, JSON.stringify(errors));
  invalid.push({ row: rowNum, data: row as any, errors });
  continue;
}
    if (errors.length > 0) {
      invalid.push({ row: rowNum, data: row as any, errors });
      continue;
    }

    // Duplicate detection within CSV
    const dedupeKey = `${email}:${locationCode}`;
    if (seenEmails.has(dedupeKey)) {
      duplicates++;
      continue;
    }
    seenEmails.add(dedupeKey);

    valid.push({
      firstName:   firstName || lastName,
      lastName:    lastName  || "",
      email,
      locationCode,
      examDate:    examDate!,
      doctorName,
      phone:       phone || undefined,
    });
  }

  return {
    valid,
    invalid,
    duplicates,
    totalRows: result.data.length,
    detectedFormat: format,
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
      patient:  { email: email.toLowerCase() },
      location: { code: locationCode },
      createdAt: { gte: cutoff },
      sendStatus: { notIn: ["SUPPRESSED"] },
    },
    orderBy: { createdAt: "desc" },
  });

  return !!existing;
}

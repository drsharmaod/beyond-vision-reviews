// tests/unit/csv-validator.test.ts
import { parseAndValidateCSV } from "@/lib/csv/validator";

const VALID_LOCATIONS = ["millwoods", "crystallina", "grange", "terwillegar"];

describe("CSV Validator", () => {
  // ── Valid parsing ────────────────────────────────────────────────────────

  it("parses a fully valid CSV with all required fields", async () => {
    const csv = [
      "first_name,last_name,email,location,exam_date",
      "Sarah,Mitchell,sarah@example.com,millwoods,2024-03-15",
      "James,Okafor,james@example.com,crystallina,2024-03-15",
    ].join("\n");

    const result = await parseAndValidateCSV(csv, VALID_LOCATIONS);

    expect(result.valid).toHaveLength(2);
    expect(result.invalid).toHaveLength(0);
    expect(result.duplicates).toBe(0);
    expect(result.totalRows).toBe(2);
    expect(result.valid[0].firstName).toBe("Sarah");
    expect(result.valid[0].locationCode).toBe("millwoods");
    expect(result.valid[0].examDate).toBeInstanceOf(Date);
  });

  it("parses optional fields when present", async () => {
    const csv = [
      "first_name,last_name,email,location,exam_date,patient_id,doctor_name,phone,appointment_type",
      "Priya,Sharma,priya@example.com,grange,2024-03-14,P001,Dr. Lu,780-555-0100,Comprehensive",
    ].join("\n");

    const result = await parseAndValidateCSV(csv, VALID_LOCATIONS);

    expect(result.valid[0].patientId).toBe("P001");
    expect(result.valid[0].doctorName).toBe("Dr. Lu");
    expect(result.valid[0].phone).toBe("780-555-0100");
    expect(result.valid[0].appointmentType).toBe("Comprehensive");
  });

  // ── Email validation ─────────────────────────────────────────────────────

  it("rejects rows with missing email", async () => {
    const csv = [
      "first_name,last_name,email,location,exam_date",
      "John,Doe,,millwoods,2024-03-15",
    ].join("\n");

    const result = await parseAndValidateCSV(csv, VALID_LOCATIONS);

    expect(result.valid).toHaveLength(0);
    expect(result.invalid).toHaveLength(1);
    expect(result.invalid[0].errors[0].field).toBe("email");
  });

  it("rejects rows with malformed email", async () => {
    const csv = [
      "first_name,last_name,email,location,exam_date",
      "John,Doe,not-an-email,millwoods,2024-03-15",
    ].join("\n");

    const result = await parseAndValidateCSV(csv, VALID_LOCATIONS);

    expect(result.valid).toHaveLength(0);
    expect(result.invalid[0].errors[0].field).toBe("email");
  });

  it("normalizes email to lowercase", async () => {
    const csv = [
      "first_name,last_name,email,location,exam_date",
      "John,Doe,JOHN.DOE@EXAMPLE.COM,millwoods,2024-03-15",
    ].join("\n");

    const result = await parseAndValidateCSV(csv, VALID_LOCATIONS);
    expect(result.valid[0].email).toBe("john.doe@example.com");
  });

  // ── Location validation ──────────────────────────────────────────────────

  it("rejects rows with unknown location", async () => {
    const csv = [
      "first_name,last_name,email,location,exam_date",
      "John,Doe,john@example.com,downtown,2024-03-15",
    ].join("\n");

    const result = await parseAndValidateCSV(csv, VALID_LOCATIONS);

    expect(result.valid).toHaveLength(0);
    expect(result.invalid[0].errors[0].field).toBe("location");
    expect(result.invalid[0].errors[0].message).toContain("downtown");
  });

  it("rejects rows with missing location", async () => {
    const csv = [
      "first_name,last_name,email,location,exam_date",
      "John,Doe,john@example.com,,2024-03-15",
    ].join("\n");

    const result = await parseAndValidateCSV(csv, VALID_LOCATIONS);
    expect(result.invalid[0].errors.some((e) => e.field === "location")).toBe(true);
  });

  // ── Name validation ──────────────────────────────────────────────────────

  it("rejects rows where both first_name and last_name are blank", async () => {
    const csv = [
      "first_name,last_name,email,location,exam_date",
      ",,john@example.com,millwoods,2024-03-15",
    ].join("\n");

    const result = await parseAndValidateCSV(csv, VALID_LOCATIONS);
    expect(result.invalid).toHaveLength(1);
  });

  it("accepts rows where only first_name is provided", async () => {
    const csv = [
      "first_name,last_name,email,location,exam_date",
      "Jane,,jane@example.com,millwoods,2024-03-15",
    ].join("\n");

    const result = await parseAndValidateCSV(csv, VALID_LOCATIONS);
    expect(result.valid).toHaveLength(1);
  });

  // ── Date parsing ─────────────────────────────────────────────────────────

  it("parses ISO date format", async () => {
    const csv = [
      "first_name,last_name,email,location,exam_date",
      "Jane,Doe,jane@example.com,millwoods,2024-03-15",
    ].join("\n");

    const result = await parseAndValidateCSV(csv, VALID_LOCATIONS);
    expect(result.valid[0].examDate.getFullYear()).toBe(2024);
  });

  it("parses MM/DD/YYYY date format", async () => {
    const csv = [
      "first_name,last_name,email,location,exam_date",
      "Jane,Doe,jane@example.com,millwoods,03/15/2024",
    ].join("\n");

    const result = await parseAndValidateCSV(csv, VALID_LOCATIONS);
    expect(result.valid).toHaveLength(1);
  });

  it("rejects rows with unparseable dates", async () => {
    const csv = [
      "first_name,last_name,email,location,exam_date",
      "Jane,Doe,jane@example.com,millwoods,not-a-date",
    ].join("\n");

    const result = await parseAndValidateCSV(csv, VALID_LOCATIONS);
    expect(result.invalid[0].errors.some((e) => e.field === "exam_date")).toBe(true);
  });

  // ── Duplicate detection ──────────────────────────────────────────────────

  it("deduplicates rows with same email + location within the CSV", async () => {
    const csv = [
      "first_name,last_name,email,location,exam_date",
      "Jane,Doe,jane@example.com,millwoods,2024-03-15",
      "Jane,Doe,jane@example.com,millwoods,2024-03-15",
    ].join("\n");

    const result = await parseAndValidateCSV(csv, VALID_LOCATIONS);

    expect(result.valid).toHaveLength(1);
    expect(result.duplicates).toBe(1);
  });

  it("does NOT deduplicate same email at different locations", async () => {
    const csv = [
      "first_name,last_name,email,location,exam_date",
      "Jane,Doe,jane@example.com,millwoods,2024-03-15",
      "Jane,Doe,jane@example.com,crystallina,2024-03-15",
    ].join("\n");

    const result = await parseAndValidateCSV(csv, VALID_LOCATIONS);
    expect(result.valid).toHaveLength(2);
    expect(result.duplicates).toBe(0);
  });

  // ── Header normalization ─────────────────────────────────────────────────

  it("handles headers with extra whitespace", async () => {
    const csv = [
      " first_name , last_name , email , location , exam_date ",
      "Jane,Doe,jane@example.com,millwoods,2024-03-15",
    ].join("\n");

    const result = await parseAndValidateCSV(csv, VALID_LOCATIONS);
    expect(result.valid).toHaveLength(1);
  });

  it("skips empty rows", async () => {
    const csv = [
      "first_name,last_name,email,location,exam_date",
      "Jane,Doe,jane@example.com,millwoods,2024-03-15",
      "",
      "",
    ].join("\n");

    const result = await parseAndValidateCSV(csv, VALID_LOCATIONS);
    expect(result.valid).toHaveLength(1);
  });

  // ── Mixed valid and invalid ──────────────────────────────────────────────

  it("correctly counts valid and invalid in a mixed CSV", async () => {
    const csv = [
      "first_name,last_name,email,location,exam_date",
      "Sarah,Mitchell,sarah@example.com,millwoods,2024-03-15",  // valid
      "James,Okafor,not-email,crystallina,2024-03-15",          // invalid email
      "Priya,Sharma,priya@example.com,downtown,2024-03-14",     // invalid location
      "Mike,Chen,mike@example.com,terwillegar,2024-03-14",      // valid
    ].join("\n");

    const result = await parseAndValidateCSV(csv, VALID_LOCATIONS);

    expect(result.totalRows).toBe(4);
    expect(result.valid).toHaveLength(2);
    expect(result.invalid).toHaveLength(2);
  });
});

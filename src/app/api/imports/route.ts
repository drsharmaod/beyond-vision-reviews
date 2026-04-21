// src/app/api/imports/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { parseAndValidateCSV, checkSuppressionWindow } from "@/lib/csv/validator";
import { sendEmail, interpolateTemplate } from "@/lib/email/sender";
import { signFeedbackToken, buildRatingUrls } from "@/lib/tokens";
import { addDays, format } from "date-fns";

// GET /api/imports — list all imports
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page  = parseInt(searchParams.get("page")  ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "20");
  const skip  = (page - 1) * limit;

  const [imports, total] = await Promise.all([
    prisma.patientImport.findMany({
      skip, take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        uploadedBy: { select: { name: true, email: true } },
        _count: { select: { examVisits: true } },
      },
    }),
    prisma.patientImport.count(),
  ]);

  return NextResponse.json({
    success: true,
    data: { imports, pagination: { page, limit, total, pages: Math.ceil(total / limit) } },
  });
}

// POST /api/imports — upload and process CSV
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  if ((session.user as any).role === "STAFF") {
    return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 });
  }

  let importRecord: any;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });

    const maxSizeMB = parseInt(process.env.MAX_FILE_SIZE_MB ?? "10");
    if (file.size > maxSizeMB * 1024 * 1024) {
      return NextResponse.json({ success: false, error: `File exceeds ${maxSizeMB}MB limit` }, { status: 400 });
    }
    if (!file.name.endsWith(".csv")) {
      return NextResponse.json({ success: false, error: "Only CSV files are accepted" }, { status: 400 });
    }

    importRecord = await prisma.patientImport.create({
      data: {
        uploadedByUserId: (session.user as any).id,
        fileName: file.name,
        fileSize: file.size,
        status: "PROCESSING",
      },
    });

    const csvContent = await file.text();
    const locations  = await prisma.location.findMany({ where: { isActive: true } });
    const locationMap = new Map(locations.map((l) => [l.code, l]));
    const validCodes  = locations.map((l) => l.code);

    // Detect Visual Eyes format by checking for FIRSTNAME column
    const firstLine = csvContent.split("\n")[0].toLowerCase();
    const isVisualEyes = firstLine.includes("firstname") || firstLine.includes("first name");
    console.log(`CSV format detection: isVisualEyes=${isVisualEyes}, firstLine=${firstLine.substring(0, 50)}`);

    const parsed      = await parseAndValidateCSV(csvContent, validCodes, file.name);
    console.log(`Parsed: total=${parsed.totalRows} valid=${parsed.valid.length} invalid=${parsed.invalid.length} format=${parsed.detectedFormat}`);
    if (parsed.invalid.length > 0) {
      console.log(`First invalid row errors:`, JSON.stringify(parsed.invalid[0]?.errors));
    }

    const settings        = await prisma.systemSettings.findFirst();
    const suppressionDays = settings?.duplicateSuppressionDays ?? 90;
    // sendDelayDays removed
    const immediate       = true; // always send immediately
    const senderEmail     = settings?.defaultSenderEmail ?? process.env.EMAIL_FROM ?? "feedback@beyondvision.ca";
    const senderName      = settings?.defaultSenderName  ?? process.env.EMAIL_FROM_NAME ?? "Beyond Vision Optometry";
    const appUrl          = process.env.NEXT_PUBLIC_APP_URL ?? "https://beyond-vision-reviews.vercel.app";

    let suppressed = 0;
    let created    = 0;
    let queued     = 0;

    for (const row of parsed.valid) {
      const location = locationMap.get(row.locationCode);
      if (!location) continue;

      const isSuppressed = await checkSuppressionWindow(row.email, row.locationCode, suppressionDays);
      if (isSuppressed) { suppressed++; continue; }

      // Upsert patient
      const patient = await prisma.patient.upsert({
        where: { email_locationId: { email: row.email, locationId: location.id } },
        update: { firstName: row.firstName, lastName: row.lastName, phone: row.phone },
        create: {
          externalPatientId: (row as any).patientId,
          firstName:  row.firstName,
          lastName:   row.lastName,
          email:      row.email,
          phone:      row.phone,
          locationId: location.id,
        },
      });

      const scheduledAt  = immediate ? new Date() : addDays(row.examDate, 1);
      const shouldSendNow = immediate || scheduledAt <= new Date();

      // Create exam visit
      const visit = await prisma.examVisit.create({
        data: {
          patientId:       patient.id,
          locationId:      location.id,
          examDate:        row.examDate,
          doctorName:      (row as any).doctorName,
          appointmentType: (row as any).appointmentType,
          importId:        importRecord.id,
          sendStatus:      shouldSendNow ? "SENT" : "SCHEDULED",
          scheduledSendAt: scheduledAt,
          sentAt:          shouldSendNow ? new Date() : undefined,
        },
      });

      created++;

      if (shouldSendNow) {
        try {
          // Step 1: Create FeedbackRequest with a placeholder token first
          const placeholderToken = "placeholder";
          const feedbackRequest = await prisma.feedbackRequest.create({
            data: {
              examVisitId:  visit.id,
              locationId:   location.id,
              emailTo:      patient.email,
              emailFrom:    senderEmail,
              subject:      `How was your visit at ${location.name}?`,
              token:        placeholderToken + "-" + visit.id, // temp unique token
              sendStatus:   "PENDING",
            },
          });

          // Step 2: Now sign the token with the REAL feedbackRequestId
          const token = signFeedbackToken({
            feedbackRequestId: feedbackRequest.id,
            examVisitId:       visit.id,
            patientEmail:      patient.email,
            locationCode:      location.code,
          });

          // Step 3: Update FeedbackRequest with the real token
          await prisma.feedbackRequest.update({
            where: { id: feedbackRequest.id },
            data:  { token },
          });

          // Step 4: Build rating URLs with the real token — must use /api/r/ path
          const ratingUrls: Record<string, string> = {};
          for (let star = 1; star <= 5; star++) {
            ratingUrls[`rating_${star}_url`] = `${appUrl}/api/r/${token}/${star}`;
          }
          ratingUrls["doctor_name"] = (row as any).doctorName ?? "The Beyond Vision Team";

          // Step 5: Send email via Resend — build vars inline for full control
          const template = await prisma.emailTemplate.findFirst({
            where: { templateType: "FEEDBACK_REQUEST", isActive: true },
          });

          let result = { success: false, messageId: undefined as string | undefined, error: "No template" };

          if (template) {
            const vars: Record<string, string> = {
              first_name:    patient.firstName,
              location_name: location.name,
              exam_date:     format(row.examDate, "MMMM d, yyyy"),
              patient_email: patient.email,
              doctor_name:   (row as any).doctorName ?? "The Beyond Vision Team",
              ...ratingUrls,
            };

            const subject = interpolateTemplate(template.subject, vars);
            const html    = interpolateTemplate(template.htmlBody, vars);
            const text    = interpolateTemplate(template.textBody, vars);

            result = await sendEmail({
              to:       patient.email,
              from:     senderEmail,
              fromName: senderName,
              subject,
              html,
              text,
              tags: [{ name: "type", value: "feedback_request" }],
            });
          }

          // Step 6: Update send status
          await prisma.feedbackRequest.update({
            where: { id: feedbackRequest.id },
            data: {
              sendStatus:        result.success ? "SENT" : "FAILED",
              providerMessageId: result.messageId,
              sentAt:            result.success ? new Date() : undefined,
            } as any,
          });

          if (result.success) queued++;
          else console.error("Email failed:", result.error);

        } catch (emailErr: any) {
          console.error("Email send error:", emailErr.message);
        }
      }
    }

    const duplicatesTotal = parsed.duplicates + suppressed;
    await prisma.patientImport.update({
      where: { id: importRecord.id },
      data: {
        status:        "COMPLETE",
        totalRows:     parsed.totalRows,
        validRows:     created,
        invalidRows:   parsed.invalid.length,
        duplicateRows: duplicatesTotal,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: (session.user as any).id,
        eventType:   "IMPORT_CREATED",
        entityType:  "PatientImport",
        entityId:    importRecord.id,
        metadata: {
          fileName:      file.name,
          totalRows:     parsed.totalRows,
          validRows:     created,
          invalidRows:   parsed.invalid.length,
          duplicateRows: duplicatesTotal,
          queued,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        importId:      importRecord.id,
        fileName:      file.name,
        totalRows:     parsed.totalRows,
        validRows:     created,
        invalidRows:   parsed.invalid.length,
        duplicateRows: duplicatesTotal,
        queued,
        errors:        parsed.invalid.flatMap((r) => r.errors),
      },
    });

  } catch (err: any) {
    if (importRecord) {
      await prisma.patientImport.update({
        where: { id: importRecord.id },
        data:  { status: "FAILED", errorMessage: err.message },
      }).catch(() => {});
    }
    console.error("Import error:", err);
    return NextResponse.json({ success: false, error: err.message ?? "Import failed" }, { status: 500 });
  }
}

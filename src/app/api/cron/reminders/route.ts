// src/app/api/cron/reminders/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendEmail, interpolateTemplate } from "@/lib/email/sender";
import { format, subDays } from "date-fns";

const DOCTOR_PHOTOS: Record<string, string> = {
  "dr. suraj sharma":    "https://beyond-vision-reviews.vercel.app/api/doctor-photo?url=https://beyondvision.ca/wp-content/uploads/2018/06/sonu-sharma.jpg",
  "dr. s. sharma":       "https://beyond-vision-reviews.vercel.app/api/doctor-photo?url=https://beyondvision.ca/wp-content/uploads/2018/06/sonu-sharma.jpg",
  "dr. tom-harley poon": "https://beyond-vision-reviews.vercel.app/api/doctor-photo?url=https://beyondvision.ca/wp-content/uploads/2018/06/TH-Poon.jpg",
  "dr. th poon":         "https://beyond-vision-reviews.vercel.app/api/doctor-photo?url=https://beyondvision.ca/wp-content/uploads/2018/06/TH-Poon.jpg",
  "dr. colin bain":      "https://beyond-vision-reviews.vercel.app/api/doctor-photo?url=https://beyondvision.ca/wp-content/uploads/2018/06/colin-bain.jpg",
  "dr. maggie la":       "https://beyond-vision-reviews.vercel.app/api/doctor-photo?url=https://beyondvision.ca/wp-content/uploads/2019/07/maggie-la.jpg",
  "dr. mona ubhi":       "https://beyond-vision-reviews.vercel.app/api/doctor-photo?url=https://beyondvision.ca/wp-content/uploads/2022/05/Dr.-Mona-Ubhi.jpg",
  "dr. victoria baba":   "https://beyond-vision-reviews.vercel.app/api/doctor-photo?url=https://beyondvision.ca/wp-content/uploads/2022/03/Dr-Victoria-Baba.jpg",
  "dr. navneet hans":    "https://beyond-vision-reviews.vercel.app/api/doctor-photo?url=https://beyondvision.ca/wp-content/uploads/2023/03/navneet-hans.jpg",
  "dr. randy poon":      "https://beyond-vision-reviews.vercel.app/api/doctor-photo?url=https://beyondvision.ca/wp-content/uploads/2025/06/Randy_Poon.jpg",
  "dr. rohan kohli":     "https://beyond-vision-reviews.vercel.app/api/doctor-photo?url=https://beyondvision.ca/wp-content/uploads/2023/09/rohan_kohli.jpg",
  "dr. julia vo":        "https://beyond-vision-reviews.vercel.app/api/doctor-photo?url=https://beyondvision.ca/wp-content/uploads/2025/05/dr_vo.jpg",
  "dr. johnny lu":       "https://beyond-vision-reviews.vercel.app/api/doctor-photo?url=https://beyondvision.ca/wp-content/uploads/2026/03/dr_lu.jpg",
  "dr. lu":              "https://beyond-vision-reviews.vercel.app/api/doctor-photo?url=https://beyondvision.ca/wp-content/uploads/2026/03/dr_lu.jpg",
};

export async function GET(req: NextRequest) {
  // Verify this is called by Vercel cron or with the secret
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now        = new Date();
    const threeDaysAgo = subDays(now, 3);
    const fourDaysAgo  = subDays(now, 4);

    // Find feedback requests sent 3 days ago with no response and no reminder sent yet
    const pendingReminders = await prisma.feedbackRequest.findMany({
      where: {
        createdAt: {
          gte: fourDaysAgo,
          lte: threeDaysAgo,
        },
        sendStatus: "SENT",
        reminderSentAt: null,
        feedbackResponse: null,
      },
      include: {
        examVisit: {
          include: {
            patient:  true,
            location: true,
          },
        },
      },
    });

    const template = await prisma.emailTemplate.findFirst({
      where: { templateType: "REMINDER", isActive: true },
    });

    if (!template) {
      return NextResponse.json({ success: false, error: "Reminder template not found" });
    }

    const settings   = await prisma.systemSettings.findFirst();
    const senderEmail = settings?.defaultSenderEmail ?? "feedback@beyondvision.ca";
    const senderName  = settings?.defaultSenderName  ?? "Beyond Vision Optometrists";
    const appUrl      = process.env.NEXT_PUBLIC_APP_URL ?? "https://beyond-vision-reviews.vercel.app";

    let sent   = 0;
    let failed = 0;

    for (const fr of pendingReminders) {
      try {
        const patient  = fr.examVisit.patient;
        const location = fr.examVisit.location;
        const doctorName  = fr.examVisit.doctorName ?? "The Beyond Vision Team";
        const doctorPhoto = DOCTOR_PHOTOS[doctorName.toLowerCase()] ?? "";

        // Build rating URLs from existing token
        const ratingUrls: Record<string, string> = {};
        for (let star = 1; star <= 5; star++) {
          ratingUrls[`rating_${star}_url`] = `${appUrl}/api/r/${fr.token}/${star}`;
        }

        const vars: Record<string, string> = {
          first_name:    patient.firstName,
          location_name: location.name,
          doctor_name:   doctorName,
          doctor_photo:  doctorPhoto,
          ...ratingUrls,
        };

        const result = await sendEmail({
          to:       patient.email,
          from:     senderEmail,
          fromName: senderName,
          subject:  interpolateTemplate(template.subject, vars),
          html:     interpolateTemplate(template.htmlBody, vars),
          text:     interpolateTemplate(template.textBody, vars),
          tags:     [{ name: "type", value: "reminder" }],
        });

        if (result.success) {
          await prisma.feedbackRequest.update({
            where: { id: fr.id },
            data:  { reminderSentAt: now } as any,
          });
          sent++;
        } else {
          failed++;
        }
      } catch (err: any) {
        console.error(`Reminder failed for ${fr.emailTo}:`, err.message);
        failed++;
      }
    }

    await prisma.auditLog.create({
      data: {
        eventType:  "REMINDERS_SENT",
        entityType: "FeedbackRequest",
        entityId:   "cron",
        metadata:   { sent, failed, total: pendingReminders.length, runAt: now.toISOString() },
      },
    });

    return NextResponse.json({ success: true, data: { sent, failed, total: pendingReminders.length } });

  } catch (err: any) {
    console.error("Reminder cron error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

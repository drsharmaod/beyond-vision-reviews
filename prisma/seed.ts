// prisma/seed.ts
import { PrismaClient, UserRole, TemplateType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Beyond Vision Review Management System...");

  // ── System Settings ────────────────────────────────────────────────────────
  const settings = await prisma.systemSettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      defaultSenderEmail: "feedback@beyondvision.ca",
      defaultSenderName: "Beyond Vision Optometry",
      duplicateSuppressionDays: 90,
      sendDelayDays: 1,
      immediateSendEnabled: false,
      brandingPrimaryColor: "#C9A84C",
      feedbackPageTitle: "How was your experience?",
    },
  });
  console.log("✅ System settings created");

  // ── Locations ──────────────────────────────────────────────────────────────
  const locationData = [
    {
      name: "Beyond Vision Millwoods",
      code: "millwoods",
      reviewLink: "https://g.page/r/beyond-vision-millwoods/review",
      managerEmail: "manager.millwoods@beyondvision.ca",
      managerName: "Millwoods Clinic Manager",
      alertEmails: ["manager.millwoods@beyondvision.ca", "sonu@beyondvision.ca"],
    },
    {
      name: "Beyond Vision Crystallina",
      code: "crystallina",
      reviewLink: "https://g.page/r/beyond-vision-crystallina/review",
      managerEmail: "manager.crystallina@beyondvision.ca",
      managerName: "Crystallina Clinic Manager",
      alertEmails: ["manager.crystallina@beyondvision.ca", "sonu@beyondvision.ca"],
    },
    {
      name: "Beyond Vision Grange",
      code: "grange",
      reviewLink: "https://g.page/r/beyond-vision-grange/review",
      managerEmail: "manager.grange@beyondvision.ca",
      managerName: "Grange Clinic Manager",
      alertEmails: ["manager.grange@beyondvision.ca", "sonu@beyondvision.ca"],
    },
    {
      name: "Beyond Vision Terwillegar",
      code: "terwillegar",
      reviewLink: "https://g.page/r/beyond-vision-terwillegar/review",
      managerEmail: "manager.terwillegar@beyondvision.ca",
      managerName: "Terwillegar Clinic Manager",
      alertEmails: ["manager.terwillegar@beyondvision.ca", "sonu@beyondvision.ca"],
    },
  ];

  const locations: Record<string, any> = {};
  for (const loc of locationData) {
    const location = await prisma.location.upsert({
      where: { code: loc.code },
      update: loc,
      create: loc,
    });
    locations[loc.code] = location;
    console.log(`✅ Location: ${location.name}`);
  }

  // ── Admin User ─────────────────────────────────────────────────────────────
  const adminPassword = await bcrypt.hash("BeyondVision2024!", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@beyondvision.ca" },
    update: {},
    create: {
      name: "Sonu Sharma",
      email: "admin@beyondvision.ca",
      password: adminPassword,
      role: UserRole.ADMIN,
    },
  });
  console.log(`✅ Admin user: ${admin.email}`);

  // ── Location Manager Users ─────────────────────────────────────────────────
  const managerPassword = await bcrypt.hash("Manager2024!", 12);
  for (const [code, loc] of Object.entries(locations)) {
    await prisma.user.upsert({
      where: { email: `manager.${code}@beyondvision.ca` },
      update: {},
      create: {
        name: `${loc.name} Manager`,
        email: `manager.${code}@beyondvision.ca`,
        password: managerPassword,
        role: UserRole.LOCATION_MANAGER,
        locationId: loc.id,
      },
    });
    console.log(`✅ Manager user for ${loc.name}`);
  }

  // ── Email Templates ────────────────────────────────────────────────────────
  const templates = [
    {
      templateType: TemplateType.FEEDBACK_REQUEST,
      name: "Patient Feedback Request",
      subject: "How was your visit to {{location_name}}? (1 min)",
      htmlBody: getFeedbackRequestTemplate(),
      textBody: getFeedbackRequestTextTemplate(),
    },
    {
      templateType: TemplateType.POSITIVE_FOLLOWUP,
      name: "Positive Feedback Follow-up",
      subject: "Thank you, {{first_name}} — Would you mind sharing your experience?",
      htmlBody: getPositiveFollowupTemplate(),
      textBody: getPositiveFollowupTextTemplate(),
    },
    {
      templateType: TemplateType.NEGATIVE_ALERT,
      name: "Internal Negative Feedback Alert",
      subject: "⚠️ Patient Feedback Alert — {{location_name}} ({{rating}}/5 stars)",
      htmlBody: getNegativeAlertTemplate(),
      textBody: getNegativeAlertTextTemplate(),
    },
  ];

  for (const template of templates) {
    await prisma.emailTemplate.upsert({
      where: { templateType: template.templateType },
      update: template,
      create: template,
    });
    console.log(`✅ Email template: ${template.name}`);
  }

  console.log("\n🎉 Seed complete!");
  console.log("\n📋 Login credentials:");
  console.log("   Admin:   admin@beyondvision.ca / BeyondVision2024!");
  console.log("   Manager: manager.millwoods@beyondvision.ca / Manager2024!");
}

// ── Email Template HTML ────────────────────────────────────────────────────

function getFeedbackRequestTemplate(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>How was your visit?</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:'Georgia',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1a1a1a 0%,#2a2a2a 100%);padding:40px 48px 32px;border-radius:16px 16px 0 0;border-bottom:2px solid #C9A84C;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <div style="font-family:'Georgia',serif;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:2px;text-transform:uppercase;">BEYOND VISION</div>
                    <div style="font-size:11px;color:#C9A84C;letter-spacing:4px;text-transform:uppercase;margin-top:4px;">OPTOMETRY</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="background-color:#141414;padding:48px;">
              <p style="font-family:'Georgia',serif;font-size:28px;color:#ffffff;margin:0 0 8px 0;line-height:1.3;">Hello, {{first_name}}.</p>
              <p style="font-size:14px;color:#C9A84C;letter-spacing:2px;text-transform:uppercase;margin:0 0 32px 0;">Thank you for visiting {{location_name}}</p>
              <p style="font-size:16px;color:#b0b0b0;line-height:1.8;margin:0 0 32px 0;">
                Your eye health is our priority. We'd love to hear about your experience at your recent exam on <strong style="color:#ffffff;">{{exam_date}}</strong>.
              </p>
              <p style="font-size:16px;color:#ffffff;font-weight:600;margin:0 0 24px 0;">How would you rate your visit?</p>
              <!-- Star Rating -->
              <table cellpadding="0" cellspacing="0" style="margin:0 auto 40px auto;">
                <tr>
                  <td style="padding:0 8px;">
                    <a href="{{rating_1_url}}" style="display:block;width:56px;height:56px;background:#1e1e1e;border:2px solid #333;border-radius:12px;text-align:center;line-height:56px;font-size:28px;text-decoration:none;">⭐</a>
                    <p style="text-align:center;font-size:10px;color:#666;margin:4px 0 0;letter-spacing:1px;">1</p>
                  </td>
                  <td style="padding:0 8px;">
                    <a href="{{rating_2_url}}" style="display:block;width:56px;height:56px;background:#1e1e1e;border:2px solid #333;border-radius:12px;text-align:center;line-height:56px;font-size:28px;text-decoration:none;">⭐</a>
                    <p style="text-align:center;font-size:10px;color:#666;margin:4px 0 0;letter-spacing:1px;">2</p>
                  </td>
                  <td style="padding:0 8px;">
                    <a href="{{rating_3_url}}" style="display:block;width:56px;height:56px;background:#1e1e1e;border:2px solid #333;border-radius:12px;text-align:center;line-height:56px;font-size:28px;text-decoration:none;">⭐</a>
                    <p style="text-align:center;font-size:10px;color:#666;margin:4px 0 0;letter-spacing:1px;">3</p>
                  </td>
                  <td style="padding:0 8px;">
                    <a href="{{rating_4_url}}" style="display:block;width:56px;height:56px;background:linear-gradient(135deg,#C9A84C,#a8862e);border:2px solid #C9A84C;border-radius:12px;text-align:center;line-height:56px;font-size:28px;text-decoration:none;">⭐</a>
                    <p style="text-align:center;font-size:10px;color:#C9A84C;margin:4px 0 0;letter-spacing:1px;">4</p>
                  </td>
                  <td style="padding:0 8px;">
                    <a href="{{rating_5_url}}" style="display:block;width:56px;height:56px;background:linear-gradient(135deg,#C9A84C,#a8862e);border:2px solid #C9A84C;border-radius:12px;text-align:center;line-height:56px;font-size:28px;text-decoration:none;">⭐</a>
                    <p style="text-align:center;font-size:10px;color:#C9A84C;margin:4px 0 0;letter-spacing:1px;">5</p>
                  </td>
                </tr>
              </table>
              <p style="font-size:13px;color:#555;text-align:center;margin:0;">1 = Poor &nbsp;·&nbsp; 5 = Exceptional</p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#0f0f0f;padding:24px 48px;border-radius:0 0 16px 16px;border-top:1px solid #222;">
              <p style="font-size:12px;color:#444;margin:0;text-align:center;">
                This feedback request was sent to {{patient_email}} following your visit to {{location_name}}.<br>
                If you did not visit us recently, please disregard this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function getFeedbackRequestTextTemplate(): string {
  return `Hello {{first_name}},

Thank you for visiting {{location_name}} on {{exam_date}}.

We'd love to hear about your experience. Please rate your visit:

1 Star: {{rating_1_url}}
2 Stars: {{rating_2_url}}
3 Stars: {{rating_3_url}}
4 Stars: {{rating_4_url}}
5 Stars: {{rating_5_url}}

Thank you,
The Beyond Vision Team`;
}

function getPositiveFollowupTemplate(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Thank you!</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:'Georgia',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <tr>
            <td style="background:linear-gradient(135deg,#1a1a1a,#2a2a2a);padding:40px 48px 32px;border-radius:16px 16px 0 0;border-bottom:2px solid #C9A84C;">
              <div style="font-family:'Georgia',serif;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:2px;text-transform:uppercase;">BEYOND VISION</div>
              <div style="font-size:11px;color:#C9A84C;letter-spacing:4px;text-transform:uppercase;margin-top:4px;">OPTOMETRY</div>
            </td>
          </tr>
          <tr>
            <td style="background-color:#141414;padding:48px;text-align:center;">
              <div style="font-size:64px;margin-bottom:24px;">🌟</div>
              <p style="font-family:'Georgia',serif;font-size:28px;color:#ffffff;margin:0 0 8px 0;">Thank you, {{first_name}}!</p>
              <p style="font-size:14px;color:#C9A84C;letter-spacing:2px;text-transform:uppercase;margin:0 0 32px 0;">{{rating}} out of 5 stars</p>
              <p style="font-size:16px;color:#b0b0b0;line-height:1.8;margin:0 0 40px 0;">
                We're delighted to hear you had a great experience at <strong style="color:#ffffff;">{{location_name}}</strong>. Your kind rating means everything to our team.
              </p>
              <p style="font-size:16px;color:#ffffff;margin:0 0 24px 0;">Would you mind sharing your experience on Google?</p>
              <p style="font-size:14px;color:#888;margin:0 0 32px 0;">It only takes 60 seconds and helps others in Edmonton find quality eye care.</p>
              <a href="{{review_link}}" style="display:inline-block;background:linear-gradient(135deg,#C9A84C,#a8862e);color:#000000;text-decoration:none;padding:18px 40px;border-radius:8px;font-size:16px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">
                Leave a Google Review →
              </a>
              {{#if comment}}
              <div style="margin-top:40px;padding:24px;background:#1a1a1a;border-radius:12px;border-left:3px solid #C9A84C;text-align:left;">
                <p style="font-size:12px;color:#C9A84C;letter-spacing:2px;text-transform:uppercase;margin:0 0 8px 0;">Your feedback</p>
                <p style="font-size:15px;color:#b0b0b0;margin:0;line-height:1.7;font-style:italic;">"{{comment}}"</p>
              </div>
              {{/if}}
            </td>
          </tr>
          <tr>
            <td style="background-color:#0f0f0f;padding:24px 48px;border-radius:0 0 16px 16px;border-top:1px solid #222;">
              <p style="font-size:12px;color:#444;margin:0;text-align:center;">
                Beyond Vision Optometry · Edmonton, Alberta<br>
                beyondvision.ca
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function getPositiveFollowupTextTemplate(): string {
  return `Thank you, {{first_name}}!

You rated your recent visit to {{location_name}} {{rating}} out of 5 stars. We're so glad to hear it!

Would you mind leaving a Google review? It only takes 60 seconds:
{{review_link}}

Thank you,
The Beyond Vision Team`;
}

function getNegativeAlertTemplate(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Patient Feedback Alert</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <tr>
            <td style="background:linear-gradient(135deg,#1a1a1a,#2a2a2a);padding:32px 48px;border-radius:16px 16px 0 0;border-bottom:2px solid #e53e3e;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <div style="font-size:11px;color:#e53e3e;letter-spacing:4px;text-transform:uppercase;margin-bottom:6px;">⚠️ INTERNAL ALERT</div>
                    <div style="font-family:'Georgia',serif;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:2px;text-transform:uppercase;">BEYOND VISION</div>
                  </td>
                  <td align="right">
                    <div style="background:#e53e3e;color:#fff;font-size:28px;font-weight:700;padding:12px 20px;border-radius:8px;display:inline-block;">{{rating}}/5</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color:#141414;padding:40px 48px;">
              <p style="font-size:18px;color:#ffffff;font-weight:600;margin:0 0 8px 0;">Patient Feedback Requires Attention</p>
              <p style="font-size:14px;color:#888;margin:0 0 32px 0;">A patient at {{location_name}} submitted a low rating. Please review and follow up.</p>

              <!-- Patient Details -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#1a1a1a;border-radius:12px;overflow:hidden;margin-bottom:24px;">
                <tr><td colspan="2" style="padding:16px 20px;border-bottom:1px solid #2a2a2a;"><span style="font-size:11px;color:#e53e3e;letter-spacing:2px;text-transform:uppercase;">Patient Information</span></td></tr>
                <tr>
                  <td style="padding:12px 20px;font-size:13px;color:#888;width:40%;border-bottom:1px solid #222;">Full Name</td>
                  <td style="padding:12px 20px;font-size:13px;color:#ffffff;border-bottom:1px solid #222;"><strong>{{first_name}} {{last_name}}</strong></td>
                </tr>
                <tr>
                  <td style="padding:12px 20px;font-size:13px;color:#888;border-bottom:1px solid #222;">Email</td>
                  <td style="padding:12px 20px;font-size:13px;color:#C9A84C;border-bottom:1px solid #222;">{{patient_email}}</td>
                </tr>
                <tr>
                  <td style="padding:12px 20px;font-size:13px;color:#888;border-bottom:1px solid #222;">Location</td>
                  <td style="padding:12px 20px;font-size:13px;color:#ffffff;border-bottom:1px solid #222;">{{location_name}}</td>
                </tr>
                <tr>
                  <td style="padding:12px 20px;font-size:13px;color:#888;border-bottom:1px solid #222;">Exam Date</td>
                  <td style="padding:12px 20px;font-size:13px;color:#ffffff;border-bottom:1px solid #222;">{{exam_date}}</td>
                </tr>
                <tr>
                  <td style="padding:12px 20px;font-size:13px;color:#888;border-bottom:1px solid #222;">Rating</td>
                  <td style="padding:12px 20px;font-size:13px;color:#e53e3e;font-weight:700;border-bottom:1px solid #222;">{{rating}} / 5 stars</td>
                </tr>
                <tr>
                  <td style="padding:12px 20px;font-size:13px;color:#888;">Submitted</td>
                  <td style="padding:12px 20px;font-size:13px;color:#ffffff;">{{timestamp}}</td>
                </tr>
              </table>

              {{#if comment}}
              <div style="background:#1a1a1a;border-left:3px solid #e53e3e;border-radius:0 8px 8px 0;padding:20px 24px;margin-bottom:24px;">
                <p style="font-size:11px;color:#e53e3e;letter-spacing:2px;text-transform:uppercase;margin:0 0 10px 0;">Patient Comment</p>
                <p style="font-size:15px;color:#b0b0b0;margin:0;line-height:1.7;font-style:italic;">"{{comment}}"</p>
              </div>
              {{/if}}

              <a href="{{dashboard_url}}" style="display:inline-block;background:linear-gradient(135deg,#C9A84C,#a8862e);color:#000;text-decoration:none;padding:16px 32px;border-radius:8px;font-size:14px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">
                View in Dashboard →
              </a>
            </td>
          </tr>
          <tr>
            <td style="background-color:#0f0f0f;padding:20px 48px;border-radius:0 0 16px 16px;border-top:1px solid #222;">
              <p style="font-size:12px;color:#444;margin:0;text-align:center;">
                This is a confidential internal alert. Do not forward externally.<br>
                Beyond Vision Optometry · Management System
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function getNegativeAlertTextTemplate(): string {
  return `⚠️ INTERNAL ALERT — Beyond Vision Optometry

Patient Feedback Alert — {{location_name}} — {{rating}}/5 stars

PATIENT DETAILS:
Name: {{first_name}} {{last_name}}
Email: {{patient_email}}
Location: {{location_name}}
Exam Date: {{exam_date}}
Rating: {{rating}}/5
Submitted: {{timestamp}}

{{#if comment}}
Patient Comment:
"{{comment}}"
{{/if}}

Please follow up with this patient promptly.
View in Dashboard: {{dashboard_url}}

---
Beyond Vision Optometry — Internal Management System
This alert is confidential. Do not forward externally.`;
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

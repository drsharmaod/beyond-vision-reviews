// src/lib/email/sender.ts
import { Resend } from "resend";
import prisma from "@/lib/prisma";
import { TemplateType } from "@prisma/client";

const resend = new Resend(process.env.RESEND_API_KEY);

const DEFAULT_FROM = process.env.EMAIL_FROM ?? "feedback@beyondvision.ca";
const DEFAULT_FROM_NAME = process.env.EMAIL_FROM_NAME ?? "Beyond Vision Optometry";

// ── Template variable substitution ───────────────────────────────────────────

export function interpolateTemplate(
  template: string,
  variables: Record<string, string | number | undefined | null>
): string {
  let result = template;

  result = result.replace(
    /\{\{#if (\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g,
    (_, varName, content) => {
      const val = variables[varName];
      return val ? content : "";
    }
  );

  result = result.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const val = variables[key];
    return val !== undefined && val !== null ? String(val) : "";
  });

  return result;
}

// ── Email send helpers ────────────────────────────────────────────────────────

export interface SendEmailOptions {
  to:         string;
  from?:      string;
  fromName?:  string;
  subject:    string;
  html:       string;
  text?:      string;
  replyTo?:   string;
  tags?:      { name: string; value: string }[];
}

export interface SendEmailResult {
  success:    boolean;
  messageId?: string;
  error?:     string;
}

export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const fromAddress = `${options.fromName ?? DEFAULT_FROM_NAME} <${options.from ?? DEFAULT_FROM}>`;

  try {
    const result = await resend.emails.send({
      from:     fromAddress,
      to:       options.to,
      subject:  options.subject,
      html:     options.html,
      text:     options.text,
      reply_to: options.replyTo,
      tags:     options.tags,
    });

    if (result.error) {
      return { success: false, error: result.error.message };
    }

    return { success: true, messageId: result.data?.id };
  } catch (err: any) {
    return { success: false, error: err.message ?? "Unknown email error" };
  }
}

// ── Template-based email sends ────────────────────────────────────────────────

export async function sendFeedbackRequestEmail(params: {
  to:           string;
  firstName:    string;
  locationName: string;
  examDate:     string;
  patientEmail: string;
  ratingUrls:   Record<string, string>;
  doctorName?:  string;
  senderEmail?: string;
  senderName?:  string;
}): Promise<SendEmailResult> {
  const template = await prisma.emailTemplate.findUnique({
    where: { templateType: TemplateType.FEEDBACK_REQUEST },
  });
  if (!template || !template.isActive) {
    return { success: false, error: "Feedback request template not found or inactive" };
  }

  const vars = {
    first_name:    params.firstName,
    location_name: params.locationName,
    exam_date:     params.examDate,
    patient_email: params.patientEmail,
    ...params.ratingUrls,
  };

  return sendEmail({
    to:       params.to,
    from:     params.senderEmail,
    fromName: params.senderName,
    subject:  interpolateTemplate(template.subject, vars),
    html:     interpolateTemplate(template.htmlBody, vars),
    text:     interpolateTemplate(template.textBody, vars),
    tags:     [{ name: "type", value: "feedback_request" }],
  });
}

export async function sendPositiveFollowupEmail(params: {
  to:           string;
  firstName:    string;
  locationName: string;
  rating:       number;
  reviewLink:   string;
  comment?:     string;
  senderEmail?: string;
  senderName?:  string;
}): Promise<SendEmailResult> {
  const template = await prisma.emailTemplate.findUnique({
    where: { templateType: TemplateType.POSITIVE_FOLLOWUP },
  });
  if (!template || !template.isActive) {
    return { success: false, error: "Positive followup template not found or inactive" };
  }

  const vars = {
    first_name:    params.firstName,
    location_name: params.locationName,
    rating:        params.rating,
    review_link:   params.reviewLink,
    comment:       params.comment ?? "",
  };

  return sendEmail({
    to:       params.to,
    from:     params.senderEmail,
    fromName: params.senderName,
    subject:  interpolateTemplate(template.subject, vars),
    html:     interpolateTemplate(template.htmlBody, vars),
    text:     interpolateTemplate(template.textBody, vars),
    tags:     [{ name: "type", value: "positive_followup" }],
  });
}

export async function sendNegativeAlertEmail(params: {
  to:           string[];
  firstName:    string;
  lastName:     string;
  patientEmail: string;
  locationName: string;
  examDate:     string;
  rating:       number;
  comment?:     string;
  timestamp:    string;
  dashboardUrl: string;
}): Promise<SendEmailResult> {
  const template = await prisma.emailTemplate.findUnique({
    where: { templateType: TemplateType.NEGATIVE_ALERT },
  });
  if (!template || !template.isActive) {
    return { success: false, error: "Negative alert template not found or inactive" };
  }

  const vars = {
    first_name:    params.firstName,
    last_name:     params.lastName,
    patient_email: params.patientEmail,
    location_name: params.locationName,
    exam_date:     params.examDate,
    rating:        params.rating,
    comment:       params.comment ?? "",
    timestamp:     params.timestamp,
    dashboard_url: params.dashboardUrl,
  };

  const subj = interpolateTemplate(template.subject, vars);
  const html = interpolateTemplate(template.htmlBody, vars);
  const text = interpolateTemplate(template.textBody, vars);

  const results = await Promise.allSettled(
    params.to.map((recipient) =>
      sendEmail({ to: recipient, subject: subj, html, text, tags: [{ name: "type", value: "negative_alert" }] })
    )
  );

  const failed = results.filter((r) => r.status === "rejected" || (r.status === "fulfilled" && !r.value.success));
  if (failed.length === params.to.length) {
    return { success: false, error: "All alert emails failed to send" };
  }

  const first = results.find((r) => r.status === "fulfilled" && r.value.success) as PromiseFulfilledResult<SendEmailResult> | undefined;
  return { success: true, messageId: first?.value.messageId };
}

// src/lib/tokens.ts
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? "30d";

export interface FeedbackTokenPayload {
  feedbackRequestId: string;
  examVisitId:       string;
  patientEmail:      string;
  locationCode:      string;
  iat?:              number;
  exp?:              number;
}

/** Sign a token for the feedback email link. */
export function signFeedbackToken(payload: Omit<FeedbackTokenPayload, "iat" | "exp">): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN as any });
}

/** Verify and decode a feedback token. Throws if invalid or expired. */
export function verifyFeedbackToken(token: string): FeedbackTokenPayload {
  return jwt.verify(token, JWT_SECRET) as FeedbackTokenPayload;
}

/** Build per-rating URLs for a feedback request token. */
export function buildRatingUrls(token: string, baseUrl?: string): Record<string, string> {
  const base = baseUrl ?? process.env.FEEDBACK_BASE_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "";
  const urls: Record<string, string> = {};
  for (let star = 1; star <= 5; star++) {
    urls[`rating_${star}_url`] = `${base}/r/${token}/${star}`;
  }
  return urls;
}

/** Build a Google review redirect URL. */
export function buildReviewUrl(responseId: string, baseUrl?: string): string {
  const base = baseUrl ?? process.env.NEXT_PUBLIC_APP_URL ?? "";
  return `${base}/review/${responseId}`;
}

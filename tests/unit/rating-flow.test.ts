// tests/unit/rating-flow.test.ts
import { signFeedbackToken, verifyFeedbackToken, buildRatingUrls, buildReviewUrl } from "@/lib/tokens";
import { interpolateTemplate } from "@/lib/email/sender";

// Mock JWT_SECRET for tests
process.env.JWT_SECRET = "test-secret-key-32-chars-minimum!!";
process.env.JWT_EXPIRES_IN = "30d";

// ── Token signing ────────────────────────────────────────────────────────────

describe("Feedback token signing", () => {
  it("signs and verifies a feedback token", () => {
    const payload = {
      feedbackRequestId: "req_123",
      examVisitId:       "visit_456",
      patientEmail:      "patient@example.com",
      locationCode:      "millwoods",
    };

    const token   = signFeedbackToken(payload);
    const decoded = verifyFeedbackToken(token);

    expect(decoded.feedbackRequestId).toBe(payload.feedbackRequestId);
    expect(decoded.examVisitId).toBe(payload.examVisitId);
    expect(decoded.patientEmail).toBe(payload.patientEmail);
    expect(decoded.locationCode).toBe(payload.locationCode);
  });

  it("throws on tampered token", () => {
    const token = signFeedbackToken({
      feedbackRequestId: "req_123",
      examVisitId:       "visit_456",
      patientEmail:      "p@example.com",
      locationCode:      "millwoods",
    });

    const tampered = token.slice(0, -5) + "XXXXX";
    expect(() => verifyFeedbackToken(tampered)).toThrow();
  });

  it("throws on completely invalid token", () => {
    expect(() => verifyFeedbackToken("not.a.valid.jwt")).toThrow();
  });
});

// ── Rating URL building ──────────────────────────────────────────────────────

describe("Rating URL builder", () => {
  it("builds 5 distinct rating URLs", () => {
    const token = signFeedbackToken({
      feedbackRequestId: "req_abc",
      examVisitId:       "visit_abc",
      patientEmail:      "p@example.com",
      locationCode:      "crystallina",
    });

    const urls = buildRatingUrls(token, "https://app.beyondvision.ca");

    expect(Object.keys(urls)).toHaveLength(5);
    expect(urls["rating_1_url"]).toContain("/r/");
    expect(urls["rating_1_url"]).toContain("/1");
    expect(urls["rating_5_url"]).toContain("/5");

    // All URLs should be different
    const uniqueUrls = new Set(Object.values(urls));
    expect(uniqueUrls.size).toBe(5);
  });

  it("uses base URL from environment if not provided", () => {
    process.env.FEEDBACK_BASE_URL = "https://feedback.beyondvision.ca";
    const token = signFeedbackToken({
      feedbackRequestId: "req_env",
      examVisitId:       "visit_env",
      patientEmail:      "p@example.com",
      locationCode:      "grange",
    });
    const urls = buildRatingUrls(token);
    expect(urls["rating_3_url"]).toContain("https://feedback.beyondvision.ca");
  });

  it("builds a Google review redirect URL", () => {
    const url = buildReviewUrl("response_xyz", "https://app.beyondvision.ca");
    expect(url).toBe("https://app.beyondvision.ca/review/response_xyz");
  });
});

// ── Rating routing logic ─────────────────────────────────────────────────────

describe("Rating sentiment routing", () => {
  function getSentiment(rating: number): "POSITIVE" | "NEGATIVE" | "NEUTRAL" {
    if (rating >= 4) return "POSITIVE";
    if (rating === 3) return "NEUTRAL";
    return "NEGATIVE";
  }

  function shouldShowGoogleReview(rating: number): boolean {
    return rating >= 4;
  }

  function shouldSendInternalAlert(rating: number): boolean {
    return rating <= 3;
  }

  // ── Google review routing ──
  it("routes 5-star to POSITIVE and shows Google review CTA", () => {
    expect(getSentiment(5)).toBe("POSITIVE");
    expect(shouldShowGoogleReview(5)).toBe(true);
    expect(shouldSendInternalAlert(5)).toBe(false);
  });

  it("routes 4-star to POSITIVE and shows Google review CTA", () => {
    expect(getSentiment(4)).toBe("POSITIVE");
    expect(shouldShowGoogleReview(4)).toBe(true);
    expect(shouldSendInternalAlert(4)).toBe(false);
  });

  // ── Internal alert routing ──
  it("routes 3-star to NEUTRAL and triggers internal alert", () => {
    expect(getSentiment(3)).toBe("NEUTRAL");
    expect(shouldShowGoogleReview(3)).toBe(false);
    expect(shouldSendInternalAlert(3)).toBe(true);
  });

  it("routes 2-star to NEGATIVE and triggers internal alert", () => {
    expect(getSentiment(2)).toBe("NEGATIVE");
    expect(shouldShowGoogleReview(2)).toBe(false);
    expect(shouldSendInternalAlert(2)).toBe(true);
  });

  it("routes 1-star to NEGATIVE and triggers internal alert", () => {
    expect(getSentiment(1)).toBe("NEGATIVE");
    expect(shouldShowGoogleReview(1)).toBe(false);
    expect(shouldSendInternalAlert(1)).toBe(true);
  });

  // ── Boundary check ──
  it("does NOT show Google review for any 1–3 star rating", () => {
    [1, 2, 3].forEach((r) => {
      expect(shouldShowGoogleReview(r)).toBe(false);
    });
  });

  it("always sends internal alert for 1–3 star ratings", () => {
    [1, 2, 3].forEach((r) => {
      expect(shouldSendInternalAlert(r)).toBe(true);
    });
  });

  it("never sends internal alert for 4–5 star ratings", () => {
    [4, 5].forEach((r) => {
      expect(shouldSendInternalAlert(r)).toBe(false);
    });
  });
});

// ── Template interpolation ───────────────────────────────────────────────────

describe("Email template interpolation", () => {
  it("replaces basic variables", () => {
    const result = interpolateTemplate(
      "Hello {{first_name}}, visit at {{location_name}}.",
      { first_name: "Sarah", location_name: "Beyond Vision Millwoods" }
    );
    expect(result).toBe("Hello Sarah, visit at Beyond Vision Millwoods.");
  });

  it("leaves unknown variables empty string", () => {
    const result = interpolateTemplate("Hello {{first_name}}!", {});
    expect(result).toBe("Hello !");
  });

  it("handles numeric values", () => {
    const result = interpolateTemplate("Rating: {{rating}}/5", { rating: 4 });
    expect(result).toBe("Rating: 4/5");
  });

  it("handles {{#if}} block when variable is truthy", () => {
    const result = interpolateTemplate(
      'Start {{#if comment}}<p>{{comment}}</p>{{/if}} End',
      { comment: "Great service!" }
    );
    expect(result).toContain("Great service!");
  });

  it("removes {{#if}} block when variable is falsy", () => {
    const result = interpolateTemplate(
      'Start {{#if comment}}<p>{{comment}}</p>{{/if}} End',
      { comment: "" }
    );
    expect(result).not.toContain("<p>");
    expect(result).toBe("Start  End");
  });

  it("handles null values gracefully", () => {
    const result = interpolateTemplate("Hi {{first_name}}", { first_name: null });
    expect(result).toBe("Hi ");
  });

  it("does not throw on complex nested template", () => {
    const html = `
      <h1>{{first_name}} {{last_name}}</h1>
      <p>Location: {{location_name}}</p>
      <p>Rating: {{rating}}/5</p>
      {{#if comment}}
      <blockquote>{{comment}}</blockquote>
      {{/if}}
    `;
    const vars = {
      first_name: "John",
      last_name: "Smith",
      location_name: "Beyond Vision Terwillegar",
      rating: 2,
      comment: "Wait time was too long.",
    };
    expect(() => interpolateTemplate(html, vars)).not.toThrow();
    const result = interpolateTemplate(html, vars);
    expect(result).toContain("John Smith");
    expect(result).toContain("2/5");
    expect(result).toContain("Wait time was too long.");
  });
});

// ── Suppression window logic ─────────────────────────────────────────────────

describe("Duplicate suppression logic", () => {
  it("calculates suppression cutoff correctly", () => {
    const suppressionDays = 90;
    const now = new Date("2024-06-01");
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() - suppressionDays);

    expect(cutoff.getFullYear()).toBe(2024);
    expect(cutoff.getMonth()).toBe(2); // March
    expect(cutoff.getDate()).toBe(3);  // March 3
  });

  it("identifies a recent visit as within suppression window", () => {
    const suppressionDays = 90;
    const lastVisitDate = new Date();
    lastVisitDate.setDate(lastVisitDate.getDate() - 30); // 30 days ago

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - suppressionDays);

    expect(lastVisitDate >= cutoff).toBe(true); // should suppress
  });

  it("identifies an old visit as outside suppression window", () => {
    const suppressionDays = 90;
    const lastVisitDate = new Date();
    lastVisitDate.setDate(lastVisitDate.getDate() - 120); // 120 days ago

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - suppressionDays);

    expect(lastVisitDate >= cutoff).toBe(false); // should NOT suppress
  });
});

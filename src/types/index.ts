// src/types/index.ts
import { UserRole } from "@prisma/client";

// ── Session augmentation ──────────────────────────────────────────────────────

declare module "next-auth" {
  interface Session {
    user: {
      id:           string;
      name?:        string | null;
      email?:       string | null;
      image?:       string | null;
      role:         UserRole;
      locationId?:  string | null;
      locationName?: string | null;
      locationCode?: string | null;
    };
  }
}

// ── API response types ────────────────────────────────────────────────────────

export interface ApiSuccess<T = unknown> {
  success: true;
  data:    T;
}

export interface ApiError {
  success: false;
  error:   string;
  details?: unknown;
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;

// ── Dashboard types ───────────────────────────────────────────────────────────

export interface DashboardSummary {
  totalPatients:       number;
  totalFeedbackSent:   number;
  totalResponses:      number;
  responseRate:        number;
  averageRating:       number;
  positiveCount:       number;
  negativeCount:       number;
  openAlerts:          number;
  googleReviewClicks:  number;
  lastImportDate?:     string;
  weekOverWeek: {
    responses:   number;
    rating:      number;
    clicks:      number;
  };
}

export interface RatingDistribution {
  star:  number;
  count: number;
  pct:   number;
}

export interface LocationPerformance {
  locationId:    string;
  locationName:  string;
  locationCode:  string;
  totalSent:     number;
  totalResponses: number;
  responseRate:  number;
  averageRating: number;
  positiveCount: number;
  negativeCount: number;
  openAlerts:    number;
}

// ── Import types ──────────────────────────────────────────────────────────────

export interface ImportSummary {
  importId:     string;
  fileName:     string;
  totalRows:    number;
  validRows:    number;
  invalidRows:  number;
  duplicateRows: number;
  status:       string;
  createdAt:    string;
  errors:       { row: number; field: string; message: string }[];
}

// ── Alert types ───────────────────────────────────────────────────────────────

export interface AlertDetail {
  id:                string;
  resolutionStatus:  string;
  managerNotes?:     string;
  createdAt:         string;
  location: {
    name: string;
    code: string;
  };
  feedbackResponse: {
    rating:       number;
    comment?:     string;
    respondedAt:  string;
    feedbackRequest: {
      emailTo: string;
      examVisit: {
        examDate: string;
        doctorName?: string;
        patient: {
          firstName:  string;
          lastName:   string;
          email:      string;
          phone?:     string;
        };
      };
    };
  };
}

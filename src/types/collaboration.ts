export type ReviewStatus =
  | "unreviewed"
  | "needs_review"
  | "reviewed"
  | "approved"
  | "dismissed";

export type EventFlagType =
  | "needs_review"
  | "missing_evidence"
  | "conflicting_sources"
  | "follow_up";

export type ReviewStatusFilter = "all" | ReviewStatus;

export type BookmarkFilter = "all" | "bookmarked";

export type FlagFilter = "all" | "flagged";

export interface EventComment {
  id: string;
  claimId: string;
  eventId: string;
  authorName: string;
  body: string;
  createdAt: string;
}

export interface EventAssignment {
  id: string;
  claimId: string;
  eventId: string;
  assigneeName: string;
  status: string;
  createdAt: string;
}

export interface EventFlag {
  id: string;
  claimId: string;
  eventId: string;
  flagType: EventFlagType;
  createdAt: string;
}

export interface EventBookmark {
  id: string;
  claimId: string;
  eventId: string;
  createdAt: string;
}

export interface ClaimEventCollaboration {
  reviewStatusByEventId: Record<string, ReviewStatus>;
  assignments: EventAssignment[];
  flags: EventFlag[];
  bookmarks: EventBookmark[];
  comments: EventComment[];
}

export interface ReviewSummaryStats {
  totalEvents: number;
  reviewed: number;
  needsReview: number;
  approved: number;
  dismissed: number;
  bookmarked: number;
  flagged: number;
  comments: number;
}

export const DEMO_ASSIGNEES = [
  "Alex Rivera",
  "Priya Shah",
  "Marcus Lee",
  "Taylor Kim",
] as const;

export const DEMO_REVIEWER_NAME = "Demo Reviewer";

export const REVIEW_STATUS_LABELS: Record<ReviewStatus, string> = {
  unreviewed: "Unreviewed",
  needs_review: "Needs review",
  reviewed: "Reviewed",
  approved: "Approved",
  dismissed: "Dismissed",
};

export const FLAG_TYPE_LABELS: Record<EventFlagType, string> = {
  needs_review: "Needs review",
  missing_evidence: "Missing evidence",
  conflicting_sources: "Conflicting sources",
  follow_up: "Follow up",
};

export function createEmptyCollaboration(): ClaimEventCollaboration {
  return {
    reviewStatusByEventId: {},
    assignments: [],
    flags: [],
    bookmarks: [],
    comments: [],
  };
}

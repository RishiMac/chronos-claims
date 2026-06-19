import type {
  BookmarkFilter,
  ClaimEventCollaboration,
  EventFlag,
  FlagFilter,
  ReviewStatus,
  ReviewStatusFilter,
  ReviewSummaryStats,
} from "@/types/collaboration";
import type { TimelineEvent } from "@/types/claim";

export function getEventReviewStatus(
  collaboration: ClaimEventCollaboration,
  eventId: string
): ReviewStatus {
  return collaboration.reviewStatusByEventId[eventId] ?? "unreviewed";
}

export function getLatestAssignment(
  collaboration: ClaimEventCollaboration,
  eventId: string
): string | undefined {
  const assignments = collaboration.assignments
    .filter((item) => item.eventId === eventId)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  return assignments[0]?.assigneeName;
}

export function isEventBookmarked(
  collaboration: ClaimEventCollaboration,
  eventId: string
): boolean {
  return collaboration.bookmarks.some((item) => item.eventId === eventId);
}

export function getEventFlags(
  collaboration: ClaimEventCollaboration,
  eventId: string
): EventFlag[] {
  return collaboration.flags.filter((item) => item.eventId === eventId);
}

export function getEventCommentCount(
  collaboration: ClaimEventCollaboration,
  eventId: string
): number {
  return collaboration.comments.filter((item) => item.eventId === eventId).length;
}

export function enrichTimelineEventsWithCollaboration(
  events: TimelineEvent[],
  collaboration: ClaimEventCollaboration
): TimelineEvent[] {
  return events.map((event) => {
    const flags = getEventFlags(collaboration, event.id);
    return {
      ...event,
      reviewStatus: getEventReviewStatus(collaboration, event.id),
      assignedTo: getLatestAssignment(collaboration, event.id),
      isBookmarked: isEventBookmarked(collaboration, event.id),
      flags: flags.map((item) => item.flagType),
      commentCount: getEventCommentCount(collaboration, event.id),
    };
  });
}

export function computeReviewSummary(
  events: TimelineEvent[]
): ReviewSummaryStats {
  let reviewed = 0;
  let needsReview = 0;
  let approved = 0;
  let dismissed = 0;
  let bookmarked = 0;
  let flagged = 0;
  let comments = 0;

  for (const event of events) {
    const status = event.reviewStatus ?? "unreviewed";
    if (status === "reviewed") reviewed += 1;
    if (status === "needs_review") needsReview += 1;
    if (status === "approved") approved += 1;
    if (status === "dismissed") dismissed += 1;
    if (event.isBookmarked) bookmarked += 1;
    if ((event.flags?.length ?? 0) > 0) flagged += 1;
    comments += event.commentCount ?? 0;
  }

  return {
    totalEvents: events.length,
    reviewed,
    needsReview,
    approved,
    dismissed,
    bookmarked,
    flagged,
    comments,
  };
}

export function eventMatchesReviewStatusFilter(
  event: TimelineEvent,
  filter: ReviewStatusFilter
): boolean {
  if (filter === "all") return true;
  return (event.reviewStatus ?? "unreviewed") === filter;
}

export function eventMatchesBookmarkFilter(
  event: TimelineEvent,
  filter: BookmarkFilter
): boolean {
  if (filter === "all") return true;
  return event.isBookmarked === true;
}

export function eventMatchesFlagFilter(
  event: TimelineEvent,
  filter: FlagFilter
): boolean {
  if (filter === "all") return true;
  return (event.flags?.length ?? 0) > 0;
}

export function getAssigneeInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export const reviewStatusStyles: Record<
  ReviewStatus,
  { badge: string; label: string }
> = {
  unreviewed: {
    badge: "bg-slate-100 text-slate-600 border-slate-200",
    label: "Unreviewed",
  },
  needs_review: {
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    label: "Needs review",
  },
  reviewed: {
    badge: "bg-sky-50 text-sky-700 border-sky-200",
    label: "Reviewed",
  },
  approved: {
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    label: "Approved",
  },
  dismissed: {
    badge: "bg-slate-100 text-slate-500 border-slate-200",
    label: "Dismissed",
  },
};

export function createCollaborationId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function formatCommentTimestamp(date = new Date()): string {
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

"use client";

import { Bookmark, Flag, X } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DEMO_ASSIGNEES,
  FLAG_TYPE_LABELS,
  REVIEW_STATUS_LABELS,
  type EventComment,
  type EventFlag,
  type EventFlagType,
  type ReviewStatus,
} from "@/types/collaboration";
import { cn } from "@/lib/utils";
import { reviewStatusStyles } from "@/lib/collaboration/collaborationUtils";
import type { TimelineEvent } from "@/types/claim";

interface EventCollaborationPanelProps {
  event: TimelineEvent;
  comments: EventComment[];
  eventFlags: EventFlag[];
  onReviewStatusChange: (status: ReviewStatus) => void;
  onAssign: (assigneeName: string) => void;
  onUnassign: () => void;
  onToggleBookmark: () => void;
  onAddFlag: (flagType: EventFlagType) => void;
  onRemoveFlag: (flagId: string) => void;
  onAddComment: (body: string) => void;
}

const reviewStatusOptions: ReviewStatus[] = [
  "unreviewed",
  "needs_review",
  "reviewed",
  "approved",
  "dismissed",
];

const flagOptions: EventFlagType[] = [
  "needs_review",
  "missing_evidence",
  "conflicting_sources",
  "follow_up",
];

export function EventCollaborationPanel({
  event,
  comments,
  eventFlags,
  onReviewStatusChange,
  onAssign,
  onUnassign,
  onToggleBookmark,
  onAddFlag,
  onRemoveFlag,
  onAddComment,
}: EventCollaborationPanelProps) {
  const [commentDraft, setCommentDraft] = useState("");
  const reviewStatus = event.reviewStatus ?? "unreviewed";
  const activeFlagTypes = new Set(eventFlags.map((flag) => flag.flagType));

  const handleSaveComment = () => {
    const trimmed = commentDraft.trim();
    if (!trimmed) return;
    onAddComment(trimmed);
    setCommentDraft("");
  };

  return (
    <div className="space-y-3 border-t border-slate-100 pt-3">
      <div>
        <p className="text-[12px] font-medium text-slate-700">Review</p>
        <div className="mt-1.5 grid grid-cols-2 gap-2">
          <label className="col-span-2 space-y-0.5">
            <span className="text-[10px] text-slate-500">Review status</span>
            <select
              value={reviewStatus}
              onChange={(changeEvent) =>
                onReviewStatusChange(changeEvent.target.value as ReviewStatus)
              }
              className="h-7 w-full rounded-md border border-slate-200 bg-white px-2 text-[11px] text-slate-700 outline-none focus:border-slate-300"
            >
              {reviewStatusOptions.map((status) => (
                <option key={status} value={status}>
                  {REVIEW_STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </label>

          <label className="col-span-2 space-y-0.5">
            <span className="text-[10px] text-slate-500">Assign to</span>
            <select
              value={event.assignedTo ?? ""}
              onChange={(changeEvent) => {
                const value = changeEvent.target.value;
                if (value) {
                  onAssign(value);
                } else {
                  onUnassign();
                }
              }}
              className="h-7 w-full rounded-md border border-slate-200 bg-white px-2 text-[11px] text-slate-700 outline-none focus:border-slate-300"
            >
              <option value="">Unassigned</option>
              {DEMO_ASSIGNEES.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </label>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onToggleBookmark}
            className={cn(
              "h-7 gap-1 px-2 text-[10px]",
              event.isBookmarked &&
                "border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100"
            )}
          >
            <Bookmark
              className={cn("size-3", event.isBookmarked && "fill-current")}
            />
            {event.isBookmarked ? "Bookmarked" : "Bookmark"}
          </Button>

          <label className="space-y-0.5">
            <span className="text-[10px] text-slate-500">Add flag</span>
            <select
              defaultValue=""
              onChange={(changeEvent) => {
                const value = changeEvent.target.value as EventFlagType;
                if (value) {
                  onAddFlag(value);
                  changeEvent.target.value = "";
                }
              }}
              className="h-7 w-full rounded-md border border-slate-200 bg-white px-2 text-[11px] text-slate-700 outline-none focus:border-slate-300"
            >
              <option value="">Select flag…</option>
              {flagOptions.map((flagType) => (
                <option
                  key={flagType}
                  value={flagType}
                  disabled={activeFlagTypes.has(flagType)}
                >
                  {FLAG_TYPE_LABELS[flagType]}
                  {activeFlagTypes.has(flagType) ? " (added)" : ""}
                </option>
              ))}
            </select>
          </label>
        </div>

        {eventFlags.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-0.5">
            {eventFlags.map((flag) => (
              <Badge
                key={flag.id}
                variant="outline"
                className="h-4 gap-0.5 pl-1 pr-0.5 text-[9px] font-normal text-amber-700"
              >
                <Flag className="size-2.5" />
                {FLAG_TYPE_LABELS[flag.flagType]}
                <button
                  type="button"
                  onClick={() => onRemoveFlag(flag.id)}
                  className="ml-0.5 rounded-sm p-0.5 hover:bg-amber-100"
                  aria-label={`Remove ${FLAG_TYPE_LABELS[flag.flagType]} flag`}
                >
                  <X className="size-2.5" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        <div className="mt-1.5">
          <Badge
            variant="outline"
            className={cn(
              "h-4 px-1.5 text-[9px] font-normal",
              reviewStatusStyles[reviewStatus].badge
            )}
          >
            {reviewStatusStyles[reviewStatus].label}
          </Badge>
        </div>
      </div>

      <div>
        <p className="text-[12px] font-medium text-slate-700">Comments</p>
        <textarea
          value={commentDraft}
          onChange={(changeEvent) => setCommentDraft(changeEvent.target.value)}
          placeholder="Add a review comment for this event…"
          rows={2}
          className="mt-1.5 w-full resize-none rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[11px] leading-snug text-slate-700 outline-none placeholder:text-slate-400 focus:border-slate-300"
        />
        <Button
          type="button"
          size="sm"
          disabled={!commentDraft.trim()}
          onClick={handleSaveComment}
          className="mt-1.5 h-7 bg-slate-900 px-2 text-[10px] text-white hover:bg-slate-800"
        >
          Save comment
        </Button>

        {comments.length === 0 ? (
          <p className="mt-2 text-[10px] text-muted-foreground">
            No comments yet.
          </p>
        ) : (
          <ul className="mt-2 max-h-28 space-y-1.5 overflow-y-auto">
            {comments.map((comment) => (
              <li
                key={comment.id}
                className="rounded-md border border-slate-200 bg-slate-50/70 px-2 py-1.5"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-[10px] font-medium text-slate-700">
                    {comment.authorName}
                  </span>
                  <span className="text-[9px] text-muted-foreground">
                    {comment.createdAt}
                  </span>
                </div>
                <p className="mt-0.5 text-[11px] leading-snug text-slate-600">
                  {comment.body}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

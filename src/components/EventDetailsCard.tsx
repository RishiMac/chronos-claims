"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EvidenceSourceChip } from "@/components/EvidenceSourceChip";
import { EventCollaborationPanel } from "@/components/EventCollaborationPanel";
import { SupportingEvidenceList } from "@/components/SupportingEvidenceList";
import { buildEventSummaryCopy, severityStyles } from "@/lib/eventUtils";
import { getEventEvidenceReferences } from "@/lib/evidenceReferenceUtils";
import { cn } from "@/lib/utils";
import type { ConfidenceLevel, EvidenceFile, TimelineEvent } from "@/types/claim";
import type { EvidenceReference } from "@/types/evidence-reference";
import type {
  EventComment,
  EventFlagType,
  ReviewStatus,
} from "@/types/collaboration";

interface EventDetailsCardProps {
  event: TimelineEvent | null;
  linkedEvidence: EvidenceFile[];
  hiddenByFilter?: boolean;
  eventComments?: EventComment[];
  onCopySummary?: () => void;
  onPreviewEvidence?: (evidenceId: string) => void;
  onOpenEvidenceReference?: (reference: EvidenceReference) => void;
  onReviewStatusChange?: (status: ReviewStatus) => void;
  onAssignEvent?: (assigneeName: string) => void;
  onToggleBookmark?: () => void;
  onAddFlag?: (flagType: EventFlagType) => void;
  onAddComment?: (body: string) => void;
}

const confidenceStyles: Record<ConfidenceLevel, string> = {
  High: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Medium: "bg-amber-50 text-amber-700 border-amber-200",
  Low: "bg-slate-100 text-slate-600 border-slate-200",
};

export function EventDetailsCard({
  event,
  linkedEvidence,
  hiddenByFilter = false,
  onCopySummary,
  onPreviewEvidence,
  onOpenEvidenceReference,
  eventComments = [],
  onReviewStatusChange,
  onAssignEvent,
  onToggleBookmark,
  onAddFlag,
  onAddComment,
}: EventDetailsCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!event) return;
    const summary = buildEventSummaryCopy(event, linkedEvidence);
    await navigator.clipboard.writeText(summary);
    setCopied(true);
    onCopySummary?.();
    setTimeout(() => setCopied(false), 2000);
  };

  if (!event) {
    return (
      <Card className="border-slate-200 shadow-none">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 px-3 py-2.5">
          <CardTitle className="text-[13px] font-medium text-slate-900">
            Selected Event Details
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <p className="text-[13px] text-muted-foreground">
            Select an event to synchronize the investigation workspace.
          </p>
        </CardContent>
      </Card>
    );
  }

  const supportingReferences = getEventEvidenceReferences(event, linkedEvidence);

  return (
    <Card className="border-slate-200 shadow-none">
      <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 bg-slate-50/50 px-3 py-2.5">
        <CardTitle className="text-[13px] font-medium text-slate-900">
          Selected Event Details
        </CardTitle>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleCopy}
          className="h-7 gap-1 px-2 text-[11px] transition-colors hover:bg-slate-50"
        >
          {copied ? (
            <>
              <Check className="size-3" />
              Copied
            </>
          ) : (
            <>
              <Copy className="size-3" />
              Copy Event Summary
            </>
          )}
        </Button>
      </CardHeader>
      <CardContent className="space-y-3 p-3">
        {hiddenByFilter && (
          <p className="text-[11px] text-amber-700">
            Selected event is hidden by current filters.
          </p>
        )}

        <div>
          <p className="font-mono text-[11px] tabular-nums text-muted-foreground">
            {event.timestamp}
          </p>
          <p className="mt-0.5 text-[13px] font-medium text-slate-900">
            {event.title}
          </p>
          <p className="mt-1.5 text-[13px] leading-snug text-slate-600">
            {event.description}
          </p>
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="text-[12px] text-slate-500">Severity</span>
          <Badge
            variant="outline"
            className={cn(
              "h-5 text-[11px] font-normal",
              severityStyles[event.severity].badge
            )}
          >
            {severityStyles[event.severity].label}
          </Badge>
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="text-[12px] text-slate-500">Confidence</span>
          <Badge
            variant="outline"
            className={cn(
              "h-5 text-[11px] font-normal",
              confidenceStyles[event.confidence]
            )}
          >
            {event.confidence}
          </Badge>
        </div>

        <div>
          <p className="text-[12px] text-slate-500">Source references</p>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {linkedEvidence.map((file) =>
              onPreviewEvidence ? (
                <EvidenceSourceChip
                  key={file.id}
                  file={file}
                  onPreview={onPreviewEvidence}
                />
              ) : (
                <Badge
                  key={file.id}
                  variant="secondary"
                  className="h-4 bg-slate-100 px-1.5 text-[10px] font-normal text-slate-600"
                >
                  {file.name}
                </Badge>
              )
            )}
          </div>
        </div>

        <div>
          <p className="text-[12px] font-medium text-slate-700">
            Supporting Evidence
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            Source references attached to this event for human review.
          </p>
          <div className="mt-2">
            <SupportingEvidenceList
              references={supportingReferences}
              onOpenReference={onOpenEvidenceReference}
              compact
            />
          </div>
        </div>

        {onReviewStatusChange &&
          onAssignEvent &&
          onToggleBookmark &&
          onAddFlag &&
          onAddComment && (
            <EventCollaborationPanel
              event={event}
              comments={eventComments}
              onReviewStatusChange={onReviewStatusChange}
              onAssign={onAssignEvent}
              onToggleBookmark={onToggleBookmark}
              onAddFlag={onAddFlag}
              onAddComment={onAddComment}
            />
          )}

        <div>
          <label
            htmlFor="event-notes"
            className="text-[12px] text-slate-500"
          >
            Event notes
          </label>
          <div
            id="event-notes"
            className="mt-1.5 min-h-16 rounded-md border border-dashed border-slate-200 bg-slate-50/50 px-2.5 py-2 text-[12px] leading-snug text-slate-500"
          >
            {event.notes}
            <span className="mt-1.5 block text-slate-400">
              Add reviewer notes here (placeholder)
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

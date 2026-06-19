"use client";

import { useCallback, useRef, useState } from "react";

import { EventDetailsCard } from "@/components/EventDetailsCard";
import { TimelinePanel } from "@/components/TimelinePanel";
import { cn } from "@/lib/utils";
import type {
  EvidenceFile,
  InvestigationStats,
  SeverityFilter,
  TimelineEvent,
  TimelineSourceFilter,
} from "@/types/claim";
import type { EvidenceReference } from "@/types/evidence-reference";

const MIN_PANEL_HEIGHT = 180;
const DEFAULT_TIMELINE_RATIO = 0.55;

interface RightInvestigationPanelProps {
  events: TimelineEvent[];
  evidenceFiles: EvidenceFile[];
  selectedEventId: string;
  selectedEvent: TimelineEvent | null;
  linkedEvidence: EvidenceFile[];
  onSelectEvent: (id: string) => void;
  sourceFilter: TimelineSourceFilter;
  severityFilter: SeverityFilter;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  onSourceFilterChange: (filter: TimelineSourceFilter) => void;
  onSeverityFilterChange: (filter: SeverityFilter) => void;
  stats: InvestigationStats;
  selectedEventHiddenByFilter: boolean;
  isVideoPlaying: boolean;
  playbackEvent: TimelineEvent | null;
  onCopySummary?: () => void;
  onPreviewEvidence?: (evidenceId: string) => void;
  onOpenEvidenceReference?: (reference: EvidenceReference) => void;
}

export function RightInvestigationPanel({
  events,
  evidenceFiles,
  selectedEventId,
  selectedEvent,
  linkedEvidence,
  onSelectEvent,
  sourceFilter,
  severityFilter,
  searchQuery,
  onSearchQueryChange,
  onSourceFilterChange,
  onSeverityFilterChange,
  stats,
  selectedEventHiddenByFilter,
  isVideoPlaying,
  playbackEvent,
  onCopySummary,
  onPreviewEvidence,
  onOpenEvidenceReference,
}: RightInvestigationPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [timelineRatio, setTimelineRatio] = useState(DEFAULT_TIMELINE_RATIO);
  const [isDragging, setIsDragging] = useState(false);

  const clampRatio = useCallback((ratio: number, containerHeight: number) => {
    const minRatio = MIN_PANEL_HEIGHT / containerHeight;
    return Math.max(minRatio, Math.min(1 - minRatio, ratio));
  }, []);

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      const container = containerRef.current;
      const handle = event.currentTarget;
      if (!container) return;

      setIsDragging(true);
      handle.setPointerCapture(event.pointerId);

      const handlePointerMove = (moveEvent: PointerEvent) => {
        const rect = container.getBoundingClientRect();
        const ratio = (moveEvent.clientY - rect.top) / rect.height;
        setTimelineRatio(clampRatio(ratio, rect.height));
      };

      const handlePointerUp = (upEvent: PointerEvent) => {
        setIsDragging(false);
        handle.releasePointerCapture(upEvent.pointerId);
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", handlePointerUp);
      };

      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
    },
    [clampRatio]
  );

  const detailsRatio = 1 - timelineRatio;

  return (
    <aside
      ref={containerRef}
      className="flex h-full min-h-0 flex-col overflow-hidden border-t border-border bg-white xl:border-t-0"
    >
      <div
        className="flex min-h-0 flex-col overflow-hidden"
        style={{ flex: `${timelineRatio} 1 0%`, minHeight: MIN_PANEL_HEIGHT }}
      >
        <TimelinePanel
          events={events}
          evidenceFiles={evidenceFiles}
          selectedEventId={selectedEventId}
          onSelectEvent={onSelectEvent}
          sourceFilter={sourceFilter}
          severityFilter={severityFilter}
          searchQuery={searchQuery}
          onSearchQueryChange={onSearchQueryChange}
          onSourceFilterChange={onSourceFilterChange}
          onSeverityFilterChange={onSeverityFilterChange}
          stats={stats}
          selectedEventHiddenByFilter={selectedEventHiddenByFilter}
          isVideoPlaying={isVideoPlaying}
          playbackEvent={playbackEvent}
          onPreviewEvidence={onPreviewEvidence}
        />
      </div>

      <div
        role="separator"
        aria-orientation="horizontal"
        aria-label="Resize timeline and event details panels"
        aria-valuenow={Math.round(timelineRatio * 100)}
        onPointerDown={handlePointerDown}
        className={cn(
          "group flex h-2.5 shrink-0 cursor-row-resize touch-none items-center justify-center border-y border-border bg-slate-50 transition-colors hover:bg-slate-100",
          isDragging && "bg-slate-200"
        )}
      >
        <div
          className={cn(
            "h-1 w-12 rounded-full bg-slate-300 transition-colors group-hover:bg-slate-400",
            isDragging && "bg-slate-500"
          )}
        />
      </div>

      <div
        className="flex min-h-0 flex-col overflow-hidden"
        style={{ flex: `${detailsRatio} 1 0%`, minHeight: MIN_PANEL_HEIGHT }}
      >
        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          <EventDetailsCard
            event={selectedEvent}
            linkedEvidence={linkedEvidence}
            hiddenByFilter={selectedEventHiddenByFilter}
            onCopySummary={onCopySummary}
            onPreviewEvidence={onPreviewEvidence}
            onOpenEvidenceReference={onOpenEvidenceReference}
          />
        </div>
      </div>
    </aside>
  );
}

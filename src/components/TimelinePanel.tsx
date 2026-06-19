"use client";

import { Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import {
  filterTimelineEvents,
  formatDurationLabel,
  severityStyles,
} from "@/lib/eventUtils";
import { cn } from "@/lib/utils";
import type {
  EvidenceFile,
  InvestigationStats,
  SeverityFilter,
  TimelineEvent,
  TimelineSourceFilter,
} from "@/types/claim";

interface TimelinePanelProps {
  events: TimelineEvent[];
  evidenceFiles: EvidenceFile[];
  selectedEventId: string;
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
}

const sourceOptions: { value: TimelineSourceFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "video", label: "Video" },
  { value: "telematics", label: "Telematics" },
  { value: "gps", label: "GPS" },
  { value: "police", label: "Police Report" },
  { value: "uploaded", label: "Uploaded Telemetry" },
];

const severityOptions: { value: SeverityFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "info", label: "Info" },
  { value: "moderate", label: "Moderate" },
  { value: "critical", label: "Critical" },
];

export function TimelinePanel({
  events,
  evidenceFiles,
  selectedEventId,
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
}: TimelinePanelProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const eventRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const [hoveredEventId, setHoveredEventId] = useState<string | null>(null);
  const previousSelectedRef = useRef(selectedEventId);

  const filteredEvents = filterTimelineEvents(
    events,
    evidenceFiles,
    sourceFilter,
    severityFilter,
    searchQuery
  );

  useEffect(() => {
    if (!isVideoPlaying || selectedEventId === previousSelectedRef.current) {
      previousSelectedRef.current = selectedEventId;
      return;
    }

    previousSelectedRef.current = selectedEventId;
    const node = eventRefs.current.get(selectedEventId);
    if (node) {
      node.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [selectedEventId, isVideoPlaying]);

  const hoveredEvent = hoveredEventId
    ? events.find((event) => event.id === hoveredEventId)
    : null;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b border-border px-3 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-[13px] font-medium text-slate-900">
            Event Timeline
          </h2>
          <span className="text-[11px] text-slate-500">
            Events: {stats.eventCount}
          </span>
        </div>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          Click an event to synchronize the investigation view
        </p>

        {isVideoPlaying && playbackEvent && (
          <div className="mt-2 rounded-md border border-sky-200 bg-sky-50/80 px-2 py-1.5">
            <p className="text-[10px] font-medium text-sky-700">
              Currently playing:
            </p>
            <p className="text-[11px] text-sky-900">
              {playbackEvent.timestamp} — {playbackEvent.title}
            </p>
          </div>
        )}

        <div className="relative mt-2">
          <Search className="pointer-events-none absolute top-1/2 left-2 size-3 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => onSearchQueryChange(event.target.value)}
            placeholder="Search events or sources..."
            className="h-7 w-full rounded-md border border-slate-200 bg-white pr-2 pl-7 text-[11px] text-slate-700 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-300"
          />
        </div>

        <div className="mt-2 grid grid-cols-2 gap-x-2 gap-y-0.5 rounded-md border border-slate-200 bg-slate-50/80 px-2 py-1.5 text-[10px] text-slate-600">
          <span>Sources: {stats.sourceCount}</span>
          <span>Duration: {formatDurationLabel(stats.durationSeconds)}</span>
          <span className="col-span-2">
            Peak speed: {stats.peakSpeedMph} mph
          </span>
        </div>

        <div className="mt-2 space-y-1.5">
          <FilterRow
            label="Source"
            value={sourceFilter}
            options={sourceOptions}
            onChange={onSourceFilterChange}
          />
          <FilterRow
            label="Severity"
            value={severityFilter}
            options={severityOptions}
            onChange={onSeverityFilterChange}
          />
        </div>

        {selectedEventHiddenByFilter && (
          <p className="mt-2 text-[10px] text-amber-700">
            Selected event is hidden by current filters.
          </p>
        )}
      </div>

      <div ref={scrollContainerRef} className="min-h-0 flex-1 overflow-y-auto">
        {filteredEvents.length === 0 ? (
          <p className="px-3 py-4 text-[12px] text-muted-foreground">
            No events match the current filters.
          </p>
        ) : (
          <div className="relative px-2.5 py-1.5">
            <div className="absolute top-1.5 bottom-1.5 left-[13px] w-px bg-slate-200" />
            <div className="space-y-0.5">
              {filteredEvents.map((event) => {
                const isSelected = event.id === selectedEventId;
                const linkedFiles = event.linkedEvidenceIds
                  .map((id) => evidenceFiles.find((file) => file.id === id))
                  .filter(Boolean) as EvidenceFile[];

                return (
                  <div key={event.id} className="relative">
                    <button
                      ref={(node) => {
                        if (node) {
                          eventRefs.current.set(event.id, node);
                        } else {
                          eventRefs.current.delete(event.id);
                        }
                      }}
                      type="button"
                      onClick={() => onSelectEvent(event.id)}
                      onMouseEnter={() => setHoveredEventId(event.id)}
                      onMouseLeave={() => setHoveredEventId(null)}
                      className={cn(
                        "relative w-full rounded-md border px-1.5 py-1 text-left transition-colors",
                        isSelected
                          ? "border-amber-300/70 bg-amber-50/70 ring-1 ring-amber-200/60"
                          : "border-transparent hover:border-slate-200 hover:bg-slate-50/80"
                      )}
                    >
                      <div
                        className={cn(
                          "absolute top-[9px] -left-[4px] size-2 rounded-full border border-white transition-colors",
                          isSelected
                            ? "bg-amber-500 ring-2 ring-amber-200/80"
                            : severityStyles[event.severity].dot
                        )}
                      />
                      <div className="pl-2">
                        <div className="flex items-baseline gap-1.5">
                          <p
                            className={cn(
                              "shrink-0 font-mono text-[10px] tabular-nums",
                              isSelected
                                ? "text-amber-800/80"
                                : "text-slate-500"
                            )}
                          >
                            {event.timestamp}
                          </p>
                          <p
                            className={cn(
                              "truncate text-[12px] font-medium",
                              isSelected ? "text-amber-950" : "text-slate-900"
                            )}
                          >
                            {event.title}
                          </p>
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-0.5">
                          <Badge
                            variant="outline"
                            className={cn(
                              "h-3.5 px-1 text-[8px] font-normal leading-none",
                              severityStyles[event.severity].badge
                            )}
                          >
                            {severityStyles[event.severity].label}
                          </Badge>
                          {event.isUploadedTelemetry && (
                            <Badge
                              variant="secondary"
                              className={cn(
                                "h-3.5 bg-sky-50 px-1 text-[8px] font-normal leading-none text-sky-700",
                                isSelected && "bg-amber-100 text-amber-900"
                              )}
                            >
                              Uploaded telemetry
                            </Badge>
                          )}
                          {linkedFiles.map((file) => (
                            <Badge
                              key={file.id}
                              variant="outline"
                              className={cn(
                                "h-3.5 bg-white px-1 text-[8px] font-normal leading-none",
                                isSelected
                                  ? "border-amber-200/80 text-amber-900/70"
                                  : "text-slate-600"
                              )}
                            >
                              {file.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </button>

                    {hoveredEventId === event.id && hoveredEvent && (
                      <EventHoverPreview
                        event={hoveredEvent}
                        linkedFiles={linkedFiles}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function EventHoverPreview({
  event,
  linkedFiles,
}: {
  event: TimelineEvent;
  linkedFiles: EvidenceFile[];
}) {
  return (
    <div className="pointer-events-none absolute top-0 right-full z-20 mr-2 w-52 rounded-md border border-slate-200 bg-white p-2 shadow-lg">
      <p className="font-mono text-[10px] text-slate-500">{event.timestamp}</p>
      <p className="mt-0.5 text-[11px] font-medium text-slate-900">
        {event.title}
      </p>
      <p className="mt-1 line-clamp-2 text-[10px] leading-snug text-slate-600">
        {event.description}
      </p>
      <p className="mt-1.5 text-[10px] text-slate-500">
        Severity: {severityStyles[event.severity].label}
      </p>
      <p className="mt-1 text-[10px] text-slate-500">
        Sources: {linkedFiles.map((file) => file.name).join(", ") || "—"}
      </p>
    </div>
  );
}

function FilterRow<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      <span className="w-12 shrink-0 text-[10px] text-muted-foreground">
        {label}
      </span>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            "rounded px-1.5 py-0.5 text-[10px] transition-colors",
            value === option.value
              ? "bg-slate-900 text-white"
              : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

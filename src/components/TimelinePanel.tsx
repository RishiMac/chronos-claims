"use client";

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
  onSourceFilterChange: (filter: TimelineSourceFilter) => void;
  onSeverityFilterChange: (filter: SeverityFilter) => void;
  stats: InvestigationStats;
  selectedEventHiddenByFilter: boolean;
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
  onSourceFilterChange,
  onSeverityFilterChange,
  stats,
  selectedEventHiddenByFilter,
}: TimelinePanelProps) {
  const filteredEvents = filterTimelineEvents(
    events,
    evidenceFiles,
    sourceFilter,
    severityFilter
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b border-border px-3 py-2.5">
        <h2 className="text-[13px] font-medium text-slate-900">
          Event Timeline
        </h2>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          Click an event to synchronize the investigation view
        </p>

        <div className="mt-2 grid grid-cols-2 gap-x-2 gap-y-0.5 rounded-md border border-slate-200 bg-slate-50/80 px-2 py-1.5 text-[10px] text-slate-600">
          <span>Events: {stats.eventCount}</span>
          <span>Sources: {stats.sourceCount}</span>
          <span>Duration: {formatDurationLabel(stats.durationSeconds)}</span>
          <span>Peak speed: {stats.peakSpeedMph} mph</span>
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

      <div className="min-h-0 flex-1 overflow-y-auto">
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
                  <button
                    key={event.id}
                    type="button"
                    onClick={() => onSelectEvent(event.id)}
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
                            isSelected ? "text-amber-800/80" : "text-slate-500"
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
                );
              })}
            </div>
          </div>
        )}
      </div>
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

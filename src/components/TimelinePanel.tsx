"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { EvidenceFile, TimelineEvent } from "@/types/claim";

interface TimelinePanelProps {
  events: TimelineEvent[];
  evidenceFiles: EvidenceFile[];
  selectedEventId: string;
  onSelectEvent: (id: string) => void;
}

export function TimelinePanel({
  events,
  evidenceFiles,
  selectedEventId,
  onSelectEvent,
}: TimelinePanelProps) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b border-border px-3 py-2.5">
        <h2 className="text-[13px] font-medium text-slate-900">
          Event Timeline
        </h2>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          Click an event to synchronize the investigation view
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="relative px-2.5 py-1.5">
          <div className="absolute top-1.5 bottom-1.5 left-[13px] w-px bg-slate-200" />
          <div className="space-y-0.5">
            {events.map((event) => {
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
                        : "bg-slate-300"
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
                    <div className="mt-0.5 flex flex-wrap gap-0.5">
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
      </div>
    </div>
  );
}

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
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 border-b border-border px-4 py-3">
        <h2 className="text-[13px] font-medium text-slate-900">
          Event Timeline
        </h2>
        <p className="mt-0.5 text-[12px] text-muted-foreground">
          Click an event to synchronize the investigation view
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="relative px-3 py-2">
          <div className="absolute top-2 bottom-2 left-[15px] w-px bg-slate-200" />
          <div className="space-y-1">
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
                    "relative w-full rounded-md border px-2 py-1.5 text-left transition-colors",
                    isSelected
                      ? "border-slate-300 bg-slate-50"
                      : "border-transparent hover:border-slate-200 hover:bg-slate-50/80"
                  )}
                >
                  <div
                    className={cn(
                      "absolute top-[11px] -left-[5px] size-2 rounded-full border border-white",
                      isSelected ? "bg-amber-500" : "bg-slate-300"
                    )}
                  />
                  <div className="pl-2">
                    <div className="flex items-baseline gap-2">
                      <p className="shrink-0 font-mono text-[11px] tabular-nums text-slate-500">
                        {event.timestamp}
                      </p>
                      <p className="truncate text-[13px] font-medium text-slate-900">
                        {event.title}
                      </p>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {linkedFiles.map((file) => (
                        <Badge
                          key={file.id}
                          variant="outline"
                          className="h-4 bg-white px-1.5 text-[9px] font-normal text-slate-600"
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

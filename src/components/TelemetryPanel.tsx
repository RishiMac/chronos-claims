"use client";

import { useState } from "react";

import { SpeedGraph } from "@/components/SpeedGraph";
import { TelemetryMetricsPanel } from "@/components/TelemetryMetricsPanel";
import { TelemetryRawDataView } from "@/components/TelemetryRawDataView";
import { cn } from "@/lib/utils";
import type { ParsedTelematics, SpeedDataPoint, TimelineEvent } from "@/types/claim";

interface TelemetryPanelProps {
  speedData: SpeedDataPoint[];
  parsedTelematics: ParsedTelematics | null;
  selectedEvent: TimelineEvent | null;
  hasUploadedTelematics: boolean;
}

type TelemetryView = "graph" | "raw";

export function TelemetryPanel({
  speedData,
  parsedTelematics,
  selectedEvent,
  hasUploadedTelematics,
}: TelemetryPanelProps) {
  const [view, setView] = useState<TelemetryView>("graph");

  return (
    <div className="space-y-3">
      {!hasUploadedTelematics && (
        <p className="text-[12px] text-muted-foreground">
          Using sample claim data. Upload a telematics CSV to parse, normalize,
          and generate synchronized events.
        </p>
      )}

      {parsedTelematics && parsedTelematics.warnings.length > 0 && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2">
          {parsedTelematics.warnings.slice(0, 3).map((warning) => (
            <p key={warning} className="text-[11px] leading-snug text-amber-800">
              {warning}
            </p>
          ))}
        </div>
      )}

      <TelemetryMetricsPanel parsedTelematics={parsedTelematics} />

      <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50/80 p-1">
        <button
          type="button"
          onClick={() => setView("graph")}
          className={cn(
            "rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors",
            view === "graph"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:bg-white/60"
          )}
        >
          Graph
        </button>
        <button
          type="button"
          onClick={() => setView("raw")}
          className={cn(
            "rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors",
            view === "raw"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:bg-white/60"
          )}
        >
          Raw Data
        </button>
      </div>

      {view === "graph" ? (
        <SpeedGraph
          data={speedData}
          highlightedMarkerId={selectedEvent?.markerId ?? null}
        />
      ) : (
        <TelemetryRawDataView records={parsedTelematics?.records ?? []} />
      )}
    </div>
  );
}

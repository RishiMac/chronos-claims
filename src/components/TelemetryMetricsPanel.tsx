"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatLabelForFormat } from "@/lib/telematics/parseTelemetryCsv";
import type { ParsedTelematics } from "@/types/claim";

interface TelemetryMetricsPanelProps {
  parsedTelematics: ParsedTelematics | null;
}

export function TelemetryMetricsPanel({
  parsedTelematics,
}: TelemetryMetricsPanelProps) {
  if (!parsedTelematics) return null;

  const { metrics, format } = parsedTelematics;

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="border-b border-slate-100 bg-slate-50/50 px-4 py-3">
        <CardTitle className="text-[13px] font-medium text-slate-900">
          Telemetry Metrics
        </CardTitle>
        <span className="text-[11px] text-muted-foreground">
          {formatLabelForFormat(format)} format · normalized records
        </span>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3">
        <Metric label="Peak speed" value={`${metrics.peakSpeedMph} mph`} />
        <Metric label="Average speed" value={`${metrics.averageSpeedMph} mph`} />
        <Metric label="Distance" value={`${metrics.distanceMiles} mi`} />
        <Metric label="Duration" value={`${metrics.durationSeconds}s`} />
        <Metric
          label="Hard braking events"
          value={String(metrics.hardBrakingEventCount)}
        />
        <Metric label="Stops" value={String(metrics.stopCount)} />
      </CardContent>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white px-3 py-2">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-[13px] font-medium text-slate-900">{value}</p>
    </div>
  );
}

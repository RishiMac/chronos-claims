"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { EvidenceFile, ParsedTelematics } from "@/types/claim";

interface CsvEvidenceViewerProps {
  file: EvidenceFile;
  parsedTelematics: ParsedTelematics | null;
}

export function CsvEvidenceViewer({
  file,
  parsedTelematics,
}: CsvEvidenceViewerProps) {
  const isLoaded =
    parsedTelematics !== null &&
    (parsedTelematics.evidenceId === file.id ||
      file.id === "ev-telematics");

  const rowCount = isLoaded
    ? parsedTelematics.rows.length
    : file.metadata.recordCount;
  const timeRange = isLoaded
    ? parsedTelematics.timeRange
    : file.metadata.timeRange;
  const detectedEvents = isLoaded
    ? parsedTelematics.detectedEvents.length
    : file.metadata.detectedEventCount;

  return (
    <Card className="overflow-hidden border-slate-200 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 bg-slate-50/50 px-4 py-3">
        <CardTitle className="text-[13px] font-medium text-slate-900">
          Telematics CSV
        </CardTitle>
        <span className="text-xs text-muted-foreground">
          {isLoaded ? "Parsed telemetry data" : "Metadata preview"}
        </span>
      </CardHeader>
      <CardContent className="space-y-3 p-4">
        <div className="rounded-md border border-slate-200 bg-white p-4 text-[12px] text-slate-600">
          <DetailRow label="Filename" value={file.name} />
          <DetailRow label="Source reference" value={file.metadata.source} />
          <DetailRow
            label="Row count"
            value={rowCount !== undefined ? String(rowCount) : "Not loaded"}
          />
          <DetailRow
            label="Time range"
            value={
              timeRange
                ? `${timeRange.start} – ${timeRange.end}`
                : "Load sample evidence to parse"
            }
          />
          <DetailRow
            label="Detected events"
            value={
              detectedEvents !== undefined
                ? String(detectedEvents)
                : "Not loaded"
            }
          />
        </div>

        {!isLoaded && (
          <p className="text-[12px] leading-snug text-muted-foreground">
            Use &quot;Load sample evidence&quot; or upload a telematics CSV to
            parse rows and generate synchronized timeline events.
          </p>
        )}

        {isLoaded && parsedTelematics.warnings.length > 0 && (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
            <p className="text-[11px] font-medium text-amber-800">Warnings</p>
            <ul className="mt-1 space-y-1">
              {parsedTelematics.warnings.slice(0, 3).map((warning) => (
                <li key={warning} className="text-[11px] text-amber-700">
                  {warning}
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="text-[12px] leading-relaxed text-slate-500">
          {file.metadata.description}
        </p>
      </CardContent>
    </Card>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 border-b border-slate-100 py-2 last:border-b-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium text-slate-800">{value}</span>
    </div>
  );
}

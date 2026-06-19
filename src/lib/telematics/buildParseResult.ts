import {
  formatDisplayTime,
  formatUploadedAt,
} from "@/lib/telematics/csvUtils";
import { computeTelemetryMetrics } from "@/lib/telematics/computeMetrics";
import type {
  TelematicsFormat,
  TelematicsParseResult,
  TelemetryRecord,
} from "@/types/telemetry";

export function buildParseResult({
  fileName,
  format,
  records,
  warnings,
}: {
  fileName: string;
  format: TelematicsFormat;
  records: TelemetryRecord[];
  warnings: string[];
}): TelematicsParseResult {
  const metrics = computeTelemetryMetrics(records);

  if (records.length > 0) {
    warnings.unshift(`Detected ${formatLabel(format)} telematics format.`);
  }

  return {
    fileName,
    format,
    records,
    uploadedAt: formatUploadedAt(new Date()),
    timeRange:
      records.length > 0
        ? {
            start: formatDisplayTime(records[0].date),
            end: formatDisplayTime(records[records.length - 1].date),
          }
        : { start: "—", end: "—" },
    warnings,
    metrics,
  };
}

function formatLabel(format: TelematicsFormat): string {
  switch (format) {
    case "samsara":
      return "Samsara";
    case "geotab":
      return "Geotab";
    case "verizon_connect":
      return "Verizon Connect";
    default:
      return "generic";
  }
}

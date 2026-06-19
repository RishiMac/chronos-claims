import { parseTelemetryCsv } from "@/lib/telematics/parseTelemetryCsv";
import type { TelematicsParseResult } from "@/types/telemetry";

export class TelematicsParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TelematicsParseError";
  }
}

export function validateTelematicsColumns(headers: string[]): boolean {
  const normalized = headers.map((header) => header.trim().toLowerCase());
  const hasTimestamp = normalized.some((header) =>
    ["timestamp", "time", "datetime", "date_time", "event_time", "event time"].includes(
      header
    )
  );
  const hasSpeed = normalized.some((header) =>
    ["speed", "speed_mph", "vehicle_speed", "vehicle speed"].includes(header)
  );
  return hasTimestamp && hasSpeed;
}

export function getMissingTelematicsColumns(headers: string[]): string[] {
  const missing: string[] = [];
  if (
    !headers.some((header) => /time|timestamp|datetime/i.test(header))
  ) {
    missing.push("timestamp");
  }
  if (!headers.some((header) => /speed/i.test(header))) {
    missing.push("speed");
  }
  return missing;
}

export function parseTelematicsCsv(
  csvText: string,
  fileName: string
): TelematicsParseResult & { rows: TelematicsParseResult["records"] } {
  const parsed = parseTelemetryCsv(csvText, fileName);
  return {
    ...parsed,
    rows: parsed.records,
  };
}

export function formatDisplayTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

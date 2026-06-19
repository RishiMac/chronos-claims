import { formatDisplayTime } from "@/lib/parseTelematicsCsv";
import type {
  EvidenceFile,
  MapMarker,
  ParsedTelematics,
  SpeedDataPoint,
  TimelineEvent,
  TelematicsRow,
} from "@/types/claim";

export function buildParsedTelematics(
  evidenceId: string,
  parsed: {
    fileName: string;
    rows: TelematicsRow[];
    uploadedAt: string;
    timeRange: { start: string; end: string };
    warnings: string[];
  },
  detectedEvents: TimelineEvent[]
): ParsedTelematics {
  return {
    evidenceId,
    fileName: parsed.fileName,
    rows: parsed.rows,
    uploadedAt: parsed.uploadedAt,
    timeRange: parsed.timeRange,
    detectedEvents,
    warnings: parsed.warnings,
    hasGpsCoordinates: parsed.rows.some(
      (row) => row.latitude !== undefined && row.longitude !== undefined
    ),
  };
}

export function enrichTelematicsEvidenceFile(
  evidence: EvidenceFile,
  parsed: ParsedTelematics,
  fileSizeBytes?: number
): EvidenceFile {
  return {
    ...evidence,
    status: "Processed",
    metadata: {
      ...evidence.metadata,
      fileSize: fileSizeBytes
        ? formatBytes(fileSizeBytes)
        : evidence.metadata.fileSize,
      source: evidence.isSampleFile
        ? evidence.metadata.source
        : "Uploaded telematics CSV",
      description: evidence.isSampleFile
        ? evidence.metadata.description
        : "Uploaded telemetry export parsed client-side to support synchronized review.",
      recordCount: parsed.rows.length,
      timeRange: parsed.timeRange,
      detectedEventCount: parsed.detectedEvents.length,
      warnings: parsed.warnings.length > 0 ? parsed.warnings : undefined,
    },
  };
}

export function mergeTimelineEvents(
  baselineEvents: TimelineEvent[],
  uploadedEvents: TimelineEvent[]
): TimelineEvent[] {
  const baselineWithSort = baselineEvents.map((event) => ({
    ...event,
    sortDate: event.sortDate ?? parseMockTimelineTimestamp(event.timestamp),
  }));

  return [...baselineWithSort, ...uploadedEvents].sort(
    (a, b) => (a.sortDate?.getTime() ?? 0) - (b.sortDate?.getTime() ?? 0)
  );
}

export function collectUploadedTimelineEvents(
  telematicsByEvidenceId: Record<string, ParsedTelematics>
): TimelineEvent[] {
  return Object.values(telematicsByEvidenceId).flatMap(
    (parsed) => parsed.detectedEvents
  );
}

export function telematicsRowsToSpeedData(
  rows: TelematicsRow[],
  events: TimelineEvent[]
): SpeedDataPoint[] {
  const eventByRowIndex = new Map<number, TimelineEvent>();
  for (const event of events) {
    if (event.rowIndex !== undefined) {
      eventByRowIndex.set(event.rowIndex, event);
    }
  }

  return rows.map((row, index) => {
    const event = eventByRowIndex.get(index);
    return {
      time: formatDisplayTime(row.date),
      speed: row.speedMph,
      markerId: event?.markerId,
      label: event ? shortEventLabel(event) : undefined,
      severity: event?.severity,
    };
  });
}

export function telematicsRowsToMapData(
  rows: TelematicsRow[],
  events: TimelineEvent[]
): {
  route: { x: number; y: number }[];
  markers: MapMarker[];
  hasGpsCoordinates: boolean;
} {
  const pointsWithCoords = rows
    .map((row, index) => ({ row, index }))
    .filter(
      ({ row }) => row.latitude !== undefined && row.longitude !== undefined
    );

  if (pointsWithCoords.length === 0) {
    return { route: [], markers: [], hasGpsCoordinates: false };
  }

  const latitudes = pointsWithCoords.map(({ row }) => row.latitude!);
  const longitudes = pointsWithCoords.map(({ row }) => row.longitude!);
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLng = Math.min(...longitudes);
  const maxLng = Math.max(...longitudes);
  const padding = 10;

  const normalize = (lat: number, lng: number) => ({
    x:
      padding +
      ((lng - minLng) / (maxLng - minLng || 1)) * (100 - padding * 2),
    y:
      padding +
      ((lat - minLat) / (maxLat - minLat || 1)) * (100 - padding * 2),
  });

  const route = pointsWithCoords.map(({ row }) =>
    normalize(row.latitude!, row.longitude!)
  );

  const markers = events
    .filter((event) => event.rowIndex !== undefined && event.isUploadedTelemetry)
    .map((event) => {
      const row = rows[event.rowIndex!];
      if (row.latitude === undefined || row.longitude === undefined) {
        return null;
      }

      const point = normalize(row.latitude, row.longitude);
      return {
        id: event.markerId,
        label: shortEventLabel(event),
        x: point.x,
        y: point.y,
        severity: event.severity,
      };
    })
    .filter((marker) => marker !== null) as MapMarker[];

  return {
    route,
    markers,
    hasGpsCoordinates: true,
  };
}

function shortEventLabel(event: TimelineEvent): string {
  if (event.title.includes("Peak")) return "Peak speed";
  if (event.title.includes("braking")) return "Hard braking";
  if (event.title.includes("stopped")) return "Stopped";
  return event.title;
}

function parseMockTimelineTimestamp(timestamp: string): Date {
  const match = timestamp.match(/(\d+):(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return new Date("2026-03-14T14:41:00");

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = Number(match[3]);
  const meridiem = match[4].toUpperCase();

  if (meridiem === "PM" && hours !== 12) hours += 12;
  if (meridiem === "AM" && hours === 12) hours = 0;

  return new Date(2026, 2, 14, hours, minutes, seconds);
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

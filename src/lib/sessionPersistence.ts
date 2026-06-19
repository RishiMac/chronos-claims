import type {
  EvidenceFile,
  InvestigationNote,
  InvestigationSessionExport,
  ParsedTelematics,
  SessionActivityEntry,
  SerializedTelematics,
  SeverityFilter,
  TimelineEvent,
  TimelineSourceFilter,
} from "@/types/claim";

interface BuildSessionExportInput {
  selectedEventId: string;
  selectedEvidenceId: string | null;
  activeVideoEvidenceId: string | null;
  sourceFilter: TimelineSourceFilter;
  severityFilter: SeverityFilter;
  searchQuery: string;
  notesDraft: string;
  notes: InvestigationNote[];
  activityLog: SessionActivityEntry[];
  evidenceFiles: EvidenceFile[];
  telematicsByEvidenceId: Record<string, ParsedTelematics>;
  timelineEvents: TimelineEvent[];
}

export function buildSessionExport(
  input: BuildSessionExportInput
): InvestigationSessionExport {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    selectedEventId: input.selectedEventId,
    selectedEvidenceId: input.selectedEvidenceId,
    activeVideoEvidenceId: input.activeVideoEvidenceId,
    sourceFilter: input.sourceFilter,
    severityFilter: input.severityFilter,
    searchQuery: input.searchQuery,
    notesDraft: input.notesDraft,
    notes: input.notes,
    activityLog: input.activityLog,
    evidenceFiles: input.evidenceFiles.map(stripObjectUrls),
    telematics: Object.values(input.telematicsByEvidenceId).map(
      serializeTelematics
    ),
    timelineEvents: input.timelineEvents.map(serializeTimelineEvent),
  };
}

export function downloadSessionExport(session: InvestigationSessionExport) {
  const blob = new Blob([JSON.stringify(session, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `chronos-session-${new Date().toISOString().slice(0, 10)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function parseSessionImport(text: string): InvestigationSessionExport {
  const parsed = JSON.parse(text) as InvestigationSessionExport;
  if (parsed.version !== 1) {
    throw new Error("Unsupported session file version.");
  }
  return parsed;
}

export function deserializeTelematics(
  serialized: SerializedTelematics
): ParsedTelematics {
  const rows = serialized.rows.map((row) => ({
    ...row,
    date: new Date(row.date),
  }));

  const detectedEvents: TimelineEvent[] = serialized.detectedEvents.map(
    (event) => ({
      ...event,
      sortDate: event.sortDate ? new Date(event.sortDate) : undefined,
    })
  );

  return {
    evidenceId: serialized.evidenceId,
    fileName: serialized.fileName,
    format: serialized.format ?? "generic",
    records: rows,
    rows,
    uploadedAt: serialized.uploadedAt,
    timeRange: serialized.timeRange,
    detectedEvents,
    hasGpsCoordinates: serialized.hasGpsCoordinates,
    warnings: serialized.warnings,
    metrics:
      serialized.metrics ?? {
        peakSpeedMph: rows.length
          ? Math.max(...rows.map((row) => row.speedMph))
          : 0,
        averageSpeedMph: 0,
        distanceMiles: 0,
        durationSeconds: 0,
        hardBrakingEventCount: 0,
        stopCount: 0,
      },
  };
}

export function deserializeTimelineEvents(
  events: InvestigationSessionExport["timelineEvents"]
): TimelineEvent[] {
  return events.map((event) => ({
    ...event,
    sortDate: event.sortDate ? new Date(event.sortDate) : undefined,
  }));
}

function serializeTelematics(parsed: ParsedTelematics): SerializedTelematics {
  return {
    evidenceId: parsed.evidenceId,
    fileName: parsed.fileName,
    format: parsed.format,
    uploadedAt: parsed.uploadedAt,
    timeRange: parsed.timeRange,
    hasGpsCoordinates: parsed.hasGpsCoordinates,
    warnings: parsed.warnings,
    metrics: parsed.metrics,
    rows: parsed.rows.map((row) => ({
      timestamp: row.timestamp,
      date: row.date.toISOString(),
      speedMph: row.speedMph,
      latitude: row.latitude,
      longitude: row.longitude,
      brakeStatus: row.brakeStatus,
      acceleration: row.acceleration,
      heading: row.heading,
    })),
    detectedEvents: parsed.detectedEvents.map(serializeTimelineEvent),
  };
}

function serializeTimelineEvent(
  event: TimelineEvent
): InvestigationSessionExport["timelineEvents"][number] {
  return {
    ...event,
    sortDate: event.sortDate?.toISOString(),
  };
}

function stripObjectUrls(file: EvidenceFile): EvidenceFile {
  const { objectUrl: _objectUrl, ...rest } = file;
  return rest;
}

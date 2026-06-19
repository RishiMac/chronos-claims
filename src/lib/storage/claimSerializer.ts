import type {
  EvidenceFile,
  ParsedTelematics,
  SerializedTelematics,
  TimelineEvent,
} from "@/types/claim";
import type { ClaimWorkspaceSnapshot, StoredClaim } from "@/types/stored-claim";

export function stripEvidenceForStorage(files: EvidenceFile[]): EvidenceFile[] {
  return files.map((file) => {
    const { objectUrl: _objectUrl, ...rest } = file;
    return rest;
  });
}

export function serializeTelematicsMap(
  telematicsByEvidenceId: Record<string, ParsedTelematics>
): SerializedTelematics[] {
  return Object.values(telematicsByEvidenceId).map((parsed) => ({
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
    detectedEvents: parsed.detectedEvents.map((event) => ({
      ...event,
      sortDate: event.sortDate?.toISOString(),
    })),
  }));
}

export function deserializeTelematicsMap(
  telematics: SerializedTelematics[]
): Record<string, ParsedTelematics> {
  return telematics.reduce<Record<string, ParsedTelematics>>(
    (accumulator, serialized) => {
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

      accumulator[serialized.evidenceId] = {
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
        metrics: serialized.metrics ?? {
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
      return accumulator;
    },
    {}
  );
}

export function buildStoredClaimSnapshot(
  stored: StoredClaim,
  workspace: ClaimWorkspaceSnapshot
): StoredClaim {
  return {
    ...stored,
    evidenceFiles: stripEvidenceForStorage(workspace.evidenceFiles),
    telematics: workspace.telematics,
    selectedEventId: workspace.selectedEventId,
    selectedEvidenceId: workspace.selectedEvidenceId,
    activeVideoEvidenceId: workspace.activeVideoEvidenceId,
    sampleEvidenceLoaded: workspace.sampleEvidenceLoaded,
    notesDraft: workspace.notesDraft,
    sourceFilter: workspace.sourceFilter,
    severityFilter: workspace.severityFilter,
    searchQuery: workspace.searchQuery,
  };
}

export function workspaceFromStored(stored: StoredClaim): {
  evidenceFiles: EvidenceFile[];
  telematicsByEvidenceId: Record<string, ParsedTelematics>;
  selectedEventId: string;
  selectedEvidenceId: string | null;
  activeVideoEvidenceId: string | null;
  sampleEvidenceLoaded: boolean;
  notesDraft: string;
  sourceFilter: StoredClaim["sourceFilter"];
  severityFilter: StoredClaim["severityFilter"];
  searchQuery: string;
} {
  return {
    evidenceFiles: stored.evidenceFiles,
    telematicsByEvidenceId: deserializeTelematicsMap(stored.telematics),
    selectedEventId: stored.selectedEventId,
    selectedEvidenceId: stored.selectedEvidenceId,
    activeVideoEvidenceId: stored.activeVideoEvidenceId,
    sampleEvidenceLoaded: stored.sampleEvidenceLoaded,
    notesDraft: stored.notesDraft,
    sourceFilter: stored.sourceFilter ?? "all",
    severityFilter: stored.severityFilter ?? "all",
    searchQuery: stored.searchQuery ?? "",
  };
}

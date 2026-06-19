import type {
  EventSeverity,
  EvidenceFile,
  InvestigationStats,
  ParsedTelematics,
  SeverityFilter,
  TimelineEvent,
  TimelineSourceFilter,
} from "@/types/claim";

export const severityStyles: Record<
  EventSeverity,
  { badge: string; dot: string; label: string }
> = {
  info: {
    badge: "bg-slate-100 text-slate-600 border-slate-200",
    dot: "bg-slate-400",
    label: "Info",
  },
  moderate: {
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
    label: "Moderate",
  },
  critical: {
    badge: "bg-red-50 text-red-700 border-red-200",
    dot: "bg-red-500",
    label: "Critical",
  },
};

export function formatSeconds(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function formatDurationLabel(seconds: number): string {
  if (seconds < 60) return `${seconds} sec`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
}

export function eventMatchesSourceFilter(
  event: TimelineEvent,
  evidenceFiles: EvidenceFile[],
  filter: TimelineSourceFilter
): boolean {
  if (filter === "all") return true;
  if (filter === "uploaded") return event.isUploadedTelemetry === true;

  const linked = evidenceFiles.filter((file) =>
    event.linkedEvidenceIds.includes(file.id)
  );

  switch (filter) {
    case "video":
      return linked.some((file) => file.fileType === "video");
    case "telematics":
      return linked.some(
        (file) =>
          file.id === "ev-telematics" ||
          (file.fileType === "csv" &&
            file.id !== "ev-gps" &&
            !file.name.toLowerCase().includes("gps"))
      );
    case "gps":
      return linked.some(
        (file) =>
          file.id === "ev-gps" || file.name.toLowerCase().includes("gps")
      );
    case "police":
      return linked.some(
        (file) =>
          file.id === "ev-police" ||
          file.name.toLowerCase().includes("police")
      );
    case "ai":
      return event.isAiGenerated === true;
    default:
      return true;
  }
}

export function eventMatchesSeverityFilter(
  event: TimelineEvent,
  filter: SeverityFilter
): boolean {
  if (filter === "all") return true;
  return event.severity === filter;
}

export function filterTimelineEvents(
  events: TimelineEvent[],
  evidenceFiles: EvidenceFile[],
  sourceFilter: TimelineSourceFilter,
  severityFilter: SeverityFilter,
  searchQuery = ""
): TimelineEvent[] {
  const normalizedQuery = searchQuery.trim().toLowerCase();

  return events.filter((event) => {
    if (!eventMatchesSourceFilter(event, evidenceFiles, sourceFilter)) {
      return false;
    }
    if (!eventMatchesSeverityFilter(event, severityFilter)) {
      return false;
    }
    if (!normalizedQuery) return true;
    return eventMatchesSearchQuery(event, evidenceFiles, normalizedQuery);
  });
}

function eventMatchesSearchQuery(
  event: TimelineEvent,
  evidenceFiles: EvidenceFile[],
  query: string
): boolean {
  const linkedNames = event.linkedEvidenceIds
    .map((id) => evidenceFiles.find((file) => file.id === id)?.name ?? "")
    .join(" ");

  const haystack = [
    event.title,
    event.description,
    event.notes,
    linkedNames,
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(query);
}

export function computeInvestigationStats(
  events: TimelineEvent[],
  parsedTelematics: ParsedTelematics | null
): InvestigationStats {
  const sourceIds = new Set<string>();
  for (const event of events) {
    for (const id of event.linkedEvidenceIds) {
      sourceIds.add(id);
    }
  }

  if (parsedTelematics && parsedTelematics.records.length > 0) {
    const metrics = parsedTelematics.metrics;
    const start = parsedTelematics.records[0].date.getTime();
    const end =
      parsedTelematics.records[parsedTelematics.records.length - 1].date.getTime();
    return {
      eventCount: events.length,
      sourceCount: sourceIds.size,
      durationSeconds: metrics.durationSeconds || Math.max(1, Math.round((end - start) / 1000)),
      peakSpeedMph: metrics.peakSpeedMph,
    };
  }

  const offsets = events.map((event) => event.videoOffsetSeconds);
  const minOffset = Math.min(...offsets);
  const maxOffset = Math.max(...offsets);

  return {
    eventCount: events.length,
    sourceCount: sourceIds.size,
    durationSeconds: Math.max(1, Math.round(maxOffset - minOffset)),
    peakSpeedMph: 42,
  };
}

export function findActiveEventForPlayback(
  events: TimelineEvent[],
  currentTime: number
): TimelineEvent | null {
  if (events.length === 0) return null;

  const sorted = [...events].sort(
    (a, b) => a.videoOffsetSeconds - b.videoOffsetSeconds
  );

  let active = sorted[0];
  for (const event of sorted) {
    if (event.videoOffsetSeconds <= currentTime + 0.25) {
      active = event;
    } else {
      break;
    }
  }

  return active;
}

export function computeVideoDuration(
  events: TimelineEvent[],
  parsedTelematics: ParsedTelematics | null
): number {
  if (parsedTelematics && parsedTelematics.records.length > 0) {
    return Math.max(16, parsedTelematics.metrics.durationSeconds + 2);
  }

  const maxOffset = Math.max(...events.map((event) => event.videoOffsetSeconds));
  return Math.max(16, maxOffset + 2);
}

export function buildEventNoteInsert(
  event: TimelineEvent,
  evidenceFiles: EvidenceFile[]
): string {
  const sources = event.linkedEvidenceIds
    .map((id) => evidenceFiles.find((file) => file.id === id)?.name)
    .filter(Boolean)
    .join(", ");

  return `[${event.timestamp}] ${event.title} — source references: ${sources}`;
}

export function buildEventSummaryCopy(
  event: TimelineEvent,
  linkedEvidence: EvidenceFile[]
): string {
  const sources = linkedEvidence.map((file) => file.name).join("\n");

  return `${event.timestamp}
${event.title}

Sources:
${sources}

Confidence: ${event.confidence}

Notes:
${event.notes}`;
}

export function formatActivityTimestamp(date = new Date()): string {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

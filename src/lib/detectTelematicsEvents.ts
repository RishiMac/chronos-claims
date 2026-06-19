import { formatDisplayTime } from "@/lib/telematics/csvUtils";
import { countHardBrakingEvents } from "@/lib/telematics/computeMetrics";
import type { ConfidenceLevel, TimelineEvent } from "@/types/claim";
import type { TelemetryRecord } from "@/types/telemetry";

export function detectTelematicsEvents(
  records: TelemetryRecord[],
  evidenceFileId: string
): TimelineEvent[] {
  if (records.length === 0) return [];

  const start = records[0].date;
  const end = records[records.length - 1].date;
  const events: TimelineEvent[] = [];

  const peakRow = records.reduce((currentPeak, row) =>
    row.speedMph > currentPeak.speedMph ? row : currentPeak
  );
  events.push(
    buildEvent({
      id: `${evidenceFileId}-peak-speed`,
      markerId: `${evidenceFileId}-peak-speed`,
      rowIndex: records.indexOf(peakRow),
      row: peakRow,
      title: "Peak speed recorded",
      description: `Uploaded telemetry indicates peak recorded speed of ${peakRow.speedMph} mph during the incident window.`,
      confidence: "High",
      severity: "info",
      evidenceFileId,
      start,
      end,
      notes: "Peak speed derived from normalized telemetry for human review.",
    })
  );

  const hardBraking = findHardBrakingEvent(records);
  if (hardBraking) {
    events.push(
      buildEvent({
        id: `${evidenceFileId}-hard-braking`,
        markerId: `${evidenceFileId}-hard-braking`,
        rowIndex: hardBraking.endIndex,
        row: records[hardBraking.endIndex],
        title: "Hard braking detected",
        description: `Telemetry indicates a speed decrease from ${hardBraking.fromSpeed} mph to ${hardBraking.toSpeed} mph over ${hardBraking.durationSeconds.toFixed(1)} seconds.`,
        confidence: hardBraking.confidence,
        severity: "moderate",
        evidenceFileId,
        start,
        end,
        notes: `Hard braking events in file: ${countHardBrakingEvents(records)}. Requires human review.`,
      })
    );
  }

  const harshAccel = findHarshAccelerationEvent(records);
  if (harshAccel) {
    events.push(
      buildEvent({
        id: `${evidenceFileId}-harsh-acceleration`,
        markerId: `${evidenceFileId}-harsh-acceleration`,
        rowIndex: harshAccel.endIndex,
        row: records[harshAccel.endIndex],
        title: "Harsh acceleration detected",
        description: `Telemetry indicates speed increased from ${harshAccel.fromSpeed} mph to ${harshAccel.toSpeed} mph over ${harshAccel.durationSeconds.toFixed(1)} seconds.`,
        confidence: harshAccel.confidence,
        severity: "moderate",
        evidenceFileId,
        start,
        end,
        notes: "Acceleration pattern detected in uploaded telemetry for reviewer verification.",
      })
    );
  }

  const stoppedIndex = records.findIndex((row) => row.speedMph <= 1);
  if (stoppedIndex >= 0) {
    events.push(
      buildEvent({
        id: `${evidenceFileId}-vehicle-stopped`,
        markerId: `${evidenceFileId}-vehicle-stopped`,
        rowIndex: stoppedIndex,
        row: records[stoppedIndex],
        title: "Vehicle stopped",
        description:
          "Uploaded telemetry shows vehicle speed reached 0 mph or near-zero speed.",
        confidence: "High",
        severity: "info",
        evidenceFileId,
        start,
        end,
        notes: "Stop event recorded in normalized telemetry at this timestamp.",
      })
    );
  }

  const nearStopIndex = records.findIndex(
    (row) => row.speedMph > 1 && row.speedMph <= 5
  );
  if (nearStopIndex >= 0 && nearStopIndex !== stoppedIndex) {
    events.push(
      buildEvent({
        id: `${evidenceFileId}-near-stop`,
        markerId: `${evidenceFileId}-near-stop`,
        rowIndex: nearStopIndex,
        row: records[nearStopIndex],
        title: "Near stop recorded",
        description: `Telemetry indicates speed near ${records[nearStopIndex].speedMph} mph, supporting review of low-speed maneuvering.`,
        confidence: "Medium",
        severity: "info",
        evidenceFileId,
        start,
        end,
        notes: "Near-stop reading supports review without implying a full stop.",
      })
    );
  }

  const recovery = findSpeedRecoveryEvent(records, hardBraking?.endIndex);
  if (recovery) {
    events.push(
      buildEvent({
        id: `${evidenceFileId}-speed-recovery`,
        markerId: `${evidenceFileId}-speed-recovery`,
        rowIndex: recovery.index,
        row: records[recovery.index],
        title: "Speed recovery detected",
        description: `Telemetry indicates speed recovered to ${recovery.toSpeed} mph after deceleration.`,
        confidence: "Medium",
        severity: "info",
        evidenceFileId,
        start,
        end,
        notes: "Speed recovery pattern supports review of post-braking movement.",
      })
    );
  }

  return events.sort(
    (a, b) => (a.sortDate?.getTime() ?? 0) - (b.sortDate?.getTime() ?? 0)
  );
}

function findHardBrakingEvent(records: TelemetryRecord[]) {
  return findSpeedChangeEvent(records, "decrease", 10, 2);
}

function findHarshAccelerationEvent(records: TelemetryRecord[]) {
  return findSpeedChangeEvent(records, "increase", 10, 2);
}

function findSpeedChangeEvent(
  records: TelemetryRecord[],
  direction: "decrease" | "increase",
  threshold: number,
  maxWindowSec: number
) {
  let best:
    | {
        startIndex: number;
        endIndex: number;
        fromSpeed: number;
        toSpeed: number;
        durationSeconds: number;
        confidence: ConfidenceLevel;
      }
    | undefined;

  for (let startIndex = 0; startIndex < records.length; startIndex++) {
    for (let endIndex = startIndex + 1; endIndex < records.length; endIndex++) {
      const durationSeconds =
        (records[endIndex].date.getTime() - records[startIndex].date.getTime()) /
        1000;
      if (durationSeconds > maxWindowSec) break;

      const change =
        direction === "decrease"
          ? records[startIndex].speedMph - records[endIndex].speedMph
          : records[endIndex].speedMph - records[startIndex].speedMph;

      if (change < threshold) continue;

      const candidate = {
        startIndex,
        endIndex,
        fromSpeed: records[startIndex].speedMph,
        toSpeed: records[endIndex].speedMph,
        durationSeconds,
        confidence:
          durationSeconds <= 1.5 ? ("High" as const) : ("Medium" as const),
      };

      if (!best || change > Math.abs(best.fromSpeed - best.toSpeed)) {
        best = candidate;
      }
    }
  }

  return best;
}

function findSpeedRecoveryEvent(
  records: TelemetryRecord[],
  afterIndex?: number
) {
  if (afterIndex === undefined) return null;

  const baseRow = records[afterIndex];
  if (!baseRow) return null;

  for (let index = afterIndex + 1; index < records.length; index++) {
    const durationSeconds =
      (records[index].date.getTime() - baseRow.date.getTime()) / 1000;
    if (durationSeconds > 8) break;

    const gain = records[index].speedMph - baseRow.speedMph;
    if (gain >= 8) {
      return {
        index,
        toSpeed: records[index].speedMph,
      };
    }
  }

  return null;
}

function buildEvent({
  id,
  markerId,
  rowIndex,
  row,
  title,
  description,
  confidence,
  severity,
  evidenceFileId,
  start,
  end,
  notes,
}: {
  id: string;
  markerId: string;
  rowIndex: number;
  row: TelemetryRecord;
  title: string;
  description: string;
  confidence: ConfidenceLevel;
  severity: TimelineEvent["severity"];
  evidenceFileId: string;
  start: Date;
  end: Date;
  notes: string;
}): TimelineEvent {
  const videoOffsetSeconds = (row.date.getTime() - start.getTime()) / 1000;

  return {
    id,
    markerId,
    rowIndex,
    timestamp: formatDisplayTime(row.date),
    title,
    description,
    confidence,
    severity,
    linkedEvidenceIds: [evidenceFileId],
    notes,
    isUploadedTelemetry: true,
    sortDate: row.date,
    videoProgress: computeVideoProgress(row.date, start, end),
    videoOffsetSeconds,
  };
}

function computeVideoProgress(eventDate: Date, start: Date, end: Date): number {
  const total = end.getTime() - start.getTime();
  if (total <= 0) return 50;
  const elapsed = eventDate.getTime() - start.getTime();
  return Math.max(5, Math.min(95, Math.round((elapsed / total) * 100)));
}

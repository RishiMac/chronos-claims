import { formatDisplayTime } from "@/lib/parseTelematicsCsv";
import type { ConfidenceLevel, TelematicsRow, TimelineEvent } from "@/types/claim";

const UPLOADED_EVIDENCE_ID = "ev-uploaded-telematics";

export function detectTelematicsEvents(
  rows: TelematicsRow[],
  evidenceFileId: string = UPLOADED_EVIDENCE_ID
): TimelineEvent[] {
  if (rows.length === 0) return [];

  const start = rows[0].date;
  const end = rows[rows.length - 1].date;
  const events: TimelineEvent[] = [];

  const peakRow = rows.reduce((currentPeak, row) =>
    row.speedMph > currentPeak.speedMph ? row : currentPeak
  );
  const peakIndex = rows.indexOf(peakRow);

  events.push(
    buildEvent({
      id: "telem-peak-speed",
      markerId: "telem-peak-speed",
      rowIndex: peakIndex,
      row: peakRow,
      title: "Peak speed recorded",
      description: `Telematics export shows peak recorded speed of ${peakRow.speedMph} mph during the uploaded incident window.`,
      confidence: "High",
      severity: "info",
      evidenceFileId,
      start,
      end,
      notes:
        "Peak speed derived from uploaded telemetry and intended to support human review.",
    })
  );

  const hardBraking = findHardBrakingEvent(rows);
  if (hardBraking) {
    events.push(
      buildEvent({
        id: "telem-hard-braking",
        markerId: "telem-hard-braking",
        rowIndex: hardBraking.endIndex,
        row: rows[hardBraking.endIndex],
        title: "Hard braking detected",
        description: `Telematics export shows speed decreased from ${hardBraking.fromSpeed} mph to ${hardBraking.toSpeed} mph over ${hardBraking.durationSeconds.toFixed(1)} seconds.`,
        confidence: hardBraking.confidence,
        severity: "moderate",
        evidenceFileId,
        start,
        end,
        notes:
          "Deceleration pattern detected in uploaded telemetry for reviewer verification.",
      })
    );
  }

  const stoppedIndex = rows.findIndex((row) => row.speedMph <= 1);
  if (stoppedIndex >= 0) {
    const stoppedRow = rows[stoppedIndex];
    events.push(
      buildEvent({
        id: "telem-vehicle-stopped",
        markerId: "telem-vehicle-stopped",
        rowIndex: stoppedIndex,
        row: stoppedRow,
        title: "Vehicle stopped",
        description:
          "Telematics export shows vehicle speed reached 0 mph or near-zero speed.",
        confidence: "High",
        severity: "info",
        evidenceFileId,
        start,
        end,
        notes:
          "Near-zero speed reading recorded in uploaded telemetry at this timestamp.",
      })
    );
  }

  return events.sort((a, b) => (a.sortDate?.getTime() ?? 0) - (b.sortDate?.getTime() ?? 0));
}

function findHardBrakingEvent(rows: TelematicsRow[]) {
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

  for (let startIndex = 0; startIndex < rows.length; startIndex++) {
    for (let endIndex = startIndex + 1; endIndex < rows.length; endIndex++) {
      const durationSeconds =
        (rows[endIndex].date.getTime() - rows[startIndex].date.getTime()) / 1000;

      if (durationSeconds > 2) break;

      const drop = rows[startIndex].speedMph - rows[endIndex].speedMph;
      if (drop < 10) continue;

      const candidate = {
        startIndex,
        endIndex,
        fromSpeed: rows[startIndex].speedMph,
        toSpeed: rows[endIndex].speedMph,
        durationSeconds,
        confidence: durationSeconds <= 1.5 ? ("High" as const) : ("Medium" as const),
      };

      if (
        !best ||
        drop > best.fromSpeed - best.toSpeed ||
        (drop === best.fromSpeed - best.toSpeed &&
          candidate.durationSeconds < best.durationSeconds)
      ) {
        best = candidate;
      }
    }
  }

  return best;
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
  row: TelematicsRow;
  title: string;
  description: string;
  confidence: ConfidenceLevel;
  severity: TimelineEvent["severity"];
  evidenceFileId: string;
  start: Date;
  end: Date;
  notes: string;
}): TimelineEvent {
  const videoOffsetSeconds =
    (row.date.getTime() - start.getTime()) / 1000;

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

export { UPLOADED_EVIDENCE_ID };

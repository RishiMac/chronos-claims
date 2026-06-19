import type { TelemetryMetrics, TelemetryRecord } from "@/types/telemetry";

const HARD_BRAKE_DROP_MPH = 10;
const HARD_BRAKE_WINDOW_SEC = 2;
const STOP_SPEED_MPH = 1;

export function computeTelemetryMetrics(
  records: TelemetryRecord[]
): TelemetryMetrics {
  if (records.length === 0) {
    return {
      peakSpeedMph: 0,
      averageSpeedMph: 0,
      distanceMiles: 0,
      durationSeconds: 0,
      hardBrakingEventCount: 0,
      stopCount: 0,
    };
  }

  const speeds = records.map((record) => record.speedMph);
  const peakSpeedMph = Math.max(...speeds);
  const averageSpeedMph =
    speeds.reduce((sum, speed) => sum + speed, 0) / speeds.length;

  const start = records[0].date.getTime();
  const end = records[records.length - 1].date.getTime();
  const durationSeconds = Math.max(1, Math.round((end - start) / 1000));

  return {
    peakSpeedMph: Math.round(peakSpeedMph * 10) / 10,
    averageSpeedMph: Math.round(averageSpeedMph * 10) / 10,
    distanceMiles: Math.round(estimateDistanceMiles(records) * 100) / 100,
    durationSeconds,
    hardBrakingEventCount: countHardBrakingEvents(records),
    stopCount: countStops(records),
  };
}

function estimateDistanceMiles(records: TelemetryRecord[]): number {
  let distanceMiles = 0;

  for (let index = 1; index < records.length; index++) {
    const previous = records[index - 1];
    const current = records[index];
    const deltaHours =
      (current.date.getTime() - previous.date.getTime()) / 3_600_000;

    if (
      previous.latitude !== undefined &&
      previous.longitude !== undefined &&
      current.latitude !== undefined &&
      current.longitude !== undefined
    ) {
      distanceMiles += haversineMiles(
        previous.latitude,
        previous.longitude,
        current.latitude,
        current.longitude
      );
    } else {
      const avgSpeed = (previous.speedMph + current.speedMph) / 2;
      distanceMiles += avgSpeed * deltaHours;
    }
  }

  return distanceMiles;
}

function haversineMiles(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthRadiusMiles = 3958.8;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * earthRadiusMiles * Math.asin(Math.sqrt(a));
}

export function countHardBrakingEvents(records: TelemetryRecord[]): number {
  let count = 0;
  const seen = new Set<number>();

  for (let startIndex = 0; startIndex < records.length; startIndex++) {
    for (let endIndex = startIndex + 1; endIndex < records.length; endIndex++) {
      const durationSeconds =
        (records[endIndex].date.getTime() - records[startIndex].date.getTime()) /
        1000;
      if (durationSeconds > HARD_BRAKE_WINDOW_SEC) break;

      const drop = records[startIndex].speedMph - records[endIndex].speedMph;
      if (drop >= HARD_BRAKE_DROP_MPH && !seen.has(endIndex)) {
        seen.add(endIndex);
        count += 1;
        break;
      }
    }
  }

  return count;
}

function countStops(records: TelemetryRecord[]): number {
  let count = 0;
  let inStop = false;

  for (const record of records) {
    if (record.speedMph <= STOP_SPEED_MPH) {
      if (!inStop) {
        count += 1;
        inStop = true;
      }
    } else {
      inStop = false;
    }
  }

  return count;
}

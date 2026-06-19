import {
  detectColumnIndex,
  GEOTAB_COLUMNS,
  GENERIC_COLUMNS,
  normalizeHeaders,
  SAMSARA_COLUMNS,
  VERIZON_COLUMNS,
} from "@/lib/telematics/columnMappings";
import type { TelematicsFormat } from "@/types/telemetry";

export function detectCsvFormat(headers: string[]): TelematicsFormat {
  const normalized = normalizeHeaders(headers);
  const joined = normalized.join("|");

  const samsaraScore = scoreFormat(normalized, SAMSARA_COLUMNS, [
    "gps_latitude",
    "gps_longitude",
    "vehicle_speed",
    "event_time",
    "harsh_brake",
    "harsh_accel",
  ]);
  const geotabScore = scoreFormat(normalized, GEOTAB_COLUMNS, [
    "datetime",
    "bearing",
    "brakepedalon",
    "device",
  ]);
  const verizonScore = scoreFormat(normalized, VERIZON_COLUMNS, [
    "event time",
    "vehicle speed",
    "brake status",
  ]);

  if (joined.includes("samsara") || samsaraScore >= 3) return "samsara";
  if (joined.includes("geotab") || geotabScore >= 3) return "geotab";
  if (
    joined.includes("verizon") ||
    joined.includes("networkfleet") ||
    verizonScore >= 3
  ) {
    return "verizon_connect";
  }

  if (samsaraScore > geotabScore && samsaraScore > verizonScore && samsaraScore >= 2) {
    return "samsara";
  }
  if (geotabScore > verizonScore && geotabScore >= 2) return "geotab";
  if (verizonScore >= 2) return "verizon_connect";

  return "generic";
}

function scoreFormat(
  normalized: string[],
  mapping: Record<string, string[]>,
  signatures: string[]
): number {
  const columns = detectColumnIndex(normalized, mapping);
  let score = 0;
  if (columns.timestamp >= 0) score += 1;
  if (columns.speed >= 0) score += 1;
  if (columns.latitude >= 0) score += 1;
  if (columns.longitude >= 0) score += 1;
  for (const signature of signatures) {
    if (normalized.includes(signature)) score += 1;
  }
  return score;
}

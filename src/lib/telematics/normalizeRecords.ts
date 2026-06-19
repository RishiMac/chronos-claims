import type { ColumnIndex } from "@/lib/telematics/columnMappings";
import {
  formatDisplayTime,
  getValue,
  parseBooleanValue,
  parseCsvLine,
  parseTimestamp,
} from "@/lib/telematics/csvUtils";
import type { TelemetryRecord } from "@/types/telemetry";

interface NormalizeOptions {
  lines: string[];
  columnIndex: ColumnIndex;
  formatLabel: string;
}

export function normalizeRecordsFromCsv({
  lines,
  columnIndex,
  formatLabel,
}: NormalizeOptions): {
  records: TelemetryRecord[];
  warnings: string[];
} {
  const warnings: string[] = [];

  if (columnIndex.timestamp < 0) {
    warnings.push("No timestamp column detected. Timeline events cannot be generated.");
  }
  if (columnIndex.speed < 0) {
    warnings.push("No speed column detected. Speed-based events cannot be generated.");
  }
  if (columnIndex.latitude < 0 || columnIndex.longitude < 0) {
    warnings.push("GPS coordinates not found. Map route will not be available.");
  }
  if (columnIndex.acceleration < 0) {
    warnings.push("Acceleration column not found.");
  }
  if (columnIndex.heading < 0) {
    warnings.push("Heading column not found.");
  }

  if (columnIndex.timestamp < 0 || columnIndex.speed < 0) {
    return { records: [], warnings };
  }

  const records: TelemetryRecord[] = [];

  for (let lineIndex = 1; lineIndex < lines.length; lineIndex++) {
    const rowValues = parseCsvLine(lines[lineIndex]);
    if (rowValues.every((value) => value.length === 0)) continue;

    const timestampRaw = getValue(rowValues, columnIndex.timestamp);
    if (!timestampRaw) {
      warnings.push(`Row ${lineIndex + 1} skipped: missing timestamp.`);
      continue;
    }

    const date = parseTimestamp(timestampRaw);
    if (!date) {
      warnings.push(
        `Row ${lineIndex + 1} skipped: invalid timestamp "${timestampRaw}".`
      );
      continue;
    }

    const speedRaw = getValue(rowValues, columnIndex.speed);
    if (!speedRaw) {
      warnings.push(`Row ${lineIndex + 1} skipped: missing speed value.`);
      continue;
    }

    const speedMph = Number(speedRaw);
    if (!Number.isFinite(speedMph)) {
      warnings.push(`Row ${lineIndex + 1} skipped: invalid speed "${speedRaw}".`);
      continue;
    }

    const latitude = parseOptionalNumber(
      getValue(rowValues, columnIndex.latitude),
      lineIndex,
      "latitude",
      warnings
    );
    const longitude = parseOptionalNumber(
      getValue(rowValues, columnIndex.longitude),
      lineIndex,
      "longitude",
      warnings
    );
    const acceleration = parseOptionalNumber(
      getValue(rowValues, columnIndex.acceleration),
      lineIndex,
      "acceleration",
      warnings
    );
    const heading = parseOptionalNumber(
      getValue(rowValues, columnIndex.heading),
      lineIndex,
      "heading",
      warnings
    );
    const brakeRaw = getValue(rowValues, columnIndex.brake);
    const brakeStatus =
      brakeRaw !== undefined ? parseBooleanValue(brakeRaw) : undefined;

    records.push({
      timestamp: formatDisplayTime(date),
      date,
      speedMph,
      latitude,
      longitude,
      acceleration,
      heading,
      brakeStatus,
    });
  }

  if (records.length === 0) {
    warnings.push(
      `No valid telemetry rows were parsed from this ${formatLabel} CSV.`
    );
  } else {
    records.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  return { records, warnings };
}

function parseOptionalNumber(
  raw: string | undefined,
  lineIndex: number,
  label: string,
  warnings: string[]
): number | undefined {
  if (raw === undefined || raw.length === 0) return undefined;
  const value = Number(raw);
  if (!Number.isFinite(value)) {
    warnings.push(`Row ${lineIndex + 1}: invalid ${label} ignored.`);
    return undefined;
  }
  return value;
}

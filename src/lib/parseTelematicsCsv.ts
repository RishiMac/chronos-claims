import type { TelematicsRow } from "@/types/claim";

export class TelematicsParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TelematicsParseError";
  }
}

export interface TelematicsParseResult {
  fileName: string;
  rows: TelematicsRow[];
  uploadedAt: string;
  timeRange: { start: string; end: string };
  warnings: string[];
}

const TIMESTAMP_ALIASES = ["timestamp", "time", "datetime", "date_time", "event_time"];
const SPEED_ALIASES = ["speed_mph", "speed", "velocity", "spd", "mph"];
const LAT_ALIASES = ["latitude", "lat"];
const LON_ALIASES = ["longitude", "lon", "lng", "long"];
const ACCEL_ALIASES = ["acceleration", "accel", "g_force"];
const BRAKE_ALIASES = ["brake_status", "braking", "brake"];

export function validateTelematicsColumns(headers: string[]): boolean {
  const index = detectColumnIndex(headers);
  return index.timestamp >= 0 && index.speed >= 0;
}

export function getMissingTelematicsColumns(headers: string[]): string[] {
  const index = detectColumnIndex(headers);
  const missing: string[] = [];
  if (index.timestamp < 0) missing.push("timestamp");
  if (index.speed < 0) missing.push("speed");
  return missing;
}

export function parseTelematicsCsv(
  csvText: string,
  fileName: string
): TelematicsParseResult {
  const warnings: string[] = [];
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length < 2) {
    throw new TelematicsParseError(
      "The CSV file must include a header row and at least one data row."
    );
  }

  const headers = parseCsvLine(lines[0]);
  const columnIndex = detectColumnIndex(headers);

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

  if (columnIndex.timestamp < 0 || columnIndex.speed < 0) {
    return {
      fileName,
      rows: [],
      uploadedAt: formatUploadedAt(new Date()),
      timeRange: { start: "—", end: "—" },
      warnings,
    };
  }

  const rows: TelematicsRow[] = [];

  for (let lineIndex = 1; lineIndex < lines.length; lineIndex++) {
    const values = parseCsvLine(lines[lineIndex]);
    if (values.every((value) => value.length === 0)) continue;

    const timestamp = getValue(values, columnIndex.timestamp);
    if (!timestamp) {
      warnings.push(`Row ${lineIndex + 1} skipped: missing timestamp.`);
      continue;
    }

    const date = parseTimestamp(timestamp);
    if (!date) {
      warnings.push(`Row ${lineIndex + 1} skipped: invalid timestamp "${timestamp}".`);
      continue;
    }

    const speedRaw = getValue(values, columnIndex.speed);
    if (speedRaw === undefined || speedRaw.length === 0) {
      warnings.push(`Row ${lineIndex + 1} skipped: missing speed value.`);
      continue;
    }

    const speedMph = Number(speedRaw);
    if (!Number.isFinite(speedMph)) {
      warnings.push(`Row ${lineIndex + 1} skipped: invalid speed "${speedRaw}".`);
      continue;
    }

    const latitudeRaw = getValue(values, columnIndex.latitude);
    const longitudeRaw = getValue(values, columnIndex.longitude);
    const accelRaw = getValue(values, columnIndex.acceleration);
    const brakeRaw = getValue(values, columnIndex.brake);

    const latitude =
      latitudeRaw !== undefined && latitudeRaw.length > 0
        ? Number(latitudeRaw)
        : undefined;
    const longitude =
      longitudeRaw !== undefined && longitudeRaw.length > 0
        ? Number(longitudeRaw)
        : undefined;
    const acceleration =
      accelRaw !== undefined && accelRaw.length > 0
        ? Number(accelRaw)
        : undefined;

    if (latitude !== undefined && !Number.isFinite(latitude)) {
      warnings.push(`Row ${lineIndex + 1}: invalid latitude ignored.`);
    }
    if (longitude !== undefined && !Number.isFinite(longitude)) {
      warnings.push(`Row ${lineIndex + 1}: invalid longitude ignored.`);
    }

    const brakeStatus =
      brakeRaw !== undefined ? parseBooleanValue(brakeRaw) : undefined;

    rows.push({
      timestamp,
      date,
      speedMph,
      latitude: Number.isFinite(latitude) ? latitude : undefined,
      longitude: Number.isFinite(longitude) ? longitude : undefined,
      brakeStatus,
      acceleration: Number.isFinite(acceleration) ? acceleration : undefined,
    });
  }

  if (rows.length === 0) {
    warnings.push("No valid telematics rows were parsed from this CSV.");
    return {
      fileName,
      rows: [],
      uploadedAt: formatUploadedAt(new Date()),
      timeRange: { start: "—", end: "—" },
      warnings,
    };
  }

  rows.sort((a, b) => a.date.getTime() - b.date.getTime());

  return {
    fileName,
    rows,
    uploadedAt: formatUploadedAt(new Date()),
    timeRange: {
      start: formatDisplayTime(rows[0].date),
      end: formatDisplayTime(rows[rows.length - 1].date),
    },
    warnings,
  };
}

function detectColumnIndex(headers: string[]) {
  const normalized = normalizeHeaders(headers);
  return {
    timestamp: findColumn(normalized, TIMESTAMP_ALIASES),
    speed: findColumn(normalized, SPEED_ALIASES),
    latitude: findColumn(normalized, LAT_ALIASES),
    longitude: findColumn(normalized, LON_ALIASES),
    acceleration: findColumn(normalized, ACCEL_ALIASES),
    brake: findColumn(normalized, BRAKE_ALIASES),
  };
}

function findColumn(normalized: string[], aliases: string[]): number {
  for (const alias of aliases) {
    const index = normalized.indexOf(alias);
    if (index >= 0) return index;
  }
  return -1;
}

function normalizeHeaders(headers: string[]): string[] {
  return headers.map((header) => header.trim().toLowerCase());
}

function getValue(values: string[], index: number): string | undefined {
  if (index < 0 || index >= values.length) return undefined;
  return values[index]?.trim();
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index++) {
    const character = line[index];

    if (character === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (character === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
      continue;
    }

    current += character;
  }

  result.push(current.trim());
  return result;
}

function parseTimestamp(value: string): Date | null {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

function parseBooleanValue(value: string): boolean | undefined {
  const normalized = value.trim().toLowerCase();
  if (["true", "1", "yes"].includes(normalized)) return true;
  if (["false", "0", "no"].includes(normalized)) return false;
  return undefined;
}

export function formatDisplayTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

function formatUploadedAt(date: Date): string {
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

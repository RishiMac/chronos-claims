import type { TelematicsRow } from "@/types/claim";

const REQUIRED_COLUMNS = ["timestamp", "speed_mph"] as const;

export class TelematicsParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TelematicsParseError";
  }
}

export function validateTelematicsColumns(headers: string[]): boolean {
  const normalized = normalizeHeaders(headers);
  return REQUIRED_COLUMNS.every((column) => normalized.includes(column));
}

export function getMissingTelematicsColumns(headers: string[]): string[] {
  const normalized = normalizeHeaders(headers);
  return REQUIRED_COLUMNS.filter((column) => !normalized.includes(column));
}

export function parseTelematicsCsv(
  csvText: string,
  fileName: string
): {
  fileName: string;
  rows: TelematicsRow[];
  uploadedAt: string;
  timeRange: { start: string; end: string };
} {
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
  if (!validateTelematicsColumns(headers)) {
    const missing = getMissingTelematicsColumns(headers);
    throw new TelematicsParseError(
      `Missing required columns: ${missing.join(", ")}. Expected at least timestamp and speed_mph.`
    );
  }

  const columnIndex = buildColumnIndex(headers);
  const rows: TelematicsRow[] = [];

  for (let lineIndex = 1; lineIndex < lines.length; lineIndex++) {
    const values = parseCsvLine(lines[lineIndex]);
    if (values.every((value) => value.length === 0)) continue;

    const timestamp = getValue(values, columnIndex.timestamp);
    if (!timestamp) {
      throw new TelematicsParseError(
        `Row ${lineIndex + 1} is missing a timestamp value.`
      );
    }

    const date = parseTimestamp(timestamp);
    if (!date) {
      throw new TelematicsParseError(
        `Row ${lineIndex + 1} has an invalid timestamp: "${timestamp}".`
      );
    }

    const speedRaw = getValue(values, columnIndex.speed_mph);
    if (speedRaw === undefined) {
      throw new TelematicsParseError(
        `Row ${lineIndex + 1} is missing a speed_mph value.`
      );
    }

    const speedMph = Number(speedRaw);
    if (!Number.isFinite(speedMph)) {
      throw new TelematicsParseError(
        `Row ${lineIndex + 1} has an invalid speed value: "${speedRaw}".`
      );
    }

    const latitudeRaw = getValue(values, columnIndex.latitude);
    const longitudeRaw = getValue(values, columnIndex.longitude);
    const brakeRaw = getValue(values, columnIndex.brake_status);

    const latitude =
      latitudeRaw !== undefined && latitudeRaw.length > 0
        ? Number(latitudeRaw)
        : undefined;
    const longitude =
      longitudeRaw !== undefined && longitudeRaw.length > 0
        ? Number(longitudeRaw)
        : undefined;

    if (latitude !== undefined && !Number.isFinite(latitude)) {
      throw new TelematicsParseError(
        `Row ${lineIndex + 1} has an invalid latitude value: "${latitudeRaw}".`
      );
    }

    if (longitude !== undefined && !Number.isFinite(longitude)) {
      throw new TelematicsParseError(
        `Row ${lineIndex + 1} has an invalid longitude value: "${longitudeRaw}".`
      );
    }

    const brakeStatus =
      brakeRaw !== undefined ? parseBooleanValue(brakeRaw) : undefined;

    if (brakeRaw !== undefined && brakeRaw.length > 0 && brakeStatus === undefined) {
      throw new TelematicsParseError(
        `Row ${lineIndex + 1} has an invalid brake_status value: "${brakeRaw}".`
      );
    }

    rows.push({
      timestamp,
      date,
      speedMph,
      latitude,
      longitude,
      brakeStatus,
    });
  }

  if (rows.length === 0) {
    throw new TelematicsParseError("No valid telematics rows were found in the CSV.");
  }

  rows.sort((a, b) => a.date.getTime() - b.date.getTime());

  const uploadedAt = formatUploadedAt(new Date());
  const timeRange = {
    start: formatDisplayTime(rows[0].date),
    end: formatDisplayTime(rows[rows.length - 1].date),
  };

  return {
    fileName,
    rows,
    uploadedAt,
    timeRange,
  };
}

function normalizeHeaders(headers: string[]): string[] {
  return headers.map((header) => header.trim().toLowerCase());
}

function buildColumnIndex(headers: string[]) {
  const normalized = normalizeHeaders(headers);
  return {
    timestamp: normalized.indexOf("timestamp"),
    speed_mph: normalized.indexOf("speed_mph"),
    latitude: normalized.indexOf("latitude"),
    longitude: normalized.indexOf("longitude"),
    brake_status: normalized.indexOf("brake_status"),
  };
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

import {
  detectColumnIndex,
  GEOTAB_COLUMNS,
} from "@/lib/telematics/columnMappings";
import { parseCsvLine, splitCsvLines } from "@/lib/telematics/csvUtils";
import { normalizeRecordsFromCsv } from "@/lib/telematics/normalizeRecords";
import { buildParseResult } from "@/lib/telematics/buildParseResult";
import type { TelematicsParseResult } from "@/types/telemetry";

export function parseGeotabCsv(
  csvText: string,
  fileName: string
): TelematicsParseResult {
  const lines = splitCsvLines(csvText);
  if (lines.length < 2) {
    return buildParseResult({
      fileName,
      format: "geotab",
      records: [],
      warnings: [
        "The Geotab CSV must include a header row and at least one data row.",
      ],
    });
  }

  const headers = parseCsvLine(lines[0]);
  const columnIndex = detectColumnIndex(headers, GEOTAB_COLUMNS);
  const { records, warnings } = normalizeRecordsFromCsv({
    lines,
    columnIndex,
    formatLabel: "Geotab",
  });

  return buildParseResult({
    fileName,
    format: "geotab",
    records,
    warnings,
  });
}

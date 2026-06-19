import {
  detectColumnIndex,
  GENERIC_COLUMNS,
} from "@/lib/telematics/columnMappings";
import { parseCsvLine, splitCsvLines } from "@/lib/telematics/csvUtils";
import { normalizeRecordsFromCsv } from "@/lib/telematics/normalizeRecords";
import type { TelematicsParseResult } from "@/types/telemetry";
import { buildParseResult } from "@/lib/telematics/buildParseResult";

export function parseGenericCsv(
  csvText: string,
  fileName: string
): TelematicsParseResult {
  const lines = splitCsvLines(csvText);
  if (lines.length < 2) {
    return buildParseResult({
      fileName,
      format: "generic",
      records: [],
      warnings: [
        "The CSV file must include a header row and at least one data row.",
      ],
    });
  }

  const headers = parseCsvLine(lines[0]);
  const columnIndex = detectColumnIndex(headers, GENERIC_COLUMNS);
  const { records, warnings } = normalizeRecordsFromCsv({
    lines,
    columnIndex,
    formatLabel: "generic",
  });

  return buildParseResult({
    fileName,
    format: "generic",
    records,
    warnings,
  });
}

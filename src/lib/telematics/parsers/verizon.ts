import {
  detectColumnIndex,
  VERIZON_COLUMNS,
} from "@/lib/telematics/columnMappings";
import { parseCsvLine, splitCsvLines } from "@/lib/telematics/csvUtils";
import { normalizeRecordsFromCsv } from "@/lib/telematics/normalizeRecords";
import { buildParseResult } from "@/lib/telematics/buildParseResult";
import type { TelematicsParseResult } from "@/types/telemetry";

export function parseVerizonConnectCsv(
  csvText: string,
  fileName: string
): TelematicsParseResult {
  const lines = splitCsvLines(csvText);
  if (lines.length < 2) {
    return buildParseResult({
      fileName,
      format: "verizon_connect",
      records: [],
      warnings: [
        "The Verizon Connect CSV must include a header row and at least one data row.",
      ],
    });
  }

  const headers = parseCsvLine(lines[0]);
  const columnIndex = detectColumnIndex(headers, VERIZON_COLUMNS);
  const { records, warnings } = normalizeRecordsFromCsv({
    lines,
    columnIndex,
    formatLabel: "Verizon Connect",
  });

  return buildParseResult({
    fileName,
    format: "verizon_connect",
    records,
    warnings,
  });
}

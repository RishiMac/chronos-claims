import { detectCsvFormat } from "@/lib/telematics/detectCsvFormat";
import { parseGenericCsv } from "@/lib/telematics/parsers/generic";
import { parseGeotabCsv } from "@/lib/telematics/parsers/geotab";
import { parseSamsaraCsv } from "@/lib/telematics/parsers/samsara";
import { parseVerizonConnectCsv } from "@/lib/telematics/parsers/verizon";
import { parseCsvLine, splitCsvLines } from "@/lib/telematics/csvUtils";
import type { TelematicsFormat, TelematicsParseResult } from "@/types/telemetry";

export function parseTelemetryCsv(
  csvText: string,
  fileName: string
): TelematicsParseResult {
  try {
    const lines = splitCsvLines(csvText);
    if (lines.length < 1) {
      return parseGenericCsv(csvText, fileName);
    }

    const headers = parseCsvLine(lines[0]);
    const format = detectCsvFormat(headers);

    switch (format) {
      case "samsara":
        return parseSamsaraCsv(csvText, fileName);
      case "geotab":
        return parseGeotabCsv(csvText, fileName);
      case "verizon_connect":
        return parseVerizonConnectCsv(csvText, fileName);
      default:
        return parseGenericCsv(csvText, fileName);
    }
  } catch {
    return parseGenericCsv(csvText, fileName);
  }
}

export { detectCsvFormat } from "@/lib/telematics/detectCsvFormat";
export { parseGenericCsv } from "@/lib/telematics/parsers/generic";
export { parseSamsaraCsv } from "@/lib/telematics/parsers/samsara";
export { parseGeotabCsv } from "@/lib/telematics/parsers/geotab";
export { parseVerizonConnectCsv } from "@/lib/telematics/parsers/verizon";
export { computeTelemetryMetrics } from "@/lib/telematics/computeMetrics";

export function formatLabelForFormat(format: TelematicsFormat): string {
  switch (format) {
    case "samsara":
      return "Samsara";
    case "geotab":
      return "Geotab";
    case "verizon_connect":
      return "Verizon Connect";
    default:
      return "Generic";
  }
}

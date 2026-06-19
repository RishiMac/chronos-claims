import type { ConfidenceLevel, EvidenceFile, TimelineEvent } from "@/types/claim";
import type {
  EvidenceReference,
} from "@/types/evidence-reference";

export function createReferenceId(prefix: string, parts: string[]): string {
  return `${prefix}-${parts.join("-")}`;
}

export function formatLineLabel(lineStart: number, lineEnd?: number): string {
  if (lineEnd !== undefined && lineEnd !== lineStart) {
    return `Lines ${lineStart}-${lineEnd}`;
  }
  return `Line ${lineStart}`;
}

export function formatRowLabel(
  rowIndex?: number,
  rowStart?: number,
  rowEnd?: number
): string {
  if (rowStart !== undefined && rowEnd !== undefined && rowEnd !== rowStart) {
    return `Rows ${rowStart + 1}-${rowEnd + 1}`;
  }
  if (rowIndex !== undefined) {
    return `Row ${rowIndex + 1}`;
  }
  return "Telemetry row";
}

export function buildLineEvidenceReference(input: {
  evidenceFileId: string;
  filename: string;
  lineStart: number;
  lineEnd?: number;
  excerpt: string;
  confidence?: ConfidenceLevel;
  idSuffix?: string;
}): EvidenceReference {
  const lineEnd = input.lineEnd ?? input.lineStart;
  return {
    id: createReferenceId("ref-line", [
      input.evidenceFileId,
      String(input.lineStart),
      String(lineEnd),
      input.idSuffix ?? "0",
    ]),
    evidenceFileId: input.evidenceFileId,
    filename: input.filename,
    referenceType: "line",
    label: formatLineLabel(input.lineStart, lineEnd),
    excerpt: input.excerpt,
    lineStart: input.lineStart,
    lineEnd,
    confidence: input.confidence,
  };
}

export function buildRowEvidenceReference(input: {
  evidenceFileId: string;
  filename: string;
  rowIndex?: number;
  rowStart?: number;
  rowEnd?: number;
  excerpt: string;
  confidence?: ConfidenceLevel;
  idSuffix?: string;
}): EvidenceReference {
  return {
    id: createReferenceId("ref-row", [
      input.evidenceFileId,
      String(input.rowStart ?? input.rowIndex ?? 0),
      String(input.rowEnd ?? input.rowIndex ?? 0),
      input.idSuffix ?? "0",
    ]),
    evidenceFileId: input.evidenceFileId,
    filename: input.filename,
    referenceType: "row",
    label: formatRowLabel(input.rowIndex, input.rowStart, input.rowEnd),
    excerpt: input.excerpt,
    rowIndex: input.rowIndex,
    rowStart: input.rowStart,
    rowEnd: input.rowEnd,
    confidence: input.confidence,
  };
}

export function buildFileEvidenceReference(input: {
  evidenceFileId: string;
  filename: string;
  excerpt?: string;
  confidence?: ConfidenceLevel;
}): EvidenceReference {
  return {
    id: createReferenceId("ref-file", [input.evidenceFileId]),
    evidenceFileId: input.evidenceFileId,
    filename: input.filename,
    referenceType: "file",
    label: "Source file",
    excerpt: input.excerpt,
    confidence: input.confidence,
  };
}

export function getEventEvidenceReferences(
  event: TimelineEvent,
  evidenceFiles: EvidenceFile[]
): EvidenceReference[] {
  if (event.evidenceReferences?.length) {
    return event.evidenceReferences;
  }

  return event.linkedEvidenceIds.map((evidenceFileId) => {
    const file = evidenceFiles.find((item) => item.id === evidenceFileId);
    return buildFileEvidenceReference({
      evidenceFileId,
      filename: file?.name ?? evidenceFileId,
      excerpt: file?.metadata.description,
      confidence: event.confidence,
    });
  });
}

export function referenceTargetsLine(reference: EvidenceReference): boolean {
  return (
    reference.referenceType === "line" &&
    reference.lineStart !== undefined
  );
}

export function referenceTargetsRow(reference: EvidenceReference): boolean {
  return (
    reference.referenceType === "row" &&
    (reference.rowIndex !== undefined ||
      reference.rowStart !== undefined ||
      reference.rowEnd !== undefined)
  );
}

export function isLineHighlighted(
  lineNumber: number,
  reference: EvidenceReference | null | undefined
): boolean {
  if (!reference || !referenceTargetsLine(reference)) return false;
  const start = reference.lineStart ?? 1;
  const end = reference.lineEnd ?? start;
  return lineNumber >= start && lineNumber <= end;
}

export function isRowHighlighted(
  rowIndex: number,
  reference: EvidenceReference | null | undefined
): boolean {
  if (!reference || !referenceTargetsRow(reference)) return false;
  if (reference.rowStart !== undefined && reference.rowEnd !== undefined) {
    return rowIndex >= reference.rowStart && rowIndex <= reference.rowEnd;
  }
  return reference.rowIndex === rowIndex;
}

export function mapAiConfidenceToLevel(
  confidence: "low" | "medium" | "high" | undefined
): ConfidenceLevel | undefined {
  switch (confidence) {
    case "high":
      return "High";
    case "medium":
      return "Medium";
    case "low":
      return "Low";
    default:
      return undefined;
  }
}

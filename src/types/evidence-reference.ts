import type { ConfidenceLevel } from "@/types/claim";

export type EvidenceReferenceType =
  | "line"
  | "row"
  | "timestamp"
  | "page"
  | "file";

export interface EvidenceReference {
  id: string;
  evidenceFileId: string;
  filename: string;
  referenceType: EvidenceReferenceType;
  label: string;
  excerpt?: string;
  lineStart?: number;
  lineEnd?: number;
  rowIndex?: number;
  rowStart?: number;
  rowEnd?: number;
  timestamp?: string;
  confidence?: ConfidenceLevel;
}

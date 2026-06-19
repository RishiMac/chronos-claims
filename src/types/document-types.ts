import type { AiConfidence } from "@/types/ai-types";
import type { EventSeverity } from "@/types/claim";
import type { EvidenceReference } from "@/types/evidence-reference";

export type DocumentCategory =
  | "impact"
  | "braking"
  | "speed"
  | "road_conditions"
  | "witness_account"
  | "driver_account"
  | "tow"
  | "uncertainty"
  | "other";

export type SupportedDocumentKind =
  | "police_report"
  | "driver_statement"
  | "witness_statement"
  | "weather_report"
  | "tow_receipt";

export interface DocumentObservation {
  id: string;
  claimId: string;
  evidenceFileId: string;
  sourceFilename: string;
  category: DocumentCategory;
  title: string;
  extractedText: string;
  confidence: AiConfidence;
  severity: EventSeverity;
  suggestedEventTime?: string;
  lineStart?: number;
  lineEnd?: number;
  evidenceReferences: EvidenceReference[];
  createdAt: string;
}

export interface DocumentParseInput {
  claimId: string;
  evidenceFileId: string;
  sourceFilename: string;
  text: string;
}

import type { DocumentObservation } from "@/types/document-types";
import type { EvidenceReference } from "@/types/evidence-reference";

export type AiConfidence = "low" | "medium" | "high";

export type AiSourceType =
  | "police_report"
  | "driver_statement"
  | "witness_statement"
  | "weather_report"
  | "tow_receipt"
  | "claim_summary"
  | "ai_timeline"
  | "document_extraction";

export interface AiObservation {
  id: string;
  claimId: string;
  sourceFileId: string;
  title: string;
  description: string;
  confidence: AiConfidence;
  sourceType: AiSourceType;
  createdAt: string;
}

export interface AiExtraction {
  id: string;
  claimId: string;
  sourceFileId: string;
  title: string;
  description: string;
  confidence: AiConfidence;
  sourceType: AiSourceType;
  createdAt: string;
  observations: AiObservation[];
}

export interface AiTimelineEvent {
  id: string;
  claimId: string;
  sourceFileId: string;
  title: string;
  description: string;
  confidence: AiConfidence;
  sourceType: AiSourceType;
  evidenceReferences?: EvidenceReference[];
  createdAt: string;
}

export interface AiSummary {
  id: string;
  claimId: string;
  sourceFileId: string;
  title: string;
  description: string;
  confidence: AiConfidence;
  sourceType: AiSourceType;
  createdAt: string;
}

export type AiGenerationStatus =
  | "not_generated"
  | "generated"
  | "regenerated"
  | "cleared";

export interface StoredAiAnalysis {
  observations: AiObservation[];
  documentObservations: DocumentObservation[];
  extractions: AiExtraction[];
  timelineEvents: AiTimelineEvent[];
  summary: AiSummary | null;
  evidenceFingerprint: string;
  generatedAt: string | null;
  status: AiGenerationStatus;
}

export interface AiAnalysisResult {
  observations: AiObservation[];
  documentObservations: DocumentObservation[];
  extractions: AiExtraction[];
  timelineEvents: AiTimelineEvent[];
  summary: AiSummary | null;
}

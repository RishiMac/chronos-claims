import type { StoredAiAnalysis } from "@/types/ai-types";
import type {
  Claim,
  EvidenceFile,
  SerializedTelematics,
  TimelineSourceFilter,
  SeverityFilter,
} from "@/types/claim";

/** Persisted claim record — workspace state bundled for localStorage */
export interface StoredClaim {
  claim: Claim;
  evidenceFiles: EvidenceFile[];
  telematics: SerializedTelematics[];
  selectedEventId: string;
  selectedEvidenceId: string | null;
  activeVideoEvidenceId: string | null;
  sampleEvidenceLoaded: boolean;
  notesDraft: string;
  sourceFilter: TimelineSourceFilter;
  severityFilter: SeverityFilter;
  searchQuery: string;
  isSample: boolean;
  aiAnalysis?: StoredAiAnalysis | null;
}

export interface ClaimWorkspaceSnapshot {
  evidenceFiles: EvidenceFile[];
  telematics: SerializedTelematics[];
  selectedEventId: string;
  selectedEvidenceId: string | null;
  activeVideoEvidenceId: string | null;
  sampleEvidenceLoaded: boolean;
  notesDraft: string;
  sourceFilter: TimelineSourceFilter;
  severityFilter: SeverityFilter;
  searchQuery: string;
  aiAnalysis?: StoredAiAnalysis | null;
}

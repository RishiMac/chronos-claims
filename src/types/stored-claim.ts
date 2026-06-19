import type { StoredAiAnalysis } from "@/types/ai-types";
import type {
  Claim,
  EvidenceFile,
  SerializedTelematics,
  TimelineSourceFilter,
  SeverityFilter,
  BookmarkFilter,
  FlagFilter,
  ReviewStatusFilter,
} from "@/types/claim";
import type { ClaimEventCollaboration } from "@/types/collaboration";

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
  eventCollaboration?: ClaimEventCollaboration;
  reviewStatusFilter?: ReviewStatusFilter;
  bookmarkFilter?: BookmarkFilter;
  flagFilter?: FlagFilter;
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
  eventCollaboration?: ClaimEventCollaboration;
  reviewStatusFilter?: ReviewStatusFilter;
  bookmarkFilter?: BookmarkFilter;
  flagFilter?: FlagFilter;
}

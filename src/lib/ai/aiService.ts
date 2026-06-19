import {
  deriveHighSignalTimelineTitles,
  hasTextDocumentEvidence,
  isSupportedDocumentFile,
  parseEvidenceDocuments,
} from "@/lib/parsers/documentParser";
import type {
  AiAnalysisResult,
  AiExtraction,
  AiGenerationStatus,
  AiObservation,
  AiSourceType,
  AiSummary,
  AiTimelineEvent,
  StoredAiAnalysis,
} from "@/types/ai-types";
import type { DocumentObservation } from "@/types/document-types";
import type { EvidenceFile } from "@/types/claim";

export type BuildAiAnalysisFailureReason =
  | "no_text_evidence"
  | "no_observations";

export interface BuildStoredAiAnalysisResult {
  stored: StoredAiAnalysis | null;
  failureReason?: BuildAiAnalysisFailureReason;
}

function nowIso(): string {
  return new Date().toISOString();
}

function sourceTypeFromFilename(fileName: string): AiSourceType {
  const normalized = fileName.toLowerCase();
  if (normalized.includes("police")) return "police_report";
  if (normalized.includes("driver")) return "driver_statement";
  if (normalized.includes("witness")) return "witness_statement";
  if (normalized.includes("weather")) return "weather_report";
  if (normalized.includes("tow")) return "tow_receipt";
  return "document_extraction";
}

function documentObservationToAiObservation(
  document: DocumentObservation
): AiObservation {
  return {
    id: `ai-obs-${document.id}`,
    claimId: document.claimId,
    sourceFileId: document.evidenceFileId,
    title: document.title,
    description: document.extractedText,
    confidence: document.confidence,
    sourceType: sourceTypeFromFilename(document.sourceFilename),
    createdAt: document.createdAt,
  };
}

function buildExtractionsFromDocuments(
  documents: DocumentObservation[]
): AiExtraction[] {
  const byFile = new Map<string, DocumentObservation[]>();

  for (const document of documents) {
    const existing = byFile.get(document.evidenceFileId) ?? [];
    existing.push(document);
    byFile.set(document.evidenceFileId, existing);
  }

  return Array.from(byFile.entries()).map(([evidenceFileId, fileDocuments]) => {
    const first = fileDocuments[0];
    const observations = fileDocuments.map(documentObservationToAiObservation);

    return {
      id: `ai-ext-${evidenceFileId}`,
      claimId: first.claimId,
      sourceFileId: evidenceFileId,
      title: `Document extraction — ${first.sourceFilename}`,
      description: `${fileDocuments.length} structured observation(s) extracted from source text. Requires human review.`,
      confidence: observations.some((item) => item.confidence === "high")
        ? "high"
        : "medium",
      sourceType: sourceTypeFromFilename(first.sourceFilename),
      createdAt: first.createdAt,
      observations,
    };
  });
}

export function deriveDocumentTimelineEvents(
  claimId: string,
  documentObservations: DocumentObservation[]
): AiTimelineEvent[] {
  const events: AiTimelineEvent[] = [];
  const seenTitles = new Set<string>();

  for (const document of documentObservations) {
    const signal = deriveHighSignalTimelineTitles(document);
    if (!signal || seenTitles.has(signal.title)) continue;
    seenTitles.add(signal.title);

    events.push({
      id: `doc-evt-${document.id}`,
      claimId,
      sourceFileId: document.evidenceFileId,
      title: signal.title,
      description: signal.description,
      confidence: document.confidence,
      sourceType: "document_extraction",
      evidenceReferences: document.evidenceReferences,
      createdAt: document.createdAt,
    });
  }

  return events;
}

export function generateClaimSummary(input: {
  claimId: string;
  documentObservations: DocumentObservation[];
  hasTelematics: boolean;
}): AiSummary {
  const sourceCount = new Set(
    input.documentObservations.map((item) => item.sourceFilename)
  ).size;

  const telematicsLine = input.hasTelematics
    ? "Telemetry references were included alongside extracted document observations."
    : "Telemetry references were not included in this analysis pass.";

  const categorySummary = input.documentObservations.length
    ? `Document extraction reports ${input.documentObservations.length} structured observation(s) across ${sourceCount} text file(s).`
    : "No structured document observations were extracted in this pass.";

  return {
    id: `ai-summary-${input.claimId}`,
    claimId: input.claimId,
    sourceFileId: "",
    title: "Claim summary",
    description: `${telematicsLine} ${categorySummary} Language uses indicates, reports, and references to support human review and does not determine outcomes.`,
    confidence: "medium",
    sourceType: "claim_summary",
    createdAt: nowIso(),
  };
}

async function resolveEvidenceText(file: EvidenceFile): Promise<string | null> {
  if (file.metadata.textPreview?.trim()) {
    return file.metadata.textPreview;
  }

  if (!file.metadata.publicUrl) return null;

  try {
    const response = await fetch(file.metadata.publicUrl);
    if (!response.ok) return null;
    return response.text();
  } catch {
    return null;
  }
}

export async function resolveEvidenceTexts(
  evidenceFiles: EvidenceFile[]
): Promise<
  Array<{
    evidenceFileId: string;
    sourceFilename: string;
    text: string;
  }>
> {
  const documents: Array<{
    evidenceFileId: string;
    sourceFilename: string;
    text: string;
  }> = [];

  for (const file of evidenceFiles) {
    if (!isSupportedDocumentFile(file)) continue;
    const text = await resolveEvidenceText(file);
    if (text?.trim()) {
      documents.push({
        evidenceFileId: file.id,
        sourceFilename: file.name,
        text,
      });
    }
  }

  return documents;
}

export async function analyzeEvidenceFiles(input: {
  claimId: string;
  evidenceFiles: EvidenceFile[];
  hasTelematics?: boolean;
}): Promise<AiAnalysisResult> {
  const parsedDocuments = await resolveEvidenceTexts(input.evidenceFiles);
  const documentObservations = parseEvidenceDocuments({
    claimId: input.claimId,
    documents: parsedDocuments,
  });
  const observations = documentObservations.map(documentObservationToAiObservation);
  const extractions = buildExtractionsFromDocuments(documentObservations);
  const timelineEvents = deriveDocumentTimelineEvents(
    input.claimId,
    documentObservations
  );
  const summary =
    documentObservations.length > 0
      ? generateClaimSummary({
          claimId: input.claimId,
          documentObservations,
          hasTelematics: input.hasTelematics ?? false,
        })
      : null;

  return {
    observations,
    documentObservations,
    extractions,
    timelineEvents,
    summary,
  };
}

export function buildEvidenceFingerprint(evidenceFiles: EvidenceFile[]): string {
  return evidenceFiles
    .map((file) => `${file.id}:${file.name}`)
    .sort()
    .join("|");
}

export function normalizeStoredAiAnalysis(
  stored: Partial<StoredAiAnalysis> | null | undefined
): StoredAiAnalysis | null {
  if (!stored) return null;

  const observations = stored.observations ?? [];
  const documentObservations = (stored.documentObservations ?? []).map(
    (observation) => ({
      ...observation,
      evidenceReferences: observation.evidenceReferences ?? [],
    })
  );
  const status: AiGenerationStatus =
    stored.status ??
    (observations.length > 0 || documentObservations.length > 0
      ? "generated"
      : stored.generatedAt
        ? "cleared"
        : "not_generated");

  return {
    observations,
    documentObservations,
    extractions: stored.extractions ?? [],
    timelineEvents: stored.timelineEvents ?? [],
    summary: stored.summary ?? null,
    evidenceFingerprint: stored.evidenceFingerprint ?? "",
    generatedAt: stored.generatedAt ?? null,
    status,
  };
}

export function hasActiveAiContent(
  analysis: StoredAiAnalysis | null | undefined
): boolean {
  if (!analysis) return false;
  return (
    (analysis.status === "generated" || analysis.status === "regenerated") &&
    (analysis.observations.length > 0 ||
      analysis.documentObservations.length > 0 ||
      analysis.timelineEvents.length > 0)
  );
}

export async function buildStoredAiAnalysis(input: {
  claimId: string;
  evidenceFiles: EvidenceFile[];
  hasTelematics?: boolean;
  status: Exclude<AiGenerationStatus, "not_generated" | "cleared">;
}): Promise<BuildStoredAiAnalysisResult> {
  if (!hasTextDocumentEvidence(input.evidenceFiles)) {
    return { stored: null, failureReason: "no_text_evidence" };
  }

  const result = await analyzeEvidenceFiles(input);
  if (result.documentObservations.length === 0) {
    return { stored: null, failureReason: "no_observations" };
  }

  return {
    stored: {
      ...result,
      evidenceFingerprint: buildEvidenceFingerprint(input.evidenceFiles),
      generatedAt: new Date().toISOString(),
      status: input.status,
    },
  };
}

export function buildClearedAiAnalysis(
  evidenceFiles: EvidenceFile[],
  previous: StoredAiAnalysis | null
): StoredAiAnalysis {
  return {
    observations: [],
    documentObservations: [],
    extractions: [],
    timelineEvents: [],
    summary: null,
    evidenceFingerprint: buildEvidenceFingerprint(evidenceFiles),
    generatedAt: previous?.generatedAt ?? null,
    status: "cleared",
  };
}

export function getDisplayAiStatus(
  analysis: StoredAiAnalysis | null
): AiGenerationStatus {
  if (!analysis) return "not_generated";
  return analysis.status;
}

export { hasTextDocumentEvidence } from "@/lib/parsers/documentParser";

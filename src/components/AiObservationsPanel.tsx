"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AI_HUMAN_REVIEW_DISCLAIMER,
  AI_NO_OBSERVATIONS_COPY,
  AI_NO_TEXT_EVIDENCE_COPY,
  AI_REVIEWER_CONTROLS_COPY,
  AI_STATUS_LABELS,
} from "@/lib/ai/constants";
import { getDisplayAiStatus, hasActiveAiContent } from "@/lib/ai/aiService";
import { cn } from "@/lib/utils";
import type {
  AiConfidence,
  AiGenerationStatus,
  StoredAiAnalysis,
} from "@/types/ai-types";
import type { DocumentObservation } from "@/types/document-types";
import type { EvidenceFile } from "@/types/claim";
import { formatLineLabel } from "@/lib/evidenceReferenceUtils";
import { hasTextDocumentEvidence } from "@/lib/parsers/documentParser";
import type { EvidenceReference } from "@/types/evidence-reference";

interface AiObservationsPanelProps {
  aiAnalysis: StoredAiAnalysis | null;
  evidenceFiles: EvidenceFile[];
  generationNotice: string | null;
  onGenerate: () => void;
  onRegenerate: () => void;
  onClear: () => void;
  onPreviewEvidence: (evidenceId: string) => void;
  onOpenEvidenceReference?: (reference: EvidenceReference) => void;
}

function confidenceBadgeClass(confidence: AiConfidence): string {
  switch (confidence) {
    case "high":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "medium":
      return "border-amber-200 bg-amber-50 text-amber-700";
    default:
      return "border-slate-200 bg-slate-100 text-slate-600";
  }
}

function formatConfidence(confidence: AiConfidence): string {
  return confidence.charAt(0).toUpperCase() + confidence.slice(1);
}

function statusBadgeClass(status: AiGenerationStatus): string {
  switch (status) {
    case "generated":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "regenerated":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "cleared":
      return "border-slate-200 bg-slate-100 text-slate-600";
    default:
      return "border-slate-200 bg-slate-100 text-slate-600";
  }
}

function formatCategory(category: DocumentObservation["category"]): string {
  return category.replace(/_/g, " ");
}

export function AiObservationsPanel({
  aiAnalysis,
  evidenceFiles,
  generationNotice,
  onGenerate,
  onRegenerate,
  onClear,
  onPreviewEvidence,
  onOpenEvidenceReference,
}: AiObservationsPanelProps) {
  const fileNameById = new Map(evidenceFiles.map((file) => [file.id, file.name]));
  const status = getDisplayAiStatus(aiAnalysis);
  const hasTextEvidence = hasTextDocumentEvidence(evidenceFiles);
  const hasAiContent = hasActiveAiContent(aiAnalysis);
  const documentObservations = aiAnalysis?.documentObservations ?? [];
  const displayObservations =
    documentObservations.length > 0
      ? documentObservations
      : (aiAnalysis?.observations ?? []).map((observation) => ({
          id: observation.id,
          claimId: observation.claimId,
          evidenceFileId: observation.sourceFileId,
          sourceFilename:
            fileNameById.get(observation.sourceFileId) ?? observation.sourceFileId,
          category: "other" as const,
          title: observation.title,
          extractedText: observation.description,
          confidence: observation.confidence,
          severity: "info" as const,
          evidenceReferences: [] as DocumentObservation["evidenceReferences"],
          createdAt: observation.createdAt,
        }));
  const summary = aiAnalysis?.summary ?? null;
  const timelineEventCount = aiAnalysis?.timelineEvents.length ?? 0;

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="border-b border-slate-100 bg-slate-50/50 px-4 py-3">
        <CardTitle className="text-[13px] font-medium text-slate-900">
          AI observations
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-4">
        <div className="space-y-3 rounded-md border border-slate-200 bg-slate-50/80 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="secondary"
              className={cn(
                "h-5 text-[10px] font-normal",
                statusBadgeClass(status)
              )}
            >
              {AI_STATUS_LABELS[status]}
            </Badge>
            {aiAnalysis?.generatedAt && (
              <span className="text-[11px] text-muted-foreground">
                Last generated{" "}
                {new Date(aiAnalysis.generatedAt).toLocaleString()}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-600">
            <span>Extracted observations: {displayObservations.length}</span>
            <span>AI timeline events: {timelineEventCount}</span>
          </div>
          <p className="text-[11px] leading-snug text-slate-600">
            {AI_REVIEWER_CONTROLS_COPY}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              className="h-8 bg-slate-900 text-[12px] text-white hover:bg-slate-800"
              onClick={onGenerate}
              disabled={!hasTextEvidence || hasAiContent}
            >
              Generate AI observations
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 text-[12px]"
              onClick={onRegenerate}
              disabled={!hasTextEvidence || !hasAiContent}
            >
              Regenerate observations
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 text-[12px] text-red-600 hover:text-red-700"
              onClick={onClear}
              disabled={!hasAiContent}
            >
              Clear AI observations
            </Button>
          </div>
          {!hasTextEvidence && (
            <p className="text-[11px] text-amber-800">{AI_NO_TEXT_EVIDENCE_COPY}</p>
          )}
          {generationNotice && (
            <p className="text-[11px] text-amber-800">{generationNotice}</p>
          )}
        </div>

        <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] leading-snug text-slate-600">
          {AI_HUMAN_REVIEW_DISCLAIMER}
        </p>

        {summary && hasAiContent ? (
          <div className="rounded-md border border-slate-200 bg-white px-3 py-3">
            <p className="text-[12px] font-medium text-slate-900">
              {summary.title}
            </p>
            <p className="mt-1.5 text-[12px] leading-snug text-slate-700">
              {summary.description}
            </p>
          </div>
        ) : (
          <p className="text-[12px] text-muted-foreground">
            {status === "cleared"
              ? "AI observations were cleared. Generate again when ready."
              : "Claim summary will appear after you generate AI observations."}
          </p>
        )}

        {displayObservations.length === 0 ? (
          <p className="text-[12px] text-muted-foreground">
            {status === "not_generated" || status === "cleared"
              ? "No extracted observations yet. Use Generate AI observations when text evidence is loaded."
              : AI_NO_OBSERVATIONS_COPY}
          </p>
        ) : (
          <ul className="space-y-2">
            {displayObservations.map((observation) => {
              const primaryReference = observation.evidenceReferences?.[0];
              const lineLabel =
                primaryReference?.label ??
                ("lineStart" in observation && observation.lineStart !== undefined
                  ? formatLineLabel(observation.lineStart, observation.lineEnd)
                  : undefined);

              return (
              <li
                key={observation.id}
                className="rounded-md border border-slate-200 bg-slate-50/70 px-3 py-2.5"
              >
                <p className="text-[13px] font-medium text-slate-900">
                  {observation.title}
                </p>
                <p className="mt-0.5 text-[12px] leading-snug text-slate-600">
                  {observation.extractedText}
                </p>
                {lineLabel && (
                  <p className="mt-1 text-[11px] text-slate-500">
                    Source reference: {lineLabel}
                  </p>
                )}
                {primaryReference?.excerpt &&
                  primaryReference.excerpt !== observation.extractedText && (
                    <p className="mt-1 text-[11px] leading-snug text-slate-500">
                      Excerpt: {primaryReference.excerpt}
                    </p>
                  )}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Badge
                    variant="secondary"
                    className={cn(
                      "h-5 text-[10px] font-normal",
                      confidenceBadgeClass(observation.confidence)
                    )}
                  >
                    Confidence: {formatConfidence(observation.confidence)}
                  </Badge>
                  <button
                    type="button"
                    onClick={() => {
                      if (primaryReference && onOpenEvidenceReference) {
                        onOpenEvidenceReference(primaryReference);
                        return;
                      }
                      onPreviewEvidence(observation.evidenceFileId);
                    }}
                    className="h-5 rounded-sm border border-slate-200 bg-white px-1.5 text-[10px] font-normal text-slate-600 transition-colors hover:border-sky-300 hover:bg-sky-50 hover:text-sky-800"
                  >
                    Source:{" "}
                    {fileNameById.get(observation.evidenceFileId) ??
                      observation.sourceFilename}
                  </button>
                  <Badge
                    variant="secondary"
                    className="h-5 border border-slate-200 bg-white text-[10px] font-normal capitalize text-slate-600"
                  >
                    {formatCategory(observation.category)}
                  </Badge>
                </div>
              </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

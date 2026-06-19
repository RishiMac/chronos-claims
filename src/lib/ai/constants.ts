export const AI_HUMAN_REVIEW_DISCLAIMER =
  "AI-generated observations are intended to support human review and do not determine outcomes.";

export const AI_REVIEWER_CONTROLS_COPY =
  "AI observations summarize source evidence and are intended to support human review. They do not determine outcomes.";

export const AI_NO_TEXT_EVIDENCE_COPY =
  "Load or upload text evidence before generating observations.";

export const AI_NO_OBSERVATIONS_COPY =
  "No structured observations found. Add more detailed evidence or review files manually.";

export const AI_STATUS_LABELS: Record<
  import("@/types/ai-types").AiGenerationStatus,
  string
> = {
  not_generated: "Not generated",
  generated: "Generated",
  regenerated: "Regenerated",
  cleared: "Cleared",
};

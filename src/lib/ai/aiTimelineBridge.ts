import type { AiConfidence, AiTimelineEvent } from "@/types/ai-types";
import type { ConfidenceLevel, TimelineEvent } from "@/types/claim";

function mapConfidence(confidence: AiConfidence): ConfidenceLevel {
  switch (confidence) {
    case "high":
      return "High";
    case "medium":
      return "Medium";
    default:
      return "Low";
  }
}

export function aiTimelineEventToTimelineEvent(
  aiEvent: AiTimelineEvent,
  index: number
): TimelineEvent {
  return {
    id: aiEvent.id,
    timestamp: "AI — derived",
    title: aiEvent.title,
    description: aiEvent.description,
    confidence: mapConfidence(aiEvent.confidence),
    severity: index === 0 ? "moderate" : "info",
    linkedEvidenceIds: aiEvent.sourceFileId ? [aiEvent.sourceFileId] : [],
    notes:
      "Document extraction timeline observation. Intended to support human review — source reference for human review.",
    markerId: `ai-marker-${index}`,
    videoProgress: Math.min(0.9, 0.35 + index * 0.2),
    videoOffsetSeconds: index * 4 + 2,
    isAiGenerated: true,
    sortDate: new Date(Date.now() + index * 1000),
    evidenceReferences: aiEvent.evidenceReferences,
  };
}

export function aiTimelineEventsToTimelineEvents(
  events: AiTimelineEvent[]
): TimelineEvent[] {
  return events.map(aiTimelineEventToTimelineEvent);
}

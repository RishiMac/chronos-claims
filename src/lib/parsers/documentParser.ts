import type { AiConfidence } from "@/types/ai-types";
import type { EventSeverity } from "@/types/claim";
import type {
  DocumentCategory,
  DocumentObservation,
  DocumentParseInput,
  SupportedDocumentKind,
} from "@/types/document-types";
import type { EvidenceFile } from "@/types/claim";
import {
  buildFileEvidenceReference,
  buildLineEvidenceReference,
  mapAiConfidenceToLevel,
} from "@/lib/evidenceReferenceUtils";

interface ExtractionRule {
  pattern: RegExp;
  category: DocumentCategory;
  title: string;
  extractedText: string;
  confidence: AiConfidence;
  severity: EventSeverity;
  suggestedEventTime?: string;
}

const SUPPORTED_DOCUMENT_PATTERNS: Array<{
  kind: SupportedDocumentKind;
  pattern: RegExp;
}> = [
  { kind: "police_report", pattern: /police/i },
  { kind: "driver_statement", pattern: /driver/i },
  { kind: "witness_statement", pattern: /witness/i },
  { kind: "weather_report", pattern: /weather/i },
  { kind: "tow_receipt", pattern: /tow/i },
];

function resolveDocumentKind(fileName: string): SupportedDocumentKind | null {
  const normalized = fileName.toLowerCase();
  const match = SUPPORTED_DOCUMENT_PATTERNS.find(({ pattern }) =>
    pattern.test(normalized)
  );
  return match?.kind ?? null;
}

export function isSupportedDocumentFile(file: EvidenceFile): boolean {
  if (file.fileType !== "text") return false;
  return resolveDocumentKind(file.name) !== null;
}

export function hasTextDocumentEvidence(evidenceFiles: EvidenceFile[]): boolean {
  return evidenceFiles.some(isSupportedDocumentFile);
}

function createObservationId(
  evidenceFileId: string,
  category: DocumentCategory,
  index: number
): string {
  return `doc-obs-${evidenceFileId}-${category}-${index}`;
}

function findMatchingLineRange(
  text: string,
  pattern: RegExp
): { lineStart: number; lineEnd: number; excerpt: string } | null {
  const lines = text.split(/\r?\n/);
  const matchingLineNumbers: number[] = [];

  lines.forEach((line, index) => {
    if (pattern.test(line)) {
      matchingLineNumbers.push(index + 1);
    }
  });

  if (matchingLineNumbers.length === 0) {
    if (!pattern.test(text.replace(/\s+/g, " "))) return null;
    const excerpt = text.trim().slice(0, 280);
    return {
      lineStart: 1,
      lineEnd: lines.length,
      excerpt,
    };
  }

  const lineStart = Math.min(...matchingLineNumbers);
  const lineEnd = Math.max(...matchingLineNumbers);
  const excerpt = lines
    .slice(lineStart - 1, lineEnd)
    .join("\n")
    .trim()
    .slice(0, 280);

  return { lineStart, lineEnd, excerpt };
}

function matchRules(
  input: DocumentParseInput,
  rules: ExtractionRule[]
): DocumentObservation[] {
  const observations: DocumentObservation[] = [];
  const seen = new Set<string>();

  rules.forEach((rule) => {
    if (!rule.pattern.test(input.text.replace(/\s+/g, " "))) return;

    const key = `${rule.category}:${rule.title}`;
    if (seen.has(key)) return;
    seen.add(key);

    const lineRange = findMatchingLineRange(input.text, rule.pattern);
    const evidenceReferences = lineRange
      ? [
          buildLineEvidenceReference({
            evidenceFileId: input.evidenceFileId,
            filename: input.sourceFilename,
            lineStart: lineRange.lineStart,
            lineEnd: lineRange.lineEnd,
            excerpt: lineRange.excerpt || rule.extractedText,
            confidence: mapAiConfidenceToLevel(rule.confidence),
            idSuffix: String(observations.length),
          }),
        ]
      : [
          buildFileEvidenceReference({
            evidenceFileId: input.evidenceFileId,
            filename: input.sourceFilename,
            excerpt: rule.extractedText,
            confidence: mapAiConfidenceToLevel(rule.confidence),
          }),
        ];

    observations.push({
      id: createObservationId(
        input.evidenceFileId,
        rule.category,
        observations.length
      ),
      claimId: input.claimId,
      evidenceFileId: input.evidenceFileId,
      sourceFilename: input.sourceFilename,
      category: rule.category,
      title: rule.title,
      extractedText: rule.extractedText,
      confidence: rule.confidence,
      severity: rule.severity,
      suggestedEventTime: rule.suggestedEventTime,
      lineStart: lineRange?.lineStart,
      lineEnd: lineRange?.lineEnd,
      evidenceReferences,
      createdAt: new Date().toISOString(),
    });
  });

  return observations;
}

function policeReportRules(): ExtractionRule[] {
  return [
    {
      pattern: /rear[- ]?end|rear contact|contact with rear|contact from behind/i,
      category: "impact",
      title: "Police report indicates rear-end impact",
      extractedText:
        "Police report references rear contact between involved units. Requires human review.",
      confidence: "high",
      severity: "moderate",
    },
    {
      pattern: /brak(e|es|ing|ed)|slow(ed|ing)|stopped|slowing near/i,
      category: "braking",
      title: "Police report references braking sequence",
      extractedText:
        "Police report indicates a braking or slowing sequence near the intersection. Requires human review.",
      confidence: "medium",
      severity: "moderate",
    },
    {
      pattern: /wet pavement|dry|rain|road conditions|visibility|overcast/i,
      category: "road_conditions",
      title: "Police report notes road conditions",
      extractedText:
        "Police report references visibility and road surface conditions at the incident time. Requires human review.",
      confidence: "high",
      severity: "info",
    },
    {
      pattern: /requires human review|support review|approximate/i,
      category: "uncertainty",
      title: "Police report notes review limitations",
      extractedText:
        "Police report indicates findings should support human review rather than determine outcomes.",
      confidence: "medium",
      severity: "info",
    },
  ];
}

function driverStatementRules(): ExtractionRule[] {
  return [
    {
      pattern: /brak(e|es|ing|ed)|\bstopped\b|\bslow(ed|ing)\b/i,
      category: "braking",
      title: "Driver statement references braking",
      extractedText:
        "Driver statement reports braking or slowing before contact. Requires human review.",
      confidence: "medium",
      severity: "moderate",
    },
    {
      pattern: /jolt|collision|contact|rear|struck/i,
      category: "impact",
      title: "Driver statement references contact",
      extractedText:
        "Driver statement references contact or impact forces. Requires human review.",
      confidence: "medium",
      severity: "moderate",
    },
    {
      pattern: /recollection|requires human review|against video/i,
      category: "uncertainty",
      title: "Driver statement notes recollection limits",
      extractedText:
        "Driver statement indicates recollection-based account and requires human review against other sources.",
      confidence: "low",
      severity: "info",
    },
    {
      pattern: /\b\d+\s*mph\b|speed|traveling/i,
      category: "speed",
      title: "Driver statement references travel speed",
      extractedText:
        "Driver statement references travel speed or movement prior to the incident. Requires human review.",
      confidence: "low",
      severity: "info",
    },
  ];
}

function witnessStatementRules(): ExtractionRule[] {
  return [
    {
      pattern: /traffic slowing|slowing|brake lights|observed.*brak/i,
      category: "witness_account",
      title: "Witness statement references traffic slowing",
      extractedText:
        "Witness statement reports traffic slowing or brake activity before contact. Requires human review.",
      confidence: "medium",
      severity: "moderate",
    },
    {
      pattern: /brak(e|es|ing|ed)|contact|heard contact/i,
      category: "braking",
      title: "Witness statement references braking activity",
      extractedText:
        "Witness statement references braking or contact cues observed at the scene. Requires human review.",
      confidence: "medium",
      severity: "info",
    },
    {
      pattern: /approximate|recall|support review only/i,
      category: "uncertainty",
      title: "Witness statement notes timing uncertainty",
      extractedText:
        "Witness statement indicates approximate timing and distance estimates requiring human review.",
      confidence: "low",
      severity: "info",
    },
  ];
}

function weatherReportRules(): ExtractionRule[] {
  return [
    {
      pattern: /\bdry\b|rain|wet|precipitation|road surface|pavement|overcast/i,
      category: "road_conditions",
      title: "Weather report notes road conditions",
      extractedText:
        "Weather report references precipitation, visibility, and road surface conditions during the incident window. Requires human review.",
      confidence: "high",
      severity: "info",
    },
    {
      pattern: /visibility|wind|temperature|observation window/i,
      category: "road_conditions",
      title: "Weather report references incident window conditions",
      extractedText:
        "Weather report summarizes environmental conditions for the reported incident window. Requires human review.",
      confidence: "medium",
      severity: "info",
    },
  ];
}

function towReceiptRules(): ExtractionRule[] {
  return [
    {
      pattern: /tow(ed|ing)|tow company|repositioning|fleet yard|service type/i,
      category: "tow",
      title: "Tow receipt references post-incident towing",
      extractedText:
        "Tow receipt references vehicle towing or repositioning after the incident. Requires human review.",
      confidence: "high",
      severity: "info",
      suggestedEventTime: "Post-incident",
    },
    {
      pattern: /service time|march|inspection|damage assessment/i,
      category: "tow",
      title: "Tow receipt references service timing",
      extractedText:
        "Tow receipt references service timing and inspection notes. Requires human review.",
      confidence: "medium",
      severity: "info",
    },
  ];
}

function rulesForKind(kind: SupportedDocumentKind): ExtractionRule[] {
  switch (kind) {
    case "police_report":
      return policeReportRules();
    case "driver_statement":
      return driverStatementRules();
    case "witness_statement":
      return witnessStatementRules();
    case "weather_report":
      return weatherReportRules();
    case "tow_receipt":
      return towReceiptRules();
  }
}

export function parseDocumentText(input: DocumentParseInput): DocumentObservation[] {
  const kind = resolveDocumentKind(input.sourceFilename);
  if (!kind) return [];
  return matchRules(input, rulesForKind(kind));
}

export function parseEvidenceDocuments(input: {
  claimId: string;
  documents: Array<{
    evidenceFileId: string;
    sourceFilename: string;
    text: string;
  }>;
}): DocumentObservation[] {
  const observations: DocumentObservation[] = [];

  for (const document of input.documents) {
    observations.push(
      ...parseDocumentText({
        claimId: input.claimId,
        evidenceFileId: document.evidenceFileId,
        sourceFilename: document.sourceFilename,
        text: document.text,
      })
    );
  }

  return observations;
}

export function deriveHighSignalTimelineTitles(
  observation: DocumentObservation
): { title: string; description: string } | null {
  switch (observation.category) {
    case "impact":
      if (observation.sourceFilename.toLowerCase().includes("police")) {
        return {
          title: "Police report references impact",
          description: observation.extractedText,
        };
      }
      return null;
    case "braking":
      if (observation.sourceFilename.toLowerCase().includes("driver")) {
        return {
          title: "Driver statement references braking",
          description: observation.extractedText,
        };
      }
      return null;
    case "road_conditions":
      if (observation.sourceFilename.toLowerCase().includes("weather")) {
        return {
          title: "Weather report notes road conditions",
          description: observation.extractedText,
        };
      }
      return null;
    default:
      return null;
  }
}

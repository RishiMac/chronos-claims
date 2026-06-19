import type { EvidenceFile, EvidenceFileType } from "@/types/claim";

export const EVIDENCE_PREVIEW_DISCLAIMER =
  "This preview organizes source evidence for human review and does not determine outcomes.";

export const IMAGE_PREVIEW_NOTE =
  "Image preview supports human review and does not determine outcomes.";

export const HIGHLIGHT_TERM_PATTERN =
  /\b(impact|collision|braking|brakes?|braked|speed|stopped|slowed|slowing|witness|weather|tow|towed|uncertainty|approximate|rear[- ]?end|wet|dry|rain)\b/gi;

export const FILE_TYPE_LABELS: Record<EvidenceFileType, string> = {
  pdf: "PDF",
  video: "Video",
  csv: "CSV / Telematics",
  text: "Text document",
  zip: "Archive",
  image: "Image",
};

export function getFileTypeLabel(fileType: EvidenceFileType): string {
  return FILE_TYPE_LABELS[fileType];
}

export function splitHighlightedText(text: string): Array<{
  text: string;
  highlight: boolean;
}> {
  const parts: Array<{ text: string; highlight: boolean }> = [];
  let lastIndex = 0;
  const pattern = new RegExp(HIGHLIGHT_TERM_PATTERN.source, "gi");
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({
        text: text.slice(lastIndex, match.index),
        highlight: false,
      });
    }
    parts.push({ text: match[0], highlight: true });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push({ text: text.slice(lastIndex), highlight: false });
  }

  return parts.length > 0 ? parts : [{ text, highlight: false }];
}

export function getEvidencePreviewUrl(file: EvidenceFile): string | undefined {
  return file.objectUrl ?? file.metadata.publicUrl;
}

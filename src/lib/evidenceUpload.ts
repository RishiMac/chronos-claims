import { formatFileSize } from "@/lib/parseTelematicsCsv";
import type { EvidenceFile, EvidenceFileType } from "@/types/claim";

const ACCEPTED_EXTENSIONS = new Set([
  ".mp4",
  ".csv",
  ".txt",
  ".pdf",
  ".jpg",
  ".jpeg",
  ".png",
  ".zip",
]);

export function isAcceptedEvidenceFile(file: File): boolean {
  const extension = getExtension(file.name);
  return ACCEPTED_EXTENSIONS.has(extension);
}

export function getExtension(fileName: string): string {
  const index = fileName.lastIndexOf(".");
  if (index === -1) return "";
  return fileName.slice(index).toLowerCase();
}

export function detectEvidenceFileType(file: File): EvidenceFileType | null {
  const extension = getExtension(file.name);
  const mime = file.type.toLowerCase();

  if (extension === ".mp4" || mime.startsWith("video/")) return "video";
  if (extension === ".csv" || mime.includes("csv")) return "csv";
  if (extension === ".txt" || mime.startsWith("text/")) return "text";
  if (extension === ".pdf" || mime === "application/pdf") return "pdf";
  if (
    extension === ".jpg" ||
    extension === ".jpeg" ||
    extension === ".png" ||
    mime.startsWith("image/")
  ) {
    return "image";
  }
  if (extension === ".zip" || mime.includes("zip")) return "zip";
  return null;
}

export function createUploadedEvidenceFile(
  file: File,
  id: string
): EvidenceFile {
  const fileType = detectEvidenceFileType(file);
  if (!fileType) {
    throw new Error(`Unsupported file type: ${file.name}`);
  }

  const uploadedAt = new Date().toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return {
    id,
    name: file.name,
    fileType,
    status: "Processed",
    isUserUploaded: true,
    mimeType: file.type || undefined,
    metadata: {
      uploadedAt,
      fileSize: formatFileSize(file.size),
      source: "Uploaded evidence file",
      description: "Uploaded file added to the investigation workspace.",
    },
  };
}

export function createPreviewObjectUrl(file: File): string {
  return URL.createObjectURL(file);
}

export async function loadImageDimensions(
  objectUrl: string
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () =>
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = () => reject(new Error("Unable to read image dimensions."));
    image.src = objectUrl;
  });
}

export async function estimatePdfPageCount(file: File): Promise<number | undefined> {
  try {
    const buffer = await file.arrayBuffer();
    const text = new TextDecoder("latin1").decode(new Uint8Array(buffer));
    const matches = text.match(/\/Type\s*\/Page\b/g);
    return matches?.length ?? undefined;
  } catch {
    return undefined;
  }
}

export async function readTextPreview(file: File, maxLength = 280): Promise<string> {
  const text = await file.text();
  return text.slice(0, maxLength).trim();
}

export const MAX_STORED_TEXT_BYTES = 1024 * 1024;

export async function readUploadedTextContent(file: File): Promise<{
  preview: string;
  storedText?: string;
  warnings?: string[];
}> {
  const text = await file.text();
  const preview = text.slice(0, 280).trim();
  const byteLength = new TextEncoder().encode(text).length;

  if (byteLength <= MAX_STORED_TEXT_BYTES) {
    return { preview, storedText: text };
  }

  return {
    preview,
    warnings: [
      `Text exceeds ${MAX_STORED_TEXT_BYTES / 1024}KB storage cap; only preview persisted for extraction.`,
    ],
  };
}

export function getAcceptAttribute(): string {
  return ".mp4,.csv,.txt,.pdf,.jpg,.jpeg,.png,.zip,video/*,image/*,application/pdf,text/plain";
}

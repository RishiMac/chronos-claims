import {
  buildSampleEvidenceFiles,
  getCanonicalSampleEvidencePath,
} from "@/data/sampleClaims";
import type { Claim, EvidenceFile } from "@/types/claim";

export const SAMPLE_EVIDENCE_FILE_COUNT = 9;

export const SAMPLE_EVIDENCE_ALREADY_LOADED_MESSAGE =
  "Sample evidence already loaded.";

export class SampleEvidenceDuplicateError extends Error {
  constructor(message = SAMPLE_EVIDENCE_ALREADY_LOADED_MESSAGE) {
    super(message);
    this.name = "SampleEvidenceDuplicateError";
  }
}

export class SampleEvidenceFileMissingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SampleEvidenceFileMissingError";
  }
}

export class SampleEvidenceParserError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SampleEvidenceParserError";
  }
}

export class SampleEvidenceUnexpectedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SampleEvidenceUnexpectedError";
  }
}

export interface SampleEvidenceBundle {
  files: EvidenceFile[];
  telematicsUrl: string;
  telematicsEvidence: EvidenceFile;
  sampleEvidencePath: string;
}

export function hasSampleEvidenceLoaded(
  evidenceFiles: EvidenceFile[],
  sampleEvidenceLoaded: boolean,
  hasParsedTelematics: boolean
): boolean {
  if (sampleEvidenceLoaded) return true;

  const sampleFileCount = evidenceFiles.filter((file) => file.isSampleFile).length;
  return sampleFileCount >= SAMPLE_EVIDENCE_FILE_COUNT && hasParsedTelematics;
}

export function resolveSampleEvidenceBundle(
  evidenceFiles: EvidenceFile[]
): SampleEvidenceBundle {
  const sampleEvidencePath = getCanonicalSampleEvidencePath();
  const canonicalFiles = buildSampleEvidenceFiles();
  const mergedFiles = canonicalFiles.map((canonical) => {
    const existing = evidenceFiles.find((file) => file.id === canonical.id);
    return existing ?? canonical;
  });

  const telematicsEvidence = mergedFiles.find(
    (file) => file.id === "ev-telematics"
  );
  if (!telematicsEvidence) {
    throw new SampleEvidenceUnexpectedError(
      "Sample evidence bundle is missing telematics.csv."
    );
  }

  const telematicsUrl =
    telematicsEvidence.metadata.publicUrl ??
    `${sampleEvidencePath}/telematics.csv`;

  return {
    files: mergedFiles,
    telematicsUrl,
    telematicsEvidence,
    sampleEvidencePath,
  };
}

export async function fetchSampleTelematicsCsv(url: string): Promise<string> {
  let response: Response;
  try {
    response = await fetch(url);
  } catch {
    throw new SampleEvidenceFileMissingError(
      `Sample telematics file could not be loaded. The file may be missing at ${url}.`
    );
  }

  if (!response.ok) {
    throw new SampleEvidenceFileMissingError(
      `Sample telematics file could not be loaded. The file may be missing (${response.status} ${response.statusText}).`
    );
  }

  return response.text();
}

/** @deprecated Use fetchSampleTelematicsCsv with resolveSampleEvidenceBundle instead. */
export async function loadSampleTelematicsCsv(claim: Claim): Promise<string> {
  const bundle = resolveSampleEvidenceBundle(claim.evidenceFiles);
  return fetchSampleTelematicsCsv(bundle.telematicsUrl);
}

export async function fetchTextPreview(
  publicUrl: string,
  maxLength = 600
): Promise<string> {
  let response: Response;
  try {
    response = await fetch(publicUrl);
  } catch {
    throw new SampleEvidenceFileMissingError(
      `Unable to load preview from ${publicUrl}.`
    );
  }

  if (!response.ok) {
    throw new SampleEvidenceFileMissingError(
      `Unable to load preview from ${publicUrl} (${response.status}).`
    );
  }

  const text = await response.text();
  return text.slice(0, maxLength).trim();
}

export async function enrichSampleEvidencePreviews(
  claim: Claim
): Promise<Claim["evidenceFiles"]> {
  const enriched = await Promise.all(
    claim.evidenceFiles.map(async (file) => {
      if (file.fileType !== "text" || !file.metadata.publicUrl) {
        return file;
      }

      if (file.metadata.textPreview) return file;

      try {
        const preview = await fetchTextPreview(file.metadata.publicUrl);
        return {
          ...file,
          metadata: {
            ...file.metadata,
            textPreview: preview,
          },
        };
      } catch {
        return {
          ...file,
          metadata: {
            ...file.metadata,
            warnings: ["Text preview could not be loaded."],
          },
        };
      }
    })
  );

  return enriched;
}

export function getEvidencePreviewUrl(
  publicUrl?: string,
  objectUrl?: string
): string | undefined {
  return objectUrl ?? publicUrl;
}

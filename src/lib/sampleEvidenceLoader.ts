import type { Claim } from "@/types/claim";

export async function fetchTextPreview(
  publicUrl: string,
  maxLength = 600
): Promise<string> {
  const response = await fetch(publicUrl);
  if (!response.ok) {
    throw new Error(`Unable to load ${publicUrl}`);
  }
  const text = await response.text();
  return text.slice(0, maxLength).trim();
}

export async function loadSampleTelematicsCsv(claim: Claim): Promise<string> {
  const telematicsFile = claim.evidenceFiles.find(
    (file) => file.id === "ev-telematics"
  );
  const url =
    telematicsFile?.metadata.publicUrl ??
    `${claim.sampleEvidencePath}/telematics.csv`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Sample telematics file could not be loaded.");
  }
  return response.text();
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

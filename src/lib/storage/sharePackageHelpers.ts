import type { SharePackage } from "@/types/share-package";
import type { Claim, EvidenceFile, TimelineEvent } from "@/types/claim";

export function createSharePackage(input: {
  claimId: string;
  shareUrl: string;
  evidenceFiles: EvidenceFile[];
  timelineEvents: TimelineEvent[];
}): SharePackage {
  const now = new Date();
  const expires = new Date(now);
  expires.setDate(expires.getDate() + 30);

  return {
    id: `share-${Date.now()}`,
    claimId: input.claimId,
    createdAt: now.toISOString(),
    expiresAt: expires.toISOString(),
    url: input.shareUrl,
    includedEvidenceIds: input.evidenceFiles.map((file) => file.id),
    includedEventIds: input.timelineEvents.map((event) => event.id),
  };
}

export function getLatestSharePackageForClaim(
  packages: SharePackage[],
  claimId: string
): SharePackage | null {
  return (
    packages
      .filter((pkg) => pkg.claimId === claimId)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0] ?? null
  );
}

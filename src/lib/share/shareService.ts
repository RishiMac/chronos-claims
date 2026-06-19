import { formatClaimDisplayTitle } from "@/lib/claimDisplay";
import {
  SHARE_CREATED_BY_PLACEHOLDER,
  SHARE_EXPIRATION_DAYS,
} from "@/lib/share/constants";
import {
  generateShareToken,
  getShareUrl,
  isExpired,
  normalizeSharePackage,
} from "@/lib/share/sharePackageUtils";
import {
  getClaims,
  getSharePackages,
  saveSharePackages,
} from "@/lib/storage/chronosStorage";
import { workspaceFromStored } from "@/lib/storage/claimSerializer";
import {
  collectUploadedTimelineEvents,
  mergeTimelineEvents,
} from "@/lib/telematicsTransforms";
import type { Claim, EvidenceFile, TimelineEvent } from "@/types/claim";
import type { SharePackage } from "@/types/share-package";

export {
  generateShareToken,
  getShareUrl,
  isExpired,
  normalizeSharePackage,
} from "@/lib/share/sharePackageUtils";

export function createSharePackage(input: {
  claimId: string;
  evidenceFiles: EvidenceFile[];
  timelineEvents: TimelineEvent[];
}): SharePackage {
  const now = new Date();
  const expires = new Date(now);
  expires.setDate(expires.getDate() + SHARE_EXPIRATION_DAYS);
  const shareToken = generateShareToken();

  const sharePackage: SharePackage = {
    id: `share-${Date.now()}`,
    claimId: input.claimId,
    createdAt: now.toISOString(),
    expiresAt: expires.toISOString(),
    shareToken,
    url: getShareUrl(shareToken),
    includedEvidenceIds: input.evidenceFiles.map((file) => file.id),
    includedEventIds: input.timelineEvents.map((event) => event.id),
    createdBy: SHARE_CREATED_BY_PLACEHOLDER,
    accessCount: 0,
  };

  const packages = [...getSharePackages(), sharePackage];
  saveSharePackages(packages);
  return sharePackage;
}

export function getSharePackage(shareToken: string): SharePackage | null {
  const packages = getSharePackages();
  const found = packages.find((pkg) => pkg.shareToken === shareToken);
  return found ? normalizeSharePackage(found) : null;
}

export function getLatestSharePackageForClaim(
  claimId: string
): SharePackage | null {
  const packages = getSharePackages()
    .filter((pkg) => pkg.claimId === claimId)
    .map(normalizeSharePackage)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

  return packages[0] ?? null;
}

export function incrementAccessCount(shareToken: string): SharePackage | null {
  const packages = getSharePackages();
  const index = packages.findIndex((pkg) => pkg.shareToken === shareToken);
  if (index === -1) return null;

  const updated = normalizeSharePackage({
    ...packages[index],
    accessCount: (packages[index].accessCount ?? 0) + 1,
  });
  packages[index] = updated;
  saveSharePackages(packages);
  return updated;
}

export interface SharePackageViewData {
  sharePackage: SharePackage;
  claim: Claim;
  claimTitle: string;
  events: TimelineEvent[];
  evidence: EvidenceFile[];
  expired: boolean;
}

function resolveClaimTimelineEvents(claimId: string): TimelineEvent[] {
  const stored = getClaims().find((item) => item.claim.id === claimId);
  if (!stored) return [];

  const workspace = workspaceFromStored(stored);
  const uploadedEvents = collectUploadedTimelineEvents(
    workspace.telematicsByEvidenceId
  );
  if (uploadedEvents.length === 0) return stored.claim.timelineEvents;
  return mergeTimelineEvents(stored.claim.timelineEvents, uploadedEvents);
}

function resolveClaimEvidence(claimId: string): EvidenceFile[] {
  const stored = getClaims().find((item) => item.claim.id === claimId);
  if (!stored) return [];
  return workspaceFromStored(stored).evidenceFiles;
}

export function getSharePackageViewData(
  shareToken: string
): SharePackageViewData | null {
  const sharePackage = getSharePackage(shareToken);
  if (!sharePackage) return null;

  const stored = getClaims().find((item) => item.claim.id === sharePackage.claimId);
  if (!stored) return null;

  const allEvents = resolveClaimTimelineEvents(sharePackage.claimId);
  const allEvidence = resolveClaimEvidence(sharePackage.claimId);
  const eventIdSet = new Set(sharePackage.includedEventIds);
  const evidenceIdSet = new Set(sharePackage.includedEvidenceIds);

  return {
    sharePackage,
    claim: stored.claim,
    claimTitle: formatClaimDisplayTitle(stored.claim),
    events: allEvents.filter((event) => eventIdSet.has(event.id)),
    evidence: allEvidence.filter((file) => evidenceIdSet.has(file.id)),
    expired: isExpired(sharePackage),
  };
}

export function listSharePackages(): SharePackage[] {
  return getSharePackages().map(normalizeSharePackage);
}

export function replaceSharePackages(packages: SharePackage[]): void {
  saveSharePackages(packages.map(normalizeSharePackage));
}

import { REAL_DEMO_CLAIM_ID } from "@/data/realDemoClaim";
import { aiTimelineEventsToTimelineEvents } from "@/lib/ai/aiTimelineBridge";
import {
  hasActiveAiContent,
  normalizeStoredAiAnalysis,
} from "@/lib/ai/aiService";
import { formatClaimDisplayTitle } from "@/lib/claimDisplay";
import { SHARE_CREATED_BY_PLACEHOLDER } from "@/lib/share/constants";
import {
  hashPasscode,
  computeExpiresAt,
} from "@/lib/share/passcodeUtils";
import {
  generateShareToken,
  getSharePackageStatus,
  getShareUrl,
  isSharePackageAccessible,
  normalizeSharePackage,
} from "@/lib/share/sharePackageUtils";
import {
  getActivities,
  getClaims,
  getNotes,
  getSharePackages,
  saveSharePackages,
} from "@/lib/storage/chronosStorage";
import { workspaceFromStored } from "@/lib/storage/claimSerializer";
import {
  collectUploadedTimelineEvents,
  mergeTimelineEvents,
} from "@/lib/telematicsTransforms";
import {
  enrichTimelineEventsWithCollaboration,
} from "@/lib/collaboration/collaborationUtils";
import { createEmptyCollaboration } from "@/types/collaboration";
import type { AuditActivity } from "@/types/audit-activity";
import type { Claim, EvidenceFile, TimelineEvent } from "@/types/claim";
import type {
  SharePackage,
  SharePackageCreateInput,
  SharePackageSettings,
} from "@/types/share-package";

export {
  generateShareToken,
  getSharePackageStatus,
  getShareUrl,
  isExpired,
  isSharePackageAccessible,
  normalizeSharePackage,
} from "@/lib/share/sharePackageUtils";

export { verifyPasscodeHash } from "@/lib/share/passcodeUtils";

function updatePackageAtIndex(
  packages: SharePackage[],
  index: number,
  patch: Partial<SharePackage>
): SharePackage {
  const updated = normalizeSharePackage({ ...packages[index], ...patch });
  packages[index] = updated;
  saveSharePackages(packages);
  return updated;
}

export async function createSharePackage(
  input: SharePackageCreateInput
): Promise<SharePackage> {
  const now = new Date();
  const shareToken = generateShareToken();
  const passcodeHash =
    input.accessMode === "passcode_required" && input.passcode
      ? await hashPasscode(input.passcode)
      : undefined;

  const sharePackage: SharePackage = normalizeSharePackage({
    id: `share-${Date.now()}`,
    claimId: input.claimId,
    createdAt: now.toISOString(),
    expiresAt: computeExpiresAt(input.expiration, now),
    shareToken,
    url: getShareUrl(shareToken),
    includedEvidenceIds: input.includedSections.evidenceList
      ? input.evidenceFiles.map((file) => file.id)
      : [],
    includedEventIds: input.includedSections.timeline
      ? input.timelineEvents.map((event) => event.id)
      : [],
    createdBy: SHARE_CREATED_BY_PLACEHOLDER,
    accessCount: 0,
    expiration: input.expiration,
    accessMode: input.accessMode,
    includedSections: input.includedSections,
    passcodeHash,
    revoked: false,
    revokedAt: null,
  });

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

  return updatePackageAtIndex(packages, index, {
    accessCount: (packages[index].accessCount ?? 0) + 1,
  });
}

export function revokeSharePackage(shareToken: string): SharePackage | null {
  const packages = getSharePackages();
  const index = packages.findIndex((pkg) => pkg.shareToken === shareToken);
  if (index === -1) return null;

  return updatePackageAtIndex(packages, index, {
    revoked: true,
    revokedAt: new Date().toISOString(),
  });
}

export interface SharePackageViewData {
  sharePackage: SharePackage;
  claim: Claim;
  claimTitle: string;
  events: TimelineEvent[];
  evidence: EvidenceFile[];
  notes: { id: string; body: string; createdAt: string }[];
  activities: AuditActivity[];
  status: ReturnType<typeof getSharePackageStatus>;
  accessible: boolean;
}

function resolveClaimTimelineEvents(claimId: string): TimelineEvent[] {
  const stored = getClaims().find((item) => item.claim.id === claimId);
  if (!stored) return [];

  const workspace = workspaceFromStored(stored);
  const uploadedEvents = collectUploadedTimelineEvents(
    workspace.telematicsByEvidenceId
  );
  let events =
    uploadedEvents.length > 0 && claimId !== REAL_DEMO_CLAIM_ID
      ? mergeTimelineEvents(stored.claim.timelineEvents, uploadedEvents)
      : stored.claim.timelineEvents;

  const aiAnalysis = normalizeStoredAiAnalysis(stored.aiAnalysis ?? null);
  if (
    aiAnalysis &&
    hasActiveAiContent(aiAnalysis) &&
    aiAnalysis.timelineEvents.length
  ) {
    events = mergeTimelineEvents(
      events,
      aiTimelineEventsToTimelineEvents(aiAnalysis.timelineEvents)
    );
  }

  return enrichTimelineEventsWithCollaboration(
    events,
    stored.eventCollaboration ?? createEmptyCollaboration()
  );
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

  const status = getSharePackageStatus(sharePackage);
  const accessible = isSharePackageAccessible(sharePackage);
  const allEvents = resolveClaimTimelineEvents(sharePackage.claimId);
  const allEvidence = resolveClaimEvidence(sharePackage.claimId);
  const eventIdSet = new Set(sharePackage.includedEventIds);
  const evidenceIdSet = new Set(sharePackage.includedEvidenceIds);
  const notes = getNotes()
    .filter((note) => note.claimId === sharePackage.claimId)
    .map((note) => ({
      id: note.id,
      body: note.body,
      createdAt: note.createdAt,
    }));
  const activities = getActivities().filter(
    (entry) => entry.claimId === sharePackage.claimId
  );

  return {
    sharePackage,
    claim: stored.claim,
    claimTitle: formatClaimDisplayTitle(stored.claim),
    events: allEvents.filter((event) => eventIdSet.has(event.id)),
    evidence: allEvidence.filter((file) => evidenceIdSet.has(file.id)),
    notes,
    activities,
    status,
    accessible,
  };
}

export function listSharePackages(): SharePackage[] {
  return getSharePackages().map(normalizeSharePackage);
}

export function replaceSharePackages(packages: SharePackage[]): void {
  saveSharePackages(packages.map(normalizeSharePackage));
}

export function settingsChanged(
  previous: SharePackageSettings | null,
  next: SharePackageSettings
): boolean {
  if (!previous) return false;
  return (
    previous.expiration !== next.expiration ||
    previous.accessMode !== next.accessMode ||
    previous.includedSections.timeline !== next.includedSections.timeline ||
    previous.includedSections.evidenceList !==
      next.includedSections.evidenceList ||
    previous.includedSections.notes !== next.includedSections.notes ||
    previous.includedSections.activitySummary !==
      next.includedSections.activitySummary
  );
}

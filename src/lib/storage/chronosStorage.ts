import { sampleClaims } from "@/data/sampleClaims";
import { normalizeClaimTitle } from "@/lib/claimDisplay";
import { buildInitialNotesFromSampleClaims } from "@/lib/storage/claimOperations";
import type { AuditActivity, AuditActivityAction } from "@/types/audit-activity";
import type { StoredInvestigationNote } from "@/types/investigation-note";
import type { SharePackage } from "@/types/share-package";
import type { StoredClaim } from "@/types/stored-claim";
import { normalizeSharePackage } from "@/lib/share/sharePackageUtils";

const KEYS = {
  claims: "chronos_claims_v1",
  selectedClaim: "chronos_selected_claim_v1",
  notes: "chronos_notes_v1",
  activity: "chronos_activity_v1",
  sharePackages: "chronos_share_packages_v1",
} as const;

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function readJson<T>(key: string): T | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch (error) {
    console.warn(`[Chronos Storage] Failed to parse "${key}":`, error);
    return null;
  }
}

function writeJson<T>(key: string, value: T): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`[Chronos Storage] Failed to write "${key}":`, error);
  }
}

function normalizeStoredClaims(claims: StoredClaim[]): StoredClaim[] {
  return claims.map((item) => ({
    ...item,
    claim: normalizeClaimTitle(item.claim),
  }));
}

function buildDefaultStoredClaims(): StoredClaim[] {
  return normalizeStoredClaims(
    sampleClaims.map((claim) => ({
    claim,
    evidenceFiles: claim.evidenceFiles,
    telematics: [],
    selectedEventId: claim.defaultSelectedEventId,
    selectedEvidenceId: claim.defaultSelectedEvidenceId,
    activeVideoEvidenceId: null,
    sampleEvidenceLoaded: false,
    notesDraft: "",
    sourceFilter: "all",
    severityFilter: "all",
    searchQuery: "",
    isSample: true,
  }))
  );
}

export function getClaims(): StoredClaim[] {
  const stored = readJson<StoredClaim[]>(KEYS.claims);
  if (!stored || !Array.isArray(stored) || stored.length === 0) {
    return buildDefaultStoredClaims();
  }
  return normalizeStoredClaims(stored);
}

export function saveClaims(claims: StoredClaim[]): void {
  writeJson(KEYS.claims, claims);
}

export function getSelectedClaimId(): string | null {
  if (!isBrowser()) return null;
  return window.localStorage.getItem(KEYS.selectedClaim);
}

export function saveSelectedClaimId(claimId: string): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(KEYS.selectedClaim, claimId);
}

export function getNotes(): StoredInvestigationNote[] {
  const stored = readJson<StoredInvestigationNote[]>(KEYS.notes);
  return stored && Array.isArray(stored) ? stored : [];
}

export function saveNotes(notes: StoredInvestigationNote[]): void {
  writeJson(KEYS.notes, notes);
}

export function getActivities(): AuditActivity[] {
  const stored = readJson<LegacyAuditActivity[]>(KEYS.activity);
  if (!stored || !Array.isArray(stored)) return [];
  return stored.map(normalizeAuditActivity);
}

interface LegacyAuditActivity {
  id: string;
  claimId: string;
  timestamp: string;
  action?: AuditActivityAction;
  details?: string;
  message?: string;
  type?: AuditActivityAction;
}

function normalizeAuditActivity(entry: LegacyAuditActivity): AuditActivity {
  const action = entry.action ?? entry.type ?? "general";
  const details = entry.details ?? entry.message ?? "";
  return {
    id: entry.id,
    claimId: entry.claimId,
    timestamp: entry.timestamp,
    action,
    details,
  };
}

export function saveActivities(activities: AuditActivity[]): void {
  writeJson(KEYS.activity, activities);
}

export function getSharePackages(): SharePackage[] {
  const stored = readJson<Partial<SharePackage>[]>(KEYS.sharePackages);
  if (!stored || !Array.isArray(stored)) return [];
  return stored
    .filter(
      (pkg): pkg is Partial<SharePackage> & Pick<SharePackage, "id" | "claimId"> =>
        Boolean(pkg?.id && pkg?.claimId)
    )
    .map(normalizeSharePackage);
}

export function saveSharePackages(packages: SharePackage[]): void {
  writeJson(KEYS.sharePackages, packages);
}

export function resetStorage(): void {
  if (!isBrowser()) return;
  Object.values(KEYS).forEach((key) => {
    window.localStorage.removeItem(key);
  });
}

export function loadInitialAppState() {
  try {
    const claims = getClaims();
    const selectedClaimId =
      getSelectedClaimId() ??
      claims[0]?.claim.id ??
      sampleClaims[0].id;
    const notesRaw = getNotes();
    const notes =
      notesRaw.length > 0 ? notesRaw : buildInitialNotesFromSampleClaims();
    const activities = getActivities();
    const sharePackages = getSharePackages();

    const activeStored =
      claims.find((item) => item.claim.id === selectedClaimId) ?? claims[0];

    if (!activeStored) {
      console.warn("[Chronos Storage] No valid claims found, restoring samples.");
      const defaults = buildDefaultStoredClaims();
      return {
        claims: defaults,
        selectedClaimId: defaults[0].claim.id,
        notes: [],
        activities: [],
        sharePackages: [],
      };
    }

    return {
      claims,
      selectedClaimId: activeStored.claim.id,
      notes,
      activities,
      sharePackages,
    };
  } catch (error) {
    console.warn("[Chronos Storage] Corrupted storage, restoring samples:", error);
    resetStorage();
    const defaults = buildDefaultStoredClaims();
    return {
      claims: defaults,
      selectedClaimId: defaults[0].claim.id,
      notes: [],
      activities: [],
      sharePackages: [],
    };
  }
}

export { KEYS as CHRONOS_STORAGE_KEYS };

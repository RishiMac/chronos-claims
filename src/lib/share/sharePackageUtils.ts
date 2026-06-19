import {
  DEFAULT_SHARE_INCLUDED_SECTIONS,
  DEFAULT_SHARE_SETTINGS,
} from "@/types/share-package";
import type {
  SharePackage,
  SharePackageStatus,
} from "@/types/share-package";
import {
  SHARE_CREATED_BY_PLACEHOLDER,
} from "@/lib/share/constants";
import { computeExpiresAt } from "@/lib/share/passcodeUtils";

export function generateShareToken(): string {
  return `sp_${crypto.randomUUID().replace(/-/g, "")}`;
}

export function getShareUrl(shareToken: string, origin?: string): string {
  const path = `/share/${shareToken}`;
  if (origin) {
    return `${origin.replace(/\/$/, "")}${path}`;
  }
  if (typeof window !== "undefined") {
    return `${window.location.origin}${path}`;
  }
  return path;
}

function generateShareTokenFromLegacy(
  id: string,
  claimId: string,
  createdAt?: string
): string {
  const seed = `${id}-${claimId}-${createdAt ?? ""}`;
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(index);
    hash |= 0;
  }
  return `sp_${Math.abs(hash).toString(36)}${Date.now().toString(36).slice(-4)}`;
}

export function normalizeSharePackage(
  pkg: Partial<SharePackage> & Pick<SharePackage, "id" | "claimId">
): SharePackage {
  const shareToken =
    pkg.shareToken ??
    generateShareTokenFromLegacy(pkg.id, pkg.claimId, pkg.createdAt);
  const url = pkg.url?.includes("/share/")
    ? pkg.url
    : getShareUrl(shareToken);
  const expiration = pkg.expiration ?? "7d";
  const createdAt = pkg.createdAt ?? new Date().toISOString();

  return {
    id: pkg.id,
    claimId: pkg.claimId,
    createdAt,
    expiresAt: pkg.expiresAt ?? computeExpiresAt(expiration, new Date(createdAt)),
    shareToken,
    url,
    includedEvidenceIds: pkg.includedEvidenceIds ?? [],
    includedEventIds: pkg.includedEventIds ?? [],
    createdBy: pkg.createdBy ?? SHARE_CREATED_BY_PLACEHOLDER,
    accessCount: pkg.accessCount ?? 0,
    expiration,
    accessMode: pkg.accessMode ?? "anyone_with_link",
    includedSections: pkg.includedSections ?? DEFAULT_SHARE_INCLUDED_SECTIONS,
    passcodeHash: pkg.passcodeHash,
    revoked: pkg.revoked ?? false,
    revokedAt: pkg.revokedAt ?? null,
  };
}

export function isExpired(sharePackage: SharePackage, now = new Date()): boolean {
  if (sharePackage.revoked) return false;
  if (sharePackage.expiration === "never") return false;
  return new Date(sharePackage.expiresAt).getTime() <= now.getTime();
}

export function getSharePackageStatus(
  sharePackage: SharePackage,
  now = new Date()
): SharePackageStatus {
  if (sharePackage.revoked) return "revoked";
  if (isExpired(sharePackage, now)) return "expired";
  return "active";
}

export function isSharePackageAccessible(
  sharePackage: SharePackage,
  now = new Date()
): boolean {
  return getSharePackageStatus(sharePackage, now) === "active";
}

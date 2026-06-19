import {
  SHARE_CREATED_BY_PLACEHOLDER,
  SHARE_EXPIRATION_DAYS,
} from "@/lib/share/constants";
import type { SharePackage } from "@/types/share-package";

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

function defaultExpirationFrom(createdAt?: string): string {
  const created = createdAt ? new Date(createdAt) : new Date();
  const expires = new Date(created);
  expires.setDate(expires.getDate() + SHARE_EXPIRATION_DAYS);
  return expires.toISOString();
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

  return {
    id: pkg.id,
    claimId: pkg.claimId,
    createdAt: pkg.createdAt ?? new Date().toISOString(),
    expiresAt: pkg.expiresAt ?? defaultExpirationFrom(pkg.createdAt),
    shareToken,
    url,
    includedEvidenceIds: pkg.includedEvidenceIds ?? [],
    includedEventIds: pkg.includedEventIds ?? [],
    createdBy: pkg.createdBy ?? SHARE_CREATED_BY_PLACEHOLDER,
    accessCount: pkg.accessCount ?? 0,
  };
}

export function isExpired(sharePackage: SharePackage, now = new Date()): boolean {
  return new Date(sharePackage.expiresAt).getTime() <= now.getTime();
}

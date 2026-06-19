import type { Claim } from "@/types/claim";

export function formatClaimDisplayTitle(claim: Pick<Claim, "id" | "title">): string {
  return `Claim #${claim.id} — ${claim.title}`;
}

/** Normalize legacy claims that stored the composed string in title. */
export function normalizeClaimTitle(claim: Claim): Claim {
  const composedPrefix = `Claim #${claim.id} — `;
  if (claim.title.startsWith(composedPrefix)) {
    const titleOnly = claim.title.slice(composedPrefix.length);
    return { ...claim, title: titleOnly, shortLabel: titleOnly };
  }
  if (claim.title === `Claim #${claim.id}`) {
    const titleOnly = claim.shortLabel || "New Investigation";
    return { ...claim, title: titleOnly, shortLabel: titleOnly };
  }
  if (claim.shortLabel && claim.shortLabel !== claim.title) {
    return { ...claim, shortLabel: claim.title };
  }
  return claim;
}

import type { Claim } from "@/types/claim";
import { getDefaultClaim, getClaimById } from "@/data/sampleClaims";

export const mockClaim: Claim = getDefaultClaim();

export function getEvidenceById(id: string, claim: Claim = mockClaim) {
  return claim.evidenceFiles.find((file) => file.id === id);
}

export function getTimelineEventById(id: string, claim: Claim = mockClaim) {
  return claim.timelineEvents.find((event) => event.id === id);
}

export { getClaimById, getDefaultClaim, sampleClaims } from "@/data/sampleClaims";

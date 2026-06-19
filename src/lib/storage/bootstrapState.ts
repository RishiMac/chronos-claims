import { buildSampleStoredClaims } from "@/lib/storage/claimOperations";
import { workspaceFromStored } from "@/lib/storage/claimSerializer";
import type { Claim } from "@/types/claim";
import type { StoredClaim } from "@/types/stored-claim";

/** Deterministic pre-hydration claims — identical on server and first client render. */
export const BOOTSTRAP_STORED_CLAIMS: StoredClaim[] = buildSampleStoredClaims();

export const BOOTSTRAP_SELECTED_CLAIM_ID =
  BOOTSTRAP_STORED_CLAIMS[0]?.claim.id ?? "";

export const BOOTSTRAP_CLAIMS: Claim[] = BOOTSTRAP_STORED_CLAIMS.map(
  (item) => item.claim
);

export function getBootstrapStoredClaim(): StoredClaim {
  return (
    BOOTSTRAP_STORED_CLAIMS.find(
      (item) => item.claim.id === BOOTSTRAP_SELECTED_CLAIM_ID
    ) ?? BOOTSTRAP_STORED_CLAIMS[0]
  );
}

export function getBootstrapWorkspace() {
  return workspaceFromStored(getBootstrapStoredClaim());
}

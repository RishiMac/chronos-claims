export interface SharePackage {
  id: string;
  claimId: string;
  createdAt: string;
  expiresAt: string;
  url: string;
  includedEvidenceIds: string[];
  includedEventIds: string[];
}

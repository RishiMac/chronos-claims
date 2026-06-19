export interface SharePackage {
  id: string;
  claimId: string;
  createdAt: string;
  expiresAt: string;
  shareToken: string;
  url: string;
  includedEvidenceIds: string[];
  includedEventIds: string[];
  createdBy: string;
  accessCount: number;
}

export type ShareExpirationOption = "24h" | "7d" | "30d" | "never";

export type ShareAccessMode = "anyone_with_link" | "passcode_required";

export interface ShareIncludedSections {
  timeline: boolean;
  evidenceList: boolean;
  notes: boolean;
  activitySummary: boolean;
}

export type SharePackageStatus = "active" | "expired" | "revoked";

export interface SharePackageSettings {
  expiration: ShareExpirationOption;
  accessMode: ShareAccessMode;
  includedSections: ShareIncludedSections;
}

export interface SharePackage extends SharePackageSettings {
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
  passcodeHash?: string;
  revoked: boolean;
  revokedAt?: string | null;
}

export interface SharePackageCreateInput extends SharePackageSettings {
  claimId: string;
  evidenceFiles: import("@/types/claim").EvidenceFile[];
  timelineEvents: import("@/types/claim").TimelineEvent[];
  passcode?: string;
}

export const DEFAULT_SHARE_INCLUDED_SECTIONS: ShareIncludedSections = {
  timeline: true,
  evidenceList: true,
  notes: true,
  activitySummary: true,
};

export const DEFAULT_SHARE_SETTINGS: SharePackageSettings = {
  expiration: "7d",
  accessMode: "anyone_with_link",
  includedSections: DEFAULT_SHARE_INCLUDED_SECTIONS,
};

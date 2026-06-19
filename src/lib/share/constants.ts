export const HUMAN_REVIEW_DISCLAIMER =
  "This package is intended to support human review and does not determine outcomes. Source references remain linked to original evidence.";

export const READ_ONLY_BANNER_TITLE = "Read-only investigation package";

export const READ_ONLY_BANNER_SUBTEXT =
  "This view supports human review and does not determine outcomes.";

export const DEMO_ACCESS_CONTROL_COPY =
  "Demo access control only. Real authentication will be added later.";

export const SHARE_CREATED_BY_PLACEHOLDER = "Local Reviewer";

export const SHARE_EXPIRATION_DAYS = 7;

export const EXPIRATION_LABELS: Record<
  import("@/types/share-package").ShareExpirationOption,
  string
> = {
  "24h": "24 hours",
  "7d": "7 days",
  "30d": "30 days",
  never: "Never expires (demo only)",
};

export const ACCESS_MODE_LABELS: Record<
  import("@/types/share-package").ShareAccessMode,
  string
> = {
  anyone_with_link: "Anyone with link can view",
  passcode_required: "Passcode required (demo only)",
};

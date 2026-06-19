export type AuditActivityAction =
  | "created_share_package"
  | "regenerated_share_package"
  | "opened_share_package"
  | "copied_share_link"
  | "failed_passcode_attempt"
  | "successful_passcode_attempt"
  | "revoked_share_package"
  | "changed_share_settings"
  | "opened_timeline_event"
  | "copied_event_summary"
  | "saved_note"
  | "uploaded_csv"
  | "loaded_sample_evidence"
  | "created_claim"
  | "deleted_claim"
  | "renamed_claim"
  | "duplicated_claim"
  | "switched_claim"
  | "generated_ai_observations"
  | "regenerated_ai_observations"
  | "cleared_ai_observations"
  | "generated_claim_summary"
  | "changed_review_status"
  | "assigned_event"
  | "bookmarked_event"
  | "unbookmarked_event"
  | "flagged_event"
  | "commented_on_event"
  | "dismissed_event"
  | "approved_event"
  | "general";

/** @deprecated Use AuditActivityAction */
export type AuditActivityType = AuditActivityAction;

export interface AuditActivity {
  id: string;
  claimId: string;
  eventId?: string;
  timestamp: string;
  action: AuditActivityAction;
  details: string;
}

/** @deprecated Use AuditActivity — kept for existing UI components */
export type SessionActivityEntry = {
  id: string;
  timestamp: string;
  message: string;
  claimId?: string;
  action?: AuditActivityAction;
};

export function auditActivityToSessionEntry(
  activity: AuditActivity
): SessionActivityEntry {
  return {
    id: activity.id,
    timestamp: activity.timestamp,
    message: activity.details,
    claimId: activity.claimId,
    action: activity.action,
  };
}

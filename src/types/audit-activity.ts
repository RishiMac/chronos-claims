export type AuditActivityType =
  | "viewed_event"
  | "uploaded_csv"
  | "loaded_sample_evidence"
  | "generated_share_package"
  | "copied_event_summary"
  | "saved_note"
  | "created_claim"
  | "deleted_claim"
  | "renamed_claim"
  | "duplicated_claim"
  | "switched_claim"
  | "general";

export interface AuditActivity {
  id: string;
  claimId: string;
  timestamp: string;
  message: string;
  type: AuditActivityType;
}

/** @deprecated Use AuditActivity — kept for existing UI components */
export type SessionActivityEntry = Omit<AuditActivity, "claimId" | "type"> & {
  claimId?: string;
  type?: AuditActivityType;
};

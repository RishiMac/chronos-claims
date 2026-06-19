import { getActivities, saveActivities } from "@/lib/storage/chronosStorage";
import type { AuditActivity, AuditActivityAction } from "@/types/audit-activity";

export function createActivityEntry(
  claimId: string,
  action: AuditActivityAction,
  details: string,
  eventId?: string
): AuditActivity {
  return {
    id: `activity-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    claimId,
    eventId,
    timestamp: new Date().toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    }),
    action,
    details,
  };
}

// Intentional direct write path for pages outside React state (e.g. share unlock).
// Uses chronosStorage saveActivities/getActivities — not raw localStorage.
export function appendActivity(entry: AuditActivity): void {
  saveActivities([entry, ...getActivities()]);
}

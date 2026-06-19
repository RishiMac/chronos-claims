"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  getActivities,
  getNotes,
  getSelectedClaimId,
  getSharePackages,
  loadInitialAppState,
  saveActivities,
  saveClaims,
  saveNotes,
  saveSelectedClaimId,
  saveSharePackages,
} from "@/lib/storage/chronosStorage";
import {
  buildStoredClaimSnapshot,
  serializeTelematicsMap,
  workspaceFromStored,
} from "@/lib/storage/claimSerializer";
import type { AuditActivity, AuditActivityAction } from "@/types/audit-activity";
import type { StoredInvestigationNote } from "@/types/investigation-note";
import type { SharePackage } from "@/types/share-package";
import type { StoredClaim } from "@/types/stored-claim";
import type { ClaimEventCollaboration } from "@/types/collaboration";
import type {
  BookmarkFilter,
  Claim,
  FlagFilter,
  ParsedTelematics,
  ReviewStatusFilter,
  SeverityFilter,
  TimelineSourceFilter,
} from "@/types/claim";

export interface HydratedAppState {
  storedClaims: StoredClaim[];
  selectedClaimId: string;
  allNotes: StoredInvestigationNote[];
  allActivities: AuditActivity[];
  sharePackages: SharePackage[];
}

export function hydrateAppState(): HydratedAppState {
  const initial = loadInitialAppState();
  return {
    storedClaims: initial.claims,
    selectedClaimId: initial.selectedClaimId,
    allNotes: initial.notes,
    allActivities: initial.activities,
    sharePackages: initial.sharePackages,
  };
}

export function useChronosPersistence() {
  const [hydrated, setHydrated] = useState(false);
  const [storedClaims, setStoredClaims] = useState<StoredClaim[]>([]);
  const [selectedClaimId, setSelectedClaimId] = useState("");
  const [allNotes, setAllNotes] = useState<StoredInvestigationNote[]>([]);
  const [allActivities, setAllActivities] = useState<AuditActivity[]>([]);
  const [sharePackages, setSharePackages] = useState<SharePackage[]>([]);
  const skipNextPersist = useRef(true);

  useEffect(() => {
    const initial = hydrateAppState();
    setStoredClaims(initial.storedClaims);
    setSelectedClaimId(initial.selectedClaimId);
    setAllNotes(initial.allNotes);
    setAllActivities(initial.allActivities);
    setSharePackages(initial.sharePackages);
    setHydrated(true);
  }, []);

  const persistAll = useCallback(
    (snapshot: {
      storedClaims: StoredClaim[];
      selectedClaimId: string;
      allNotes: StoredInvestigationNote[];
      allActivities: AuditActivity[];
      sharePackages: SharePackage[];
    }) => {
      saveClaims(snapshot.storedClaims);
      saveSelectedClaimId(snapshot.selectedClaimId);
      saveNotes(snapshot.allNotes);
      saveActivities(snapshot.allActivities);
      saveSharePackages(snapshot.sharePackages);
    },
    []
  );

  useEffect(() => {
    if (!hydrated) return;
    if (skipNextPersist.current) {
      skipNextPersist.current = false;
      return;
    }
    persistAll({
      storedClaims,
      selectedClaimId,
      allNotes,
      allActivities,
      sharePackages,
    });
  }, [
    hydrated,
    storedClaims,
    selectedClaimId,
    allNotes,
    allActivities,
    sharePackages,
    persistAll,
  ]);

  const updateStoredClaimWorkspace = useCallback(
    (claimId: string, workspace: ReturnType<typeof workspaceFromStored>) => {
      setStoredClaims((current) =>
        current.map((item) => {
          if (item.claim.id !== claimId) return item;
          return buildStoredClaimSnapshot(item, {
            evidenceFiles: workspace.evidenceFiles,
            telematics: serializeTelematicsMap(workspace.telematicsByEvidenceId),
            selectedEventId: workspace.selectedEventId,
            selectedEvidenceId: workspace.selectedEvidenceId,
            activeVideoEvidenceId: workspace.activeVideoEvidenceId,
            sampleEvidenceLoaded: workspace.sampleEvidenceLoaded,
            notesDraft: workspace.notesDraft,
            sourceFilter: workspace.sourceFilter,
            severityFilter: workspace.severityFilter,
            searchQuery: workspace.searchQuery,
            aiAnalysis: workspace.aiAnalysis ?? null,
            eventCollaboration: workspace.eventCollaboration,
            reviewStatusFilter: workspace.reviewStatusFilter,
            bookmarkFilter: workspace.bookmarkFilter,
            flagFilter: workspace.flagFilter,
          });
        })
      );
    },
    []
  );

  return {
    hydrated,
    storedClaims,
    setStoredClaims,
    selectedClaimId,
    setSelectedClaimId,
    allNotes,
    setAllNotes,
    allActivities,
    setAllActivities,
    sharePackages,
    setSharePackages,
    updateStoredClaimWorkspace,
    persistAll,
    skipNextPersist,
  };
}

export function getClaimFromCatalog(
  storedClaims: StoredClaim[],
  claimId: string
): Claim | null {
  return storedClaims.find((item) => item.claim.id === claimId)?.claim ?? null;
}

export function buildWorkspacePersistPayload(input: {
  evidenceFiles: StoredClaim["evidenceFiles"];
  telematicsByEvidenceId: Record<string, ParsedTelematics>;
  selectedEventId: string;
  selectedEvidenceId: string | null;
  activeVideoEvidenceId: string | null;
  sampleEvidenceLoaded: boolean;
  notesDraft: string;
  sourceFilter: TimelineSourceFilter;
  severityFilter: SeverityFilter;
  searchQuery: string;
  eventCollaboration?: ClaimEventCollaboration;
  reviewStatusFilter?: ReviewStatusFilter;
  bookmarkFilter?: BookmarkFilter;
  flagFilter?: FlagFilter;
}) {
  return {
    evidenceFiles: input.evidenceFiles,
    telematics: serializeTelematicsMap(input.telematicsByEvidenceId),
    selectedEventId: input.selectedEventId,
    selectedEvidenceId: input.selectedEvidenceId,
    activeVideoEvidenceId: input.activeVideoEvidenceId,
    sampleEvidenceLoaded: input.sampleEvidenceLoaded,
    notesDraft: input.notesDraft,
    sourceFilter: input.sourceFilter,
    severityFilter: input.severityFilter,
    searchQuery: input.searchQuery,
    eventCollaboration: input.eventCollaboration,
    reviewStatusFilter: input.reviewStatusFilter,
    bookmarkFilter: input.bookmarkFilter,
    flagFilter: input.flagFilter,
  };
}

export { createActivityEntry } from "@/lib/audit/activityUtils";

export {
  getActivities,
  getNotes,
  getSelectedClaimId,
  getSharePackages,
};

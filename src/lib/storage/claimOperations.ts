import { sampleClaims } from "@/data/sampleClaims";
import {
  REAL_DEMO_CLAIM_ID,
  REAL_DEMO_VIDEO_EVIDENCE_ID,
} from "@/data/realDemoClaim";
import {
  getRealDemoParsedTelematics,
  getRealDemoTelematicsSerialized,
  REAL_DEMO_TELEMATICS_EVIDENCE_ID,
} from "@/data/realDemoClaimTelemetry";
import { enrichTelematicsEvidenceFile } from "@/lib/telematicsTransforms";
import type { Claim } from "@/types/claim";
import type { StoredInvestigationNote } from "@/types/investigation-note";
import { createEmptyCollaboration } from "@/types/collaboration";
import { createCollaborationId } from "@/lib/collaboration/collaborationUtils";
import type { ClaimEventCollaboration } from "@/types/collaboration";
import type { StoredClaim } from "@/types/stored-claim";

let claimCounter = 0;

export function generateClaimId(): string {
  claimCounter += 1;
  return `CC-${new Date().getFullYear()}-${String(claimCounter).padStart(3, "0")}-${Date.now().toString(36).slice(-4)}`;
}

export function createEmptyClaim(title?: string): StoredClaim {
  const id = generateClaimId();
  const claimTitle = title ?? "New Investigation";
  const claim: Claim = {
    id,
    shortLabel: claimTitle,
    title: claimTitle,
    status: "Evidence Review",
    incidentDateTime: new Date().toLocaleString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }),
    vehicleId: "Unit —",
    driverName: "—",
    location: "—",
    scenarioSummary: "New investigation workspace awaiting evidence upload.",
    shareUrl: `https://chronosclaims.app/share/${id}`,
    evidenceFiles: [],
    timelineEvents: [],
    speedData: [],
    mapRoute: [],
    mapMarkers: [],
    sampleObservations: [],
    sampleEvidencePath: "",
    defaultSelectedEventId: "",
    defaultSelectedEvidenceId: "",
    mapRouteLabel: "No route loaded",
  };

  return {
    claim,
    evidenceFiles: [],
    telematics: [],
    selectedEventId: "",
    selectedEvidenceId: null,
    activeVideoEvidenceId: null,
    sampleEvidenceLoaded: false,
    notesDraft: "",
    sourceFilter: "all",
    severityFilter: "all",
    searchQuery: "",
    isSample: false,
  };
}

function duplicateCollaborationForClaim(
  source: ClaimEventCollaboration | undefined,
  newClaimId: string
): ClaimEventCollaboration {
  const collaboration = source ?? createEmptyCollaboration();
  return {
    reviewStatusByEventId: { ...collaboration.reviewStatusByEventId },
    assignments: collaboration.assignments.map((assignment) => ({
      ...assignment,
      id: createCollaborationId("assign"),
      claimId: newClaimId,
    })),
    bookmarks: collaboration.bookmarks.map((bookmark) => ({
      ...bookmark,
      id: createCollaborationId("bookmark"),
      claimId: newClaimId,
    })),
    flags: collaboration.flags.map((flag) => ({
      ...flag,
      id: createCollaborationId("flag"),
      claimId: newClaimId,
    })),
    comments: collaboration.comments.map((comment) => ({
      ...comment,
      id: createCollaborationId("comment"),
      claimId: newClaimId,
    })),
  };
}

function duplicateAiAnalysis(
  source: StoredClaim["aiAnalysis"],
  newClaimId: string
): StoredClaim["aiAnalysis"] {
  if (!source) return null;
  return {
    ...source,
    observations: source.observations.map((item) => ({
      ...item,
      claimId: newClaimId,
    })),
    documentObservations: source.documentObservations.map((item) => ({
      ...item,
      claimId: newClaimId,
    })),
    extractions: source.extractions.map((item) => ({
      ...item,
      claimId: newClaimId,
      observations: item.observations.map((observation) => ({
        ...observation,
        claimId: newClaimId,
      })),
    })),
    timelineEvents: source.timelineEvents.map((item) => ({
      ...item,
      claimId: newClaimId,
    })),
    summary: source.summary
      ? { ...source.summary, claimId: newClaimId }
      : null,
  };
}

export function duplicateStoredClaim(
  source: StoredClaim,
  notes: StoredInvestigationNote[]
): { stored: StoredClaim; copiedNotes: StoredInvestigationNote[] } {
  const newId = generateClaimId();
  const duplicatedTitle = `${source.claim.title} (Copy)`;
  const duplicatedClaim: Claim = {
    ...source.claim,
    id: newId,
    title: duplicatedTitle,
    shortLabel: duplicatedTitle,
    shareUrl: `https://chronosclaims.app/share/${newId}`,
  };

  const stored: StoredClaim = {
    claim: duplicatedClaim,
    evidenceFiles: source.evidenceFiles.map((file) => ({ ...file })),
    telematics: source.telematics.map((item) => ({
      ...item,
      detectedEvents: item.detectedEvents.map((event) => ({ ...event })),
      rows: item.rows.map((row) => ({ ...row })),
    })),
    selectedEventId: source.selectedEventId,
    selectedEvidenceId: source.selectedEvidenceId,
    activeVideoEvidenceId: source.activeVideoEvidenceId,
    sampleEvidenceLoaded: source.sampleEvidenceLoaded,
    notesDraft: source.notesDraft,
    sourceFilter: source.sourceFilter,
    severityFilter: source.severityFilter,
    searchQuery: source.searchQuery,
    reviewStatusFilter: source.reviewStatusFilter ?? "all",
    bookmarkFilter: source.bookmarkFilter ?? "all",
    flagFilter: source.flagFilter ?? "all",
    aiAnalysis: duplicateAiAnalysis(source.aiAnalysis, newId),
    eventCollaboration: duplicateCollaborationForClaim(
      source.eventCollaboration,
      newId
    ),
    isSample: false,
  };

  const copiedNotes = notes
    .filter((note) => note.claimId === source.claim.id)
    .map((note) => ({
      ...note,
      id: `note-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      claimId: newId,
    }));

  return { stored, copiedNotes };
}

export function buildSampleStoredClaims(): StoredClaim[] {
  return sampleClaims.map((claim) => {
    if (claim.id === REAL_DEMO_CLAIM_ID) {
      const parsed = getRealDemoParsedTelematics();
      const evidenceFiles = claim.evidenceFiles.map((file) =>
        file.id === REAL_DEMO_TELEMATICS_EVIDENCE_ID
          ? enrichTelematicsEvidenceFile(file, parsed)
          : file
      );
      return {
        claim,
        evidenceFiles,
        telematics: getRealDemoTelematicsSerialized(),
        selectedEventId: claim.defaultSelectedEventId,
        selectedEvidenceId: claim.defaultSelectedEvidenceId,
        activeVideoEvidenceId: REAL_DEMO_VIDEO_EVIDENCE_ID,
        sampleEvidenceLoaded: true,
        notesDraft: "",
        sourceFilter: "all",
        severityFilter: "all",
        searchQuery: "",
        isSample: true,
      };
    }

    return {
      claim,
      evidenceFiles: claim.evidenceFiles,
      telematics: [],
      selectedEventId: claim.defaultSelectedEventId,
      selectedEvidenceId: claim.defaultSelectedEvidenceId,
      activeVideoEvidenceId: null,
      sampleEvidenceLoaded: false,
      notesDraft: "",
      sourceFilter: "all",
      severityFilter: "all",
      searchQuery: "",
      isSample: true,
    };
  });
}

export function buildInitialNotesFromSampleClaims(): StoredInvestigationNote[] {
  return sampleClaims.flatMap((claim) =>
    claim.sampleObservations.map((observation) => ({
      id: observation.id,
      claimId: claim.id,
      body: observation.content,
      createdAt: observation.createdAt,
    }))
  );
}

export function renameStoredClaim(
  stored: StoredClaim,
  title: string,
  shortLabel?: string
): StoredClaim {
  const nextShortLabel = shortLabel ?? title;
  return {
    ...stored,
    claim: {
      ...stored.claim,
      title,
      shortLabel: nextShortLabel,
    },
  };
}

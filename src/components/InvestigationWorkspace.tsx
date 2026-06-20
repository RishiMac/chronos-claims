"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { EvidenceSidebar } from "@/components/EvidenceSidebar";
import { EvidenceViewerTabs } from "@/components/EvidenceViewerTabs";
import { Header } from "@/components/Header";
import { RightInvestigationPanel } from "@/components/RightInvestigationPanel";
import { SharePackageModal } from "@/components/SharePackageModal";
import { DEMO_VIDEO_SRC } from "@/components/VideoViewer";
import { getDefaultClaim } from "@/data/sampleClaims";
import {
  REAL_DEMO_CLAIM_ID,
  REAL_DEMO_VIDEO_DURATION_SECONDS,
} from "@/data/realDemoClaim";
import {
  buildClearedAiAnalysis,
  buildStoredAiAnalysis,
  hasActiveAiContent,
  normalizeStoredAiAnalysis,
} from "@/lib/ai/aiService";
import {
  AI_NO_OBSERVATIONS_COPY,
  AI_NO_TEXT_EVIDENCE_COPY,
} from "@/lib/ai/constants";
import { aiTimelineEventsToTimelineEvents } from "@/lib/ai/aiTimelineBridge";
import { formatClaimDisplayTitle } from "@/lib/claimDisplay";
import { createActivityEntry } from "@/lib/audit/activityUtils";
import {
  computeReviewSummary,
  createCollaborationId,
  enrichTimelineEventsWithCollaboration,
  formatCommentTimestamp,
  getEventFlags,
  isEventBookmarked,
} from "@/lib/collaboration/collaborationUtils";
import { detectTelematicsEvents } from "@/lib/detectTelematicsEvents";
import {
  createPreviewObjectUrl,
  createUploadedEvidenceFile,
  detectEvidenceFileType,
  estimatePdfPageCount,
  isAcceptedEvidenceFile,
  loadImageDimensions,
  readUploadedTextContent,
} from "@/lib/evidenceUpload";
import {
  buildEventNoteInsert,
  computeInvestigationStats,
  computeVideoDuration,
  filterTimelineEvents,
  findActiveEventForPlayback,
  findActiveVideoSyncedEventForPlayback,
  eventLinksVideoEvidence,
} from "@/lib/eventUtils";
import { useInvestigationKeyboard } from "@/hooks/useInvestigationKeyboard";
import {
  getClaimFromCatalog,
  useChronosPersistence,
} from "@/hooks/useChronosPersistence";
import {
  parseTelematicsCsv,
  TelematicsParseError,
} from "@/lib/parseTelematicsCsv";
import {
  enrichSampleEvidencePreviews,
  fetchSampleTelematicsCsv,
  hasSampleEvidenceLoaded,
  resolveSampleEvidenceBundle,
  SAMPLE_EVIDENCE_ALREADY_LOADED_MESSAGE,
  SampleEvidenceFileMissingError,
  SampleEvidenceUnexpectedError,
} from "@/lib/sampleEvidenceLoader";
import {
  buildSessionExport,
  deserializeTelematics,
  downloadSessionExport,
  parseSessionImport,
} from "@/lib/sessionPersistence";
import {
  buildInitialNotesFromSampleClaims,
  buildSampleStoredClaims,
  createEmptyClaim,
  duplicateStoredClaim,
  renameStoredClaim,
} from "@/lib/storage/claimOperations";
import {
  workspaceFromStored,
} from "@/lib/storage/claimSerializer";
import { resetStorage } from "@/lib/storage/chronosStorage";
import {
  getBootstrapStoredClaim,
  getBootstrapWorkspace,
} from "@/lib/storage/bootstrapState";
import {
  createSharePackage,
  getLatestSharePackageForClaim,
  listSharePackages,
  revokeSharePackage,
  settingsChanged,
} from "@/lib/share/shareService";
import type { SharePackageGenerateInput } from "@/components/SharePackageModal";
import {
  fromInvestigationNote,
  toInvestigationNote,
} from "@/types/investigation-note";
import {
  auditActivityToSessionEntry,
  type AuditActivityAction,
} from "@/types/audit-activity";
import type { StoredAiAnalysis } from "@/types/ai-types";
import type { EvidenceReference } from "@/types/evidence-reference";
import type { SharePackage } from "@/types/share-package";
import type { StoredClaim } from "@/types/stored-claim";
import {
  buildParsedTelematics,
  collectUploadedTimelineEvents,
  enrichTelematicsEvidenceFile,
  mergeTimelineEvents,
  telematicsRowsToMapData,
  telematicsRowsToSpeedData,
} from "@/lib/telematicsTransforms";
import type {
  BookmarkFilter,
  Claim,
  EvidenceFile,
  FlagFilter,
  ParsedTelematics,
  ReviewStatusFilter,
  SessionActivityEntry,
  SeverityFilter,
  TelematicsUploadState,
  TimelineSourceFilter,
} from "@/types/claim";
import {
  createEmptyCollaboration,
  DEMO_REVIEWER_NAME,
  FLAG_TYPE_LABELS,
  REVIEW_STATUS_LABELS,
  type ClaimEventCollaboration,
  type EventBookmark,
  type EventComment,
  type EventFlag,
  type EventFlagType,
  type EventAssignment,
  type ReviewStatus,
} from "@/types/collaboration";
import type { ViewerTab } from "@/components/EvidenceViewerTabs";

function createEvidenceId() {
  return `ev-upload-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function getDefaultVideoOffset(claim: Claim) {
  const event = claim.timelineEvents.find(
    (item) => item.id === claim.defaultSelectedEventId
  );
  return event?.videoOffsetSeconds ?? 0;
}

const bootstrapStoredClaim = getBootstrapStoredClaim();
const bootstrapWorkspace = getBootstrapWorkspace();

export function InvestigationWorkspace() {
  const {
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
  } = useChronosPersistence();

  const activeClaimId = selectedClaimId;
  const claimsCatalog = useMemo(
    () => storedClaims.map((item) => item.claim),
    [storedClaims]
  );
  const activeClaim = useMemo(
    () =>
      getClaimFromCatalog(storedClaims, activeClaimId) ?? getDefaultClaim(),
    [storedClaims, activeClaimId]
  );

  const [evidenceFiles, setEvidenceFiles] = useState<EvidenceFile[]>(
    bootstrapWorkspace.evidenceFiles
  );
  const [telematicsByEvidenceId, setTelematicsByEvidenceId] = useState<
    Record<string, ParsedTelematics>
  >(bootstrapWorkspace.telematicsByEvidenceId);
  const [uploadState, setUploadState] = useState<TelematicsUploadState>("idle");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadWarnings, setUploadWarnings] = useState<string[]>([]);
  const [processedFileName, setProcessedFileName] = useState<string | null>(
    null
  );
  const [sampleEvidenceLoaded, setSampleEvidenceLoaded] = useState(
    bootstrapWorkspace.sampleEvidenceLoaded
  );
  const [selectedEventId, setSelectedEventId] = useState(
    bootstrapWorkspace.selectedEventId ||
      bootstrapStoredClaim.claim.defaultSelectedEventId
  );
  const [selectedEvidenceId, setSelectedEvidenceId] = useState<string | null>(
    bootstrapWorkspace.selectedEvidenceId ??
      bootstrapStoredClaim.claim.defaultSelectedEvidenceId
  );
  const [activeVideoEvidenceId, setActiveVideoEvidenceId] = useState<
    string | null
  >(bootstrapWorkspace.activeVideoEvidenceId);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [modalSharePackage, setModalSharePackage] = useState<SharePackage | null>(
    null
  );
  const [sourceFilter, setSourceFilter] =
    useState<TimelineSourceFilter>(bootstrapWorkspace.sourceFilter);
  const [severityFilter, setSeverityFilter] =
    useState<SeverityFilter>(bootstrapWorkspace.severityFilter);
  const [reviewStatusFilter, setReviewStatusFilter] =
    useState<ReviewStatusFilter>(bootstrapWorkspace.reviewStatusFilter ?? "all");
  const [bookmarkFilter, setBookmarkFilter] = useState<BookmarkFilter>(
    bootstrapWorkspace.bookmarkFilter ?? "all"
  );
  const [flagFilter, setFlagFilter] = useState<FlagFilter>(
    bootstrapWorkspace.flagFilter ?? "all"
  );
  const [eventCollaboration, setEventCollaboration] =
    useState<ClaimEventCollaboration>(
      bootstrapWorkspace.eventCollaboration ?? createEmptyCollaboration()
    );
  const [currentVideoTime, setCurrentVideoTime] = useState(() =>
    getDefaultVideoOffset(bootstrapStoredClaim.claim)
  );
  const [videoDuration, setVideoDuration] = useState(18);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [videoSourceLoaded, setVideoSourceLoaded] = useState(false);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [notesDraft, setNotesDraft] = useState(bootstrapWorkspace.notesDraft);
  const [searchQuery, setSearchQuery] = useState(bootstrapWorkspace.searchQuery);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<StoredAiAnalysis | null>(() =>
    normalizeStoredAiAnalysis(bootstrapWorkspace.aiAnalysis)
  );
  const [aiGenerationNotice, setAiGenerationNotice] = useState<string | null>(
    null
  );
  const [activeViewerTab, setActiveViewerTab] = useState<ViewerTab>("video");
  const [activeEvidenceReference, setActiveEvidenceReference] =
    useState<EvidenceReference | null>(null);
  const playbackIntervalRef = useRef<number | null>(null);
  const objectUrlsRef = useRef<Map<string, string>>(new Map());
  const workspaceLoadedRef = useRef(false);
  const skipNextWorkspacePersist = useRef(true);

  const investigationNotes = useMemo(
    () =>
      allNotes
        .filter((note) => note.claimId === activeClaimId)
        .map(toInvestigationNote),
    [allNotes, activeClaimId]
  );

  const activityLog = useMemo<SessionActivityEntry[]>(
    () =>
      allActivities
        .filter((entry) => entry.claimId === activeClaimId)
        .map(auditActivityToSessionEntry),
    [allActivities, activeClaimId]
  );

  const latestSharePackage = useMemo(() => {
    return (
      sharePackages
        .filter((pkg) => pkg.claimId === activeClaimId)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )[0] ?? null
    );
  }, [sharePackages, activeClaimId]);

  const loadWorkspaceFromStored = useCallback((stored: StoredClaim) => {
    const workspace = workspaceFromStored(stored);
    setEvidenceFiles(workspace.evidenceFiles);
    setTelematicsByEvidenceId(workspace.telematicsByEvidenceId);
    setSelectedEventId(
      workspace.selectedEventId || stored.claim.defaultSelectedEventId
    );
    setSelectedEvidenceId(
      workspace.selectedEvidenceId ?? stored.claim.defaultSelectedEvidenceId
    );
    setActiveVideoEvidenceId(workspace.activeVideoEvidenceId);
    setSampleEvidenceLoaded(workspace.sampleEvidenceLoaded);
    setNotesDraft(workspace.notesDraft);
    setSourceFilter(workspace.sourceFilter);
    setSeverityFilter(workspace.severityFilter);
    setReviewStatusFilter(workspace.reviewStatusFilter ?? "all");
    setBookmarkFilter(workspace.bookmarkFilter ?? "all");
    setFlagFilter(workspace.flagFilter ?? "all");
    setEventCollaboration(workspace.eventCollaboration ?? createEmptyCollaboration());
    setSearchQuery(workspace.searchQuery);
    setAiAnalysis(normalizeStoredAiAnalysis(workspace.aiAnalysis));
    setAiGenerationNotice(null);
    setActiveViewerTab("video");
    setActiveEvidenceReference(null);
    setCurrentVideoTime(getDefaultVideoOffset(stored.claim));
    setIsVideoPlaying(false);
    setVideoSourceLoaded(false);
    setUploadState("idle");
    setUploadError(null);
    setUploadWarnings([]);
    setProcessedFileName(null);
    setImportMessage(null);
  }, []);

  const logActivity = useCallback(
    (action: AuditActivityAction, details: string, eventId?: string) => {
      if (!activeClaimId) return;
      const entry = createActivityEntry(activeClaimId, action, details, eventId);
      setAllActivities((previous) => [entry, ...previous]);
    },
    [activeClaimId, setAllActivities]
  );

  const hasUploadedTelematics =
    Object.keys(telematicsByEvidenceId).length > 0;

  useEffect(() => {
    if (!hydrated || workspaceLoadedRef.current) return;
    queueMicrotask(() => {
      const stored =
        storedClaims.find((item) => item.claim.id === selectedClaimId) ??
        storedClaims[0];
      if (stored) {
        loadWorkspaceFromStored(stored);
        if (!selectedClaimId) {
          setSelectedClaimId(stored.claim.id);
        }
      }
      workspaceLoadedRef.current = true;
      skipNextWorkspacePersist.current = true;
    });
  }, [
    hydrated,
    storedClaims,
    selectedClaimId,
    loadWorkspaceFromStored,
    setSelectedClaimId,
  ]);

  useEffect(() => {
    if (!hydrated || !workspaceLoadedRef.current || !activeClaimId) return;
    if (skipNextWorkspacePersist.current) {
      skipNextWorkspacePersist.current = false;
      return;
    }
    updateStoredClaimWorkspace(activeClaimId, {
      evidenceFiles,
      telematicsByEvidenceId,
      selectedEventId,
      selectedEvidenceId,
      activeVideoEvidenceId,
      sampleEvidenceLoaded,
      notesDraft,
      sourceFilter,
      severityFilter,
      reviewStatusFilter,
      bookmarkFilter,
      flagFilter,
      searchQuery,
      aiAnalysis,
      eventCollaboration,
    });
  }, [
    hydrated,
    activeClaimId,
    evidenceFiles,
    telematicsByEvidenceId,
    selectedEventId,
    selectedEvidenceId,
    activeVideoEvidenceId,
    sampleEvidenceLoaded,
    notesDraft,
    sourceFilter,
    severityFilter,
    reviewStatusFilter,
    bookmarkFilter,
    flagFilter,
    searchQuery,
    aiAnalysis,
    eventCollaboration,
    updateStoredClaimWorkspace,
  ]);

  const activeTelematics = useMemo(() => {
    if (
      selectedEvidenceId &&
      telematicsByEvidenceId[selectedEvidenceId]
    ) {
      return telematicsByEvidenceId[selectedEvidenceId];
    }

    const values = Object.values(telematicsByEvidenceId);
    return values[values.length - 1] ?? null;
  }, [selectedEvidenceId, telematicsByEvidenceId]);

  const timelineEvents = useMemo(() => {
    let events = activeClaim.timelineEvents;
    const uploadedEvents = collectUploadedTimelineEvents(telematicsByEvidenceId);
    if (
      uploadedEvents.length > 0 &&
      activeClaim.id !== REAL_DEMO_CLAIM_ID
    ) {
      events = mergeTimelineEvents(events, uploadedEvents);
    }
    if (
      aiAnalysis &&
      hasActiveAiContent(aiAnalysis) &&
      aiAnalysis.timelineEvents.length
    ) {
      events = mergeTimelineEvents(
        events,
        aiTimelineEventsToTimelineEvents(aiAnalysis.timelineEvents)
      );
    }
    return enrichTimelineEventsWithCollaboration(events, eventCollaboration);
  }, [
    telematicsByEvidenceId,
    activeClaim.id,
    activeClaim.timelineEvents,
    aiAnalysis,
    eventCollaboration,
  ]);

  const speedData = useMemo(() => {
    if (!activeTelematics) return activeClaim.speedData;
    return telematicsRowsToSpeedData(
      activeTelematics.rows,
      activeTelematics.detectedEvents
    );
  }, [activeTelematics, activeClaim.speedData]);

  const mapData = useMemo(() => {
    if (!activeTelematics) {
      return {
        route: activeClaim.mapRoute,
        markers: activeClaim.mapMarkers,
        hasGpsCoordinates: true,
      };
    }

    return telematicsRowsToMapData(
      activeTelematics.rows,
      activeTelematics.detectedEvents
    );
  }, [activeTelematics, activeClaim.mapRoute, activeClaim.mapMarkers]);

  const selectedEvidence = useMemo(
    () => evidenceFiles.find((file) => file.id === selectedEvidenceId) ?? null,
    [evidenceFiles, selectedEvidenceId]
  );

  const selectedParsedTelematics = useMemo(() => {
    if (!selectedEvidenceId) return null;
    return telematicsByEvidenceId[selectedEvidenceId] ?? null;
  }, [selectedEvidenceId, telematicsByEvidenceId]);

  const activeVideoFile = useMemo(() => {
    if (activeVideoEvidenceId) {
      const selectedVideo = evidenceFiles.find(
        (file) => file.id === activeVideoEvidenceId && file.fileType === "video"
      );
      if (selectedVideo) return selectedVideo;
    }

    const publicVideo = evidenceFiles.find(
      (file) => file.fileType === "video" && file.metadata.publicUrl
    );
    if (publicVideo) return publicVideo;

    const uploadedVideos = evidenceFiles.filter(
      (file) => file.fileType === "video" && file.objectUrl
    );
    return uploadedVideos[uploadedVideos.length - 1] ?? null;
  }, [activeVideoEvidenceId, evidenceFiles]);

  const videoConfig = useMemo(() => {
    if (activeVideoFile?.objectUrl) {
      return {
        src: activeVideoFile.objectUrl,
        fileName: activeVideoFile.name,
        isUploaded: true,
      };
    }

    if (activeVideoFile?.metadata.publicUrl) {
      return {
        src: activeVideoFile.metadata.publicUrl,
        fileName: activeVideoFile.name,
        isUploaded: false,
      };
    }

    return {
      src: DEMO_VIDEO_SRC,
      fileName: "dashcam_front.mp4",
      isUploaded: false,
    };
  }, [activeVideoFile]);

  const stats = useMemo(
    () => computeInvestigationStats(timelineEvents, activeTelematics),
    [timelineEvents, activeTelematics]
  );

  const selectedEvent = useMemo(
    () => timelineEvents.find((event) => event.id === selectedEventId) ?? null,
    [timelineEvents, selectedEventId]
  );

  const linkedEvidence = useMemo(
    () =>
      selectedEvent
        ? selectedEvent.linkedEvidenceIds
            .map((id) => evidenceFiles.find((file) => file.id === id))
            .filter((file): file is NonNullable<typeof file> => Boolean(file))
        : [],
    [selectedEvent, evidenceFiles]
  );

  const selectedEventHiddenByFilter = useMemo(() => {
    if (!selectedEvent) return false;
    const visible = filterTimelineEvents(
      timelineEvents,
      evidenceFiles,
      sourceFilter,
      severityFilter,
      searchQuery,
      reviewStatusFilter,
      bookmarkFilter,
      flagFilter
    );
    return !visible.some((event) => event.id === selectedEvent.id);
  }, [
    selectedEvent,
    timelineEvents,
    evidenceFiles,
    sourceFilter,
    severityFilter,
    searchQuery,
    reviewStatusFilter,
    bookmarkFilter,
    flagFilter,
  ]);

  const playbackEvent = useMemo(() => {
    if (!isVideoPlaying) return null;
    const activeVideoEvent = findActiveVideoSyncedEventForPlayback(
      timelineEvents,
      currentVideoTime,
      evidenceFiles
    );
    if (activeVideoEvent) return activeVideoEvent;
    if (
      selectedEvent &&
      eventLinksVideoEvidence(selectedEvent, evidenceFiles)
    ) {
      return selectedEvent;
    }
    return null;
  }, [
    isVideoPlaying,
    timelineEvents,
    currentVideoTime,
    selectedEvent,
    evidenceFiles,
  ]);

  const currentTimestamp =
    selectedEvent?.timestamp ??
    timelineEvents.find((event) => event.id === selectedEventId)?.timestamp ??
    "—";

  useEffect(() => {
    queueMicrotask(() => {
      if (activeClaim.id === REAL_DEMO_CLAIM_ID) {
        setVideoDuration(REAL_DEMO_VIDEO_DURATION_SECONDS);
        return;
      }
      setVideoDuration(computeVideoDuration(timelineEvents, activeTelematics));
    });
  }, [activeClaim.id, timelineEvents, activeTelematics]);

  const resetVideoForSourceChange = useCallback(() => {
    setVideoSourceLoaded(false);
    setIsVideoPlaying(false);
  }, []);

  useEffect(() => {
    queueMicrotask(resetVideoForSourceChange);
  }, [videoConfig.src, resetVideoForSourceChange]);

  useEffect(() => {
    const objectUrls = objectUrlsRef.current;
    return () => {
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
      objectUrls.clear();
    };
  }, []);

  useEffect(() => {
    if (!isVideoPlaying || videoSourceLoaded || isScrubbing) {
      if (playbackIntervalRef.current) {
        window.clearInterval(playbackIntervalRef.current);
        playbackIntervalRef.current = null;
      }
      return;
    }

    playbackIntervalRef.current = window.setInterval(() => {
      setCurrentVideoTime((previous) => {
        const next = Math.min(videoDuration, previous + 0.25);
        const activeEvent = findActiveEventForPlayback(timelineEvents, next);
        if (activeEvent) {
          setSelectedEventId(activeEvent.id);
        }
        if (next >= videoDuration) {
          setIsVideoPlaying(false);
        }
        return next;
      });
    }, 250);

    return () => {
      if (playbackIntervalRef.current) {
        window.clearInterval(playbackIntervalRef.current);
        playbackIntervalRef.current = null;
      }
    };
  }, [isVideoPlaying, videoSourceLoaded, isScrubbing, videoDuration, timelineEvents]);

  const handleSelectEvent = useCallback(
    (eventId: string) => {
      const event = timelineEvents.find((item) => item.id === eventId);
      setSelectedEventId(eventId);
      if (event) {
        const seeksVideo = event.linkedEvidenceIds.some((id) => {
          const file = evidenceFiles.find((item) => item.id === id);
          return file?.fileType === "video";
        });
        if (seeksVideo) {
          setCurrentVideoTime(event.videoOffsetSeconds);
        }
        logActivity("opened_timeline_event", `Viewed event: ${event.title}`);
      }
    },
    [timelineEvents, evidenceFiles, logActivity]
  );

  const handleSelectEvidence = useCallback(
    (evidenceId: string) => {
      setSelectedEvidenceId(evidenceId);
      setActiveEvidenceReference(null);
      const file = evidenceFiles.find((item) => item.id === evidenceId);
      if (file?.fileType === "video") {
        setActiveVideoEvidenceId(evidenceId);
        setActiveViewerTab("video");
        logActivity("general", `Selected video evidence: ${file.name}`);
      } else if (file) {
        setActiveViewerTab("evidence");
        logActivity("general", `Selected evidence file: ${file.name}`);
      }
    },
    [evidenceFiles, logActivity]
  );

  const handlePreviewEvidence = useCallback(
    (evidenceId: string) => {
      setSelectedEvidenceId(evidenceId);
      setActiveEvidenceReference(null);
      const file = evidenceFiles.find((item) => item.id === evidenceId);
      if (file?.fileType === "video") {
        setActiveVideoEvidenceId(evidenceId);
      }
      setActiveViewerTab("evidence");
      if (file) {
        logActivity("general", `Previewed evidence file: ${file.name}`);
      }
    },
    [evidenceFiles, logActivity]
  );

  const handleOpenEvidenceReference = useCallback(
    (reference: EvidenceReference) => {
      setSelectedEvidenceId(reference.evidenceFileId);
      setActiveEvidenceReference(reference);
      setActiveViewerTab("evidence");
      logActivity(
        "general",
        `Opened supporting source reference for ${reference.filename}`
      );
    },
    [logActivity]
  );

  const handlePlayPause = useCallback(() => {
    setIsVideoPlaying((previous) => !previous);
  }, []);

  const handleVideoTimeUpdate = useCallback(
    (time: number) => {
      setCurrentVideoTime(time);
      const activeEvent = findActiveEventForPlayback(timelineEvents, time);
      if (activeEvent && isVideoPlaying) {
        setSelectedEventId(activeEvent.id);
      }
    },
    [timelineEvents, isVideoPlaying]
  );

  const handleVideoSeek = useCallback(
    (time: number) => {
      setCurrentVideoTime(time);
      const activeEvent = findActiveEventForPlayback(timelineEvents, time);
      if (activeEvent) {
        setSelectedEventId(activeEvent.id);
      }
    },
    [timelineEvents]
  );

  const handleSeekBack = useCallback(() => {
    handleVideoSeek(Math.max(0, currentVideoTime - 5));
  }, [currentVideoTime, handleVideoSeek]);

  const handleSeekForward = useCallback(() => {
    handleVideoSeek(Math.min(videoDuration, currentVideoTime + 5));
  }, [currentVideoTime, videoDuration, handleVideoSeek]);

  const handleSeekStart = useCallback(() => {
    handleVideoSeek(0);
  }, [handleVideoSeek]);

  useInvestigationKeyboard({
    onPlayPause: handlePlayPause,
    onSeekBack: handleSeekBack,
    onSeekForward: handleSeekForward,
    onSeekStart: handleSeekStart,
  });

  const handleVideoLoaded = useCallback((duration: number) => {
    setVideoSourceLoaded(true);
    if (Number.isFinite(duration) && duration > 0) {
      setVideoDuration(Math.round(duration));
    }
  }, []);

  const handleVideoError = useCallback(() => {
    setVideoSourceLoaded(false);
    setIsVideoPlaying(false);
  }, []);

  const storeObjectUrl = useCallback((evidenceId: string, url: string) => {
    const existing = objectUrlsRef.current.get(evidenceId);
    if (existing) {
      URL.revokeObjectURL(existing);
    }
    objectUrlsRef.current.set(evidenceId, url);
  }, []);

  const processTelematicsCsv = useCallback(
    async (
      csvText: string,
      fileName: string,
      evidenceId: string,
      fileSizeBytes?: number,
      baseEvidence?: EvidenceFile
    ): Promise<boolean> => {
      setUploadState("parsing");
      setUploadError(null);

      try {
        const parsedBase = parseTelematicsCsv(csvText, fileName);
        const detectedEvents = detectTelematicsEvents(
          parsedBase.rows,
          evidenceId,
          fileName
        );
        const parsed = buildParsedTelematics(
          evidenceId,
          parsedBase,
          detectedEvents
        );

        const sourceEvidence =
          baseEvidence ??
          createUploadedEvidenceFile(
            new File([csvText], fileName, { type: "text/csv" }),
            evidenceId
          );

        const uploadedEvidence = enrichTelematicsEvidenceFile(
          sourceEvidence,
          parsed,
          fileSizeBytes
        );

        setTelematicsByEvidenceId((current) => ({
          ...current,
          [evidenceId]: parsed,
        }));
        setEvidenceFiles((current) => [
          ...current.filter((file) => file.id !== evidenceId),
          uploadedEvidence,
        ]);
        setSelectedEvidenceId(evidenceId);
        setProcessedFileName(fileName);
        setUploadState("processed");

        if (parsed.warnings.length > 0) {
          setUploadWarnings((current) => [...current, ...parsed.warnings]);
        }

        if (detectedEvents.length > 0) {
          setSelectedEventId(detectedEvents[0].id);
          setCurrentVideoTime(detectedEvents[0].videoOffsetSeconds);
        }

        logActivity("uploaded_csv", `Processed telematics CSV: ${fileName}`);
        return true;
      } catch (error) {
        const message =
          error instanceof TelematicsParseError
            ? error.message
            : "Unable to parse telematics CSV. Please check the file format.";
        setUploadError(message);
        setUploadState("error");
        return false;
      }
    },
    [logActivity]
  );

  const applyClaimBaseline = useCallback(
    (stored: StoredClaim) => {
      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      objectUrlsRef.current.clear();
      setSelectedClaimId(stored.claim.id);
      loadWorkspaceFromStored(stored);
    },
    [loadWorkspaceFromStored, setSelectedClaimId]
  );

  const handleClaimChange = useCallback(
    (claimId: string) => {
      const stored = storedClaims.find((item) => item.claim.id === claimId);
      if (!stored) return;
      applyClaimBaseline(stored);
      logActivity("switched_claim", `Switched to claim ${claimId}`);
    },
    [storedClaims, applyClaimBaseline, logActivity]
  );

  const handleCreateClaim = useCallback(() => {
    const stored = createEmptyClaim();
    setStoredClaims((current) => [...current, stored]);
    applyClaimBaseline(stored);
    logActivity("created_claim", "Created claim");
  }, [setStoredClaims, applyClaimBaseline, logActivity]);

  const handleRenameClaim = useCallback(() => {
    const nextTitle = window.prompt("Claim title", activeClaim.title);
    if (!nextTitle?.trim()) return;
    setStoredClaims((current) =>
      current.map((item) =>
        item.claim.id === activeClaimId
          ? renameStoredClaim(item, nextTitle.trim())
          : item
      )
    );
    logActivity("renamed_claim", `Renamed claim to "${nextTitle.trim()}"`);
  }, [activeClaim.title, activeClaimId, setStoredClaims, logActivity]);

  const handleDuplicateClaim = useCallback(() => {
    const source = storedClaims.find((item) => item.claim.id === activeClaimId);
    if (!source) return;
    const { stored, copiedNotes } = duplicateStoredClaim(source, allNotes);
    setStoredClaims((current) => [...current, stored]);
    setAllNotes((current) => [...current, ...copiedNotes]);
    applyClaimBaseline(stored);
    logActivity("duplicated_claim", `Duplicated claim ${activeClaimId}`);
  }, [
    storedClaims,
    activeClaimId,
    allNotes,
    setStoredClaims,
    setAllNotes,
    applyClaimBaseline,
    logActivity,
  ]);

  const handleDeleteClaim = useCallback(() => {
    if (storedClaims.length <= 1) {
      window.alert("At least one claim must remain in the workspace.");
      return;
    }
    const confirmed = window.confirm(
      `Delete ${formatClaimDisplayTitle(activeClaim)}? This cannot be undone.`
    );
    if (!confirmed) return;

    const remaining = storedClaims.filter(
      (item) => item.claim.id !== activeClaimId
    );
    setStoredClaims(remaining);
    setAllNotes((current) =>
      current.filter((note) => note.claimId !== activeClaimId)
    );
    setAllActivities((current) =>
      current.filter((entry) => entry.claimId !== activeClaimId)
    );
    applyClaimBaseline(remaining[0]);
    logActivity("deleted_claim", `Deleted claim ${activeClaimId}`);
  }, [
    storedClaims,
    activeClaimId,
    activeClaim,
    setStoredClaims,
    setAllNotes,
    setAllActivities,
    applyClaimBaseline,
    logActivity,
  ]);

  const handleResetDemo = useCallback(() => {
    const confirmed = window.confirm(
      "Reset all Chronos demo data? This clears local storage and restores sample claims."
    );
    if (!confirmed) return;

    resetStorage();
    const defaults = buildSampleStoredClaims();
    const sampleNotes = buildInitialNotesFromSampleClaims();
    setStoredClaims(defaults);
    setAllNotes(sampleNotes);
    setAllActivities([]);
    setSharePackages([]);
    setSelectedClaimId(defaults[0].claim.id);
    applyClaimBaseline(defaults[0]);
    logActivity("general", "Reset demo data");
  }, [
    setStoredClaims,
    setAllNotes,
    setAllActivities,
    setSharePackages,
    setSelectedClaimId,
    applyClaimBaseline,
    logActivity,
  ]);

  const handleLoadSampleClaims = useCallback(() => {
    const defaults = buildSampleStoredClaims();
    const sampleNotes = buildInitialNotesFromSampleClaims();
    setStoredClaims(defaults);
    setAllNotes(sampleNotes);
    setSelectedClaimId(defaults[0].claim.id);
    applyClaimBaseline(defaults[0]);
    logActivity("general", "Loaded sample claims");
  }, [setStoredClaims, setAllNotes, setSelectedClaimId, applyClaimBaseline, logActivity]);

  const processUploadedFile = useCallback(
    async (file: File) => {
      if (!isAcceptedEvidenceFile(file)) {
        setUploadWarnings((current) => [
          ...current,
          `${file.name} is not a supported file type.`,
        ]);
        return;
      }

      const fileType = detectEvidenceFileType(file);
      if (!fileType) {
        setUploadWarnings((current) => [
          ...current,
          `${file.name} could not be classified.`,
        ]);
        return;
      }

      const evidenceId = createEvidenceId();

      if (fileType === "csv") {
        const csvText = await file.text();
        await processTelematicsCsv(csvText, file.name, evidenceId, file.size);
        return;
      }

      let evidence = createUploadedEvidenceFile(file, evidenceId);

      setEvidenceFiles((current) => [...current, evidence]);
      setSelectedEvidenceId(evidenceId);
      logActivity("general", `Uploaded evidence file: ${file.name}`);

      if (fileType === "video") {
        const objectUrl = createPreviewObjectUrl(file);
        storeObjectUrl(evidenceId, objectUrl);
        evidence = {
          ...evidence,
          objectUrl,
          metadata: {
            ...evidence.metadata,
            source: "Uploaded dashcam video",
            description:
              "Uploaded MP4 loaded into the synchronized video viewer.",
          },
        };
        setEvidenceFiles((current) =>
          current.map((item) => (item.id === evidenceId ? evidence : item))
        );
        setActiveVideoEvidenceId(evidenceId);
        return;
      }

      if (fileType === "image") {
        const objectUrl = createPreviewObjectUrl(file);
        storeObjectUrl(evidenceId, objectUrl);
        try {
          const dimensions = await loadImageDimensions(objectUrl);
          evidence = {
            ...evidence,
            objectUrl,
            metadata: {
              ...evidence.metadata,
              source: "Uploaded image evidence",
              description: "Image evidence available for visual review.",
              imageWidth: dimensions.width,
              imageHeight: dimensions.height,
            },
          };
        } catch {
          evidence = {
            ...evidence,
            objectUrl,
            metadata: {
              ...evidence.metadata,
              source: "Uploaded image evidence",
              description: "Image evidence available for visual review.",
              warnings: ["Unable to read image dimensions."],
            },
          };
        }
        setEvidenceFiles((current) =>
          current.map((item) => (item.id === evidenceId ? evidence : item))
        );
        return;
      }

      if (fileType === "pdf") {
        const objectUrl = createPreviewObjectUrl(file);
        storeObjectUrl(evidenceId, objectUrl);
        const pageCount = await estimatePdfPageCount(file);
        evidence = {
          ...evidence,
          objectUrl,
          metadata: {
            ...evidence.metadata,
            source: "Uploaded PDF document",
            description: "PDF evidence available for embedded preview.",
            pdfPageCount: pageCount,
          },
        };
        setEvidenceFiles((current) =>
          current.map((item) => (item.id === evidenceId ? evidence : item))
        );
        return;
      }

      if (fileType === "text") {
        try {
          const { preview, storedText, warnings } =
            await readUploadedTextContent(file);
          evidence = {
            ...evidence,
            metadata: {
              ...evidence.metadata,
              source: "Uploaded text document",
              description: "Text evidence file added to the investigation.",
              textPreview: preview,
              storedTextContent: storedText,
              warnings: warnings
                ? [...(evidence.metadata.warnings ?? []), ...warnings]
                : evidence.metadata.warnings,
            },
          };
        } catch {
          evidence = {
            ...evidence,
            metadata: {
              ...evidence.metadata,
              warnings: ["Unable to read text preview."],
            },
          };
        }
        setEvidenceFiles((current) =>
          current.map((item) => (item.id === evidenceId ? evidence : item))
        );
        return;
      }

      if (fileType === "zip") {
        evidence = {
          ...evidence,
          metadata: {
            ...evidence.metadata,
            source: "Uploaded archive",
            description:
              "Archive file stored as evidence reference. Contents are not extracted in this demo.",
          },
        };
        setEvidenceFiles((current) =>
          current.map((item) => (item.id === evidenceId ? evidence : item))
        );
      }
    },
    [logActivity, processTelematicsCsv, storeObjectUrl]
  );

  const handleUploadFiles = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;
      setUploadError(null);
      setUploadWarnings([]);
      setUploadState("parsing");

      for (const file of files) {
        await processUploadedFile(file);
      }

      setUploadState((current) => (current === "error" ? "error" : "processed"));
    },
    [processUploadedFile]
  );

  const handleLoadSampleEvidence = useCallback(async () => {
    try {
      setUploadState("parsing");
      setUploadError(null);
      setUploadWarnings([]);

      if (
        hasSampleEvidenceLoaded(
          evidenceFiles,
          sampleEvidenceLoaded,
          Boolean(telematicsByEvidenceId["ev-telematics"])
        )
      ) {
        setUploadState("idle");
        setUploadWarnings([SAMPLE_EVIDENCE_ALREADY_LOADED_MESSAGE]);
        return;
      }

      const bundle = resolveSampleEvidenceBundle(evidenceFiles);
      const csvText = await fetchSampleTelematicsCsv(bundle.telematicsUrl);

      const telematicsProcessed = await processTelematicsCsv(
        csvText,
        "telematics.csv",
        "ev-telematics",
        undefined,
        bundle.telematicsEvidence
      );
      if (!telematicsProcessed) {
        return;
      }

      const claimForPreview: Claim = {
        ...activeClaim,
        evidenceFiles: bundle.files,
        sampleEvidencePath: bundle.sampleEvidencePath,
      };
      const enrichedFiles = await enrichSampleEvidencePreviews(claimForPreview);

      setEvidenceFiles((current) => {
        const parsedTelematics = current.find((file) => file.id === "ev-telematics");
        const sampleIds = new Set(enrichedFiles.map((file) => file.id));
        const nonSampleFiles = current.filter((file) => !sampleIds.has(file.id));
        const sampleFiles = enrichedFiles.map((file) =>
          file.id === "ev-telematics" && parsedTelematics
            ? parsedTelematics
            : file
        );
        return [...nonSampleFiles, ...sampleFiles];
      });
      setSampleEvidenceLoaded(true);
      setUploadState("processed");
      logActivity(
        "loaded_sample_evidence",
        `Loaded sample evidence for ${activeClaim.id}`
      );
    } catch (error) {
      let message: string;
      if (error instanceof SampleEvidenceFileMissingError) {
        message = error.message;
      } else if (error instanceof TelematicsParseError) {
        message = `Telematics parser failure: ${error.message}`;
      } else if (error instanceof SampleEvidenceUnexpectedError) {
        message = error.message;
      } else if (error instanceof Error) {
        message = `An unexpected error occurred while loading sample evidence: ${error.message}`;
      } else {
        message =
          "An unexpected error occurred while loading sample evidence. Please try again.";
      }
      setUploadError(message);
      setUploadState("error");
    }
  }, [
    activeClaim,
    evidenceFiles,
    sampleEvidenceLoaded,
    telematicsByEvidenceId,
    processTelematicsCsv,
    logActivity,
  ]);

  const handleInsertSelectedEvent = useCallback(() => {
    if (!selectedEvent) return;
    const insertion = buildEventNoteInsert(selectedEvent, evidenceFiles);
    setNotesDraft((previous) =>
      previous.trim() ? `${previous.trim()}\n${insertion}` : insertion
    );
  }, [selectedEvent, evidenceFiles]);

  const handleInsertTimestamp = useCallback(() => {
    const insertion = `[${currentTimestamp}]`;
    setNotesDraft((previous) =>
      previous.trim() ? `${previous.trim()}\n${insertion}` : insertion
    );
  }, [currentTimestamp]);

  const handleAddNote = useCallback(() => {
    const content = notesDraft.trim();
    if (!content) return;

    const note = fromInvestigationNote(
      {
        id: `note-${Date.now()}`,
        content,
        createdAt: new Date().toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }),
      },
      activeClaimId
    );
    setAllNotes((previous) => [note, ...previous]);
    logActivity("saved_note", "Saved investigation note");
    setNotesDraft("");
  }, [notesDraft, activeClaimId, setAllNotes, logActivity]);

  const handleExportSession = useCallback(() => {
    const session = buildSessionExport({
      selectedEventId,
      selectedEvidenceId,
      activeVideoEvidenceId,
      sourceFilter,
      severityFilter,
      searchQuery,
      notesDraft,
      notes: investigationNotes,
      activityLog,
      evidenceFiles,
      telematicsByEvidenceId,
      timelineEvents,
    });
    downloadSessionExport(session);
    logActivity("general", "Exported investigation session");
  }, [
    selectedEventId,
    selectedEvidenceId,
    activeVideoEvidenceId,
    sourceFilter,
    severityFilter,
    searchQuery,
    notesDraft,
    investigationNotes,
    activityLog,
    evidenceFiles,
    telematicsByEvidenceId,
    timelineEvents,
    logActivity,
  ]);

  const handleImportSession = useCallback(
    async (file: File) => {
      try {
        const text = await file.text();
        const session = parseSessionImport(text);

        const importedTelematics = session.telematics.reduce<
          Record<string, ParsedTelematics>
        >((accumulator, item) => {
          accumulator[item.evidenceId] = deserializeTelematics(item);
          return accumulator;
        }, {});

        const claimIds = new Set(activeClaim.evidenceFiles.map((item) => item.id));
        const importedEvidence = session.evidenceFiles.filter(
          (item) => item.isUserUploaded || !claimIds.has(item.id)
        );

        setTelematicsByEvidenceId(importedTelematics);
        setEvidenceFiles([...activeClaim.evidenceFiles, ...importedEvidence]);
        setSelectedEventId(session.selectedEventId);
        setSelectedEvidenceId(session.selectedEvidenceId);
        setActiveVideoEvidenceId(session.activeVideoEvidenceId);
        setSourceFilter(session.sourceFilter);
        setSeverityFilter(session.severityFilter);
        setSearchQuery(session.searchQuery);
        setNotesDraft(session.notesDraft);
        setAllNotes((previous) => {
          const others = previous.filter((note) => note.claimId !== activeClaimId);
          const imported = session.notes.map((note) =>
            fromInvestigationNote(note, activeClaimId)
          );
          return [...others, ...imported];
        });
        setAllActivities((previous) => {
          const others = previous.filter(
            (entry) => entry.claimId !== activeClaimId
          );
          const imported = session.activityLog.map((entry) => ({
            id: entry.id,
            claimId: activeClaimId,
            timestamp: entry.timestamp,
            action: entry.action ?? "general",
            details: entry.message,
          }));
          return [...imported, ...others];
        });
        setUploadState(importedEvidence.length > 0 ? "processed" : "idle");
        setUploadError(null);
        setUploadWarnings([]);
        setImportMessage(
          "Session imported. Re-upload video, image, and PDF files to restore previews."
        );
        logActivity("general", "Imported investigation session");
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Unable to import session file.";
        setImportMessage(message);
      }
    },
    [activeClaim.evidenceFiles, activeClaimId, setAllNotes, setAllActivities, logActivity]
  );

  const handleViewerTabChange = useCallback(
    (tab: ViewerTab) => {
      setActiveViewerTab(tab);
      const labels: Record<ViewerTab, string> = {
        video: "Video",
        telemetry: "Telemetry",
        map: "Map",
        notes: "Notes",
        ai: "AI",
        evidence: "Evidence",
      };
      logActivity("general", `Opened ${labels[tab]} tab`);
    },
    [logActivity]
  );

  const handleShareOpen = useCallback(() => {
    setSharePackages(listSharePackages());
    setModalSharePackage(getLatestSharePackageForClaim(activeClaimId));
    setShareModalOpen(true);
  }, [activeClaimId, setSharePackages]);

  const handleGenerateSharePackage = useCallback(
    async (input: SharePackageGenerateInput) => {
      const previous = getLatestSharePackageForClaim(activeClaimId);
      const sharePackage = await createSharePackage({
        claimId: activeClaimId,
        evidenceFiles,
        timelineEvents,
        expiration: input.expiration,
        accessMode: input.accessMode,
        includedSections: input.includedSections,
        passcode: input.passcode,
      });
      setSharePackages(listSharePackages());
      setModalSharePackage(sharePackage);

      if (previous) {
        logActivity(
          "regenerated_share_package",
          `Regenerated share package ${sharePackage.shareToken}`
        );
        if (
          settingsChanged(
            {
              expiration: previous.expiration,
              accessMode: previous.accessMode,
              includedSections: previous.includedSections,
            },
            input
          )
        ) {
          logActivity("changed_share_settings", "Changed share package settings");
        }
      } else {
        logActivity(
          "created_share_package",
          `Created share package ${sharePackage.shareToken}`
        );
      }
    },
    [
      activeClaimId,
      evidenceFiles,
      timelineEvents,
      setSharePackages,
      logActivity,
    ]
  );

  const handleRevokeSharePackage = useCallback(() => {
    const current = modalSharePackage ?? latestSharePackage;
    if (!current) return;
    const revoked = revokeSharePackage(current.shareToken);
    if (!revoked) return;
    setSharePackages(listSharePackages());
    setModalSharePackage(revoked);
    logActivity(
      "revoked_share_package",
      `Revoked share package ${current.shareToken}`
    );
  }, [
    modalSharePackage,
    latestSharePackage,
    setSharePackages,
    logActivity,
  ]);

  const handleCopyShareLink = useCallback(() => {
    logActivity("copied_share_link", "Copied share link");
  }, [logActivity]);

  const handleOpenSharePackage = useCallback(() => {
    logActivity("opened_share_package", "Opened share package in new tab");
  }, [logActivity]);

  const selectedEventComments = useMemo(() => {
    if (!selectedEventId) return [];
    return eventCollaboration.comments
      .filter((comment) => comment.eventId === selectedEventId)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }, [eventCollaboration.comments, selectedEventId]);

  const selectedEventFlags = useMemo(() => {
    if (!selectedEventId) return [];
    return getEventFlags(eventCollaboration, selectedEventId);
  }, [eventCollaboration, selectedEventId]);

  const reviewSummary = useMemo(
    () => computeReviewSummary(timelineEvents),
    [timelineEvents]
  );

  const handleReviewStatusChange = useCallback(
    (status: ReviewStatus) => {
      if (!selectedEventId) return;
      setEventCollaboration((previous) => ({
        ...previous,
        reviewStatusByEventId: {
          ...previous.reviewStatusByEventId,
          [selectedEventId]: status,
        },
      }));
      logActivity(
        "changed_review_status",
        `Changed review status to ${REVIEW_STATUS_LABELS[status]}`,
        selectedEventId
      );
      if (status === "approved") {
        logActivity(
          "approved_event",
          "Marked event as approved after review",
          selectedEventId
        );
      }
      if (status === "dismissed") {
        logActivity(
          "dismissed_event",
          "Dismissed event from active review queue",
          selectedEventId
        );
      }
    },
    [selectedEventId, logActivity]
  );

  const handleAssignEvent = useCallback(
    (assigneeName: string) => {
      if (!selectedEventId || !activeClaimId) return;
      const assignment: EventAssignment = {
        id: createCollaborationId("assign"),
        claimId: activeClaimId,
        eventId: selectedEventId,
        assigneeName,
        status: "assigned",
        createdAt: new Date().toISOString(),
      };
      setEventCollaboration((previous) => ({
        ...previous,
        assignments: [
          ...previous.assignments.filter(
            (item) => item.eventId !== selectedEventId
          ),
          assignment,
        ],
      }));
      logActivity(
        "assigned_event",
        `Assigned event to ${assigneeName}`,
        selectedEventId
      );
    },
    [activeClaimId, selectedEventId, logActivity]
  );

  const handleUnassignEvent = useCallback(() => {
    if (!selectedEventId || !activeClaimId) return;
    setEventCollaboration((previous) => ({
      ...previous,
      assignments: previous.assignments.filter(
        (item) => item.eventId !== selectedEventId
      ),
    }));
    logActivity(
      "assigned_event",
      "Unassigned event",
      selectedEventId
    );
  }, [activeClaimId, selectedEventId, logActivity]);

  const handleToggleBookmark = useCallback(() => {
    if (!selectedEventId || !activeClaimId) return;
    const bookmarked = isEventBookmarked(eventCollaboration, selectedEventId);
    if (bookmarked) {
      setEventCollaboration((previous) => ({
        ...previous,
        bookmarks: previous.bookmarks.filter(
          (item) => item.eventId !== selectedEventId
        ),
      }));
      logActivity(
        "unbookmarked_event",
        "Removed bookmark from event",
        selectedEventId
      );
      return;
    }

    const bookmark: EventBookmark = {
      id: createCollaborationId("bookmark"),
      claimId: activeClaimId,
      eventId: selectedEventId,
      createdAt: new Date().toISOString(),
    };
    setEventCollaboration((previous) => ({
      ...previous,
      bookmarks: [...previous.bookmarks, bookmark],
    }));
    logActivity(
      "bookmarked_event",
      "Bookmarked event for follow-up review",
      selectedEventId
    );
  }, [activeClaimId, selectedEventId, eventCollaboration, logActivity]);

  const handleAddFlag = useCallback(
    (flagType: EventFlagType) => {
      if (!selectedEventId || !activeClaimId) return;
      const existingFlags = getEventFlags(eventCollaboration, selectedEventId);
      if (existingFlags.some((item) => item.flagType === flagType)) {
        return;
      }
      const flag: EventFlag = {
        id: createCollaborationId("flag"),
        claimId: activeClaimId,
        eventId: selectedEventId,
        flagType,
        createdAt: new Date().toISOString(),
      };
      setEventCollaboration((previous) => ({
        ...previous,
        flags: [...previous.flags, flag],
      }));
      logActivity(
        "flagged_event",
        `Added flag: ${FLAG_TYPE_LABELS[flagType]}`,
        selectedEventId
      );
    },
    [activeClaimId, selectedEventId, eventCollaboration, logActivity]
  );

  const handleRemoveFlag = useCallback(
    (flagId: string) => {
      if (!selectedEventId || !activeClaimId) return;
      const flag = eventCollaboration.flags.find((item) => item.id === flagId);
      if (!flag) return;
      setEventCollaboration((previous) => ({
        ...previous,
        flags: previous.flags.filter((item) => item.id !== flagId),
      }));
      logActivity(
        "general",
        `Removed flag: ${FLAG_TYPE_LABELS[flag.flagType]}`,
        selectedEventId
      );
    },
    [activeClaimId, selectedEventId, eventCollaboration.flags, logActivity]
  );

  const handleAddComment = useCallback(
    (body: string) => {
      if (!selectedEventId || !activeClaimId) return;
      const comment: EventComment = {
        id: createCollaborationId("comment"),
        claimId: activeClaimId,
        eventId: selectedEventId,
        authorName: DEMO_REVIEWER_NAME,
        body,
        createdAt: formatCommentTimestamp(),
      };
      setEventCollaboration((previous) => ({
        ...previous,
        comments: [...previous.comments, comment],
      }));
      logActivity(
        "commented_on_event",
        "Added review comment on event",
        selectedEventId
      );
    },
    [activeClaimId, selectedEventId, logActivity]
  );

  const handleCopySummary = useCallback(() => {
    logActivity("copied_event_summary", "Copied event summary");
  }, [logActivity]);

  const handleGenerateAi = useCallback(async () => {
    setAiGenerationNotice(null);
    const result = await buildStoredAiAnalysis({
      claimId: activeClaimId,
      evidenceFiles,
      hasTelematics:
        hasUploadedTelematics ||
        evidenceFiles.some((file) => file.id === "ev-telematics"),
      status: "generated",
    });
    if (result.failureReason === "no_text_evidence") {
      setAiGenerationNotice(AI_NO_TEXT_EVIDENCE_COPY);
      return;
    }
    if (result.failureReason === "no_observations" || !result.stored) {
      setAiGenerationNotice(AI_NO_OBSERVATIONS_COPY);
      return;
    }
    setAiAnalysis(result.stored);
    logActivity(
      "generated_ai_observations",
      `Generated ${result.stored.documentObservations.length} document observations`
    );
  }, [
    activeClaimId,
    evidenceFiles,
    hasUploadedTelematics,
    logActivity,
  ]);

  const handleRegenerateAi = useCallback(async () => {
    setAiGenerationNotice(null);
    const result = await buildStoredAiAnalysis({
      claimId: activeClaimId,
      evidenceFiles,
      hasTelematics:
        hasUploadedTelematics ||
        evidenceFiles.some((file) => file.id === "ev-telematics"),
      status: "regenerated",
    });
    if (result.failureReason === "no_text_evidence") {
      setAiGenerationNotice(AI_NO_TEXT_EVIDENCE_COPY);
      return;
    }
    if (result.failureReason === "no_observations" || !result.stored) {
      setAiGenerationNotice(AI_NO_OBSERVATIONS_COPY);
      return;
    }
    setAiAnalysis(result.stored);
    logActivity(
      "regenerated_ai_observations",
      `Regenerated ${result.stored.documentObservations.length} document observations`
    );
  }, [
    activeClaimId,
    evidenceFiles,
    hasUploadedTelematics,
    logActivity,
  ]);

  const handleClearAi = useCallback(() => {
    setAiAnalysis(buildClearedAiAnalysis(evidenceFiles, aiAnalysis));
    setAiGenerationNotice(null);
    logActivity("cleared_ai_observations", "Cleared AI observations");
  }, [evidenceFiles, aiAnalysis, logActivity]);

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-slate-100/60">
      <Header
        claim={activeClaim}
        claims={claimsCatalog}
        activeClaimId={activeClaimId}
        onClaimChange={handleClaimChange}
        onCreateClaim={handleCreateClaim}
        onRenameClaim={handleRenameClaim}
        onDuplicateClaim={handleDuplicateClaim}
        onDeleteClaim={handleDeleteClaim}
        onResetDemo={handleResetDemo}
        onLoadSampleClaims={handleLoadSampleClaims}
        onShareClick={handleShareOpen}
      />

      <div className="grid min-h-0 flex-1 overflow-hidden xl:grid-cols-[18rem_minmax(0,1fr)_24rem]">
        <EvidenceSidebar
          files={evidenceFiles}
          selectedEvidenceId={selectedEvidenceId}
          onSelectEvidence={handleSelectEvidence}
          uploadState={uploadState}
          uploadError={uploadError}
          uploadWarnings={uploadWarnings}
          processedFileName={processedFileName}
          hasUploadedTelematics={hasUploadedTelematics}
          sampleEvidenceLoaded={sampleEvidenceLoaded}
          onUploadFiles={handleUploadFiles}
          onLoadSampleEvidence={handleLoadSampleEvidence}
        />

        <main className="min-h-0 overflow-y-auto border-x border-border">
          <EvidenceViewerTabs
            activeTab={activeViewerTab}
            onTabChange={handleViewerTabChange}
            selectedEvent={selectedEvent}
            selectedEvidence={selectedEvidence}
            telemetryTelematics={activeTelematics}
            selectedParsedTelematics={selectedParsedTelematics}
            mapRouteLabel={activeClaim.mapRouteLabel}
            speedData={speedData}
            mapRoute={mapData.route}
            mapMarkers={mapData.markers}
            hasUploadedTelematics={hasUploadedTelematics}
            hasGpsCoordinates={mapData.hasGpsCoordinates}
            currentVideoTime={currentVideoTime}
            videoDuration={videoDuration}
            isVideoPlaying={isVideoPlaying}
            videoSourceLoaded={videoSourceLoaded}
            videoSrc={videoConfig.src}
            videoFileName={videoConfig.fileName}
            isUploadedVideo={videoConfig.isUploaded}
            onPlayPause={handlePlayPause}
            onVideoTimeUpdate={handleVideoTimeUpdate}
            onVideoLoaded={handleVideoLoaded}
            onVideoError={handleVideoError}
            onVideoSeek={handleVideoSeek}
            onScrubbingChange={setIsScrubbing}
            notesDraft={notesDraft}
            investigationNotes={investigationNotes}
            currentTimestamp={currentTimestamp}
            onNotesDraftChange={setNotesDraft}
            onInsertSelectedEvent={handleInsertSelectedEvent}
            onInsertTimestamp={handleInsertTimestamp}
            onAddNote={handleAddNote}
            activityLog={activityLog}
            reviewSummary={reviewSummary}
            importMessage={importMessage}
            onExportSession={handleExportSession}
            onImportSession={handleImportSession}
            aiAnalysis={aiAnalysis}
            evidenceFiles={evidenceFiles}
            aiGenerationNotice={aiGenerationNotice}
            onGenerateAi={handleGenerateAi}
            onRegenerateAi={handleRegenerateAi}
            onClearAi={handleClearAi}
            onPreviewEvidence={handlePreviewEvidence}
            onOpenEvidenceReference={handleOpenEvidenceReference}
            activeEvidenceReference={activeEvidenceReference}
          />
        </main>

        <RightInvestigationPanel
          events={timelineEvents}
          evidenceFiles={evidenceFiles}
          selectedEventId={selectedEventId}
          selectedEvent={selectedEvent}
          linkedEvidence={linkedEvidence}
          onSelectEvent={handleSelectEvent}
          sourceFilter={sourceFilter}
          severityFilter={severityFilter}
          reviewStatusFilter={reviewStatusFilter}
          bookmarkFilter={bookmarkFilter}
          flagFilter={flagFilter}
          onSourceFilterChange={setSourceFilter}
          onSeverityFilterChange={setSeverityFilter}
          onReviewStatusFilterChange={setReviewStatusFilter}
          onBookmarkFilterChange={setBookmarkFilter}
          onFlagFilterChange={setFlagFilter}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          stats={stats}
          selectedEventHiddenByFilter={selectedEventHiddenByFilter}
          isVideoPlaying={isVideoPlaying}
          playbackEvent={playbackEvent}
          onCopySummary={handleCopySummary}
          onPreviewEvidence={handlePreviewEvidence}
          onOpenEvidenceReference={handleOpenEvidenceReference}
          eventComments={selectedEventComments}
          eventFlags={selectedEventFlags}
          onReviewStatusChange={handleReviewStatusChange}
          onAssignEvent={handleAssignEvent}
          onUnassignEvent={handleUnassignEvent}
          onToggleBookmark={handleToggleBookmark}
          onAddFlag={handleAddFlag}
          onRemoveFlag={handleRemoveFlag}
          onAddComment={handleAddComment}
        />
      </div>

      <SharePackageModal
        open={shareModalOpen}
        onOpenChange={setShareModalOpen}
        claimId={activeClaim.id}
        sharePackage={modalSharePackage ?? latestSharePackage}
        onGenerate={handleGenerateSharePackage}
        onCopyLink={handleCopyShareLink}
        onOpenPackage={handleOpenSharePackage}
        onRevoke={handleRevokeSharePackage}
      />
    </div>
  );
}

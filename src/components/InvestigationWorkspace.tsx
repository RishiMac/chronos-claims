"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { EvidenceSidebar } from "@/components/EvidenceSidebar";
import { EvidenceViewerTabs } from "@/components/EvidenceViewerTabs";
import { Header } from "@/components/Header";
import { RightInvestigationPanel } from "@/components/RightInvestigationPanel";
import { SharePackageModal } from "@/components/SharePackageModal";
import { DEMO_VIDEO_SRC } from "@/components/VideoViewer";
import { getDefaultClaim } from "@/data/sampleClaims";
import { formatClaimDisplayTitle } from "@/lib/claimDisplay";
import { createActivityEntry } from "@/lib/audit/activityUtils";
import { detectTelematicsEvents } from "@/lib/detectTelematicsEvents";
import {
  createPreviewObjectUrl,
  createUploadedEvidenceFile,
  detectEvidenceFileType,
  estimatePdfPageCount,
  isAcceptedEvidenceFile,
  loadImageDimensions,
  readTextPreview,
} from "@/lib/evidenceUpload";
import {
  buildEventNoteInsert,
  computeInvestigationStats,
  computeVideoDuration,
  filterTimelineEvents,
  findActiveEventForPlayback,
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
  loadSampleTelematicsCsv,
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
  serializeTelematicsMap,
  workspaceFromStored,
} from "@/lib/storage/claimSerializer";
import { resetStorage } from "@/lib/storage/chronosStorage";
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
  Claim,
  EvidenceFile,
  ParsedTelematics,
  SessionActivityEntry,
  SeverityFilter,
  TelematicsUploadState,
  TimelineSourceFilter,
} from "@/types/claim";
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

  const [evidenceFiles, setEvidenceFiles] = useState<EvidenceFile[]>([]);
  const [telematicsByEvidenceId, setTelematicsByEvidenceId] = useState<
    Record<string, ParsedTelematics>
  >({});
  const [uploadState, setUploadState] = useState<TelematicsUploadState>("idle");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadWarnings, setUploadWarnings] = useState<string[]>([]);
  const [processedFileName, setProcessedFileName] = useState<string | null>(
    null
  );
  const [sampleEvidenceLoaded, setSampleEvidenceLoaded] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [selectedEvidenceId, setSelectedEvidenceId] = useState<string | null>(
    null
  );
  const [activeVideoEvidenceId, setActiveVideoEvidenceId] = useState<
    string | null
  >(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [modalSharePackage, setModalSharePackage] = useState<SharePackage | null>(
    null
  );
  const [sourceFilter, setSourceFilter] =
    useState<TimelineSourceFilter>("all");
  const [severityFilter, setSeverityFilter] =
    useState<SeverityFilter>("all");
  const [currentVideoTime, setCurrentVideoTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(18);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [videoSourceLoaded, setVideoSourceLoaded] = useState(false);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [notesDraft, setNotesDraft] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const playbackIntervalRef = useRef<number | null>(null);
  const objectUrlsRef = useRef<Map<string, string>>(new Map());
  const workspaceLoadedRef = useRef(false);

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

  const latestSharePackage = useMemo(
    () => getLatestSharePackageForClaim(activeClaimId),
    [sharePackages, activeClaimId]
  );

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
    setSearchQuery(workspace.searchQuery);
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
    (action: AuditActivityAction, details: string) => {
      if (!activeClaimId) return;
      const entry = createActivityEntry(activeClaimId, action, details);
      setAllActivities((previous) => [entry, ...previous]);
    },
    [activeClaimId, setAllActivities]
  );

  const hasUploadedTelematics =
    Object.keys(telematicsByEvidenceId).length > 0;

  useEffect(() => {
    if (!hydrated || workspaceLoadedRef.current) return;
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
  }, [
    hydrated,
    storedClaims,
    selectedClaimId,
    loadWorkspaceFromStored,
    setSelectedClaimId,
  ]);

  useEffect(() => {
    if (!hydrated || !workspaceLoadedRef.current || !activeClaimId) return;
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
      searchQuery,
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
    searchQuery,
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
    const uploadedEvents = collectUploadedTimelineEvents(telematicsByEvidenceId);
    if (uploadedEvents.length === 0) return activeClaim.timelineEvents;
    return mergeTimelineEvents(activeClaim.timelineEvents, uploadedEvents);
  }, [telematicsByEvidenceId, activeClaim.timelineEvents]);

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

  const activeVideoFile = useMemo(() => {
    if (activeVideoEvidenceId) {
      const selectedVideo = evidenceFiles.find(
        (file) => file.id === activeVideoEvidenceId && file.fileType === "video"
      );
      if (selectedVideo) return selectedVideo;
    }

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
      searchQuery
    );
    return !visible.some((event) => event.id === selectedEvent.id);
  }, [
    selectedEvent,
    timelineEvents,
    evidenceFiles,
    sourceFilter,
    severityFilter,
    searchQuery,
  ]);

  const playbackEvent = useMemo(() => {
    if (!isVideoPlaying) return null;
    return (
      findActiveEventForPlayback(timelineEvents, currentVideoTime) ??
      selectedEvent
    );
  }, [isVideoPlaying, timelineEvents, currentVideoTime, selectedEvent]);

  const currentTimestamp =
    selectedEvent?.timestamp ??
    timelineEvents.find((event) => event.id === selectedEventId)?.timestamp ??
    "—";

  useEffect(() => {
    setVideoDuration(computeVideoDuration(timelineEvents, activeTelematics));
  }, [timelineEvents, activeTelematics]);

  useEffect(() => {
    setVideoSourceLoaded(false);
    setIsVideoPlaying(false);
  }, [videoConfig.src]);

  useEffect(() => {
    return () => {
      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      objectUrlsRef.current.clear();
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
        setCurrentVideoTime(event.videoOffsetSeconds);
        logActivity("opened_timeline_event", `Viewed event: ${event.title}`);
      }
    },
    [timelineEvents, logActivity]
  );

  const handleSelectEvidence = useCallback(
    (evidenceId: string) => {
      setSelectedEvidenceId(evidenceId);
      const file = evidenceFiles.find((item) => item.id === evidenceId);
      if (file?.fileType === "video") {
        setActiveVideoEvidenceId(evidenceId);
        logActivity("general", `Selected video evidence: ${file.name}`);
      } else if (file) {
        logActivity("general", `Selected evidence file: ${file.name}`);
      }
    },
    [evidenceFiles, logActivity]
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
    ) => {
      setUploadState("parsing");
      setUploadError(null);

      try {
        const parsedBase = parseTelematicsCsv(csvText, fileName);
        const detectedEvents = detectTelematicsEvents(
          parsedBase.rows,
          evidenceId
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
      } catch (error) {
        const message =
          error instanceof TelematicsParseError
            ? error.message
            : "Unable to parse telematics CSV. Please check the file format.";
        setUploadError(message);
        setUploadState("error");
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
    activeClaim.title,
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
          const preview = await readTextPreview(file);
          evidence = {
            ...evidence,
            metadata: {
              ...evidence.metadata,
              source: "Uploaded text document",
              description: "Text evidence file added to the investigation.",
              textPreview: preview,
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

      const csvText = await loadSampleTelematicsCsv(activeClaim);
      const telematicsEvidence = activeClaim.evidenceFiles.find(
        (file) => file.id === "ev-telematics"
      );

      await processTelematicsCsv(
        csvText,
        "telematics.csv",
        "ev-telematics",
        undefined,
        telematicsEvidence
      );

      const enrichedFiles = await enrichSampleEvidencePreviews(activeClaim);
      setEvidenceFiles((current) =>
        enrichedFiles.map((file) => {
          const existing = current.find((item) => item.id === file.id);
          if (file.id === "ev-telematics" && existing) {
            return existing;
          }
          return file;
        })
      );
      setSampleEvidenceLoaded(true);
      logActivity(
        "loaded_sample_evidence",
        `Loaded sample evidence for ${activeClaim.id}`
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to load sample evidence.";
      setUploadError(message);
      setUploadState("error");
    }
  }, [activeClaim, processTelematicsCsv, logActivity]);

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

  const handleTabChange = useCallback(
    (tab: ViewerTab) => {
      const labels: Record<ViewerTab, string> = {
        video: "Video",
        telemetry: "Telemetry",
        map: "Map",
        notes: "Notes",
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

  const handleCopySummary = useCallback(() => {
    logActivity("copied_event_summary", "Copied event summary");
  }, [logActivity]);

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
            selectedEvent={selectedEvent}
            selectedEvidence={selectedEvidence}
            parsedTelematics={activeTelematics}
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
            importMessage={importMessage}
            onExportSession={handleExportSession}
            onImportSession={handleImportSession}
            onTabChange={handleTabChange}
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
          onSourceFilterChange={setSourceFilter}
          onSeverityFilterChange={setSeverityFilter}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          stats={stats}
          selectedEventHiddenByFilter={selectedEventHiddenByFilter}
          isVideoPlaying={isVideoPlaying}
          playbackEvent={playbackEvent}
          onCopySummary={handleCopySummary}
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

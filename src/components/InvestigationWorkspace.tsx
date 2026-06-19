"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { EvidenceSidebar } from "@/components/EvidenceSidebar";
import { EvidenceViewerTabs } from "@/components/EvidenceViewerTabs";
import { Header } from "@/components/Header";
import { RightInvestigationPanel } from "@/components/RightInvestigationPanel";
import { SharePackageModal } from "@/components/SharePackageModal";
import { DEMO_VIDEO_SRC } from "@/components/VideoViewer";
import {
  defaultClaimId,
  getClaimById,
  getDefaultClaim,
} from "@/data/sampleClaims";
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
  formatActivityTimestamp,
} from "@/lib/eventUtils";
import { useInvestigationKeyboard } from "@/hooks/useInvestigationKeyboard";
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
  InvestigationNote,
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

function observationsToNotes(claim: Claim) {
  return claim.sampleObservations.map((observation) => ({
    id: observation.id,
    content: observation.content,
    createdAt: observation.createdAt,
  }));
}

function getDefaultVideoOffset(claim: Claim) {
  const event = claim.timelineEvents.find(
    (item) => item.id === claim.defaultSelectedEventId
  );
  return event?.videoOffsetSeconds ?? 0;
}

export function InvestigationWorkspace() {
  const [activeClaimId, setActiveClaimId] = useState(defaultClaimId);
  const activeClaim = useMemo(
    () => getClaimById(activeClaimId),
    [activeClaimId]
  );
  const [evidenceFiles, setEvidenceFiles] = useState<EvidenceFile[]>(
    getDefaultClaim().evidenceFiles
  );
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
  const [selectedEventId, setSelectedEventId] = useState(
    getDefaultClaim().defaultSelectedEventId
  );
  const [selectedEvidenceId, setSelectedEvidenceId] = useState<string | null>(
    getDefaultClaim().defaultSelectedEvidenceId
  );
  const [activeVideoEvidenceId, setActiveVideoEvidenceId] = useState<
    string | null
  >(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [sourceFilter, setSourceFilter] =
    useState<TimelineSourceFilter>("all");
  const [severityFilter, setSeverityFilter] =
    useState<SeverityFilter>("all");
  const [currentVideoTime, setCurrentVideoTime] = useState(() =>
    getDefaultVideoOffset(getDefaultClaim())
  );
  const [videoDuration, setVideoDuration] = useState(18);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [videoSourceLoaded, setVideoSourceLoaded] = useState(false);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [notesDraft, setNotesDraft] = useState("");
  const [investigationNotes, setInvestigationNotes] = useState<
    InvestigationNote[]
  >(() => observationsToNotes(getDefaultClaim()));
  const [activityLog, setActivityLog] = useState<SessionActivityEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const playbackIntervalRef = useRef<number | null>(null);
  const objectUrlsRef = useRef<Map<string, string>>(new Map());

  const hasUploadedTelematics =
    Object.keys(telematicsByEvidenceId).length > 0;

  const logActivity = useCallback((message: string) => {
    setActivityLog((previous) => [
      {
        id: `activity-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        timestamp: formatActivityTimestamp(),
        message,
      },
      ...previous,
    ]);
  }, []);

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
        logActivity(`Viewed event: ${event.title}`);
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
        logActivity(`Selected video evidence: ${file.name}`);
      } else if (file) {
        logActivity(`Selected evidence file: ${file.name}`);
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

        logActivity(`Processed telematics CSV: ${fileName}`);
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

  const applyClaimBaseline = useCallback((claim: Claim) => {
    objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    objectUrlsRef.current.clear();

    setActiveClaimId(claim.id);
    setEvidenceFiles(claim.evidenceFiles);
    setTelematicsByEvidenceId({});
    setSampleEvidenceLoaded(false);
    setSelectedEventId(claim.defaultSelectedEventId);
    setSelectedEvidenceId(claim.defaultSelectedEvidenceId);
    setActiveVideoEvidenceId(null);
    setCurrentVideoTime(getDefaultVideoOffset(claim));
    setIsVideoPlaying(false);
    setVideoSourceLoaded(false);
    setNotesDraft("");
    setInvestigationNotes(observationsToNotes(claim));
    setActivityLog([]);
    setSourceFilter("all");
    setSeverityFilter("all");
    setSearchQuery("");
    setUploadState("idle");
    setUploadError(null);
    setUploadWarnings([]);
    setProcessedFileName(null);
    setImportMessage(null);
  }, []);

  const handleClaimChange = useCallback(
    (claimId: string) => {
      const claim = getClaimById(claimId);
      applyClaimBaseline(claim);
      logActivity(`Switched to claim ${claim.id}`);
    },
    [applyClaimBaseline, logActivity]
  );

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
      logActivity(`Uploaded evidence file: ${file.name}`);

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
      logActivity(`Loaded sample evidence for ${activeClaim.id}`);
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

    setInvestigationNotes((previous) => [
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
      ...previous,
    ]);
    logActivity("Saved investigation note");
    setNotesDraft("");
  }, [notesDraft, logActivity]);

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
    logActivity("Exported investigation session");
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
        setInvestigationNotes(session.notes);
        setActivityLog(session.activityLog);
        setUploadState(importedEvidence.length > 0 ? "processed" : "idle");
        setUploadError(null);
        setUploadWarnings([]);
        setImportMessage(
          "Session imported. Re-upload video, image, and PDF files to restore previews."
        );
        logActivity("Imported investigation session");
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Unable to import session file.";
        setImportMessage(message);
      }
    },
    [activeClaim.evidenceFiles, logActivity]
  );

  const handleTabChange = useCallback(
    (tab: ViewerTab) => {
      const labels: Record<ViewerTab, string> = {
        video: "Video",
        telemetry: "Telemetry",
        map: "Map",
        notes: "Notes",
      };
      logActivity(`Opened ${labels[tab]} tab`);
    },
    [logActivity]
  );

  const handleShareOpen = useCallback(() => {
    setShareModalOpen(true);
    logActivity("Generated share package");
  }, [logActivity]);

  const handleCopySummary = useCallback(() => {
    logActivity("Copied event summary");
  }, [logActivity]);

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-slate-100/60">
      <Header
        claim={activeClaim}
        activeClaimId={activeClaimId}
        onClaimChange={handleClaimChange}
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
        shareUrl={activeClaim.shareUrl}
        claimId={activeClaim.id}
      />
    </div>
  );
}

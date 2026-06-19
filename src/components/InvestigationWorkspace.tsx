"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { EvidenceSidebar } from "@/components/EvidenceSidebar";
import { EvidenceViewerTabs } from "@/components/EvidenceViewerTabs";
import { Header } from "@/components/Header";
import { RightInvestigationPanel } from "@/components/RightInvestigationPanel";
import { SharePackageModal } from "@/components/SharePackageModal";
import { mockClaim } from "@/data/mockClaim";
import {
  detectTelematicsEvents,
  UPLOADED_EVIDENCE_ID,
} from "@/lib/detectTelematicsEvents";
import {
  buildEventNoteInsert,
  computeInvestigationStats,
  computeVideoDuration,
  filterTimelineEvents,
  findActiveEventForPlayback,
} from "@/lib/eventUtils";
import {
  parseTelematicsCsv,
  TelematicsParseError,
} from "@/lib/parseTelematicsCsv";
import {
  buildParsedTelematics,
  createUploadedEvidenceFile,
  mergeTimelineEvents,
  telematicsRowsToMapData,
  telematicsRowsToSpeedData,
} from "@/lib/telematicsTransforms";
import type {
  EvidenceFile,
  InvestigationNote,
  ParsedTelematics,
  SeverityFilter,
  TelematicsUploadState,
  TimelineSourceFilter,
} from "@/types/claim";

export function InvestigationWorkspace() {
  const [evidenceFiles, setEvidenceFiles] = useState<EvidenceFile[]>(
    mockClaim.evidenceFiles
  );
  const [parsedTelematics, setParsedTelematics] =
    useState<ParsedTelematics | null>(null);
  const [uploadState, setUploadState] = useState<TelematicsUploadState>("idle");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [processedFileName, setProcessedFileName] = useState<string | null>(
    null
  );
  const [selectedEventId, setSelectedEventId] = useState(
    mockClaim.timelineEvents[2].id
  );
  const [selectedEvidenceId, setSelectedEvidenceId] = useState<string | null>(
    mockClaim.evidenceFiles[1].id
  );
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [sourceFilter, setSourceFilter] =
    useState<TimelineSourceFilter>("all");
  const [severityFilter, setSeverityFilter] =
    useState<SeverityFilter>("all");
  const [currentVideoTime, setCurrentVideoTime] = useState(
    mockClaim.timelineEvents[2].videoOffsetSeconds
  );
  const [videoDuration, setVideoDuration] = useState(18);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [videoSourceLoaded, setVideoSourceLoaded] = useState(false);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [notesDraft, setNotesDraft] = useState("");
  const [investigationNotes, setInvestigationNotes] = useState<
    InvestigationNote[]
  >([]);
  const playbackIntervalRef = useRef<number | null>(null);

  const timelineEvents = useMemo(() => {
    if (!parsedTelematics) return mockClaim.timelineEvents;
    return mergeTimelineEvents(
      mockClaim.timelineEvents,
      parsedTelematics.detectedEvents
    );
  }, [parsedTelematics]);

  const speedData = useMemo(() => {
    if (!parsedTelematics) return mockClaim.speedData;
    return telematicsRowsToSpeedData(
      parsedTelematics.rows,
      parsedTelematics.detectedEvents
    );
  }, [parsedTelematics]);

  const mapData = useMemo(() => {
    if (!parsedTelematics) {
      return {
        route: mockClaim.mapRoute,
        markers: mockClaim.mapMarkers,
        hasGpsCoordinates: true,
      };
    }

    return telematicsRowsToMapData(
      parsedTelematics.rows,
      parsedTelematics.detectedEvents
    );
  }, [parsedTelematics]);

  const stats = useMemo(
    () => computeInvestigationStats(timelineEvents, parsedTelematics),
    [timelineEvents, parsedTelematics]
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
      severityFilter
    );
    return !visible.some((event) => event.id === selectedEvent.id);
  }, [
    selectedEvent,
    timelineEvents,
    evidenceFiles,
    sourceFilter,
    severityFilter,
  ]);

  const currentTimestamp =
    selectedEvent?.timestamp ??
    timelineEvents.find((event) => event.id === selectedEventId)?.timestamp ??
    "—";

  useEffect(() => {
    setVideoDuration(computeVideoDuration(timelineEvents, parsedTelematics));
  }, [timelineEvents, parsedTelematics]);

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

  const handleSelectEvent = useCallback((eventId: string) => {
    const event = timelineEvents.find((item) => item.id === eventId);
    setSelectedEventId(eventId);
    if (event) {
      setCurrentVideoTime(event.videoOffsetSeconds);
    }
  }, [timelineEvents]);

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

  const processTelematicsCsv = useCallback(
    async (csvText: string, fileName: string, fileSizeBytes?: number) => {
      setUploadState("parsing");
      setUploadError(null);

      try {
        const parsedBase = parseTelematicsCsv(csvText, fileName);
        const detectedEvents = detectTelematicsEvents(parsedBase.rows);
        const parsed = buildParsedTelematics({
          ...parsedBase,
          detectedEvents,
        });
        const uploadedEvidence = createUploadedEvidenceFile(
          parsed,
          fileSizeBytes
        );

        setParsedTelematics(parsed);
        setEvidenceFiles((current) => [
          ...current.filter((file) => file.id !== UPLOADED_EVIDENCE_ID),
          uploadedEvidence,
        ]);
        setSelectedEvidenceId(UPLOADED_EVIDENCE_ID);
        setProcessedFileName(fileName);
        setUploadState("processed");

        if (detectedEvents.length > 0) {
          setSelectedEventId(detectedEvents[0].id);
          setCurrentVideoTime(detectedEvents[0].videoOffsetSeconds);
        }
      } catch (error) {
        const message =
          error instanceof TelematicsParseError
            ? error.message
            : "Unable to parse telematics CSV. Please check the file format.";
        setUploadError(message);
        setUploadState("error");
      }
    },
    []
  );

  const handleUploadCsv = useCallback(
    async (file: File) => {
      if (!file.name.toLowerCase().endsWith(".csv")) {
        setUploadError("Please upload a .csv telematics file.");
        setUploadState("error");
        return;
      }

      const csvText = await file.text();
      await processTelematicsCsv(csvText, file.name, file.size);
    },
    [processTelematicsCsv]
  );

  const handleLoadSampleCsv = useCallback(async () => {
    try {
      setUploadState("parsing");
      setUploadError(null);

      const response = await fetch("/sample-telematics.csv");
      if (!response.ok) {
        throw new Error("Sample telematics file could not be loaded.");
      }

      const csvText = await response.text();
      await processTelematicsCsv(csvText, "sample-telematics.csv");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to load sample telematics CSV.";
      setUploadError(message);
      setUploadState("error");
    }
  }, [processTelematicsCsv]);

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
    setNotesDraft("");
  }, [notesDraft]);

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-slate-100/60">
      <Header claim={mockClaim} onShareClick={() => setShareModalOpen(true)} />

      <div className="grid min-h-0 flex-1 overflow-hidden xl:grid-cols-[18rem_minmax(0,1fr)_24rem]">
        <EvidenceSidebar
          files={evidenceFiles}
          selectedEvidenceId={selectedEvidenceId}
          onSelectEvidence={setSelectedEvidenceId}
          uploadState={uploadState}
          uploadError={uploadError}
          processedFileName={processedFileName}
          hasUploadedTelematics={parsedTelematics !== null}
          onUploadCsv={handleUploadCsv}
          onLoadSampleCsv={handleLoadSampleCsv}
        />

        <main className="min-h-0 overflow-y-auto border-x border-border">
          <EvidenceViewerTabs
            selectedEvent={selectedEvent}
            speedData={speedData}
            mapRoute={mapData.route}
            mapMarkers={mapData.markers}
            hasUploadedTelematics={parsedTelematics !== null}
            hasGpsCoordinates={mapData.hasGpsCoordinates}
            currentVideoTime={currentVideoTime}
            videoDuration={videoDuration}
            isVideoPlaying={isVideoPlaying}
            videoSourceLoaded={videoSourceLoaded}
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
          stats={stats}
          selectedEventHiddenByFilter={selectedEventHiddenByFilter}
        />
      </div>

      <SharePackageModal
        open={shareModalOpen}
        onOpenChange={setShareModalOpen}
        shareUrl={mockClaim.shareUrl}
        claimId={mockClaim.id}
      />
    </div>
  );
}

"use client";

import { useCallback, useMemo, useState } from "react";

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
  ParsedTelematics,
  TelematicsUploadState,
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

  const selectedEvent = useMemo(
    () =>
      timelineEvents.find((event) => event.id === selectedEventId) ??
      timelineEvents[0],
    [timelineEvents, selectedEventId]
  );

  const linkedEvidence = useMemo(
    () =>
      selectedEvent.linkedEvidenceIds
        .map((id) => evidenceFiles.find((file) => file.id === id))
        .filter((file): file is NonNullable<typeof file> => Boolean(file)),
    [selectedEvent, evidenceFiles]
  );

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
          />
        </main>

        <RightInvestigationPanel
          events={timelineEvents}
          evidenceFiles={evidenceFiles}
          selectedEventId={selectedEventId}
          selectedEvent={selectedEvent}
          linkedEvidence={linkedEvidence}
          onSelectEvent={setSelectedEventId}
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

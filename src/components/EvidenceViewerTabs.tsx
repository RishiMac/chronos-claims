"use client";

import { useState } from "react";

import { CsvEvidenceViewer } from "@/components/CsvEvidenceViewer";
import { ImageEvidenceViewer } from "@/components/ImageEvidenceViewer";
import { InvestigationNotesPanel } from "@/components/InvestigationNotesPanel";
import { MapPlaceholder } from "@/components/MapPlaceholder";
import { PdfEvidenceViewer } from "@/components/PdfEvidenceViewer";
import { TelemetryPanel } from "@/components/TelemetryPanel";
import { TextEvidenceViewer } from "@/components/TextEvidenceViewer";
import { VideoViewer } from "@/components/VideoViewer";
import { cn } from "@/lib/utils";
import type {
  EvidenceFile,
  InvestigationNote,
  MapMarker,
  ParsedTelematics,
  SessionActivityEntry,
  SpeedDataPoint,
  TimelineEvent,
} from "@/types/claim";

export type ViewerTab = "video" | "telemetry" | "map" | "notes";

interface EvidenceViewerTabsProps {
  selectedEvent: TimelineEvent | null;
  selectedEvidence: EvidenceFile | null;
  parsedTelematics: ParsedTelematics | null;
  mapRouteLabel: string;
  speedData: SpeedDataPoint[];
  mapRoute: { x: number; y: number }[];
  mapMarkers: MapMarker[];
  hasUploadedTelematics: boolean;
  hasGpsCoordinates: boolean;
  currentVideoTime: number;
  videoDuration: number;
  isVideoPlaying: boolean;
  videoSourceLoaded: boolean;
  videoSrc: string;
  videoFileName: string;
  isUploadedVideo: boolean;
  onPlayPause: () => void;
  onVideoTimeUpdate: (time: number) => void;
  onVideoLoaded: (duration: number) => void;
  onVideoError: () => void;
  onVideoSeek: (time: number) => void;
  onScrubbingChange: (isScrubbing: boolean) => void;
  notesDraft: string;
  investigationNotes: InvestigationNote[];
  activityLog: SessionActivityEntry[];
  currentTimestamp: string;
  importMessage: string | null;
  onNotesDraftChange: (value: string) => void;
  onInsertSelectedEvent: () => void;
  onInsertTimestamp: () => void;
  onAddNote: () => void;
  onExportSession: () => void;
  onImportSession: (file: File) => void;
  onTabChange?: (tab: ViewerTab) => void;
}

const tabs: { id: ViewerTab; label: string }[] = [
  { id: "video", label: "Video" },
  { id: "telemetry", label: "Telemetry" },
  { id: "map", label: "Map" },
  { id: "notes", label: "Notes" },
];

export function EvidenceViewerTabs({
  selectedEvent,
  selectedEvidence,
  parsedTelematics,
  mapRouteLabel,
  speedData,
  mapRoute,
  mapMarkers,
  hasUploadedTelematics,
  hasGpsCoordinates,
  currentVideoTime,
  videoDuration,
  isVideoPlaying,
  videoSourceLoaded,
  videoSrc,
  videoFileName,
  isUploadedVideo,
  onPlayPause,
  onVideoTimeUpdate,
  onVideoLoaded,
  onVideoError,
  onVideoSeek,
  onScrubbingChange,
  notesDraft,
  investigationNotes,
  activityLog,
  currentTimestamp,
  importMessage,
  onNotesDraftChange,
  onInsertSelectedEvent,
  onInsertTimestamp,
  onAddNote,
  onExportSession,
  onImportSession,
  onTabChange,
}: EvidenceViewerTabsProps) {
  const [activeTab, setActiveTab] = useState<ViewerTab>("video");

  const handleTabChange = (tab: ViewerTab) => {
    if (tab === activeTab) return;
    setActiveTab(tab);
    onTabChange?.(tab);
  };

  const renderVideoTabContent = () => {
    if (selectedEvidence?.fileType === "image") {
      return <ImageEvidenceViewer file={selectedEvidence} />;
    }

    if (selectedEvidence?.fileType === "pdf") {
      return <PdfEvidenceViewer file={selectedEvidence} />;
    }

    if (selectedEvidence?.fileType === "text") {
      return <TextEvidenceViewer file={selectedEvidence} />;
    }

    if (selectedEvidence?.fileType === "csv") {
      return (
        <CsvEvidenceViewer
          file={selectedEvidence}
          parsedTelematics={parsedTelematics}
        />
      );
    }

    if (!selectedEvent) {
      return (
        <div className="rounded-lg border border-dashed border-slate-200 bg-white px-4 py-8 text-center">
          <p className="text-[13px] text-muted-foreground">
            Select an event to synchronize the investigation workspace.
          </p>
        </div>
      );
    }

    return (
      <VideoViewer
        selectedEvent={selectedEvent}
        currentTime={currentVideoTime}
        duration={videoDuration}
        isPlaying={isVideoPlaying}
        videoSourceLoaded={videoSourceLoaded}
        videoSrc={videoSrc}
        videoFileName={videoFileName}
        isUploadedVideo={isUploadedVideo}
        onPlayPause={onPlayPause}
        onTimeUpdate={onVideoTimeUpdate}
        onVideoLoaded={onVideoLoaded}
        onVideoError={onVideoError}
        onSeek={onVideoSeek}
        onScrubbingChange={onScrubbingChange}
      />
    );
  };

  return (
    <div className="flex min-h-full flex-col">
      <div className="sticky top-0 z-10 border-b border-slate-200/80 bg-slate-100/95 px-4 py-3 backdrop-blur-sm lg:px-5">
        <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50/80 p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                "flex-1 rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors",
                activeTab === tab.id
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:bg-white/60 hover:text-slate-700"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 lg:p-5">
        {activeTab === "video" && renderVideoTabContent()}

        {activeTab === "telemetry" && (
          <TelemetryPanel
            speedData={speedData}
            parsedTelematics={parsedTelematics}
            selectedEvent={selectedEvent}
            hasUploadedTelematics={hasUploadedTelematics}
          />
        )}

        {activeTab === "map" && (
          <MapPlaceholder
            route={mapRoute}
            markers={mapMarkers}
            highlightedMarkerId={selectedEvent?.markerId ?? null}
            hasGpsCoordinates={
              hasUploadedTelematics ? hasGpsCoordinates : true
            }
            routeLabel={
              hasUploadedTelematics
                ? "Uploaded telematics route — normalized coordinates"
                : mapRouteLabel
            }
          />
        )}

        {activeTab === "notes" && (
          <InvestigationNotesPanel
            draft={notesDraft}
            notes={investigationNotes}
            activityLog={activityLog}
            selectedEvent={selectedEvent}
            currentTimestamp={currentTimestamp}
            importMessage={importMessage}
            onDraftChange={onNotesDraftChange}
            onInsertSelectedEvent={onInsertSelectedEvent}
            onInsertTimestamp={onInsertTimestamp}
            onAddNote={onAddNote}
            onExportSession={onExportSession}
            onImportSession={onImportSession}
          />
        )}
      </div>
    </div>
  );
}

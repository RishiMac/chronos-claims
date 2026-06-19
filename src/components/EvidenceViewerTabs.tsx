"use client";

import { AiObservationsPanel } from "@/components/AiObservationsPanel";
import { EvidencePreviewPanel } from "@/components/EvidencePreviewPanel";
import { InvestigationNotesPanel } from "@/components/InvestigationNotesPanel";
import { MapPlaceholder } from "@/components/MapPlaceholder";
import { TelemetryPanel } from "@/components/TelemetryPanel";
import { VideoViewer } from "@/components/VideoViewer";
import { cn } from "@/lib/utils";
import type { StoredAiAnalysis } from "@/types/ai-types";
import type { EvidenceReference } from "@/types/evidence-reference";
import type { ReviewSummaryStats } from "@/types/collaboration";
import type {
  EvidenceFile,
  InvestigationNote,
  MapMarker,
  ParsedTelematics,
  SessionActivityEntry,
  SpeedDataPoint,
  TimelineEvent,
} from "@/types/claim";

export type ViewerTab =
  | "video"
  | "telemetry"
  | "map"
  | "notes"
  | "ai"
  | "evidence";

interface EvidenceViewerTabsProps {
  activeTab: ViewerTab;
  onTabChange: (tab: ViewerTab) => void;
  selectedEvent: TimelineEvent | null;
  selectedEvidence: EvidenceFile | null;
  telemetryTelematics: ParsedTelematics | null;
  selectedParsedTelematics: ParsedTelematics | null;
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
  reviewSummary: ReviewSummaryStats;
  currentTimestamp: string;
  importMessage: string | null;
  onNotesDraftChange: (value: string) => void;
  onInsertSelectedEvent: () => void;
  onInsertTimestamp: () => void;
  onAddNote: () => void;
  onExportSession: () => void;
  onImportSession: (file: File) => void;
  aiAnalysis: StoredAiAnalysis | null;
  evidenceFiles: EvidenceFile[];
  aiGenerationNotice: string | null;
  onGenerateAi: () => void;
  onRegenerateAi: () => void;
  onClearAi: () => void;
  onPreviewEvidence: (evidenceId: string) => void;
  onOpenEvidenceReference?: (reference: EvidenceReference) => void;
  activeEvidenceReference?: EvidenceReference | null;
}

const tabs: { id: ViewerTab; label: string }[] = [
  { id: "video", label: "Video" },
  { id: "telemetry", label: "Telemetry" },
  { id: "map", label: "Map" },
  { id: "notes", label: "Notes" },
  { id: "ai", label: "AI" },
  { id: "evidence", label: "Evidence" },
];

export function EvidenceViewerTabs({
  activeTab,
  onTabChange,
  selectedEvent,
  selectedEvidence,
  telemetryTelematics,
  selectedParsedTelematics,
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
  reviewSummary,
  currentTimestamp,
  importMessage,
  onNotesDraftChange,
  onInsertSelectedEvent,
  onInsertTimestamp,
  onAddNote,
  onExportSession,
  onImportSession,
  aiAnalysis,
  evidenceFiles,
  aiGenerationNotice,
  onGenerateAi,
  onRegenerateAi,
  onClearAi,
  onPreviewEvidence,
  onOpenEvidenceReference,
  activeEvidenceReference = null,
}: EvidenceViewerTabsProps) {
  const handleTabChange = (tab: ViewerTab) => {
    if (tab === activeTab) return;
    onTabChange(tab);
  };

  const renderVideoTabContent = () => {
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
        <div className="flex items-center gap-1 overflow-x-auto rounded-lg border border-slate-200 bg-slate-50/80 p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                "shrink-0 rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors",
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
            parsedTelematics={telemetryTelematics}
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
            reviewSummary={reviewSummary}
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

        {activeTab === "ai" && (
          <AiObservationsPanel
            aiAnalysis={aiAnalysis}
            evidenceFiles={evidenceFiles}
            generationNotice={aiGenerationNotice}
            onGenerate={onGenerateAi}
            onRegenerate={onRegenerateAi}
            onClear={onClearAi}
            onPreviewEvidence={onPreviewEvidence}
            onOpenEvidenceReference={onOpenEvidenceReference}
          />
        )}

        {activeTab === "evidence" && (
          <EvidencePreviewPanel
            selectedEvidence={selectedEvidence}
            parsedTelematics={selectedParsedTelematics}
            activeReference={activeEvidenceReference}
            onOpenTab={handleTabChange}
          />
        )}
      </div>
    </div>
  );
}

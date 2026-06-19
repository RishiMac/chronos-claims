"use client";

import { useState } from "react";

import { InvestigationNotesPanel } from "@/components/InvestigationNotesPanel";
import { MapPlaceholder } from "@/components/MapPlaceholder";
import { SpeedGraph } from "@/components/SpeedGraph";
import { VideoViewer } from "@/components/VideoViewer";
import { cn } from "@/lib/utils";
import type {
  InvestigationNote,
  MapMarker,
  SpeedDataPoint,
  TimelineEvent,
} from "@/types/claim";

type ViewerTab = "video" | "telemetry" | "map" | "notes";

interface EvidenceViewerTabsProps {
  selectedEvent: TimelineEvent | null;
  speedData: SpeedDataPoint[];
  mapRoute: { x: number; y: number }[];
  mapMarkers: MapMarker[];
  hasUploadedTelematics: boolean;
  hasGpsCoordinates: boolean;
  currentVideoTime: number;
  videoDuration: number;
  isVideoPlaying: boolean;
  videoSourceLoaded: boolean;
  onPlayPause: () => void;
  onVideoTimeUpdate: (time: number) => void;
  onVideoLoaded: (duration: number) => void;
  onVideoError: () => void;
  onVideoSeek: (time: number) => void;
  onScrubbingChange: (isScrubbing: boolean) => void;
  notesDraft: string;
  investigationNotes: InvestigationNote[];
  currentTimestamp: string;
  onNotesDraftChange: (value: string) => void;
  onInsertSelectedEvent: () => void;
  onInsertTimestamp: () => void;
  onAddNote: () => void;
}

const tabs: { id: ViewerTab; label: string }[] = [
  { id: "video", label: "Video" },
  { id: "telemetry", label: "Telemetry" },
  { id: "map", label: "Map" },
  { id: "notes", label: "Notes" },
];

export function EvidenceViewerTabs({
  selectedEvent,
  speedData,
  mapRoute,
  mapMarkers,
  hasUploadedTelematics,
  hasGpsCoordinates,
  currentVideoTime,
  videoDuration,
  isVideoPlaying,
  videoSourceLoaded,
  onPlayPause,
  onVideoTimeUpdate,
  onVideoLoaded,
  onVideoError,
  onVideoSeek,
  onScrubbingChange,
  notesDraft,
  investigationNotes,
  currentTimestamp,
  onNotesDraftChange,
  onInsertSelectedEvent,
  onInsertTimestamp,
  onAddNote,
}: EvidenceViewerTabsProps) {
  const [activeTab, setActiveTab] = useState<ViewerTab>("video");

  return (
    <div className="flex min-h-full flex-col">
      <div className="sticky top-0 z-10 border-b border-slate-200/80 bg-slate-100/95 px-4 py-3 backdrop-blur-sm lg:px-5">
        <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50/80 p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex-1 rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors",
                activeTab === tab.id
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 lg:p-5">
        {activeTab === "video" &&
          (selectedEvent ? (
            <VideoViewer
              selectedEvent={selectedEvent}
              currentTime={currentVideoTime}
              duration={videoDuration}
              isPlaying={isVideoPlaying}
              videoSourceLoaded={videoSourceLoaded}
              onPlayPause={onPlayPause}
              onTimeUpdate={onVideoTimeUpdate}
              onVideoLoaded={onVideoLoaded}
              onVideoError={onVideoError}
              onSeek={onVideoSeek}
              onScrubbingChange={onScrubbingChange}
            />
          ) : (
            <div className="rounded-lg border border-dashed border-slate-200 bg-white px-4 py-8 text-center">
              <p className="text-[13px] text-muted-foreground">
                Select an event to synchronize the investigation workspace.
              </p>
            </div>
          ))}

        {activeTab === "telemetry" && (
          <div className="space-y-3">
            {!hasUploadedTelematics && (
              <p className="text-[12px] text-muted-foreground">
                Using sample claim data. Upload a telematics CSV to generate
                events from real evidence.
              </p>
            )}
            <SpeedGraph
              data={speedData}
              highlightedMarkerId={selectedEvent?.markerId ?? null}
            />
          </div>
        )}

        {activeTab === "map" && (
          <MapPlaceholder
            route={mapRoute}
            markers={mapMarkers}
            highlightedMarkerId={selectedEvent?.markerId ?? null}
            hasGpsCoordinates={hasUploadedTelematics ? hasGpsCoordinates : true}
            routeLabel={
              hasUploadedTelematics
                ? "Uploaded telematics route — normalized coordinates"
                : "Market St & 5th Ave — schematic route"
            }
          />
        )}

        {activeTab === "notes" && (
          <InvestigationNotesPanel
            draft={notesDraft}
            notes={investigationNotes}
            selectedEvent={selectedEvent}
            currentTimestamp={currentTimestamp}
            onDraftChange={onNotesDraftChange}
            onInsertSelectedEvent={onInsertSelectedEvent}
            onInsertTimestamp={onInsertTimestamp}
            onAddNote={onAddNote}
          />
        )}
      </div>
    </div>
  );
}

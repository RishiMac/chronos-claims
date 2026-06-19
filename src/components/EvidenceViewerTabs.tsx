"use client";

import { useState } from "react";

import { MapPlaceholder } from "@/components/MapPlaceholder";
import { SpeedGraph } from "@/components/SpeedGraph";
import { VideoViewer } from "@/components/VideoViewer";
import { cn } from "@/lib/utils";
import type { MapMarker, SpeedDataPoint, TimelineEvent } from "@/types/claim";

type ViewerTab = "video" | "telemetry" | "map";

interface EvidenceViewerTabsProps {
  selectedEvent: TimelineEvent;
  speedData: SpeedDataPoint[];
  mapRoute: { x: number; y: number }[];
  mapMarkers: MapMarker[];
  hasUploadedTelematics: boolean;
  hasGpsCoordinates: boolean;
}

const tabs: { id: ViewerTab; label: string }[] = [
  { id: "video", label: "Video" },
  { id: "telemetry", label: "Telemetry" },
  { id: "map", label: "Map" },
];

export function EvidenceViewerTabs({
  selectedEvent,
  speedData,
  mapRoute,
  mapMarkers,
  hasUploadedTelematics,
  hasGpsCoordinates,
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
        {activeTab === "video" && (
          <VideoViewer
            timestamp={selectedEvent.timestamp}
            progress={selectedEvent.videoProgress}
          />
        )}
        {activeTab === "telemetry" && (
          <SpeedGraph
            data={speedData}
            highlightedMarkerId={selectedEvent.markerId}
          />
        )}
        {activeTab === "map" && (
          <MapPlaceholder
            route={mapRoute}
            markers={mapMarkers}
            highlightedMarkerId={selectedEvent.markerId}
            hasGpsCoordinates={hasUploadedTelematics ? hasGpsCoordinates : true}
            routeLabel={
              hasUploadedTelematics
                ? "Uploaded telematics route — normalized coordinates"
                : "Market St & 5th Ave — schematic route"
            }
          />
        )}
      </div>
    </div>
  );
}

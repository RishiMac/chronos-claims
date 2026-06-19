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
}: EvidenceViewerTabsProps) {
  const [activeTab, setActiveTab] = useState<ViewerTab>("video");

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-4 flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50/80 p-1">
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

      <div className="min-h-0 flex-1">
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
          />
        )}
      </div>
    </div>
  );
}

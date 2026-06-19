"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { MapMarker } from "@/types/claim";

interface MapPlaceholderProps {
  route: { x: number; y: number }[];
  markers: MapMarker[];
  highlightedMarkerId: string | null;
  hasGpsCoordinates?: boolean;
  routeLabel?: string;
}

export function MapPlaceholder({
  route,
  markers,
  highlightedMarkerId,
  hasGpsCoordinates = true,
  routeLabel = "Market St & 5th Ave — schematic route",
}: MapPlaceholderProps) {
  if (!hasGpsCoordinates) {
    return (
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 px-4 py-3">
          <CardTitle className="text-[13px] font-medium text-slate-900">
            GPS Route
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
            <p className="text-[13px] text-slate-600">
              No GPS coordinates found in uploaded telematics file.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const routePath = route
    .map((point, index) => {
      const x = point.x;
      const y = 100 - point.y;
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="border-b border-slate-100 bg-slate-50/50 px-4 py-3">
        <CardTitle className="text-[13px] font-medium text-slate-900">
          GPS Route
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-[#eef2f6]">
          <svg viewBox="0 0 100 100" className="aspect-[16/10] w-full">
            <defs>
              <pattern
                id="mapGrid"
                width="8"
                height="8"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 8 0 L 0 0 0 8"
                  fill="none"
                  stroke="#cbd5e1"
                  strokeWidth="0.3"
                />
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#mapGrid)" />
            <rect
              x="8"
              y="8"
              width="84"
              height="84"
              fill="#f8fafc"
              opacity="0.5"
              rx="2"
            />

            <path
              d="M 8 92 L 92 8"
              stroke="#dbeafe"
              strokeWidth="8"
              strokeLinecap="round"
              opacity="0.6"
            />
            <path
              d="M 92 92 L 8 8"
              stroke="#dbeafe"
              strokeWidth="8"
              strokeLinecap="round"
              opacity="0.6"
            />

            <path
              d={routePath}
              fill="none"
              stroke="#2563eb"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {markers.map((marker) => {
              const isHighlighted = marker.id === highlightedMarkerId;
              const x = marker.x;
              const y = 100 - marker.y;

              return (
                <g key={marker.id}>
                  {isHighlighted && (
                    <circle
                      cx={x}
                      cy={y}
                      r="4.5"
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="1"
                      opacity="0.8"
                    />
                  )}
                  <circle
                    cx={x}
                    cy={y}
                    r={isHighlighted ? 2.8 : 2.2}
                    className={cn(
                      "transition-all duration-200 stroke-white",
                      isHighlighted
                        ? "fill-amber-500"
                        : highlightedMarkerId
                          ? "fill-slate-400 opacity-50"
                          : marker.severity === "critical"
                            ? "fill-red-500"
                            : marker.severity === "moderate"
                              ? "fill-amber-500"
                              : "fill-blue-600"
                    )}
                    strokeWidth="0.8"
                  />
                  <text
                    x={x + 3}
                    y={y - 2}
                    className={cn(
                      "text-[3.2px] font-medium",
                      isHighlighted
                        ? "fill-amber-800"
                        : marker.severity === "critical"
                          ? "fill-red-800"
                          : marker.severity === "moderate"
                            ? "fill-amber-800"
                            : "fill-slate-600"
                    )}
                  >
                    {marker.label}
                  </text>
                </g>
              );
            })}
          </svg>

          <div className="absolute bottom-2 left-2 rounded bg-white/90 px-2 py-1 text-[10px] text-slate-600 shadow-sm">
            {routeLabel}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

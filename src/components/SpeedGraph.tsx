"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { SpeedDataPoint } from "@/types/claim";

interface SpeedGraphProps {
  data: SpeedDataPoint[];
  highlightedMarkerId: string | null;
}

const WIDTH = 640;
const HEIGHT = 200;
const PADDING = { top: 24, right: 20, bottom: 36, left: 44 };

export function SpeedGraph({ data, highlightedMarkerId }: SpeedGraphProps) {
  const maxSpeed = Math.max(...data.map((point) => point.speed), 45);
  const chartWidth = WIDTH - PADDING.left - PADDING.right;
  const chartHeight = HEIGHT - PADDING.top - PADDING.bottom;

  const points = data.map((point, index) => {
    const x =
      PADDING.left + (index / (data.length - 1)) * chartWidth;
    const y =
      PADDING.top + chartHeight - (point.speed / maxSpeed) * chartHeight;
    return { ...point, x, y };
  });

  const linePath = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");

  const areaPath = `${linePath} L ${points[points.length - 1].x} ${
    PADDING.top + chartHeight
  } L ${points[0].x} ${PADDING.top + chartHeight} Z`;

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="border-b border-slate-100 bg-slate-50/50 px-4 py-3">
        <CardTitle className="text-[13px] font-medium text-slate-900">
          Speed / Braking Timeline
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="h-auto w-full"
          role="img"
          aria-label="Speed over time chart"
        >
          {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
            const y = PADDING.top + chartHeight * (1 - tick);
            const value = Math.round(maxSpeed * tick);
            return (
              <g key={tick}>
                <line
                  x1={PADDING.left}
                  y1={y}
                  x2={WIDTH - PADDING.right}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeDasharray="4 4"
                />
                <text
                  x={PADDING.left - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-slate-400 text-[10px]"
                >
                  {value}
                </text>
              </g>
            );
          })}

          <path d={areaPath} fill="url(#speedGradient)" opacity={0.35} />
          <path
            d={linePath}
            fill="none"
            stroke="#0f766e"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {points
            .filter((point) => point.markerId)
            .map((point) => {
              const isHighlighted =
                point.markerId === highlightedMarkerId ||
                highlightedMarkerId === null;

              return (
                <g key={point.markerId}>
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={isHighlighted ? 7 : 5}
                    className={cn(
                      "transition-all duration-200",
                      point.markerId === highlightedMarkerId
                        ? "fill-amber-500 stroke-white"
                        : isHighlighted
                          ? "fill-teal-600 stroke-white"
                          : "fill-slate-300 stroke-white opacity-40"
                    )}
                    strokeWidth={2}
                  />
                  {point.label && (
                    <text
                      x={point.x}
                      y={point.y - 12}
                      textAnchor="middle"
                      className={cn(
                        "text-[9px] font-medium",
                        point.markerId === highlightedMarkerId
                          ? "fill-amber-700"
                          : "fill-slate-500"
                      )}
                    >
                      {point.time.replace("2:41:", "")} — {point.label}
                    </text>
                  )}
                </g>
              );
            })}

          <text
            x={PADDING.left}
            y={HEIGHT - 10}
            className="fill-slate-400 text-[10px]"
          >
            2:41:08 PM
          </text>
          <text
            x={WIDTH - PADDING.right}
            y={HEIGHT - 10}
            textAnchor="end"
            className="fill-slate-400 text-[10px]"
          >
            2:41:24 PM
          </text>

          <defs>
            <linearGradient id="speedGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#14b8a6" stopOpacity={0.5} />
              <stop offset="100%" stopColor="#14b8a6" stopOpacity={0.05} />
            </linearGradient>
          </defs>
        </svg>
      </CardContent>
    </Card>
  );
}

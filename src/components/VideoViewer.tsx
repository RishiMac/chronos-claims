"use client";

import { Pause, Play } from "lucide-react";
import { useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface VideoViewerProps {
  timestamp: string;
  progress: number;
}

export function VideoViewer({ timestamp, progress }: VideoViewerProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <Card className="overflow-hidden border-slate-200 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 bg-slate-50/50 px-4 py-3">
        <CardTitle className="text-[13px] font-medium text-slate-900">
          Dashcam Video
        </CardTitle>
        <span className="text-xs text-muted-foreground">
          Synchronized to selected event
        </span>
      </CardHeader>
      <CardContent className="p-0">
        <div className="relative aspect-video bg-slate-900">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.06),transparent_60%)]" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-medium tracking-wide text-slate-400 uppercase">
              Dashcam Video
            </span>
          </div>
          <div className="absolute top-3 left-3 rounded bg-black/60 px-2 py-1 font-mono text-xs text-white">
            {timestamp}
          </div>
          <div className="absolute right-3 bottom-3 rounded bg-black/60 px-2 py-1 text-xs text-slate-300">
            dashcam_front.mp4
          </div>
        </div>

        <div className="space-y-3 bg-slate-950 px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsPlaying((prev) => !prev)}
              className="flex size-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <Pause className="size-4 fill-current" />
              ) : (
                <Play className="size-4 fill-current" />
              )}
            </button>
            <div className="flex-1">
              <div className="relative h-1.5 overflow-hidden rounded-full bg-white/15">
                <div
                  className={cn(
                    "absolute inset-y-0 left-0 rounded-full bg-sky-400 transition-all duration-300",
                    isPlaying && "animate-pulse"
                  )}
                  style={{ width: `${progress}%` }}
                />
                <div
                  className="absolute top-1/2 size-3 -translate-y-1/2 rounded-full border-2 border-white bg-sky-400 shadow"
                  style={{ left: `calc(${progress}% - 6px)` }}
                />
              </div>
            </div>
            <span className="font-mono text-xs text-slate-400">{timestamp}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

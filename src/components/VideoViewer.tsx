"use client";

import { Pause, Play, RotateCcw, SkipBack, SkipForward } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatSeconds } from "@/lib/eventUtils";
import { cn } from "@/lib/utils";
import type { TimelineEvent } from "@/types/claim";

const DEMO_VIDEO_SRC = "/demo-dashcam.mp4";
const SCRUB_HIT_HEIGHT_PX = 28;

interface VideoViewerProps {
  selectedEvent: TimelineEvent;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  videoSourceLoaded: boolean;
  onPlayPause: () => void;
  onTimeUpdate: (time: number) => void;
  onVideoLoaded: (duration: number) => void;
  onVideoError: () => void;
  onSeek: (time: number) => void;
  onScrubbingChange?: (isScrubbing: boolean) => void;
}

export function VideoViewer({
  selectedEvent,
  currentTime,
  duration,
  isPlaying,
  videoSourceLoaded,
  onPlayPause,
  onTimeUpdate,
  onVideoLoaded,
  onVideoError,
  onSeek,
  onScrubbingChange,
}: VideoViewerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const getSeekTime = useCallback(
    (clientX: number) => {
      const track = trackRef.current;
      if (!track || duration <= 0) return 0;

      const rect = track.getBoundingClientRect();
      if (rect.width <= 0) return 0;

      const ratio = Math.max(
        0,
        Math.min(1, (clientX - rect.left) / rect.width)
      );
      return ratio * duration;
    },
    [duration]
  );

  const seekTo = useCallback(
    (time: number) => {
      const clamped = Math.max(0, Math.min(duration, time));
      onSeek(clamped);
    },
    [duration, onSeek]
  );

  const stopDragging = useCallback(() => {
    setIsDragging(false);
    onScrubbingChange?.(false);
  }, [onScrubbingChange]);

  const handleTrackPointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      const track = trackRef.current;
      if (!track || duration <= 0) return;

      setIsDragging(true);
      onScrubbingChange?.(true);
      track.setPointerCapture(event.pointerId);
      seekTo(getSeekTime(event.clientX));
    },
    [duration, getSeekTime, onScrubbingChange, seekTo]
  );

  const handleTrackPointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging) return;
      event.preventDefault();
      seekTo(getSeekTime(event.clientX));
    },
    [getSeekTime, isDragging, seekTo]
  );

  const handleTrackPointerUp = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging) return;

      const track = trackRef.current;
      if (track?.hasPointerCapture(event.pointerId)) {
        track.releasePointerCapture(event.pointerId);
      }

      seekTo(getSeekTime(event.clientX));
      stopDragging();
    },
    [getSeekTime, isDragging, seekTo, stopDragging]
  );

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoSourceLoaded || isDragging) return;

    if (Math.abs(video.currentTime - currentTime) > 0.35) {
      video.currentTime = currentTime;
    }
  }, [currentTime, videoSourceLoaded, isDragging]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoSourceLoaded) return;

    if (isPlaying) {
      void video.play().catch(() => onVideoError());
    } else {
      video.pause();
    }
  }, [isPlaying, videoSourceLoaded, onVideoError]);

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || isDragging) return;
    onTimeUpdate(video.currentTime);
  };

  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (!video) return;
    onVideoLoaded(video.duration);
  };

  const overlayTimestamp =
    videoSourceLoaded && currentTime > 0
      ? formatSeconds(currentTime)
      : selectedEvent.timestamp;

  return (
    <Card className="overflow-hidden border-slate-200 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 bg-slate-50/50 px-4 py-3">
        <CardTitle className="text-[13px] font-medium text-slate-900">
          Dashcam Video
        </CardTitle>
        <span className="text-xs text-muted-foreground">
          {videoSourceLoaded ? "Demo video loaded" : "Synchronized preview mode"}
        </span>
      </CardHeader>
      <CardContent className="p-0">
        <div className="relative aspect-video bg-slate-900">
          <video
            ref={videoRef}
            className={cn(
              "size-full object-cover",
              !videoSourceLoaded && "hidden"
            )}
            src={DEMO_VIDEO_SRC}
            preload="metadata"
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onError={onVideoError}
          />

          {!videoSourceLoaded && (
            <>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.06),transparent_60%)]" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-medium tracking-wide text-slate-400 uppercase">
                  Dashcam Video
                </span>
              </div>
            </>
          )}

          <div className="absolute top-3 left-3 rounded bg-black/60 px-2 py-1 font-mono text-xs text-white">
            {overlayTimestamp}
          </div>
          <div className="absolute right-3 bottom-3 rounded bg-black/60 px-2 py-1 text-xs text-slate-300">
            dashcam_front.mp4
          </div>
        </div>

        <div className="space-y-3 bg-slate-950 px-4 py-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onPlayPause}
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <Pause className="size-4 fill-current" />
              ) : (
                <Play className="size-4 fill-current" />
              )}
            </button>

            <button
              type="button"
              onClick={() => seekTo(currentTime - 5)}
              className="flex h-7 shrink-0 items-center gap-0.5 rounded-md px-1.5 text-[10px] font-medium text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Back 5 seconds"
            >
              <SkipBack className="size-3" />
              5s
            </button>

            <button
              type="button"
              onClick={() => seekTo(currentTime + 5)}
              className="flex h-7 shrink-0 items-center gap-0.5 rounded-md px-1.5 text-[10px] font-medium text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Forward 5 seconds"
            >
              5s
              <SkipForward className="size-3" />
            </button>

            <div
              ref={trackRef}
              role="slider"
              aria-label="Video progress"
              aria-valuemin={0}
              aria-valuemax={duration}
              aria-valuenow={currentTime}
              className="relative flex min-w-0 flex-1 cursor-pointer touch-none select-none items-center"
              style={{ height: SCRUB_HIT_HEIGHT_PX }}
              onPointerDown={handleTrackPointerDown}
              onPointerMove={handleTrackPointerMove}
              onPointerUp={handleTrackPointerUp}
              onPointerCancel={handleTrackPointerUp}
            >
              <div className="pointer-events-none absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-white/15" />
              <div
                className={cn(
                  "pointer-events-none absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-sky-400",
                  !isDragging && "transition-[width] duration-150"
                )}
                style={{ width: `${progress}%` }}
              />
              <div
                className={cn(
                  "pointer-events-none absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-sky-400 shadow",
                  !isDragging && "transition-[left] duration-150"
                )}
                style={{ left: `${progress}%` }}
              />
            </div>

            <button
              type="button"
              onClick={() => seekTo(0)}
              className="flex h-7 shrink-0 items-center gap-1 rounded-md px-1.5 text-[10px] font-medium text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Seek to start"
            >
              <RotateCcw className="size-3" />
              Start
            </button>

            <span className="min-w-[4.75rem] shrink-0 text-right font-mono text-xs text-slate-400">
              {formatSeconds(currentTime)} / {formatSeconds(duration)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

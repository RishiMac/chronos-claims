"use client";

import { useEffect } from "react";

interface InvestigationKeyboardOptions {
  onPlayPause: () => void;
  onSeekBack: () => void;
  onSeekForward: () => void;
  onSeekStart: () => void;
  enabled?: boolean;
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  return (
    tag === "input" ||
    tag === "textarea" ||
    tag === "select" ||
    target.isContentEditable
  );
}

export function useInvestigationKeyboard({
  onPlayPause,
  onSeekBack,
  onSeekForward,
  onSeekStart,
  enabled = true,
}: InvestigationKeyboardOptions) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) return;

      switch (event.code) {
        case "Space":
          event.preventDefault();
          onPlayPause();
          break;
        case "ArrowLeft":
          event.preventDefault();
          onSeekBack();
          break;
        case "ArrowRight":
          event.preventDefault();
          onSeekForward();
          break;
        case "Home":
          event.preventDefault();
          onSeekStart();
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled, onPlayPause, onSeekBack, onSeekForward, onSeekStart]);
}

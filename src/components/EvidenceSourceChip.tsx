"use client";

import { cn } from "@/lib/utils";
import type { EvidenceFile } from "@/types/claim";

interface EvidenceSourceChipProps {
  file: EvidenceFile;
  onPreview: (evidenceId: string) => void;
  className?: string;
}

export function EvidenceSourceChip({
  file,
  onPreview,
  className,
}: EvidenceSourceChipProps) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onPreview(file.id);
      }}
      className={cn(
        "inline-flex h-4 max-w-full items-center rounded-sm border border-slate-200 bg-white px-1 text-[10px] font-normal text-slate-600 transition-colors hover:border-sky-300 hover:bg-sky-50 hover:text-sky-800",
        className
      )}
      title={`Preview ${file.name}`}
    >
      <span className="truncate">{file.name}</span>
    </button>
  );
}

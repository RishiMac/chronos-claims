"use client";

import { Button } from "@/components/ui/button";
import type { EvidenceReference } from "@/types/evidence-reference";

interface SupportingEvidenceListProps {
  references: EvidenceReference[];
  onOpenReference?: (reference: EvidenceReference) => void;
  compact?: boolean;
}

export function SupportingEvidenceList({
  references,
  onOpenReference,
  compact = false,
}: SupportingEvidenceListProps) {
  if (references.length === 0) {
    return (
      <p className="text-[12px] text-muted-foreground">
        No supporting source references attached to this event.
      </p>
    );
  }

  return (
    <ul className={compact ? "space-y-1.5" : "space-y-2"}>
      {references.map((reference) => (
        <li
          key={reference.id}
          className="rounded-md border border-slate-200 bg-slate-50/70 px-3 py-2"
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-medium text-slate-900">
                {reference.filename}
              </p>
              <p className="text-[11px] text-slate-600">{reference.label}</p>
            </div>
            {onOpenReference && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 shrink-0 px-2 text-[11px]"
                onClick={() => onOpenReference(reference)}
              >
                Open source
              </Button>
            )}
          </div>
          {reference.excerpt && (
            <p className="mt-1.5 text-[11px] leading-snug text-slate-600">
              <span className="font-medium text-slate-700">Excerpt:</span>{" "}
              {reference.excerpt}
            </p>
          )}
          {reference.confidence && (
            <p className="mt-1 text-[10px] text-muted-foreground">
              Confidence: {reference.confidence}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}

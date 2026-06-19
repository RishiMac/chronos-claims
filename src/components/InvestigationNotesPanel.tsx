"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { InvestigationNote, TimelineEvent } from "@/types/claim";

interface InvestigationNotesPanelProps {
  draft: string;
  notes: InvestigationNote[];
  selectedEvent: TimelineEvent | null;
  currentTimestamp: string;
  onDraftChange: (value: string) => void;
  onInsertSelectedEvent: () => void;
  onInsertTimestamp: () => void;
  onAddNote: () => void;
}

export function InvestigationNotesPanel({
  draft,
  notes,
  selectedEvent,
  currentTimestamp,
  onDraftChange,
  onInsertSelectedEvent,
  onInsertTimestamp,
  onAddNote,
}: InvestigationNotesPanelProps) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="border-b border-slate-100 bg-slate-50/50 px-4 py-3">
        <CardTitle className="text-[13px] font-medium text-slate-900">
          Investigation Notes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-4">
        <textarea
          value={draft}
          onChange={(event) => onDraftChange(event.target.value)}
          placeholder="Add notes to support human review of synchronized evidence..."
          className="min-h-28 w-full resize-y rounded-md border border-slate-200 bg-white px-3 py-2 text-[13px] leading-snug text-slate-700 outline-none focus:border-slate-300"
        />

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onInsertSelectedEvent}
            disabled={!selectedEvent}
            className="text-[12px]"
          >
            Insert selected event
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onInsertTimestamp}
            className="text-[12px]"
          >
            Insert current timestamp
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={onAddNote}
            disabled={!draft.trim()}
            className="bg-slate-900 text-[12px] text-white hover:bg-slate-800"
          >
            Save note
          </Button>
        </div>

        <div>
          <p className="text-[12px] font-medium text-slate-700">
            Session notes
          </p>
          {notes.length === 0 ? (
            <p className="mt-2 text-[12px] text-muted-foreground">
              No notes added yet.
            </p>
          ) : (
            <ul className="mt-2 space-y-2">
              {notes.map((note) => (
                <li
                  key={note.id}
                  className="rounded-md border border-slate-200 bg-slate-50/70 px-3 py-2"
                >
                  <p className="text-[10px] text-muted-foreground">
                    {note.createdAt}
                  </p>
                  <p className="mt-0.5 text-[12px] leading-snug text-slate-700">
                    {note.content}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="text-[11px] text-muted-foreground">
          Current reference timestamp: {currentTimestamp}
        </p>
      </CardContent>
    </Card>
  );
}

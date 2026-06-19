"use client";

import { useRef } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  InvestigationNote,
  SessionActivityEntry,
  TimelineEvent,
} from "@/types/claim";
import type { ReviewSummaryStats } from "@/types/collaboration";

interface InvestigationNotesPanelProps {
  draft: string;
  notes: InvestigationNote[];
  activityLog: SessionActivityEntry[];
  reviewSummary: ReviewSummaryStats;
  selectedEvent: TimelineEvent | null;
  currentTimestamp: string;
  importMessage: string | null;
  onDraftChange: (value: string) => void;
  onInsertSelectedEvent: () => void;
  onInsertTimestamp: () => void;
  onAddNote: () => void;
  onExportSession: () => void;
  onImportSession: (file: File) => void;
}

export function InvestigationNotesPanel({
  draft,
  notes,
  activityLog,
  reviewSummary,
  selectedEvent,
  currentTimestamp,
  importMessage,
  onDraftChange,
  onInsertSelectedEvent,
  onInsertTimestamp,
  onAddNote,
  onExportSession,
  onImportSession,
}: InvestigationNotesPanelProps) {
  const importInputRef = useRef<HTMLInputElement>(null);

  const handleImportChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImportSession(file);
    }
    event.target.value = "";
  };

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="border-b border-slate-100 bg-slate-50/50 px-4 py-3">
        <CardTitle className="text-[13px] font-medium text-slate-900">
          Investigation Notes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-4">
        <div className="rounded-md border border-slate-200 bg-slate-50/80 px-3 py-2">
          <p className="text-[12px] font-medium text-slate-700">Review Summary</p>
          <div className="mt-1.5 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-slate-600">
            <span>Total events: {reviewSummary.totalEvents}</span>
            <span>Reviewed: {reviewSummary.reviewed}</span>
            <span>Needs review: {reviewSummary.needsReview}</span>
            <span>Approved: {reviewSummary.approved}</span>
            <span>Dismissed: {reviewSummary.dismissed}</span>
            <span>Bookmarked: {reviewSummary.bookmarked}</span>
            <span>Flagged: {reviewSummary.flagged}</span>
            <span>Comments: {reviewSummary.comments}</span>
          </div>
        </div>

        <textarea
          value={draft}
          onChange={(event) => onDraftChange(event.target.value)}
          placeholder="Add notes to support human review of synchronized evidence..."
          className="min-h-28 w-full resize-y rounded-md border border-slate-200 bg-white px-3 py-2 text-[13px] leading-snug text-slate-700 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-300"
        />

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onInsertSelectedEvent}
            disabled={!selectedEvent}
            className="text-[12px] transition-colors hover:bg-slate-50"
          >
            Insert selected event
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onInsertTimestamp}
            className="text-[12px] transition-colors hover:bg-slate-50"
          >
            Insert current timestamp
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={onAddNote}
            disabled={!draft.trim()}
            className="bg-slate-900 text-[12px] text-white transition-colors hover:bg-slate-800"
          >
            Save note
          </Button>
        </div>

        <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onExportSession}
            className="text-[12px] transition-colors hover:bg-slate-50"
          >
            Export Session
          </Button>
          <input
            ref={importInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={handleImportChange}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => importInputRef.current?.click()}
            className="text-[12px] transition-colors hover:bg-slate-50"
          >
            Import Session
          </Button>
        </div>

        {importMessage && (
          <p className="text-[11px] leading-snug text-slate-600">
            {importMessage}
          </p>
        )}

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
                  className="rounded-md border border-slate-200 bg-slate-50/70 px-3 py-2 transition-colors hover:bg-slate-50"
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

        <div className="border-t border-slate-100 pt-3">
          <p className="text-[12px] font-medium text-slate-700">
            Session Activity
          </p>
          {activityLog.length === 0 ? (
            <p className="mt-2 text-[12px] text-muted-foreground">
              Activity will appear here as you review evidence.
            </p>
          ) : (
            <ul className="mt-2 max-h-40 space-y-1.5 overflow-y-auto">
              {activityLog.map((entry) => (
                <li
                  key={entry.id}
                  className="text-[11px] leading-snug text-slate-600"
                >
                  <span className="font-mono text-[10px] text-slate-400">
                    {entry.timestamp}
                  </span>{" "}
                  {entry.message}
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

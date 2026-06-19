"use client";

import { FileSpreadsheet, FileText, FileVideo, ImageIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import type { ViewerTab } from "@/components/EvidenceViewerTabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  EVIDENCE_PREVIEW_DISCLAIMER,
  getFileTypeLabel,
  IMAGE_PREVIEW_NOTE,
  splitHighlightedText,
} from "@/lib/evidencePreview";
import {
  isLineHighlighted,
  isRowHighlighted,
} from "@/lib/evidenceReferenceUtils";
import { formatLabelForFormat } from "@/lib/telematics/parseTelemetryCsv";
import type { EvidenceFile, ParsedTelematics } from "@/types/claim";
import type { EvidenceReference } from "@/types/evidence-reference";

interface EvidencePreviewPanelProps {
  selectedEvidence: EvidenceFile | null;
  parsedTelematics: ParsedTelematics | null;
  activeReference?: EvidenceReference | null;
  onOpenTab: (tab: ViewerTab) => void;
}

export function EvidencePreviewPanel({
  selectedEvidence,
  parsedTelematics,
  activeReference = null,
  onOpenTab,
}: EvidencePreviewPanelProps) {
  if (!selectedEvidence) {
    return (
      <Card className="border-dashed border-slate-200 shadow-sm">
        <CardContent className="px-4 py-10 text-center">
          <p className="text-[13px] text-muted-foreground">
            Select an evidence file or source reference to preview supporting
            evidence.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {activeReference && (
        <ReferencedSectionCard reference={activeReference} />
      )}
      <EvidencePreviewHeader file={selectedEvidence} />
      <EvidencePreviewBody
        file={selectedEvidence}
        parsedTelematics={parsedTelematics}
        activeReference={activeReference}
        onOpenTab={onOpenTab}
      />
    </div>
  );
}

function ReferencedSectionCard({ reference }: { reference: EvidenceReference }) {
  return (
    <Card className="border-amber-200 bg-amber-50/60 shadow-sm">
      <CardHeader className="border-b border-amber-100 px-4 py-3">
        <CardTitle className="text-[13px] font-medium text-amber-950">
          Referenced section
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1.5 p-4">
        <p className="text-[12px] font-medium text-slate-900">
          {reference.filename} · {reference.label}
        </p>
        {reference.excerpt && (
          <p className="text-[11px] leading-snug text-slate-700">
            <span className="font-medium">Excerpt:</span> {reference.excerpt}
          </p>
        )}
        <p className="text-[10px] text-muted-foreground">
          Supporting source reference for human review.
        </p>
      </CardContent>
    </Card>
  );
}

function EvidencePreviewHeader({ file }: { file: EvidenceFile }) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="border-b border-slate-100 bg-slate-50/50 px-4 py-3">
        <CardTitle className="text-[13px] font-medium text-slate-900">
          Evidence Preview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-4">
        <div className="grid gap-2 text-[12px] sm:grid-cols-2">
          <PreviewMetaRow label="Selected source" value={file.name} />
          <PreviewMetaRow label="Type" value={getFileTypeLabel(file.fileType)} />
          <PreviewMetaRow label="Status" value={file.status} />
          <PreviewMetaRow label="Source label" value={file.metadata.source} />
        </div>
        <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] leading-snug text-slate-600">
          {EVIDENCE_PREVIEW_DISCLAIMER}
        </p>
      </CardContent>
    </Card>
  );
}

function PreviewMetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-100 bg-white px-3 py-2">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-[12px] font-medium text-slate-900">{value}</p>
    </div>
  );
}

function EvidencePreviewBody({
  file,
  parsedTelematics,
  activeReference,
  onOpenTab,
}: {
  file: EvidenceFile;
  parsedTelematics: ParsedTelematics | null;
  activeReference: EvidenceReference | null;
  onOpenTab: (tab: ViewerTab) => void;
}) {
  switch (file.fileType) {
    case "text":
      return <TextPreviewContent file={file} activeReference={activeReference} />;
    case "image":
      return <ImagePreviewContent file={file} />;
    case "pdf":
      return <PdfPreviewContent file={file} />;
    case "csv":
      return (
        <CsvPreviewContent
          file={file}
          parsedTelematics={parsedTelematics}
          activeReference={activeReference}
          onOpenTab={onOpenTab}
        />
      );
    case "video":
      return <VideoPreviewContent file={file} onOpenTab={onOpenTab} />;
    case "zip":
      return <ArchivePreviewContent file={file} />;
    default:
      return null;
  }
}

function TextPreviewContent({
  file,
  activeReference,
}: {
  file: EvidenceFile;
  activeReference: EvidenceReference | null;
}) {
  const [text, setText] = useState(file.metadata.textPreview ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lineRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  useEffect(() => {
    if (text || !file.metadata.publicUrl) return;

    setLoading(true);
    fetch(file.metadata.publicUrl)
      .then((response) => {
        if (!response.ok) throw new Error("Unable to load text file.");
        return response.text();
      })
      .then((content) => setText(content.trim()))
      .catch(() => setError("Text preview unavailable."))
      .finally(() => setLoading(false));
  }, [file.metadata.publicUrl, text]);

  useEffect(() => {
    if (!activeReference?.lineStart) return;
    const target = lineRefs.current.get(activeReference.lineStart);
    target?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [activeReference, text]);

  const lines = (text || "").split("\n");

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 bg-slate-50/50 px-4 py-3">
        <div className="flex items-center gap-2">
          <FileText className="size-3.5 text-slate-500" />
          <CardTitle className="text-[13px] font-medium text-slate-900">
            {file.name}
          </CardTitle>
        </div>
        <Badge variant="secondary" className="h-5 text-[10px] font-normal">
          {file.metadata.source}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3 p-4">
        {loading && (
          <p className="text-[12px] text-muted-foreground">Loading text preview...</p>
        )}
        {error && <p className="text-[12px] text-muted-foreground">{error}</p>}
        {!loading && !error && (
          <div className="max-h-[480px] overflow-auto rounded-md border border-slate-200 bg-slate-50">
            {lines.length === 0 ? (
              <p className="p-3 text-[12px] text-muted-foreground">
                No preview available.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {lines.map((line, index) => {
                  const lineNumber = index + 1;
                  const highlighted = isLineHighlighted(lineNumber, activeReference);
                  return (
                  <div
                    key={`${index}-${line.slice(0, 12)}`}
                    ref={(node) => {
                      if (node) lineRefs.current.set(lineNumber, node);
                    }}
                    className={`flex gap-3 px-3 py-1.5 font-mono text-[11px] leading-relaxed ${
                      highlighted ? "bg-amber-100/80" : ""
                    }`}
                  >
                    <span className={`w-6 shrink-0 select-none text-right ${
                      highlighted ? "font-medium text-amber-900" : "text-slate-400"
                    }`}>
                      {lineNumber}
                    </span>
                    <span className="min-w-0 whitespace-pre-wrap text-slate-700">
                      {splitHighlightedText(line).map((part, partIndex) =>
                        part.highlight ? (
                          <mark
                            key={partIndex}
                            className="rounded bg-amber-100 px-0.5 text-amber-900"
                          >
                            {part.text}
                          </mark>
                        ) : (
                          <span key={partIndex}>{part.text}</span>
                        )
                      )}
                    </span>
                  </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
        <p className="text-[11px] text-muted-foreground">
          Highlighted terms support review of impact, braking, speed, witness,
          weather, tow, and uncertainty references.
        </p>
      </CardContent>
    </Card>
  );
}

function ImagePreviewContent({ file }: { file: EvidenceFile }) {
  const previewUrl = file.objectUrl ?? file.metadata.publicUrl;

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 bg-slate-50/50 px-4 py-3">
        <div className="flex items-center gap-2">
          <ImageIcon className="size-3.5 text-slate-500" />
          <CardTitle className="text-[13px] font-medium text-slate-900">
            {file.name}
          </CardTitle>
        </div>
        <Badge variant="secondary" className="h-5 text-[10px] font-normal">
          {file.metadata.source}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3 p-4">
        <div className="overflow-hidden rounded-md border border-slate-200 bg-slate-900">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt={file.name}
              className="mx-auto max-h-[420px] w-full object-contain"
            />
          ) : (
            <div className="flex aspect-video items-center justify-center text-sm text-slate-400">
              Image preview unavailable.
            </div>
          )}
        </div>
        <p className="text-[11px] leading-snug text-slate-600">
          {file.metadata.description}
        </p>
        <p className="text-[11px] text-muted-foreground">{IMAGE_PREVIEW_NOTE}</p>
      </CardContent>
    </Card>
  );
}

function PdfPreviewContent({ file }: { file: EvidenceFile }) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="border-b border-slate-100 bg-slate-50/50 px-4 py-3">
        <CardTitle className="text-[13px] font-medium text-slate-900">
          {file.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-4">
        <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center">
          <p className="text-[13px] font-medium text-slate-800">
            PDF preview unavailable in local demo
          </p>
          <p className="mt-1 text-[12px] text-muted-foreground">
            Source: {file.metadata.source}
          </p>
          <Button
            type="button"
            variant="outline"
            disabled
            className="mt-4 h-8 text-[12px]"
          >
            Full PDF viewer coming later
          </Button>
        </div>
        {file.metadata.textPreview && (
          <div className="rounded-md border border-slate-200 bg-white p-3">
            <p className="text-[11px] font-medium text-slate-700">
              Extracted text preview
            </p>
            <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap font-mono text-[11px] text-slate-600">
              {file.metadata.textPreview}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CsvPreviewContent({
  file,
  parsedTelematics,
  activeReference,
  onOpenTab,
}: {
  file: EvidenceFile;
  parsedTelematics: ParsedTelematics | null;
  activeReference: EvidenceReference | null;
  onOpenTab: (tab: ViewerTab) => void;
}) {
  const rowRefs = useRef<Map<number, HTMLTableRowElement>>(new Map());
  const isLoaded =
    parsedTelematics !== null &&
    (parsedTelematics.evidenceId === file.id || file.id === "ev-telematics");
  const previewRows = isLoaded ? parsedTelematics.rows.slice(0, 12) : [];

  useEffect(() => {
    const targetIndex =
      activeReference?.rowStart ??
      activeReference?.rowIndex ??
      activeReference?.rowEnd;
    if (targetIndex === undefined) return;
    const target = rowRefs.current.get(targetIndex);
    target?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [activeReference, previewRows.length]);

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 bg-slate-50/50 px-4 py-3">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="size-3.5 text-slate-500" />
          <CardTitle className="text-[13px] font-medium text-slate-900">
            {file.name}
          </CardTitle>
        </div>
        <Badge variant="secondary" className="h-5 text-[10px] font-normal">
          {file.metadata.source}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3 p-4">
        <div className="grid gap-2 text-[12px] sm:grid-cols-2">
          <PreviewMetaRow
            label="Detected format"
            value={
              isLoaded
                ? formatLabelForFormat(parsedTelematics.format)
                : "Not parsed"
            }
          />
          <PreviewMetaRow
            label="Row count"
            value={
              isLoaded
                ? String(parsedTelematics.rows.length)
                : file.metadata.recordCount !== undefined
                  ? String(file.metadata.recordCount)
                  : "Not loaded"
            }
          />
          <PreviewMetaRow
            label="Time range"
            value={
              isLoaded
                ? `${parsedTelematics.timeRange.start} – ${parsedTelematics.timeRange.end}`
                : file.metadata.timeRange
                  ? `${file.metadata.timeRange.start} – ${file.metadata.timeRange.end}`
                  : "Not loaded"
            }
          />
          <PreviewMetaRow
            label="Detected events"
            value={
              isLoaded
                ? String(parsedTelematics.detectedEvents.length)
                : "Not loaded"
            }
          />
        </div>

        {isLoaded && parsedTelematics.warnings.length > 0 && (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
            <p className="text-[11px] font-medium text-amber-800">Warnings</p>
            <ul className="mt-1 space-y-1">
              {parsedTelematics.warnings.map((warning) => (
                <li key={warning} className="text-[11px] text-amber-700">
                  {warning}
                </li>
              ))}
            </ul>
          </div>
        )}

        {isLoaded && previewRows.length > 0 && (
          <div className="overflow-auto rounded-md border border-slate-200">
            <table className="min-w-full text-left text-[11px]">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-2 py-1.5 font-medium">Timestamp</th>
                  <th className="px-2 py-1.5 font-medium">Speed</th>
                  <th className="px-2 py-1.5 font-medium">Lat</th>
                  <th className="px-2 py-1.5 font-medium">Lng</th>
                  <th className="px-2 py-1.5 font-medium">Brake</th>
                </tr>
              </thead>
              <tbody>
                {previewRows.map((row, index) => {
                  const highlighted = isRowHighlighted(index, activeReference);
                  return (
                  <tr
                    key={`${row.timestamp}-${index}`}
                    ref={(node) => {
                      if (node) rowRefs.current.set(index, node);
                    }}
                    className={`border-t border-slate-100 ${
                      highlighted ? "bg-amber-100/80" : ""
                    }`}
                  >
                    <td className="px-2 py-1.5 font-mono">{row.timestamp}</td>
                    <td className="px-2 py-1.5">{row.speedMph}</td>
                    <td className="px-2 py-1.5">{row.latitude ?? "—"}</td>
                    <td className="px-2 py-1.5">{row.longitude ?? "—"}</td>
                    <td className="px-2 py-1.5">
                      {row.brakeStatus === true ? "Yes" : row.brakeStatus === false ? "No" : "—"}
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!isLoaded && (
          <p className="text-[12px] text-muted-foreground">
            Load sample evidence or upload a telematics CSV to parse rows and
            preview raw telemetry data.
          </p>
        )}

        <Button
          type="button"
          variant="outline"
          className="h-8 text-[12px]"
          onClick={() => onOpenTab("telemetry")}
        >
          Open Telemetry tab
        </Button>
      </CardContent>
    </Card>
  );
}

function VideoPreviewContent({
  file,
  onOpenTab,
}: {
  file: EvidenceFile;
  onOpenTab: (tab: ViewerTab) => void;
}) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 bg-slate-50/50 px-4 py-3">
        <div className="flex items-center gap-2">
          <FileVideo className="size-3.5 text-slate-500" />
          <CardTitle className="text-[13px] font-medium text-slate-900">
            {file.name}
          </CardTitle>
        </div>
        <Badge variant="secondary" className="h-5 text-[10px] font-normal">
          {file.metadata.source}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3 p-4">
        <div className="flex aspect-video items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-900/95">
          <div className="text-center">
            <FileVideo className="mx-auto size-8 text-slate-400" />
            <p className="mt-2 text-[12px] text-slate-300">Video preview placeholder</p>
          </div>
        </div>
        <div className="grid gap-2 text-[12px] sm:grid-cols-2">
          <PreviewMetaRow
            label="Duration"
            value={file.metadata.duration ?? "Available in Video tab"}
          />
          <PreviewMetaRow label="Source label" value={file.metadata.source} />
        </div>
        <p className="text-[12px] leading-snug text-slate-600">
          {file.metadata.description}
        </p>
        <Button
          type="button"
          className="h-8 bg-slate-900 text-[12px] text-white hover:bg-slate-800"
          onClick={() => onOpenTab("video")}
        >
          Open Video tab
        </Button>
      </CardContent>
    </Card>
  );
}

function ArchivePreviewContent({ file }: { file: EvidenceFile }) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="border-b border-slate-100 bg-slate-50/50 px-4 py-3">
        <CardTitle className="text-[13px] font-medium text-slate-900">
          {file.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-4">
        <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-6">
          <p className="text-[12px] font-medium text-slate-800">Archive reference</p>
          <p className="mt-1 text-[12px] text-muted-foreground">
            Source: {file.metadata.source}
          </p>
          <p className="mt-3 text-[12px] leading-snug text-slate-600">
            {file.metadata.description}
          </p>
          <p className="mt-3 text-[11px] text-muted-foreground">
            Archive contents are not extracted in this local demo. Review the
            original package outside Chronos if needed.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

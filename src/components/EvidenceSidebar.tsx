"use client";

import { useRef, useState } from "react";
import {
  Archive,
  ChevronDown,
  FileSpreadsheet,
  FileText,
  FileVideo,
  ImageIcon,
  Loader2,
  Upload,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getAcceptAttribute } from "@/lib/evidenceUpload";
import { cn } from "@/lib/utils";
import type {
  EvidenceFile,
  EvidenceFileType,
  TelematicsUploadState,
} from "@/types/claim";

interface EvidenceSidebarProps {
  files: EvidenceFile[];
  selectedEvidenceId: string | null;
  onSelectEvidence: (id: string) => void;
  uploadState: TelematicsUploadState;
  uploadError: string | null;
  uploadWarnings: string[];
  processedFileName: string | null;
  hasUploadedTelematics: boolean;
  sampleEvidenceLoaded: boolean;
  onUploadFiles: (files: File[]) => void;
  onLoadSampleEvidence: () => void;
}

const fileTypeIcons: Record<EvidenceFileType, typeof FileText> = {
  pdf: FileText,
  video: FileVideo,
  csv: FileSpreadsheet,
  text: FileText,
  zip: Archive,
  image: ImageIcon,
};

const fileTypeLabels: Record<EvidenceFileType, string> = {
  pdf: "PDF",
  video: "Video",
  csv: "CSV",
  text: "Text",
  zip: "Archive",
  image: "Image",
};

export function EvidenceSidebar({
  files,
  selectedEvidenceId,
  onSelectEvidence,
  uploadState,
  uploadError,
  uploadWarnings,
  processedFileName,
  hasUploadedTelematics,
  sampleEvidenceLoaded,
  onUploadFiles,
  onLoadSampleEvidence,
}: EvidenceSidebarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [filesExpanded, setFilesExpanded] = useState(true);
  const [detailsExpanded, setDetailsExpanded] = useState(true);
  const [isDragActive, setIsDragActive] = useState(false);
  const selectedFile = files.find((file) => file.id === selectedEvidenceId);
  const isParsing = uploadState === "parsing";

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    onUploadFiles(Array.from(fileList));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(event.target.files);
    event.target.value = "";
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragActive(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragActive(false);
    handleFiles(event.dataTransfer.files);
  };

  return (
    <aside className="h-full min-h-0 overflow-y-auto border-b border-border bg-slate-50/80 pb-10 xl:border-b-0 xl:border-r">
      <CollapsibleSection
        title="Evidence Files"
        badge={`${files.length} files`}
        expanded={filesExpanded}
        onToggle={() => setFilesExpanded((previous) => !previous)}
      >
        <p className="text-[12px] leading-snug text-muted-foreground">
          Source references linked to this claim
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept={getAcceptAttribute()}
          multiple
          className="hidden"
          onChange={handleFileChange}
        />

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "mt-2.5 rounded-md border border-dashed transition-colors",
            isDragActive
              ? "border-sky-400 bg-sky-50"
              : "border-slate-300 bg-white"
          )}
        >
          <button
            type="button"
            disabled={isParsing}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "flex w-full items-center justify-center gap-2 px-3 py-2 text-[12px] font-medium transition-colors",
              isParsing
                ? "cursor-wait text-slate-500"
                : "text-slate-600 hover:text-slate-800"
            )}
          >
            {isParsing ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                Processing uploaded files...
              </>
            ) : (
              <>
                <Upload className="size-3.5" />
                Upload or drop evidence files
              </>
            )}
          </button>
          <p className="px-3 pb-2 text-center text-[10px] text-muted-foreground">
            MP4, CSV, TXT, PDF, JPG, PNG, ZIP
          </p>
        </div>

        <button
          type="button"
          disabled={isParsing}
          onClick={onLoadSampleEvidence}
          className="mt-2 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-[11px] font-medium text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Load sample evidence
        </button>

        {sampleEvidenceLoaded && (
          <p className="mt-2 text-[11px] text-emerald-700">
            Sample evidence loaded for this claim.
          </p>
        )}

        {uploadState === "processed" && processedFileName && (
          <p className="mt-2 text-[11px] text-emerald-700">
            Processed telematics CSV: {processedFileName}
          </p>
        )}

        {uploadState === "error" && uploadError && (
          <p className="mt-2 text-[11px] leading-snug text-red-600">
            {uploadError}
          </p>
        )}

        {uploadWarnings.length > 0 && (
          <div className="mt-2 space-y-1">
            {uploadWarnings.slice(0, 4).map((warning, index) => (
              <p
                key={`${warning}-${index}`}
                className="text-[11px] leading-snug text-amber-700"
              >
                {warning}
              </p>
            ))}
            {uploadWarnings.length > 4 && (
              <p className="text-[11px] text-amber-700">
                +{uploadWarnings.length - 4} additional warnings
              </p>
            )}
          </div>
        )}

        {!hasUploadedTelematics && uploadState !== "processed" && (
          <p className="mt-2 text-[11px] leading-snug text-muted-foreground">
            Using sample claim data. Upload a telematics CSV to generate events
            from real evidence.
          </p>
        )}

        <div className="mt-2 space-y-1">
          {files.map((file) => {
            const Icon = fileTypeIcons[file.fileType];
            const isSelected = file.id === selectedEvidenceId;

            return (
              <button
                key={file.id}
                type="button"
                onClick={() => onSelectEvidence(file.id)}
                className={cn(
                  "w-full rounded-md border px-2.5 py-2 text-left transition-colors",
                  isSelected
                    ? "border-slate-300 bg-white shadow-sm"
                    : "border-transparent bg-white/60 hover:border-slate-200 hover:bg-white"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-600">
                    <Icon className="size-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-slate-900">
                      {file.name}
                    </p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] text-muted-foreground">
                        {fileTypeLabels[file.fileType]}
                      </span>
                      <Badge
                        variant="secondary"
                        className="h-4 bg-emerald-50 px-1.5 text-[10px] text-emerald-700"
                      >
                        {file.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </CollapsibleSection>

      <Separator />

      <CollapsibleSection
        title="Evidence Details"
        expanded={detailsExpanded}
        onToggle={() => setDetailsExpanded((previous) => !previous)}
        className="p-3"
      >
        {selectedFile ? (
          <div className="space-y-1.5 rounded-md border border-slate-200 bg-white p-3 text-[12px] leading-snug text-slate-600">
            <DetailRow label="File" value={selectedFile.name} />
            <DetailRow
              label="Type"
              value={fileTypeLabels[selectedFile.fileType]}
            />
            <DetailRow label="Status" value={selectedFile.status} />
            <DetailRow
              label="Uploaded"
              value={selectedFile.metadata.uploadedAt}
            />
            <DetailRow label="Size" value={selectedFile.metadata.fileSize} />
            <DetailRow label="Source" value={selectedFile.metadata.source} />
            {selectedFile.metadata.recordCount !== undefined && (
              <DetailRow
                label="Row count"
                value={String(selectedFile.metadata.recordCount)}
              />
            )}
            {selectedFile.metadata.timeRange && (
              <DetailRow
                label="Time range"
                value={`${selectedFile.metadata.timeRange.start} – ${selectedFile.metadata.timeRange.end}`}
              />
            )}
            {selectedFile.metadata.detectedEventCount !== undefined && (
              <DetailRow
                label="Detected events"
                value={String(selectedFile.metadata.detectedEventCount)}
              />
            )}
            {selectedFile.metadata.imageWidth !== undefined &&
              selectedFile.metadata.imageHeight !== undefined && (
                <DetailRow
                  label="Dimensions"
                  value={`${selectedFile.metadata.imageWidth} × ${selectedFile.metadata.imageHeight} px`}
                />
              )}
            {selectedFile.metadata.pdfPageCount !== undefined && (
              <DetailRow
                label="Page count"
                value={String(selectedFile.metadata.pdfPageCount)}
              />
            )}
            {selectedFile.metadata.textPreview && (
              <DetailRow
                label="Preview"
                value={`${selectedFile.metadata.textPreview.slice(0, 48)}…`}
              />
            )}
            {selectedFile.metadata.duration && (
              <DetailRow
                label="Duration"
                value={selectedFile.metadata.duration}
              />
            )}
            {selectedFile.metadata.warnings &&
              selectedFile.metadata.warnings.length > 0 && (
                <div className="pt-1">
                  <p className="text-[11px] font-medium text-amber-700">
                    Warnings
                  </p>
                  <ul className="mt-1 space-y-1">
                    {selectedFile.metadata.warnings.slice(0, 3).map((warning) => (
                      <li key={warning} className="text-[11px] text-amber-700">
                        {warning}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            <p className="pt-1 text-[12px] leading-relaxed text-slate-500">
              {selectedFile.metadata.description}
            </p>
          </div>
        ) : (
          <p className="text-[12px] text-muted-foreground">
            Select a file to view metadata.
          </p>
        )}
      </CollapsibleSection>
    </aside>
  );
}

function CollapsibleSection({
  title,
  badge,
  expanded,
  onToggle,
  children,
  className,
}: {
  title: string;
  badge?: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("border-b border-border", className)}>
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-slate-100/60"
      >
        <div className="flex items-center gap-2">
          <ChevronDown
            className={cn(
              "size-3.5 text-slate-500 transition-transform duration-200",
              expanded ? "rotate-0" : "-rotate-90"
            )}
          />
          <h2 className="text-[13px] font-medium text-slate-900">{title}</h2>
        </div>
        {badge && (
          <Badge variant="outline" className="h-5 text-[11px] font-normal">
            {badge}
          </Badge>
        )}
      </button>
      <div
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-200 ease-in-out",
          expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="overflow-hidden px-4 pb-3">{children}</div>
      </div>
    </section>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium text-slate-800">{value}</span>
    </div>
  );
}

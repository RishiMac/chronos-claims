"use client";

import { useRef } from "react";
import {
  Archive,
  FileSpreadsheet,
  FileText,
  FileVideo,
  Loader2,
  Upload,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
  processedFileName: string | null;
  hasUploadedTelematics: boolean;
  onUploadCsv: (file: File) => void;
  onLoadSampleCsv: () => void;
}

const fileTypeIcons: Record<EvidenceFileType, typeof FileText> = {
  pdf: FileText,
  video: FileVideo,
  csv: FileSpreadsheet,
  text: FileText,
  zip: Archive,
};

const fileTypeLabels: Record<EvidenceFileType, string> = {
  pdf: "PDF",
  video: "Video",
  csv: "CSV",
  text: "Text",
  zip: "Archive",
};

export function EvidenceSidebar({
  files,
  selectedEvidenceId,
  onSelectEvidence,
  uploadState,
  uploadError,
  processedFileName,
  hasUploadedTelematics,
  onUploadCsv,
  onLoadSampleCsv,
}: EvidenceSidebarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectedFile = files.find((file) => file.id === selectedEvidenceId);
  const isParsing = uploadState === "parsing";

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onUploadCsv(file);
    }
    event.target.value = "";
  };

  return (
    <aside className="h-full min-h-0 overflow-y-auto border-b border-border bg-slate-50/80 pb-10 xl:border-b-0 xl:border-r">
      <div className="border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[13px] font-medium text-slate-900">
            Evidence Files
          </h2>
          <Badge variant="outline" className="h-5 text-[11px] font-normal">
            {files.length} files
          </Badge>
        </div>
        <p className="mt-0.5 text-[12px] leading-snug text-muted-foreground">
          Source references linked to this claim
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={handleFileChange}
        />

        <button
          type="button"
          disabled={isParsing}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "mt-2.5 flex w-full items-center justify-center gap-2 rounded-md border border-dashed px-3 py-2 text-[12px] font-medium transition-colors",
            isParsing
              ? "cursor-wait border-slate-300 bg-slate-100 text-slate-500"
              : "border-slate-300 bg-white text-slate-600 hover:border-slate-400 hover:bg-slate-50"
          )}
        >
          {isParsing ? (
            <>
              <Loader2 className="size-3.5 animate-spin" />
              Parsing telematics CSV...
            </>
          ) : (
            <>
              <Upload className="size-3.5" />
              Upload telematics CSV
            </>
          )}
        </button>

        <button
          type="button"
          disabled={isParsing}
          onClick={onLoadSampleCsv}
          className="mt-2 text-[11px] text-slate-500 underline-offset-2 hover:text-slate-700 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
        >
          Use sample telematics CSV
        </button>

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

        {!hasUploadedTelematics && uploadState !== "processed" && (
          <p className="mt-2 text-[11px] leading-snug text-muted-foreground">
            Using sample claim data. Upload a telematics CSV to generate events
            from real evidence.
          </p>
        )}
      </div>

      <div className="space-y-1 p-2">
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

      <Separator />

      <div className="p-3">
        <h3 className="text-[13px] font-medium text-slate-900">
          Evidence Details
        </h3>
        {selectedFile ? (
          <div className="mt-2 space-y-1.5 rounded-md border border-slate-200 bg-white p-3 text-[12px] leading-snug text-slate-600">
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
            {selectedFile.metadata.duration && (
              <DetailRow
                label="Duration"
                value={selectedFile.metadata.duration}
              />
            )}
            <p className="pt-1 text-[12px] leading-relaxed text-slate-500">
              {selectedFile.metadata.description}
            </p>
          </div>
        ) : (
          <p className="mt-2 text-[12px] text-muted-foreground">
            Select a file to view metadata.
          </p>
        )}
      </div>
    </aside>
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

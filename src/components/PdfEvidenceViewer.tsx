"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { EvidenceFile } from "@/types/claim";

interface PdfEvidenceViewerProps {
  file: EvidenceFile;
}

export function PdfEvidenceViewer({ file }: PdfEvidenceViewerProps) {
  const pageCount = file.metadata.pdfPageCount;

  return (
    <Card className="overflow-hidden border-slate-200 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 bg-slate-50/50 px-4 py-3">
        <CardTitle className="text-[13px] font-medium text-slate-900">
          PDF Evidence
        </CardTitle>
        <span className="text-xs text-muted-foreground">Embedded document preview</span>
      </CardHeader>
      <CardContent className="space-y-3 p-4">
        <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
          {file.objectUrl ? (
            <iframe
              title={file.name}
              src={file.objectUrl}
              className="h-[480px] w-full"
            />
          ) : (
            <div className="flex aspect-[4/3] items-center justify-center text-sm text-slate-400">
              PDF preview unavailable. Re-upload this file to restore preview.
            </div>
          )}
        </div>

        <div className="rounded-md border border-slate-200 bg-white p-3 text-[12px] leading-snug text-slate-600">
          <DetailRow label="Filename" value={file.name} />
          <DetailRow
            label="Page count"
            value={
              pageCount !== undefined ? String(pageCount) : "Not available"
            }
          />
        </div>
      </CardContent>
    </Card>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 py-0.5">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium text-slate-800">{value}</span>
    </div>
  );
}

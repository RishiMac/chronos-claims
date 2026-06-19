"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getEvidencePreviewUrl } from "@/lib/sampleEvidenceLoader";
import type { EvidenceFile } from "@/types/claim";

interface ImageEvidenceViewerProps {
  file: EvidenceFile;
}

export function ImageEvidenceViewer({ file }: ImageEvidenceViewerProps) {
  const previewUrl = getEvidencePreviewUrl(
    file.metadata.publicUrl,
    file.objectUrl
  );
  const width = file.metadata.imageWidth;
  const height = file.metadata.imageHeight;
  const dimensions =
    width && height ? `${width} × ${height} px` : "Dimensions unavailable";

  return (
    <Card className="overflow-hidden border-slate-200 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 bg-slate-50/50 px-4 py-3">
        <CardTitle className="text-[13px] font-medium text-slate-900">
          Image Evidence
        </CardTitle>
        <span className="text-xs text-muted-foreground">Uploaded image preview</span>
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
              Image preview unavailable. Re-upload this file to restore preview.
            </div>
          )}
        </div>

        <div className="rounded-md border border-slate-200 bg-white p-3 text-[12px] leading-snug text-slate-600">
          <DetailRow label="Filename" value={file.name} />
          <DetailRow label="Dimensions" value={dimensions} />
          <DetailRow label="Source reference" value={file.metadata.source} />
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

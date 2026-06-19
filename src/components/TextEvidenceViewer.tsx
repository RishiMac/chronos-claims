"use client";

import { useEffect, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getEvidencePreviewUrl } from "@/lib/sampleEvidenceLoader";
import type { EvidenceFile } from "@/types/claim";

interface TextEvidenceViewerProps {
  file: EvidenceFile;
}

export function TextEvidenceViewer({ file }: TextEvidenceViewerProps) {
  const [preview, setPreview] = useState(file.metadata.textPreview ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (preview || !file.metadata.publicUrl) return;

    setLoading(true);
    fetch(file.metadata.publicUrl)
      .then((response) => {
        if (!response.ok) throw new Error("Unable to load text file.");
        return response.text();
      })
      .then((text) => setPreview(text.slice(0, 1200).trim()))
      .catch(() => setError("Text preview unavailable."))
      .finally(() => setLoading(false));
  }, [file.metadata.publicUrl, preview]);

  return (
    <Card className="overflow-hidden border-slate-200 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 bg-slate-50/50 px-4 py-3">
        <CardTitle className="text-[13px] font-medium text-slate-900">
          Text Evidence
        </CardTitle>
        <span className="text-xs text-muted-foreground">Document preview</span>
      </CardHeader>
      <CardContent className="space-y-3 p-4">
        <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
          {loading && (
            <p className="text-[12px] text-muted-foreground">
              Loading text preview...
            </p>
          )}
          {error && (
            <p className="text-[12px] text-muted-foreground">{error}</p>
          )}
          {!loading && !error && (
            <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-slate-700">
              {preview || "No preview available."}
            </pre>
          )}
        </div>

        <div className="rounded-md border border-slate-200 bg-white p-3 text-[12px] leading-snug text-slate-600">
          <DetailRow label="Filename" value={file.name} />
          <DetailRow label="Source reference" value={file.metadata.source} />
          {file.metadata.publicUrl && (
            <DetailRow label="Reference path" value={file.metadata.publicUrl} />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 py-0.5">
      <span className="text-muted-foreground">{label}</span>
      <span className="max-w-[60%] text-right font-medium text-slate-800">
        {value}
      </span>
    </div>
  );
}

export function getTextPreviewSource(file: EvidenceFile): string | undefined {
  return getEvidencePreviewUrl(file.metadata.publicUrl, file.objectUrl);
}

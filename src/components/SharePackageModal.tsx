"use client";

import { Check, Copy, ExternalLink, Link2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { HUMAN_REVIEW_DISCLAIMER } from "@/lib/share/constants";
import type { SharePackage } from "@/types/share-package";

interface SharePackageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  claimId: string;
  sharePackage: SharePackage | null;
  onGenerate: () => void;
  onCopyLink: (url: string) => void;
  onOpenPackage: (url: string) => void;
}

export function SharePackageModal({
  open,
  onOpenChange,
  claimId,
  sharePackage,
  onGenerate,
  onCopyLink,
  onOpenPackage,
}: SharePackageModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!sharePackage) return;
    await navigator.clipboard.writeText(sharePackage.url);
    onCopyLink(sharePackage.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpen = () => {
    if (!sharePackage) return;
    onOpenPackage(sharePackage.url);
    window.open(sharePackage.url, "_blank", "noopener,noreferrer");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {sharePackage ? (
              <>
                <Check className="size-5 text-emerald-600" />
                Shareable investigation package
              </>
            ) : (
              "Shareable investigation package"
            )}
          </DialogTitle>
          <DialogDescription className="space-y-2">
            <span>
              This package contains the synchronized timeline, evidence references,
              video view, GPS route, and supporting documents.
            </span>
            <span className="block text-[12px] text-muted-foreground">
              {HUMAN_REVIEW_DISCLAIMER}
            </span>
          </DialogDescription>
        </DialogHeader>

        {!sharePackage ? (
          <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-center">
            <p className="text-[13px] text-slate-600">
              No share package generated yet.
            </p>
            <Button
              type="button"
              size="sm"
              className="mt-3 bg-slate-900 text-white hover:bg-slate-800"
              onClick={onGenerate}
            >
              Generate package
            </Button>
          </div>
        ) : (
          <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-medium text-slate-500">
              Secure share link — Claim {claimId}
            </p>
            <div className="space-y-1 text-[11px] text-muted-foreground">
              <p>
                Created {new Date(sharePackage.createdAt).toLocaleString()}
              </p>
              <p>
                Expires {new Date(sharePackage.expiresAt).toLocaleString()}
              </p>
              <p>Access count: {sharePackage.accessCount}</p>
              <p>
                {sharePackage.includedEvidenceIds.length} evidence files ·{" "}
                {sharePackage.includedEventIds.length} events
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex min-w-0 flex-1 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2">
                <Link2 className="size-4 shrink-0 text-slate-400" />
                <span className="truncate font-mono text-xs text-slate-700">
                  {sharePackage.url}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="shrink-0"
              >
                {copied ? (
                  <Check className="size-4" />
                ) : (
                  <Copy className="size-4" />
                )}
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onGenerate}
                className="text-[12px]"
              >
                Generate new package
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="text-[12px]"
              >
                Copy link
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleOpen}
                className="text-[12px]"
              >
                <ExternalLink className="mr-1 size-3.5" />
                Open package
              </Button>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

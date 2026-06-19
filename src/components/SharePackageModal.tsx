"use client";

import { Check, Copy, Link2 } from "lucide-react";
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
import type { SharePackage } from "@/types/share-package";

interface SharePackageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shareUrl: string;
  claimId: string;
  sharePackage: SharePackage | null;
}

export function SharePackageModal({
  open,
  onOpenChange,
  shareUrl,
  claimId,
  sharePackage,
}: SharePackageModalProps) {
  const [copied, setCopied] = useState(false);
  const displayUrl = sharePackage?.url ?? shareUrl;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(displayUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Check className="size-5 text-emerald-600" />
            Shareable package generated
          </DialogTitle>
          <DialogDescription className="space-y-2">
            <span>
              This package contains the synchronized timeline, evidence references,
              video view, GPS route, and supporting documents. It is intended to
              support human review — not to determine outcomes.
            </span>
            <span className="block text-[12px] text-muted-foreground">
              All source files remain linked to their original evidence references.
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-medium text-slate-500">
            Secure share link — Claim {claimId}
          </p>
          {sharePackage && (
            <p className="text-[11px] text-muted-foreground">
              Created {new Date(sharePackage.createdAt).toLocaleString()} · Expires{" "}
              {new Date(sharePackage.expiresAt).toLocaleDateString()} ·{" "}
              {sharePackage.includedEvidenceIds.length} evidence files ·{" "}
              {sharePackage.includedEventIds.length} events
            </p>
          )}
          <div className="flex items-center gap-2">
            <div className="flex min-w-0 flex-1 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2">
              <Link2 className="size-4 shrink-0 text-slate-400" />
              <span className="truncate font-mono text-xs text-slate-700">
                {displayUrl}
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
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

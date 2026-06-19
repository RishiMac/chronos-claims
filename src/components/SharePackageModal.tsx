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

interface SharePackageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shareUrl: string;
  claimId: string;
}

export function SharePackageModal({
  open,
  onOpenChange,
  shareUrl,
  claimId,
}: SharePackageModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl);
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
          <DialogDescription>
            This package contains the synchronized timeline, evidence references,
            video view, GPS route, and supporting documents. It is intended to
            support human review — not to determine outcomes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-medium text-slate-500">
            Secure share link — Claim {claimId}
          </p>
          <div className="flex items-center gap-2">
            <div className="flex min-w-0 flex-1 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2">
              <Link2 className="size-4 shrink-0 text-slate-400" />
              <span className="truncate font-mono text-xs text-slate-700">
                {shareUrl}
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

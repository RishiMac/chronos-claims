"use client";

import { Check, Copy, ExternalLink, Link2 } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { PasscodeInput } from "@/components/PasscodeInput";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ACCESS_MODE_LABELS,
  DEMO_ACCESS_CONTROL_COPY,
  EXPIRATION_LABELS,
  HUMAN_REVIEW_DISCLAIMER,
} from "@/lib/share/constants";
import { formatExpirationLabel } from "@/lib/share/passcodeUtils";
import { getSharePackageStatus } from "@/lib/share/sharePackageUtils";
import type {
  ShareAccessMode,
  ShareExpirationOption,
  ShareIncludedSections,
  SharePackage,
  SharePackageSettings,
} from "@/types/share-package";
import {
  DEFAULT_SHARE_INCLUDED_SECTIONS,
  DEFAULT_SHARE_SETTINGS,
} from "@/types/share-package";

export interface SharePackageGenerateInput extends SharePackageSettings {
  passcode?: string;
}

interface SharePackageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  claimId: string;
  sharePackage: SharePackage | null;
  onGenerate: (input: SharePackageGenerateInput) => void | Promise<void>;
  onCopyLink: (url: string) => void;
  onOpenPackage: (url: string) => void;
  onRevoke: () => void;
}

function sectionsFromPackage(pkg: SharePackage | null): ShareIncludedSections {
  return pkg?.includedSections ?? DEFAULT_SHARE_INCLUDED_SECTIONS;
}

function settingsFromPackage(pkg: SharePackage | null): SharePackageSettings {
  if (!pkg) return DEFAULT_SHARE_SETTINGS;
  return {
    expiration: pkg.expiration,
    accessMode: pkg.accessMode,
    includedSections: pkg.includedSections,
  };
}

function statusBadgeClass(status: ReturnType<typeof getSharePackageStatus>) {
  switch (status) {
    case "active":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "expired":
      return "border-amber-200 bg-amber-50 text-amber-800";
    case "revoked":
      return "border-red-200 bg-red-50 text-red-700";
    default:
      return "border-slate-200 bg-slate-100 text-slate-600";
  }
}

export function SharePackageModal({
  open,
  onOpenChange,
  claimId,
  sharePackage,
  onGenerate,
  onCopyLink,
  onOpenPackage,
  onRevoke,
}: SharePackageModalProps) {
  const [copied, setCopied] = useState(false);
  const [expiration, setExpiration] = useState<ShareExpirationOption>("7d");
  const [accessMode, setAccessMode] =
    useState<ShareAccessMode>("anyone_with_link");
  const [includedSections, setIncludedSections] = useState<ShareIncludedSections>(
    DEFAULT_SHARE_INCLUDED_SECTIONS
  );
  const [passcode, setPasscode] = useState("");

  const syncSettingsFromPackage = useCallback(() => {
    const settings = settingsFromPackage(sharePackage);
    setExpiration(settings.expiration);
    setAccessMode(settings.accessMode);
    setIncludedSections(sectionsFromPackage(sharePackage));
    setPasscode("");
    setCopied(false);
  }, [sharePackage]);

  const handleDialogOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      syncSettingsFromPackage();
    }
    onOpenChange(nextOpen);
  };

  const status = useMemo(
    () => (sharePackage ? getSharePackageStatus(sharePackage) : null),
    [sharePackage]
  );

  const toggleSection = (key: keyof ShareIncludedSections) => {
    setIncludedSections((current) => ({
      ...current,
      [key]: !current[key],
    }));
  };

  const handleGenerate = () => {
    if (accessMode === "passcode_required" && passcode.trim().length < 4) {
      window.alert("Enter a passcode of at least 4 characters for demo access.");
      return;
    }

    void onGenerate({
      expiration,
      accessMode,
      includedSections,
      passcode: accessMode === "passcode_required" ? passcode.trim() : undefined,
    });
  };

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

  const handleRevoke = () => {
    if (!sharePackage) return;
    const confirmed = window.confirm(
      "Revoke this share package? The link will no longer provide access."
    );
    if (!confirmed) return;
    onRevoke();
  };

  const settingsPanel = (
    <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-3">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
          Package settings
        </p>
        <p className="mt-1 text-[10px] text-muted-foreground">
          Settings apply when you generate a new package.
        </p>
      </div>
      <label className="block space-y-1">
        <span className="text-[11px] text-slate-600">Expiration</span>
        <select
          value={expiration}
          onChange={(event) =>
            setExpiration(event.target.value as ShareExpirationOption)
          }
          className="h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-[12px] text-slate-700 outline-none focus:border-slate-400"
        >
          {(Object.keys(EXPIRATION_LABELS) as ShareExpirationOption[]).map(
            (option) => (
              <option key={option} value={option}>
                {EXPIRATION_LABELS[option]}
              </option>
            )
          )}
        </select>
      </label>
      <label className="block space-y-1">
        <span className="text-[11px] text-slate-600">Access mode</span>
        <select
          value={accessMode}
          onChange={(event) =>
            setAccessMode(event.target.value as ShareAccessMode)
          }
          className="h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-[12px] text-slate-700 outline-none focus:border-slate-400"
        >
          {(Object.keys(ACCESS_MODE_LABELS) as ShareAccessMode[]).map(
            (option) => (
              <option key={option} value={option}>
                {ACCESS_MODE_LABELS[option]}
              </option>
            )
          )}
        </select>
      </label>
      {accessMode === "passcode_required" && (
        <div className="space-y-1">
          <label className="text-[11px] text-slate-600" htmlFor="share-passcode">
            Demo passcode
          </label>
          <PasscodeInput
            id="share-passcode"
            value={passcode}
            onChange={setPasscode}
            placeholder="At least 4 characters"
            inputClassName="h-8 text-[12px]"
          />
          <p className="text-[10px] text-muted-foreground">
            {DEMO_ACCESS_CONTROL_COPY}
          </p>
        </div>
      )}
      <div className="space-y-1.5">
        <p className="text-[11px] text-slate-600">Included sections</p>
        {(
          [
            ["timeline", "Timeline"],
            ["evidenceList", "Evidence list"],
            ["notes", "Notes"],
            ["activitySummary", "Activity summary"],
          ] as const
        ).map(([key, label]) => (
          <label
            key={key}
            className="flex items-center gap-2 text-[12px] text-slate-700"
          >
            <input
              type="checkbox"
              checked={includedSections[key]}
              onChange={() => toggleSection(key)}
              className="size-3.5 rounded border-slate-300"
            />
            {label}
          </label>
        ))}
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-md">
        <DialogHeader className="shrink-0 gap-2 px-4 pt-4">
          <DialogTitle className="flex items-center gap-2 pr-8">
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
              This read-only package organizes evidence source references to
              support human review.
            </span>
            <span className="block text-[12px] text-muted-foreground">
              {HUMAN_REVIEW_DISCLAIMER}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        {!sharePackage ? (
          <div className="space-y-3">
            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-center">
              <p className="text-[13px] text-slate-600">
                No share package generated yet.
              </p>
            </div>
            {settingsPanel}
            <Button
              type="button"
              size="sm"
              className="w-full bg-slate-900 text-white hover:bg-slate-800"
              onClick={handleGenerate}
            >
              Generate package
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs font-medium text-slate-500">
                  Secure share link — Claim {claimId}
                </p>
                {status && (
                  <Badge
                    variant="secondary"
                    className={`h-5 text-[10px] font-normal capitalize ${statusBadgeClass(status)}`}
                  >
                    {status}
                  </Badge>
                )}
              </div>
              <div className="mt-2 space-y-1 text-[11px] text-muted-foreground">
                <p>Created {new Date(sharePackage.createdAt).toLocaleString()}</p>
                <p>
                  Expires{" "}
                  {formatExpirationLabel(
                    sharePackage.expiration,
                    sharePackage.expiresAt
                  )}
                </p>
                <p>Access mode: {ACCESS_MODE_LABELS[sharePackage.accessMode]}</p>
                <p>
                  Included:{" "}
                  {[
                    sharePackage.includedSections.timeline && "Timeline",
                    sharePackage.includedSections.evidenceList && "Evidence",
                    sharePackage.includedSections.notes && "Notes",
                    sharePackage.includedSections.activitySummary && "Activity",
                  ]
                    .filter(Boolean)
                    .join(", ") || "None"}
                </p>
                <p>Access count: {sharePackage.accessCount}</p>
              </div>
              <div className="mt-3 flex items-center gap-2">
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
              <div className="mt-3 flex flex-wrap gap-2">
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
                  disabled={status === "revoked"}
                  className="text-[12px]"
                >
                  <ExternalLink className="mr-1 size-3.5" />
                  Open package
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRevoke}
                  disabled={status === "revoked"}
                  className="text-[12px] text-red-600 hover:text-red-700"
                >
                  Revoke package
                </Button>
              </div>
            </div>
            {settingsPanel}
            <Button
              type="button"
              size="sm"
              className="w-full bg-slate-900 text-white hover:bg-slate-800"
              onClick={handleGenerate}
            >
              Generate new package
            </Button>
          </div>
        )}
        </div>

        <DialogFooter className="shrink-0 border-t bg-muted/50 px-4 py-3">
          <Button onClick={() => handleDialogOpenChange(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

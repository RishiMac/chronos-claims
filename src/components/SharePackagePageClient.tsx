"use client";

import { Bookmark, Flag, MessageSquare } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { SupportingEvidenceList } from "@/components/SupportingEvidenceList";
import { PasscodeInput } from "@/components/PasscodeInput";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { appendActivity, createActivityEntry } from "@/lib/audit/activityUtils";
import {
  DEMO_ACCESS_CONTROL_COPY,
  HUMAN_REVIEW_DISCLAIMER,
  READ_ONLY_BANNER_SUBTEXT,
  READ_ONLY_BANNER_TITLE,
} from "@/lib/share/constants";
import { formatExpirationLabel } from "@/lib/share/passcodeUtils";
import {
  getSharePackageViewData,
  incrementAccessCount,
  verifyPasscodeHash,
  type SharePackageViewData,
} from "@/lib/share/shareService";
import { getEventEvidenceReferences } from "@/lib/evidenceReferenceUtils";
import {
  reviewStatusStyles,
} from "@/lib/collaboration/collaborationUtils";

interface SharePackagePageClientProps {
  token: string;
}

function unlockStorageKey(token: string) {
  return `chronos_share_unlock_${token}`;
}

// Passcode unlock state uses sessionStorage (not chronosStorage) — session-scoped only.

function logShareActivity(
  claimId: string,
  action:
    | "opened_share_package"
    | "failed_passcode_attempt"
    | "successful_passcode_attempt",
  details: string
) {
  appendActivity(createActivityEntry(claimId, action, details));
}

export function SharePackagePageClient({ token }: SharePackagePageClientProps) {
  const [viewData, setViewData] = useState<SharePackageViewData | null | undefined>(
    undefined
  );
  const [unlocked, setUnlocked] = useState(false);
  const [passcodeInput, setPasscodeInput] = useState("");
  const [passcodeError, setPasscodeError] = useState<string | null>(null);
  const accessRecordedRef = useRef(false);

  const recordAccess = useCallback((data: SharePackageViewData) => {
    if (accessRecordedRef.current) return;
    accessRecordedRef.current = true;
    incrementAccessCount(token);
    logShareActivity(
      data.claim.id,
      "opened_share_package",
      `Opened share package ${token}`
    );
    setViewData((current) =>
      current
        ? {
            ...current,
            sharePackage: {
              ...current.sharePackage,
              accessCount: current.sharePackage.accessCount + 1,
            },
          }
        : current
    );
  }, [token]);

  useEffect(() => {
    queueMicrotask(() => {
      const data = getSharePackageViewData(token);
      setViewData(data ?? null);
      if (!data) return;

      const sessionUnlocked =
        typeof window !== "undefined" &&
        window.sessionStorage.getItem(unlockStorageKey(token)) === "1";

      if (
        data.accessible &&
        data.sharePackage.accessMode === "anyone_with_link"
      ) {
        setUnlocked(true);
        if (!sessionUnlocked) {
          recordAccess(data);
          window.sessionStorage.setItem(unlockStorageKey(token), "1");
        }
        return;
      }

      if (
        data.accessible &&
        data.sharePackage.accessMode === "passcode_required" &&
        sessionUnlocked
      ) {
        setUnlocked(true);
        accessRecordedRef.current = true;
      }
    });
  }, [token, recordAccess]);

  const handlePasscodeSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!viewData) return;

    const trimmed = passcodeInput.trim();
    if (!trimmed) {
      setPasscodeError("Enter the passcode to view this read-only package.");
      return;
    }

    const hash = viewData.sharePackage.passcodeHash;
    if (!hash) {
      setPasscodeError("This package is missing demo passcode configuration.");
      return;
    }

    const valid = await verifyPasscodeHash(trimmed, hash);
    if (!valid) {
      setPasscodeError("Incorrect passcode. This read-only package was not unlocked.");
      logShareActivity(
        viewData.claim.id,
        "failed_passcode_attempt",
        `Failed passcode attempt for ${token}`
      );
      return;
    }

    setPasscodeError(null);
    setUnlocked(true);
    window.sessionStorage.setItem(unlockStorageKey(token), "1");
    logShareActivity(
      viewData.claim.id,
      "successful_passcode_attempt",
      `Successful passcode entry for ${token}`
    );
    recordAccess(viewData);
  };

  if (viewData === undefined) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <p className="text-[13px] text-slate-500">Loading share package…</p>
      </div>
    );
  }

  if (viewData === null) {
    return (
      <div className="flex min-h-dvh flex-col">
        <header className="border-b border-border bg-card px-6 py-4">
          <Link href="/" className="text-[13px] font-medium text-slate-700">
            Chronos Claims
          </Link>
        </header>
        <main className="mx-auto w-full max-w-3xl px-6 py-10">
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-6">
              <p className="text-[15px] font-medium text-slate-900">
                Share package not found.
              </p>
              <p className="mt-2 text-[13px] text-muted-foreground">
                This link may be invalid or the package was removed from local
                storage on this device.
              </p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const {
    sharePackage,
    claimTitle,
    events,
    evidence,
    notes,
    activities,
    status,
    accessible,
  } = viewData;

  const passcodeRequired =
    accessible && sharePackage.accessMode === "passcode_required";
  const showContent = accessible && unlocked;
  const sections = sharePackage.includedSections;

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-border bg-card px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          <Link href="/" className="text-[13px] font-medium text-slate-700">
            Chronos Claims
          </Link>
          <Badge
            variant="secondary"
            className="h-5 border border-slate-200 bg-slate-100 text-[11px] font-normal text-slate-600"
          >
            Read-only package
          </Badge>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl space-y-4 px-6 py-8 pb-12">
        <div className="rounded-md border border-slate-200 bg-white px-4 py-3">
          <p className="text-[14px] font-medium text-slate-900">
            {READ_ONLY_BANNER_TITLE}
          </p>
          <p className="mt-0.5 text-[12px] text-muted-foreground">
            {READ_ONLY_BANNER_SUBTEXT}
          </p>
        </div>

        <div>
          <h1 className="text-lg font-medium tracking-tight text-slate-900">
            {claimTitle}
          </h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Shared investigation package — organizes source references for human
            review
          </p>
        </div>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50 px-4 py-3">
            <CardTitle className="text-[13px] font-medium text-slate-900">
              Package metadata
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 p-4 text-[13px] text-slate-700">
            <p>
              <span className="text-slate-500">Claim ID:</span>{" "}
              {sharePackage.claimId}
            </p>
            <p>
              <span className="text-slate-500">Generated:</span>{" "}
              {new Date(sharePackage.createdAt).toLocaleString()}
            </p>
            <p>
              <span className="text-slate-500">Expires:</span>{" "}
              {formatExpirationLabel(
                sharePackage.expiration,
                sharePackage.expiresAt
              )}
            </p>
            <p>
              <span className="text-slate-500">Status:</span>{" "}
              <span className="capitalize">{status}</span>
            </p>
            <p>
              <span className="text-slate-500">Access count:</span>{" "}
              {sharePackage.accessCount}
            </p>
            <p>
              <span className="text-slate-500">Created by:</span>{" "}
              {sharePackage.createdBy}
            </p>
          </CardContent>
        </Card>

        {status === "revoked" && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-[13px] font-medium text-red-900">
              This package has been revoked.
            </p>
          </div>
        )}

        {status === "expired" && (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-[13px] font-medium text-amber-900">
              This package has expired.
            </p>
          </div>
        )}

        <p className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-[12px] leading-snug text-slate-600">
          {HUMAN_REVIEW_DISCLAIMER}
        </p>

        {passcodeRequired && !unlocked && (
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50 px-4 py-3">
              <CardTitle className="text-[13px] font-medium text-slate-900">
                Demo passcode required
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-4">
              <p className="text-[12px] text-muted-foreground">
                {DEMO_ACCESS_CONTROL_COPY}
              </p>
              <form onSubmit={handlePasscodeSubmit} className="space-y-2">
                <PasscodeInput
                  id="share-unlock-passcode"
                  value={passcodeInput}
                  onChange={(value) => {
                    setPasscodeInput(value);
                    setPasscodeError(null);
                  }}
                  placeholder="Enter passcode"
                />
                {passcodeError && (
                  <p className="text-[12px] text-red-600">{passcodeError}</p>
                )}
                <Button type="submit" size="sm" className="bg-slate-900 text-white">
                  Unlock read-only package
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {showContent && sections.timeline && (
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50 px-4 py-3">
              <CardTitle className="text-[13px] font-medium text-slate-900">
                Timeline events
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {events.length === 0 ? (
                <p className="text-[13px] text-muted-foreground">
                  No timeline events included in this package.
                </p>
              ) : (
                <ul className="space-y-2">
                  {events.map((event) => {
                    const supportingReferences = getEventEvidenceReferences(
                      event,
                      evidence
                    );
                    const reviewStatus = event.reviewStatus ?? "unreviewed";
                    const flagCount = event.flags?.length ?? 0;
                    const commentCount = event.commentCount ?? 0;

                    return (
                    <li
                      key={event.id}
                      className="rounded-md border border-slate-200 bg-white px-3 py-2"
                    >
                      <p className="text-[11px] text-muted-foreground">
                        {event.timestamp}
                      </p>
                      <p className="text-[13px] font-medium text-slate-900">
                        {event.title}
                      </p>
                      <p className="mt-0.5 text-[12px] leading-snug text-slate-600">
                        {event.description}
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1">
                        <Badge
                          variant="outline"
                          className={`h-4 px-1.5 text-[9px] font-normal ${reviewStatusStyles[reviewStatus].badge}`}
                        >
                          {reviewStatusStyles[reviewStatus].label}
                        </Badge>
                        {event.assignedTo && (
                          <span className="text-[10px] text-slate-500">
                            Assigned: {event.assignedTo}
                          </span>
                        )}
                        {event.isBookmarked && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-700">
                            <Bookmark className="size-3 fill-current" />
                            Bookmarked
                          </span>
                        )}
                        {flagCount > 0 && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-700">
                            <Flag className="size-3" />
                            {flagCount} flag{flagCount === 1 ? "" : "s"}
                          </span>
                        )}
                        {commentCount > 0 && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] text-slate-500">
                            <MessageSquare className="size-3" />
                            {commentCount} comment{commentCount === 1 ? "" : "s"}
                          </span>
                        )}
                      </div>
                      {sections.evidenceList && supportingReferences.length > 0 && (
                        <div className="mt-2 border-t border-slate-100 pt-2">
                          <p className="text-[11px] font-medium text-slate-700">
                            Supporting evidence
                          </p>
                          <div className="mt-1.5">
                            <SupportingEvidenceList
                              references={supportingReferences}
                              compact
                            />
                          </div>
                        </div>
                      )}
                    </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        )}

        {showContent && sections.evidenceList && (
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50 px-4 py-3">
              <CardTitle className="text-[13px] font-medium text-slate-900">
                Evidence references
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {evidence.length === 0 ? (
                <p className="text-[13px] text-muted-foreground">
                  No evidence source references included in this package.
                </p>
              ) : (
                <ul className="space-y-2">
                  {evidence.map((file) => (
                    <li
                      key={file.id}
                      className="rounded-md border border-slate-200 bg-white px-3 py-2"
                    >
                      <p className="text-[13px] font-medium text-slate-900">
                        {file.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {file.fileType.toUpperCase()} · {file.metadata.source} ·{" "}
                        {file.metadata.fileSize}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        )}

        {showContent && sections.notes && (
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50 px-4 py-3">
              <CardTitle className="text-[13px] font-medium text-slate-900">
                Investigation notes
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {notes.length === 0 ? (
                <p className="text-[13px] text-muted-foreground">
                  No notes included in this package.
                </p>
              ) : (
                <ul className="space-y-2">
                  {notes.map((note) => (
                    <li
                      key={note.id}
                      className="rounded-md border border-slate-200 bg-white px-3 py-2"
                    >
                      <p className="text-[10px] text-muted-foreground">
                        {note.createdAt}
                      </p>
                      <p className="mt-0.5 text-[12px] leading-snug text-slate-700">
                        {note.body}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        )}

        {showContent && sections.activitySummary && (
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50 px-4 py-3">
              <CardTitle className="text-[13px] font-medium text-slate-900">
                Activity summary
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {activities.length === 0 ? (
                <p className="text-[13px] text-muted-foreground">
                  No activity recorded for this claim.
                </p>
              ) : (
                <ul className="max-h-48 space-y-1.5 overflow-y-auto">
                  {activities.slice(0, 20).map((entry) => (
                    <li
                      key={entry.id}
                      className="text-[11px] leading-snug text-slate-600"
                    >
                      <span className="font-mono text-[10px] text-slate-400">
                        {entry.timestamp}
                      </span>{" "}
                      {entry.details}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

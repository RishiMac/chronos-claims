"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { appendActivity, createActivityEntry } from "@/lib/audit/activityUtils";
import { HUMAN_REVIEW_DISCLAIMER } from "@/lib/share/constants";
import {
  getSharePackageViewData,
  incrementAccessCount,
  type SharePackageViewData,
} from "@/lib/share/shareService";

interface SharePackagePageClientProps {
  token: string;
}

function logOpenedSharePackage(claimId: string, shareToken: string) {
  appendActivity(
    createActivityEntry(
      claimId,
      "opened_share_package",
      `Opened share package ${shareToken}`
    )
  );
}

export function SharePackagePageClient({ token }: SharePackagePageClientProps) {
  const [viewData, setViewData] = useState<SharePackageViewData | null | undefined>(
    undefined
  );

  useEffect(() => {
    const data = getSharePackageViewData(token);
    if (!data) {
      setViewData(null);
      return;
    }

    incrementAccessCount(token);
    logOpenedSharePackage(data.claim.id, token);
    setViewData({
      ...data,
      sharePackage: {
        ...data.sharePackage,
        accessCount: data.sharePackage.accessCount + 1,
      },
    });
  }, [token]);

  if (viewData === undefined) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-slate-100/60">
        <p className="text-[13px] text-slate-500">Loading share package…</p>
      </div>
    );
  }

  if (viewData === null) {
    return (
      <div className="flex min-h-dvh flex-col overflow-y-auto bg-slate-100/60">
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

  const { sharePackage, claimTitle, events, evidence, expired } = viewData;

  return (
    <div className="flex min-h-dvh flex-col overflow-y-auto bg-slate-100/60">
      <header className="border-b border-border bg-card px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          <Link href="/" className="text-[13px] font-medium text-slate-700">
            Chronos Claims
          </Link>
          <Badge
            variant="secondary"
            className="h-5 border border-slate-200 bg-slate-100 text-[11px] font-normal text-slate-600"
          >
            Read-only share view
          </Badge>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl space-y-4 px-6 py-8">
        <div>
          <h1 className="text-lg font-medium tracking-tight text-slate-900">
            {claimTitle}
          </h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Shared investigation package — read-only review
          </p>
        </div>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50 px-4 py-3">
            <CardTitle className="text-[13px] font-medium text-slate-900">
              Package details
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
              {new Date(sharePackage.expiresAt).toLocaleString()}
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

        {expired && (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-[13px] font-medium text-amber-900">
              This package has expired.
            </p>
          </div>
        )}

        <p className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-[12px] leading-snug text-slate-600">
          {HUMAN_REVIEW_DISCLAIMER}
        </p>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50 px-4 py-3">
            <CardTitle className="text-[13px] font-medium text-slate-900">
              Timeline events
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {expired ? (
              <p className="text-[13px] text-muted-foreground">
                Timeline details are unavailable because this package has expired.
              </p>
            ) : events.length === 0 ? (
              <p className="text-[13px] text-muted-foreground">
                No timeline events included in this package.
              </p>
            ) : (
              <ul className="space-y-2">
                {events.map((event) => (
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
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50 px-4 py-3">
            <CardTitle className="text-[13px] font-medium text-slate-900">
              Evidence references
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {expired ? (
              <p className="text-[13px] text-muted-foreground">
                Evidence references are unavailable because this package has
                expired.
              </p>
            ) : evidence.length === 0 ? (
              <p className="text-[13px] text-muted-foreground">
                No evidence files included in this package.
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
      </main>
    </div>
  );
}

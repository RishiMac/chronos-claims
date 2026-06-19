"use client";

import { Calendar, ChevronDown, MapPin, Truck, User } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatClaimDisplayTitle } from "@/lib/claimDisplay";
import type { Claim } from "@/types/claim";

interface HeaderProps {
  claim: Claim;
  claims: Claim[];
  activeClaimId: string;
  onClaimChange: (claimId: string) => void;
  onCreateClaim: () => void;
  onRenameClaim: () => void;
  onDuplicateClaim: () => void;
  onDeleteClaim: () => void;
  onResetDemo: () => void;
  onLoadSampleClaims: () => void;
  onShareClick: () => void;
}

export function Header({
  claim,
  claims,
  activeClaimId,
  onClaimChange,
  onCreateClaim,
  onRenameClaim,
  onDuplicateClaim,
  onDeleteClaim,
  onResetDemo,
  onLoadSampleClaims,
  onShareClick,
}: HeaderProps) {
  const isEmpty = claims.length === 0;

  return (
    <header className="shrink-0 border-b border-border bg-card">
      <div className="flex flex-col gap-3 px-6 py-3.5 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-[13px] font-medium text-slate-700">
              Chronos Claims
            </span>
            <Badge
              variant="secondary"
              className="h-5 border border-slate-200 bg-slate-100 text-[11px] font-normal text-slate-600"
            >
              {claim.status}
            </Badge>
            <div className="relative">
              <label className="sr-only" htmlFor="claim-switcher">
                Select claim
              </label>
              <select
                id="claim-switcher"
                value={activeClaimId}
                onChange={(event) => onClaimChange(event.target.value)}
                disabled={isEmpty}
                className={cn(
                  "h-7 appearance-none rounded-md border border-slate-200 bg-white pl-2.5 pr-7 text-[11px] font-medium text-slate-700",
                  "outline-none transition-colors hover:border-slate-300 focus:border-slate-400 disabled:opacity-50"
                )}
              >
                {claims.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.id} — {item.title}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute top-1/2 right-2 size-3 -translate-y-1/2 text-slate-400" />
            </div>
            <div className="flex flex-wrap items-center gap-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 px-2 text-[11px]"
                onClick={onCreateClaim}
              >
                Create
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 px-2 text-[11px]"
                onClick={onRenameClaim}
                disabled={isEmpty}
              >
                Rename
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 px-2 text-[11px]"
                onClick={onDuplicateClaim}
                disabled={isEmpty}
              >
                Duplicate
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 px-2 text-[11px] text-red-600 hover:text-red-700"
                onClick={onDeleteClaim}
                disabled={isEmpty}
              >
                Delete
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-[11px] text-slate-500"
                onClick={onResetDemo}
              >
                Reset demo
              </Button>
            </div>
          </div>
          {isEmpty ? (
            <div className="rounded-md border border-dashed border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-[13px] text-slate-600">
                No claims in local storage. Create a claim or load sample claims
                to begin.
              </p>
              <div className="mt-2 flex gap-2">
                <Button size="sm" className="h-7 text-[11px]" onClick={onCreateClaim}>
                  Create claim
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-[11px]"
                  onClick={onLoadSampleClaims}
                >
                  Load sample claims
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div>
                <h1 className="text-lg font-medium tracking-tight text-slate-900">
                  {formatClaimDisplayTitle(claim)}
                </h1>
                <p className="mt-0.5 text-[13px] text-slate-500">
                  {claim.scenarioSummary}
                </p>
                <p className="mt-1 text-[13px] leading-snug text-muted-foreground">
                  Synchronized investigation workspace — organizes evidence to
                  support human review
                </p>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-slate-600">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="size-3.5 text-slate-400" />
                  {claim.incidentDateTime}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Truck className="size-3.5 text-slate-400" />
                  {claim.vehicleId}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <User className="size-3.5 text-slate-400" />
                  {claim.driverName}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="size-3.5 text-slate-400" />
                  {claim.location}
                </span>
              </div>
            </>
          )}
        </div>
        <Button
          onClick={onShareClick}
          disabled={isEmpty}
          className="shrink-0 bg-slate-900 text-[13px] text-white hover:bg-slate-800 disabled:opacity-50"
        >
          Generate Shareable Investigation Package
        </Button>
      </div>
    </header>
  );
}

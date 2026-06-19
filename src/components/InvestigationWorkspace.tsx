"use client";

import { useMemo, useState } from "react";

import { EventDetailsCard } from "@/components/EventDetailsCard";
import { EvidenceSidebar } from "@/components/EvidenceSidebar";
import { EvidenceViewerTabs } from "@/components/EvidenceViewerTabs";
import { Header } from "@/components/Header";
import { SharePackageModal } from "@/components/SharePackageModal";
import { TimelinePanel } from "@/components/TimelinePanel";
import { mockClaim } from "@/data/mockClaim";

export function InvestigationWorkspace() {
  const [selectedEventId, setSelectedEventId] = useState(
    mockClaim.timelineEvents[2].id
  );
  const [selectedEvidenceId, setSelectedEvidenceId] = useState<string | null>(
    mockClaim.evidenceFiles[1].id
  );
  const [shareModalOpen, setShareModalOpen] = useState(false);

  const selectedEvent = useMemo(
    () =>
      mockClaim.timelineEvents.find((event) => event.id === selectedEventId) ??
      mockClaim.timelineEvents[0],
    [selectedEventId]
  );

  const linkedEvidence = useMemo(
    () =>
      selectedEvent.linkedEvidenceIds
        .map((id) => mockClaim.evidenceFiles.find((file) => file.id === id))
        .filter((file): file is NonNullable<typeof file> => Boolean(file)),
    [selectedEvent]
  );

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-100/60">
      <Header claim={mockClaim} onShareClick={() => setShareModalOpen(true)} />

      <div className="grid min-h-0 flex-1 xl:grid-cols-[18rem_minmax(0,1fr)_24rem]">
        <EvidenceSidebar
          files={mockClaim.evidenceFiles}
          selectedEvidenceId={selectedEvidenceId}
          onSelectEvidence={setSelectedEvidenceId}
        />

        <main className="min-h-0 overflow-y-auto border-x border-border p-4 lg:p-5">
          <EvidenceViewerTabs
            selectedEvent={selectedEvent}
            speedData={mockClaim.speedData}
            mapRoute={mockClaim.mapRoute}
            mapMarkers={mockClaim.mapMarkers}
          />
        </main>

        <aside className="flex min-h-0 flex-col overflow-hidden border-t border-border bg-white xl:sticky xl:top-0 xl:h-full xl:self-start xl:border-t-0">
          <TimelinePanel
            events={mockClaim.timelineEvents}
            evidenceFiles={mockClaim.evidenceFiles}
            selectedEventId={selectedEventId}
            onSelectEvent={setSelectedEventId}
          />
          <div className="shrink-0 overflow-y-auto border-t border-border p-3">
            <EventDetailsCard
              event={selectedEvent}
              linkedEvidence={linkedEvidence}
            />
          </div>
        </aside>
      </div>

      <SharePackageModal
        open={shareModalOpen}
        onOpenChange={setShareModalOpen}
        shareUrl={mockClaim.shareUrl}
        claimId={mockClaim.id}
      />
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";

import { EvidenceSidebar } from "@/components/EvidenceSidebar";
import { EvidenceViewerTabs } from "@/components/EvidenceViewerTabs";
import { Header } from "@/components/Header";
import { RightInvestigationPanel } from "@/components/RightInvestigationPanel";
import { SharePackageModal } from "@/components/SharePackageModal";
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
    <div className="flex h-dvh flex-col overflow-hidden bg-slate-100/60">
      <Header claim={mockClaim} onShareClick={() => setShareModalOpen(true)} />

      <div className="grid min-h-0 flex-1 overflow-hidden xl:grid-cols-[18rem_minmax(0,1fr)_24rem]">
        <EvidenceSidebar
          files={mockClaim.evidenceFiles}
          selectedEvidenceId={selectedEvidenceId}
          onSelectEvidence={setSelectedEvidenceId}
        />

        <main className="min-h-0 overflow-y-auto border-x border-border">
          <EvidenceViewerTabs
            selectedEvent={selectedEvent}
            speedData={mockClaim.speedData}
            mapRoute={mockClaim.mapRoute}
            mapMarkers={mockClaim.mapMarkers}
          />
        </main>

        <RightInvestigationPanel
          events={mockClaim.timelineEvents}
          evidenceFiles={mockClaim.evidenceFiles}
          selectedEventId={selectedEventId}
          selectedEvent={selectedEvent}
          linkedEvidence={linkedEvidence}
          onSelectEvent={setSelectedEventId}
        />
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

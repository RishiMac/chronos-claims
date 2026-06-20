import type { Claim, EvidenceFile } from "@/types/claim";

export const REAL_DEMO_CLAIM_ID = "CC-REAL-001";
export const REAL_DEMO_EVIDENCE_PATH = "/demo-claims/claim-001-rear-end";
export const REAL_DEMO_VIDEO_EVIDENCE_ID = "ev-real-dashcam";

/** Nexar reference clip metadata (video id 00948). */
export const REAL_DEMO_VIDEO_DURATION_SECONDS = 40;
export const REAL_DEMO_VIDEO_ALERT_SECONDS = 19.219;
export const REAL_DEMO_VIDEO_COLLISION_SECONDS = 20.287;
export const REAL_DEMO_VIDEO_TRAVEL_SECONDS = 10;
export const REAL_DEMO_VIDEO_HARD_BRAKE_SECONDS = 18.5;
export const REAL_DEMO_VIDEO_STOP_SECONDS = 22;

function demoUrl(relativePath: string): string {
  return `${REAL_DEMO_EVIDENCE_PATH}/${relativePath}`;
}

export function buildRealDemoEvidenceFiles(): EvidenceFile[] {
  const demoNote =
    "Public demo/sample evidence bundle for human review. Not sourced from a live production feed.";

  return [
    {
      id: REAL_DEMO_VIDEO_EVIDENCE_ID,
      name: "dashcam_front.mp4",
      fileType: "video",
      status: "Processed",
      isSampleFile: true,
      metadata: {
        uploadedAt: "Demo claim bundle · Mar 14, 2026",
        fileSize: "32.5 MB",
        source: "Fleet dashcam — front camera (demo clip 00948)",
        description:
          "Dashcam reference synchronized to the documented alert and impact window for human review.",
        duration: "00:00:40",
        publicUrl: demoUrl("video/dashcam_front.mp4"),
        warnings: [demoNote],
      },
    },
    {
      id: "ev-real-telematics",
      name: "samsara_telematics.csv",
      fileType: "csv",
      status: "Processed",
      isSampleFile: true,
      metadata: {
        uploadedAt: "Demo claim bundle · Mar 14, 2026",
        fileSize: "1.4 KB",
        source: "Samsara fleet telematics export",
        description:
          "Uploaded telemetry with speed, GPS, harsh-brake flags, and heading readings for review.",
        publicUrl: demoUrl("telematics/samsara_telematics.csv"),
        recordCount: 24,
        warnings: [demoNote],
      },
    },
    {
      id: "ev-real-cr3",
      name: "texas_cr3_report.pdf",
      fileType: "pdf",
      status: "Processed",
      isSampleFile: true,
      metadata: {
        uploadedAt: "Demo claim bundle · Mar 14, 2026",
        fileSize: "73 KB",
        source: "Texas CR-3 crash report template",
        description:
          "Report template documenting incident circumstances for investigator review.",
        publicUrl: demoUrl("reports/texas_cr3_report.pdf"),
        warnings: [demoNote],
      },
    },
    {
      id: "ev-real-statements",
      name: "witness_statements.pdf",
      fileType: "pdf",
      status: "Processed",
      isSampleFile: true,
      metadata: {
        uploadedAt: "Demo claim bundle · Mar 14, 2026",
        fileSize: "1.1 MB",
        source: "Witness and driver statement packet",
        description:
          "Collected statements describing observed sequence; supports human review with noted uncertainty.",
        publicUrl: demoUrl("statements/witness_statements.pdf"),
        warnings: [demoNote],
      },
    },
    {
      id: "ev-real-photo",
      name: "rear_damage.jpg",
      fileType: "image",
      status: "Processed",
      isSampleFile: true,
      metadata: {
        uploadedAt: "Demo claim bundle · Mar 14, 2026",
        fileSize: "17 KB",
        source: "Field damage photography",
        description:
          "Documented rear damage photograph for visual review alongside other evidence.",
        publicUrl: demoUrl("photos/rear_damage.jpg"),
        warnings: [demoNote],
      },
    },
    {
      id: "ev-real-tow",
      name: "tow_invoice.pdf",
      fileType: "pdf",
      status: "Processed",
      isSampleFile: true,
      metadata: {
        uploadedAt: "Demo claim bundle · Mar 14, 2026",
        fileSize: "155 KB",
        source: "Tow service invoice",
        description:
          "Tow invoice listing vehicle identification and service timing for review.",
        publicUrl: demoUrl("financial/tow_invoice.pdf"),
        warnings: [demoNote],
      },
    },
    {
      id: "ev-real-repair",
      name: "repair_estimate.pdf",
      fileType: "pdf",
      status: "Processed",
      isSampleFile: true,
      metadata: {
        uploadedAt: "Demo claim bundle · Mar 14, 2026",
        fileSize: "2.9 MB",
        source: "Collision repair estimate",
        description:
          "Repair estimate documenting observed damage scope for financial review.",
        publicUrl: demoUrl("financial/repair_estimate.pdf"),
        warnings: [demoNote],
      },
    },
    {
      id: "ev-real-weather",
      name: "noaa_weather.csv",
      fileType: "csv",
      status: "Processed",
      isSampleFile: true,
      metadata: {
        uploadedAt: "Demo claim bundle · Mar 14, 2026",
        fileSize: "8.2 MB",
        source: "NOAA weather station export",
        description:
          "Weather observations near the incident window to support environmental context review.",
        publicUrl: demoUrl("weather/noaa_weather.csv"),
        warnings: [demoNote],
      },
    },
    {
      id: "ev-real-nhtsa",
      name: "nhtsa_heavy_truck_context.pdf",
      fileType: "pdf",
      status: "Processed",
      isSampleFile: true,
      metadata: {
        uploadedAt: "Demo claim bundle · Mar 14, 2026",
        fileSize: "624 KB",
        source: "NHTSA heavy-truck context reference",
        description:
          "Statistical context document for commercial vehicle incidents; supports review framing only.",
        publicUrl: demoUrl("statistics/nhtsa_heavy_truck_context.pdf"),
        warnings: [demoNote],
      },
    },
  ];
}

export const realDemoClaim: Claim = {
  id: REAL_DEMO_CLAIM_ID,
  shortLabel: "Rear-End Investigation",
  title: "Rear-End Collision Investigation",
  status: "Needs Review",
  incidentDateTime: "March 14, 2026 · 6:41 PM",
  vehicleId: "Box Truck / Commercial Vehicle",
  driverName: "Demo Fleet Operator",
  location: "Urban arterial / highway approach",
  scenarioSummary:
    "Commercial vehicle approaches slowing traffic and a rear-end impact occurs. Telematics, video, report templates, statements, damage photos, weather, and financial documents are linked for human review.",
  shareUrl: "https://chronosclaims.app/share/CC-REAL-001",
  sampleEvidencePath: REAL_DEMO_EVIDENCE_PATH,
  defaultSelectedEventId: "evt-real-collision",
  defaultSelectedEvidenceId: "ev-real-telematics",
  mapRouteLabel: "Urban arterial approach — schematic route",
  evidenceFiles: buildRealDemoEvidenceFiles(),
  timelineEvents: [
    {
      id: "evt-real-travel",
      timestamp: "6:41:00 PM",
      title: "Vehicle traveling normally",
      description:
        "Uploaded telemetry indicates steady travel near 36–40 mph prior to the slowing sequence, with peak recorded speed near 40 mph.",
      confidence: "High",
      severity: "info",
      linkedEvidenceIds: [REAL_DEMO_VIDEO_EVIDENCE_ID, "ev-real-telematics"],
      notes: "Dashcam and telematics references support review of pre-event travel.",
      markerId: "travel",
      videoProgress: 25,
      videoOffsetSeconds: REAL_DEMO_VIDEO_TRAVEL_SECONDS,
    },
    {
      id: "evt-real-brake",
      timestamp: "6:41:12 PM",
      title: "Hard braking observed",
      description:
        "Telemetry indicates harsh-brake flags and a speed decrease from 40 mph to 30 mph within approximately two seconds.",
      confidence: "High",
      severity: "moderate",
      linkedEvidenceIds: ["ev-real-telematics"],
      notes: "Samsara export rows show harsh_brake=true beginning at 6:41:12 PM.",
      markerId: "brake",
      videoProgress: 46,
      videoOffsetSeconds: REAL_DEMO_VIDEO_HARD_BRAKE_SECONDS,
    },
    {
      id: "evt-real-alert",
      timestamp: "6:41:19 PM",
      title: "Forward hazard / alert window begins",
      description:
        "Dashcam reference indicates an alert window beginning at 19.219 seconds into the clip.",
      confidence: "High",
      severity: "moderate",
      linkedEvidenceIds: [REAL_DEMO_VIDEO_EVIDENCE_ID],
      notes: "Alert timing documented from demo clip metadata (video id 00948).",
      markerId: "alert",
      videoProgress: 48,
      videoOffsetSeconds: REAL_DEMO_VIDEO_ALERT_SECONDS,
    },
    {
      id: "evt-real-collision",
      timestamp: "6:41:20 PM",
      title: "Rear-end collision event",
      description:
        "Dashcam reference and crash report template document an impact sequence at 20.287 seconds into the clip.",
      confidence: "Medium",
      severity: "critical",
      linkedEvidenceIds: [REAL_DEMO_VIDEO_EVIDENCE_ID, "ev-real-cr3"],
      notes: "Impact timing documented from demo clip metadata; report template available for review.",
      markerId: "collision",
      videoProgress: 51,
      videoOffsetSeconds: REAL_DEMO_VIDEO_COLLISION_SECONDS,
    },
    {
      id: "evt-real-stop",
      timestamp: "6:41:21 PM",
      title: "Vehicle slows and stops",
      description:
        "Telemetry indicates speed reaching 0 mph with continued harsh-brake flags through the stop sequence.",
      confidence: "High",
      severity: "info",
      linkedEvidenceIds: ["ev-real-telematics", REAL_DEMO_VIDEO_EVIDENCE_ID],
      notes: "Final telematics rows document near-zero speed at scene coordinates.",
      markerId: "stop",
      videoProgress: 55,
      videoOffsetSeconds: REAL_DEMO_VIDEO_STOP_SECONDS,
    },
    {
      id: "evt-real-damage",
      timestamp: "Post-incident",
      sectionDividerLabel: "Post-Incident Documentation",
      title: "Damage documented",
      description:
        "Rear damage photograph available for visual review alongside other evidence references.",
      confidence: "High",
      severity: "info",
      linkedEvidenceIds: ["ev-real-photo"],
      notes: "Photo supports documentation review; does not establish liability.",
      markerId: "damage",
      videoProgress: 100,
      videoOffsetSeconds: REAL_DEMO_VIDEO_DURATION_SECONDS,
    },
    {
      id: "evt-real-financial",
      timestamp: "Post-incident",
      title: "Tow and repair documentation available",
      description:
        "Tow invoice and repair estimate are linked for financial and logistics review.",
      confidence: "High",
      severity: "info",
      linkedEvidenceIds: ["ev-real-tow", "ev-real-repair"],
      notes: "Documents support review of service timing and repair scope.",
      markerId: "financial",
      videoProgress: 100,
      videoOffsetSeconds: REAL_DEMO_VIDEO_DURATION_SECONDS,
    },
    {
      id: "evt-real-weather",
      timestamp: "Incident window",
      title: "Weather context available",
      description:
        "NOAA weather export provides environmental observations for the incident window review.",
      confidence: "Medium",
      severity: "info",
      linkedEvidenceIds: ["ev-real-weather"],
      notes: "Weather data supports context review alongside telematics and video.",
      markerId: "weather",
      videoProgress: 100,
      videoOffsetSeconds: REAL_DEMO_VIDEO_DURATION_SECONDS,
    },
  ],
  speedData: [
    { time: "6:41:00", speed: 36, markerId: "travel" },
    { time: "6:41:04", speed: 36 },
    { time: "6:41:08", speed: 36 },
    { time: "6:41:10", speed: 40 },
    { time: "6:41:12", speed: 30, markerId: "brake", label: "Hard brake" },
    { time: "6:41:14", speed: 20 },
    { time: "6:41:16", speed: 10 },
    { time: "6:41:18", speed: 6 },
    { time: "6:41:20", speed: 2, markerId: "collision", label: "Impact window" },
    { time: "6:41:21", speed: 0, markerId: "stop", label: "Stopped" },
  ],
  mapRoute: [
    { x: 12, y: 78 },
    { x: 24, y: 70 },
    { x: 36, y: 62 },
    { x: 48, y: 54 },
    { x: 58, y: 48 },
    { x: 66, y: 44 },
    { x: 72, y: 42 },
    { x: 78, y: 40 },
    { x: 84, y: 38 },
  ],
  mapMarkers: [
    { id: "travel", label: "Travel", x: 12, y: 78 },
    { id: "brake", label: "Hard brake", x: 58, y: 48, severity: "moderate" },
    {
      id: "collision",
      label: "Impact window",
      x: 78,
      y: 40,
      severity: "critical",
    },
    { id: "stop", label: "Stop", x: 84, y: 38 },
  ],
  sampleObservations: [
    {
      id: "obs-real-1",
      content:
        "Initial review: telematics harsh-brake flags align with dashcam alert window timing for human follow-up.",
      createdAt: "Mar 14, 2026 · 8:15 PM",
    },
    {
      id: "obs-real-2",
      content:
        "Texas CR-3 template and witness statement packet linked; review sequencing against telemetry timestamps.",
      createdAt: "Mar 15, 2026 · 9:30 AM",
    },
  ],
};

import type { Claim, EvidenceFile } from "@/types/claim";
import { realDemoClaim } from "@/data/realDemoClaim";

export const canonicalSampleEvidenceSourceId = "CC-2026-001";

export function buildSampleEvidenceFiles(
  sourceClaimId: string = canonicalSampleEvidenceSourceId
): EvidenceFile[] {
  return buildEvidenceFiles(sourceClaimId);
}

export function getCanonicalSampleEvidencePath(): string {
  return `/sample-evidence/${canonicalSampleEvidenceSourceId}`;
}

function buildEvidenceFiles(claimId: string): EvidenceFile[] {
  const files: EvidenceFile[] = [
    {
      id: "ev-police",
      name: "police_report.txt",
      fileType: "text",
      status: "Processed",
      isSampleFile: true,
      metadata: {
        uploadedAt: "Sample evidence bundle",
        fileSize: "3.2 KB",
        source: "Law enforcement report (summary)",
        description:
          "Report-style narrative with date, location, vehicles, and road conditions for human review.",
        publicUrl: `/sample-evidence/${claimId}/police_report.txt`,
      },
    },
    {
      id: "ev-dashcam",
      name: "dashcam_front.mp4",
      fileType: "video",
      status: "Processed",
      isSampleFile: true,
      metadata: {
        uploadedAt: "Sample evidence bundle",
        fileSize: "248 MB",
        source: "Fleet dashcam — front camera",
        description:
          "Dashcam reference synchronized to incident window. Demo uses preview mode when no MP4 is present.",
        duration: "00:03:42",
      },
    },
    {
      id: "ev-telematics",
      name: "telematics.csv",
      fileType: "csv",
      status: "Processed",
      isSampleFile: true,
      metadata: {
        uploadedAt: "Sample evidence bundle",
        fileSize: "12 KB",
        source: "Fleet telematics platform",
        description:
          "Uploaded telemetry export with speed, GPS, braking, and acceleration readings.",
        publicUrl: `/sample-evidence/${claimId}/telematics.csv`,
      },
    },
    {
      id: "ev-driver",
      name: "driver_statement.txt",
      fileType: "text",
      status: "Processed",
      isSampleFile: true,
      metadata: {
        uploadedAt: "Sample evidence bundle",
        fileSize: "2.1 KB",
        source: "Driver interview transcript",
        description:
          "Driver statement describing perceived sequence; reported in statement for review.",
        publicUrl: `/sample-evidence/${claimId}/driver_statement.txt`,
      },
    },
    {
      id: "ev-witness",
      name: "witness_statement.txt",
      fileType: "text",
      status: "Processed",
      isSampleFile: true,
      metadata: {
        uploadedAt: "Sample evidence bundle",
        fileSize: "1.4 KB",
        source: "Witness interview transcript",
        description:
          "Witness statement with approximate timing; supports review with uncertainty noted.",
        publicUrl: `/sample-evidence/${claimId}/witness_statement.txt`,
      },
    },
    {
      id: "ev-weather",
      name: "weather_report.txt",
      fileType: "text",
      status: "Processed",
      isSampleFile: true,
      metadata: {
        uploadedAt: "Sample evidence bundle",
        fileSize: "0.9 KB",
        source: "Weather service summary",
        description:
          "Visibility, precipitation, and road surface conditions during incident window.",
        publicUrl: `/sample-evidence/${claimId}/weather_report.txt`,
      },
    },
    {
      id: "ev-tow",
      name: "tow_receipt.txt",
      fileType: "text",
      status: "Processed",
      isSampleFile: true,
      metadata: {
        uploadedAt: "Sample evidence bundle",
        fileSize: "0.8 KB",
        source: "Tow service receipt",
        description:
          "Tow receipt listing vehicle ID, service provider, and service time.",
        publicUrl: `/sample-evidence/${claimId}/tow_receipt.txt`,
      },
    },
    {
      id: "ev-photo-1",
      name: "scene_photo_1.svg",
      fileType: "image",
      status: "Processed",
      isSampleFile: true,
      metadata: {
        uploadedAt: "Sample evidence bundle",
        fileSize: "4 KB",
        source: "Field scene photography",
        description: "Scene photo reference — diagram 1 for visual review.",
        publicUrl: `/sample-evidence/${claimId}/scene_photo_1.svg`,
        imageWidth: 640,
        imageHeight: 420,
      },
    },
    {
      id: "ev-photo-2",
      name: "scene_photo_2.svg",
      fileType: "image",
      status: "Processed",
      isSampleFile: true,
      metadata: {
        uploadedAt: "Sample evidence bundle",
        fileSize: "4 KB",
        source: "Field scene photography",
        description: "Scene photo reference — diagram 2 for visual review.",
        publicUrl: `/sample-evidence/${claimId}/scene_photo_2.svg`,
        imageWidth: 640,
        imageHeight: 420,
      },
    },
  ];

  return files;
}

export const sampleClaims: Claim[] = [
  realDemoClaim,
  {
    id: "CC-2026-001",
    shortLabel: "Rear-End Collision",
    title: "Rear-End Collision",
    status: "Evidence Review",
    incidentDateTime: "March 14, 2026 · 2:41 PM",
    vehicleId: "Unit FL-4472",
    driverName: "James Porter",
    location: "Market St & 5th Ave, Tampa, FL",
    scenarioSummary:
      "Commercial box truck brakes near an intersection and is struck from behind by a passenger vehicle.",
    shareUrl: "https://chronosclaims.app/share/CC-2026-001",
    sampleEvidencePath: "/sample-evidence/CC-2026-001",
    defaultSelectedEventId: "evt-braking",
    defaultSelectedEvidenceId: "ev-telematics",
    mapRouteLabel: "Market St & 5th Ave — schematic route",
    evidenceFiles: buildEvidenceFiles("CC-2026-001"),
    timelineEvents: [
      {
        id: "evt-traveling",
        timestamp: "2:41:08 PM",
        title: "Steady travel speed recorded",
        description:
          "Uploaded telemetry indicates travel near 38–42 mph prior to intersection approach.",
        confidence: "High",
        severity: "info",
        linkedEvidenceIds: ["ev-telematics", "ev-dashcam"],
        notes: "Speed readings support review against dashcam reference.",
        markerId: "start",
        videoProgress: 15,
        videoOffsetSeconds: 3,
      },
      {
        id: "evt-braking",
        timestamp: "2:41:14 PM",
        title: "Braking sequence detected",
        description:
          "Telemetry indicates a speed decrease from 42 mph to 18 mph over approximately 4 seconds.",
        confidence: "High",
        severity: "moderate",
        linkedEvidenceIds: ["ev-telematics", "ev-dashcam", "ev-driver"],
        notes: "Driver statement reports sudden braking near the intersection.",
        markerId: "braking",
        videoProgress: 52,
        videoOffsetSeconds: 10,
      },
      {
        id: "evt-contact",
        timestamp: "2:41:18 PM",
        title: "Rear contact reported",
        description:
          "Telematics and police report narrative note a stop in motion consistent with rear contact.",
        confidence: "Medium",
        severity: "critical",
        linkedEvidenceIds: ["ev-telematics", "ev-police", "ev-witness"],
        notes: "Witness statement reports observing brake lights shortly before contact.",
        markerId: "contact",
        videoProgress: 72,
        videoOffsetSeconds: 14,
      },
      {
        id: "evt-stopped",
        timestamp: "2:41:22 PM",
        title: "Vehicle stopped",
        description:
          "Uploaded telemetry shows near-zero speed at scene coordinates.",
        confidence: "High",
        severity: "info",
        linkedEvidenceIds: ["ev-telematics", "ev-dashcam"],
        notes: "Police report narrative notes wet pavement at scene.",
        markerId: "stop",
        videoProgress: 90,
        videoOffsetSeconds: 18,
      },
    ],
    speedData: [
      { time: "2:41:08", speed: 38, markerId: "start" },
      { time: "2:41:10", speed: 40 },
      { time: "2:41:12", speed: 42 },
      { time: "2:41:14", speed: 36, markerId: "braking", label: "Braking" },
      { time: "2:41:16", speed: 24 },
      { time: "2:41:18", speed: 8, markerId: "contact", label: "Contact" },
      { time: "2:41:20", speed: 2 },
      { time: "2:41:22", speed: 0, markerId: "stop", label: "Stopped" },
    ],
    mapRoute: [
      { x: 14, y: 76 },
      { x: 26, y: 68 },
      { x: 40, y: 58 },
      { x: 54, y: 50 },
      { x: 66, y: 44 },
      { x: 74, y: 48 },
      { x: 80, y: 56 },
    ],
    mapMarkers: [
      { id: "start", label: "Travel", x: 14, y: 76 },
      { id: "braking", label: "Braking", x: 66, y: 44, severity: "moderate" },
      { id: "contact", label: "Contact", x: 74, y: 48, severity: "critical" },
      { id: "stop", label: "Stop", x: 80, y: 56 },
    ],
    sampleObservations: [
      {
        id: "obs-001-1",
        content:
          "Initial review: telemetry braking pattern aligns with driver statement timing window.",
        createdAt: "Mar 14, 2026 · 5:10 PM",
      },
      {
        id: "obs-001-2",
        content:
          "Weather report supports wet pavement note in police report narrative.",
        createdAt: "Mar 15, 2026 · 9:00 AM",
      },
    ],
  },
  {
    id: "CC-2026-002",
    shortLabel: "Side-Impact Intersection",
    title: "Side-Impact Intersection Collision",
    status: "Evidence Review",
    incidentDateTime: "April 2, 2026 · 9:18 AM",
    vehicleId: "Unit UT-2188",
    driverName: "Marcus Chen",
    location: "Oak Ridge Blvd & Elm St, Orlando, FL",
    scenarioSummary:
      "Utility vehicle enters an intersection and is struck on the passenger side.",
    shareUrl: "https://chronosclaims.app/share/CC-2026-002",
    sampleEvidencePath: "/sample-evidence/CC-2026-002",
    defaultSelectedEventId: "evt-intersection",
    defaultSelectedEvidenceId: "ev-telematics",
    mapRouteLabel: "Oak Ridge Blvd & Elm St — schematic route",
    evidenceFiles: buildEvidenceFiles("CC-2026-002"),
    timelineEvents: [
      {
        id: "evt-approach",
        timestamp: "9:18:04 AM",
        title: "Moderate speed through approach",
        description:
          "Telemetry indicates 28–32 mph on approach to intersection.",
        confidence: "High",
        severity: "info",
        linkedEvidenceIds: ["ev-telematics"],
        notes: "Supports review of approach speed before crossing.",
        markerId: "approach",
        videoProgress: 20,
        videoOffsetSeconds: 4,
      },
      {
        id: "evt-intersection",
        timestamp: "9:18:10 AM",
        title: "Intersection entry recorded",
        description:
          "GPS trace places unit within intersection boundary during crossing phase.",
        confidence: "High",
        severity: "info",
        linkedEvidenceIds: ["ev-telematics", "ev-dashcam", "ev-witness"],
        notes: "Witness statement reports vehicle entering intersection at moderate speed.",
        markerId: "intersection",
        videoProgress: 45,
        videoOffsetSeconds: 10,
      },
      {
        id: "evt-deceleration",
        timestamp: "9:18:12 AM",
        title: "Sharp deceleration at impact",
        description:
          "Telemetry indicates speed decrease from 32 mph to 8 mph over approximately 2 seconds.",
        confidence: "High",
        severity: "critical",
        linkedEvidenceIds: ["ev-telematics", "ev-driver", "ev-police"],
        notes: "Driver statement reports passenger-side contact during crossing.",
        markerId: "impact",
        videoProgress: 68,
        videoOffsetSeconds: 12,
      },
      {
        id: "evt-stopped",
        timestamp: "9:18:16 AM",
        title: "Vehicle stopped",
        description: "Uploaded telemetry shows near-zero speed after deceleration.",
        confidence: "High",
        severity: "info",
        linkedEvidenceIds: ["ev-telematics"],
        notes: "Requires human review of intersection signal timing references.",
        markerId: "stop",
        videoProgress: 88,
        videoOffsetSeconds: 16,
      },
    ],
    speedData: [
      { time: "9:18:04", speed: 28, markerId: "approach" },
      { time: "9:18:06", speed: 30 },
      { time: "9:18:08", speed: 32 },
      { time: "9:18:10", speed: 30, markerId: "intersection" },
      { time: "9:18:12", speed: 12, markerId: "impact", label: "Deceleration" },
      { time: "9:18:14", speed: 4 },
      { time: "9:18:16", speed: 0, markerId: "stop", label: "Stopped" },
    ],
    mapRoute: [
      { x: 18, y: 70 },
      { x: 32, y: 58 },
      { x: 48, y: 46 },
      { x: 58, y: 42 },
      { x: 68, y: 44 },
      { x: 76, y: 52 },
    ],
    mapMarkers: [
      { id: "approach", label: "Approach", x: 18, y: 70 },
      { id: "intersection", label: "Intersection", x: 58, y: 42 },
      { id: "impact", label: "Deceleration", x: 68, y: 44, severity: "critical" },
      { id: "stop", label: "Stop", x: 76, y: 52 },
    ],
    sampleObservations: [
      {
        id: "obs-002-1",
        content:
          "Cross-reference witness timing with telemetry intersection entry row.",
        createdAt: "Apr 2, 2026 · 11:30 AM",
      },
    ],
  },
  {
    id: "CC-2026-003",
    shortLabel: "Hard Braking Near Intersection",
    title: "Hard Braking Near Intersection",
    status: "Evidence Review",
    incidentDateTime: "April 18, 2026 · 4:52 PM",
    vehicleId: "Unit DV-9031",
    driverName: "Alicia Gomez",
    location: "I-275 Northbound Exit 24, St. Petersburg, FL",
    scenarioSummary:
      "Delivery van brakes hard to avoid a vehicle cutting across lanes.",
    shareUrl: "https://chronosclaims.app/share/CC-2026-003",
    sampleEvidencePath: "/sample-evidence/CC-2026-003",
    defaultSelectedEventId: "evt-hard-brake",
    defaultSelectedEvidenceId: "ev-telematics",
    mapRouteLabel: "I-275 NB Exit 24 — schematic route",
    evidenceFiles: buildEvidenceFiles("CC-2026-003"),
    timelineEvents: [
      {
        id: "evt-high-speed",
        timestamp: "4:52:02 PM",
        title: "Higher travel speed recorded",
        description: "Telemetry indicates travel near 48–52 mph before merge area.",
        confidence: "High",
        severity: "info",
        linkedEvidenceIds: ["ev-telematics"],
        notes: "Supports review of pre-event speed profile.",
        markerId: "high-speed",
        videoProgress: 18,
        videoOffsetSeconds: 3,
      },
      {
        id: "evt-hard-brake",
        timestamp: "4:52:08 PM",
        title: "Hard braking detected",
        description:
          "Telemetry indicates a speed decrease from 52 mph to 12 mph over approximately 2 seconds.",
        confidence: "High",
        severity: "moderate",
        linkedEvidenceIds: ["ev-telematics", "ev-driver", "ev-witness"],
        notes: "Driver statement reports hard braking to increase following distance.",
        markerId: "hard-brake",
        videoProgress: 50,
        videoOffsetSeconds: 8,
      },
      {
        id: "evt-recovery",
        timestamp: "4:52:12 PM",
        title: "Partial speed recovery",
        description:
          "Telemetry shows brief speed recovery to approximately 18 mph before secondary deceleration.",
        confidence: "Medium",
        severity: "info",
        linkedEvidenceIds: ["ev-telematics"],
        notes: "Requires human review — no full stop before secondary slowdown.",
        markerId: "recovery",
        videoProgress: 65,
        videoOffsetSeconds: 12,
      },
      {
        id: "evt-near-stop",
        timestamp: "4:52:18 PM",
        title: "Near-stop recorded",
        description:
          "Telemetry indicates speed near 2 mph; witness reports contact after braking sequence.",
        confidence: "Medium",
        severity: "moderate",
        linkedEvidenceIds: ["ev-telematics", "ev-witness", "ev-police"],
        notes: "Police report narrative notes wet pavement in merge area.",
        markerId: "near-stop",
        videoProgress: 85,
        videoOffsetSeconds: 18,
      },
    ],
    speedData: [
      { time: "4:52:02", speed: 48, markerId: "high-speed" },
      { time: "4:52:04", speed: 50 },
      { time: "4:52:06", speed: 52 },
      { time: "4:52:08", speed: 22, markerId: "hard-brake", label: "Hard brake" },
      { time: "4:52:10", speed: 12 },
      { time: "4:52:12", speed: 18, markerId: "recovery", label: "Recovery" },
      { time: "4:52:16", speed: 8 },
      { time: "4:52:18", speed: 2, markerId: "near-stop", label: "Near-stop" },
    ],
    mapRoute: [
      { x: 10, y: 72 },
      { x: 24, y: 62 },
      { x: 38, y: 52 },
      { x: 52, y: 46 },
      { x: 64, y: 44 },
      { x: 72, y: 48 },
      { x: 78, y: 54 },
    ],
    mapMarkers: [
      { id: "high-speed", label: "High speed", x: 10, y: 72 },
      { id: "hard-brake", label: "Hard brake", x: 52, y: 46, severity: "moderate" },
      { id: "recovery", label: "Recovery", x: 64, y: 44 },
      { id: "near-stop", label: "Near-stop", x: 78, y: 54, severity: "moderate" },
    ],
    sampleObservations: [
      {
        id: "obs-003-1",
        content:
          "Review merge-area telemetry against witness brake-light observation.",
        createdAt: "Apr 18, 2026 · 6:15 PM",
      },
    ],
  },
  {
    id: "CC-2026-004",
    shortLabel: "Parking Lot Low-Speed",
    title: "Parking Lot Low-Speed Incident",
    status: "Evidence Review",
    incidentDateTime: "May 6, 2026 · 11:07 AM",
    vehicleId: "Unit MN-1045",
    driverName: "Robert Ellis",
    location: "City Hall Parking Lot, Jacksonville, FL",
    scenarioSummary:
      "Municipal vehicle reverses in a parking lot and contacts a parked vehicle.",
    shareUrl: "https://chronosclaims.app/share/CC-2026-004",
    sampleEvidencePath: "/sample-evidence/CC-2026-004",
    defaultSelectedEventId: "evt-reverse",
    defaultSelectedEvidenceId: "ev-telematics",
    mapRouteLabel: "City Hall Parking Lot — schematic route",
    evidenceFiles: buildEvidenceFiles("CC-2026-004"),
    timelineEvents: [
      {
        id: "evt-low-speed",
        timestamp: "11:07:02 AM",
        title: "Low-speed maneuver recorded",
        description: "Telemetry indicates travel under 6 mph in parking aisle.",
        confidence: "High",
        severity: "info",
        linkedEvidenceIds: ["ev-telematics"],
        notes: "Supports review of parking lot maneuver profile.",
        markerId: "low-speed",
        videoProgress: 20,
        videoOffsetSeconds: 2,
      },
      {
        id: "evt-reverse",
        timestamp: "11:07:10 AM",
        title: "Reverse movement detected",
        description:
          "Heading changes and low-speed reverse pattern recorded in uploaded telemetry.",
        confidence: "High",
        severity: "info",
        linkedEvidenceIds: ["ev-telematics", "ev-driver"],
        notes: "Driver statement reports reversing to reposition in aisle.",
        markerId: "reverse",
        videoProgress: 48,
        videoOffsetSeconds: 10,
      },
      {
        id: "evt-contact",
        timestamp: "11:07:14 AM",
        title: "Low-speed contact reported",
        description:
          "Near-zero speed event recorded; witness reports light contact with parked vehicle.",
        confidence: "Medium",
        severity: "moderate",
        linkedEvidenceIds: ["ev-telematics", "ev-witness", "ev-police"],
        notes: "Police report narrative documents low-speed parking lot contact.",
        markerId: "contact",
        videoProgress: 72,
        videoOffsetSeconds: 14,
      },
      {
        id: "evt-stopped",
        timestamp: "11:07:18 AM",
        title: "Vehicle stopped",
        description: "Telemetry shows zero speed after contact event.",
        confidence: "High",
        severity: "info",
        linkedEvidenceIds: ["ev-telematics"],
        notes: "Tow receipt notes no tow required for this incident.",
        markerId: "stop",
        videoProgress: 90,
        videoOffsetSeconds: 18,
      },
    ],
    speedData: [
      { time: "11:07:02", speed: 5, markerId: "low-speed" },
      { time: "11:07:06", speed: 4 },
      { time: "11:07:10", speed: 3, markerId: "reverse", label: "Reverse" },
      { time: "11:07:12", speed: 2 },
      { time: "11:07:14", speed: 1, markerId: "contact", label: "Contact" },
      { time: "11:07:18", speed: 0, markerId: "stop", label: "Stopped" },
    ],
    mapRoute: [
      { x: 30, y: 60 },
      { x: 38, y: 58 },
      { x: 46, y: 56 },
      { x: 52, y: 54 },
      { x: 56, y: 52 },
      { x: 58, y: 50 },
    ],
    mapMarkers: [
      { id: "low-speed", label: "Low speed", x: 30, y: 60 },
      { id: "reverse", label: "Reverse", x: 46, y: 56 },
      { id: "contact", label: "Contact", x: 56, y: 52, severity: "moderate" },
      { id: "stop", label: "Stop", x: 58, y: 50 },
    ],
    sampleObservations: [
      {
        id: "obs-004-1",
        content:
          "Parking lot scene photos support visual review of aisle geometry.",
        createdAt: "May 6, 2026 · 12:00 PM",
      },
    ],
  },
];

export const defaultClaimId = "CC-2026-001";

export function getClaimById(claimId: string): Claim {
  return (
    sampleClaims.find((claim) => claim.id === claimId) ?? sampleClaims[0]
  );
}

export function getDefaultClaim(): Claim {
  return getClaimById(defaultClaimId);
}

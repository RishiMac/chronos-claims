import type { Claim } from "@/types/claim";

export const mockClaim: Claim = {
  id: "CC-2026-001",
  title: "Claim #CC-2026-001 — Commercial Vehicle Collision",
  status: "Evidence Review",
  incidentDateTime: "March 14, 2026 · 2:41 PM",
  vehicleId: "Unit FL-4472",
  location: "Intersection of Market St & 5th Ave, Tampa, FL",
  shareUrl: "https://chronosclaims.app/share/CC-2026-001",
  evidenceFiles: [
    {
      id: "ev-police",
      name: "police_report.pdf",
      fileType: "pdf",
      status: "Processed",
      metadata: {
        uploadedAt: "Mar 14, 2026 · 4:12 PM",
        fileSize: "1.2 MB",
        source: "Tampa Police Department",
        description:
          "Official incident report documenting scene observations, involved parties, and responding officer notes.",
      },
    },
    {
      id: "ev-dashcam",
      name: "dashcam_front.mp4",
      fileType: "video",
      status: "Processed",
      metadata: {
        uploadedAt: "Mar 14, 2026 · 3:05 PM",
        fileSize: "248 MB",
        source: "Fleet dashcam — front camera",
        description:
          "Forward-facing dashcam recording synchronized to incident window.",
        duration: "00:03:42",
      },
    },
    {
      id: "ev-telematics",
      name: "telematics_export.csv",
      fileType: "csv",
      status: "Processed",
      metadata: {
        uploadedAt: "Mar 14, 2026 · 3:18 PM",
        fileSize: "84 KB",
        source: "Fleet telematics platform",
        description:
          "Speed, braking, and acceleration readings at one-second intervals.",
        recordCount: 224,
      },
    },
    {
      id: "ev-gps",
      name: "gps_trace.csv",
      fileType: "csv",
      status: "Processed",
      metadata: {
        uploadedAt: "Mar 14, 2026 · 3:20 PM",
        fileSize: "52 KB",
        source: "Onboard GPS module",
        description:
          "Latitude/longitude trace covering approach, intersection, and stop.",
        recordCount: 186,
      },
    },
    {
      id: "ev-statement",
      name: "driver_statement.txt",
      fileType: "text",
      status: "Processed",
      metadata: {
        uploadedAt: "Mar 15, 2026 · 9:40 AM",
        fileSize: "4 KB",
        source: "Driver interview transcript",
        description:
          "Written account from the assigned driver regarding approach and perceived sequence.",
      },
    },
    {
      id: "ev-photos",
      name: "scene_photos.zip",
      fileType: "zip",
      status: "Processed",
      metadata: {
        uploadedAt: "Mar 14, 2026 · 5:02 PM",
        fileSize: "18.6 MB",
        source: "Field adjuster upload",
        description:
          "Scene photography bundle including vehicle damage and intersection sight lines.",
      },
    },
  ],
  timelineEvents: [
    {
      id: "evt-traveling",
      timestamp: "2:41:12 PM",
      title: "Vehicle traveling 42 mph",
      description:
        "Telematics export shows steady travel speed prior to intersection approach.",
      confidence: "High",
      linkedEvidenceIds: ["ev-telematics", "ev-gps"],
      notes: "Speed reading corroborated across telematics and GPS velocity fields.",
      markerId: "start",
      videoProgress: 18,
    },
    {
      id: "evt-intersection",
      timestamp: "2:41:18 PM",
      title: "Vehicle entering intersection",
      description:
        "GPS trace places the unit within the intersection boundary; dashcam frame aligns with entry.",
      confidence: "High",
      linkedEvidenceIds: ["ev-dashcam", "ev-gps", "ev-telematics"],
      notes: "Cross-reference dashcam timestamp with GPS geofence for intersection.",
      markerId: "intersection",
      videoProgress: 42,
    },
    {
      id: "evt-braking",
      timestamp: "2:41:20 PM",
      title: "Hard braking detected",
      description:
        "Telematics registers rapid deceleration; dashcam view shows forward scene change consistent with braking.",
      confidence: "High",
      linkedEvidenceIds: ["ev-dashcam", "ev-telematics"],
      notes: "Deceleration spike visible in telematics row at 14:41:20.",
      markerId: "braking",
      videoProgress: 58,
    },
    {
      id: "evt-impact",
      timestamp: "2:41:21 PM",
      title: "Impact detected",
      description:
        "Telematics and dashcam timestamps indicate a sudden stop in motion consistent with contact event.",
      confidence: "Medium",
      linkedEvidenceIds: ["ev-dashcam", "ev-telematics", "ev-police"],
      notes: "Police report references contact at intersection; verify against dashcam frame.",
      markerId: "impact",
      videoProgress: 72,
    },
    {
      id: "evt-stopped",
      timestamp: "2:41:24 PM",
      title: "Vehicle stopped",
      description:
        "GPS and telematics show zero speed; vehicle remains stationary at scene coordinates.",
      confidence: "High",
      linkedEvidenceIds: ["ev-gps", "ev-telematics", "ev-dashcam"],
      notes: "Post-stop position matches police report scene diagram reference.",
      markerId: "stop",
      videoProgress: 88,
    },
  ],
  speedData: [
    { time: "2:41:08", speed: 38 },
    { time: "2:41:10", speed: 40 },
    { time: "2:41:12", speed: 42, markerId: "start", label: "42 mph" },
    { time: "2:41:14", speed: 41 },
    { time: "2:41:16", speed: 39 },
    { time: "2:41:18", speed: 36, markerId: "intersection" },
    { time: "2:41:19", speed: 28 },
    { time: "2:41:20", speed: 12, markerId: "braking", label: "Hard braking" },
    { time: "2:41:21", speed: 4, markerId: "impact", label: "Impact" },
    { time: "2:41:22", speed: 0 },
    { time: "2:41:24", speed: 0, markerId: "stop", label: "Vehicle stopped" },
  ],
  mapRoute: [
    { x: 12, y: 78 },
    { x: 22, y: 72 },
    { x: 34, y: 64 },
    { x: 46, y: 55 },
    { x: 58, y: 46 },
    { x: 68, y: 42 },
    { x: 74, y: 44 },
    { x: 78, y: 50 },
    { x: 80, y: 58 },
  ],
  mapMarkers: [
    { id: "start", label: "Start", x: 12, y: 78 },
    { id: "braking", label: "Hard braking", x: 68, y: 42 },
    { id: "impact", label: "Impact", x: 78, y: 50 },
    { id: "stop", label: "Stop", x: 80, y: 58 },
  ],
};

export function getEvidenceById(id: string) {
  return mockClaim.evidenceFiles.find((file) => file.id === id);
}

export function getTimelineEventById(id: string) {
  return mockClaim.timelineEvents.find((event) => event.id === id);
}

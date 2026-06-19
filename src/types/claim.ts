export type EvidenceFileType = "pdf" | "video" | "csv" | "text" | "zip";

export type ProcessingStatus = "Processed" | "Pending" | "Failed";

export type ConfidenceLevel = "High" | "Medium" | "Low";

export type EventSeverity = "info" | "moderate" | "critical";

export type TimelineSourceFilter =
  | "all"
  | "video"
  | "telematics"
  | "gps"
  | "police"
  | "uploaded";

export type SeverityFilter = "all" | "info" | "moderate" | "critical";

export interface EvidenceMetadata {
  uploadedAt: string;
  fileSize: string;
  source: string;
  description: string;
  duration?: string;
  recordCount?: number;
  timeRange?: { start: string; end: string };
  detectedEventCount?: number;
}

export interface EvidenceFile {
  id: string;
  name: string;
  fileType: EvidenceFileType;
  status: ProcessingStatus;
  metadata: EvidenceMetadata;
}

export interface TimelineEvent {
  id: string;
  timestamp: string;
  title: string;
  description: string;
  confidence: ConfidenceLevel;
  severity: EventSeverity;
  linkedEvidenceIds: string[];
  notes: string;
  markerId: string;
  videoProgress: number;
  videoOffsetSeconds: number;
  isUploadedTelemetry?: boolean;
  sortDate?: Date;
  rowIndex?: number;
}

export interface InvestigationNote {
  id: string;
  content: string;
  createdAt: string;
}

export interface TelematicsRow {
  timestamp: string;
  date: Date;
  speedMph: number;
  latitude?: number;
  longitude?: number;
  brakeStatus?: boolean;
}

export interface ParsedTelematics {
  fileName: string;
  rows: TelematicsRow[];
  uploadedAt: string;
  timeRange: { start: string; end: string };
  detectedEvents: TimelineEvent[];
  hasGpsCoordinates: boolean;
}

export type TelematicsUploadState = "idle" | "parsing" | "processed" | "error";

export interface SpeedDataPoint {
  time: string;
  speed: number;
  markerId?: string;
  label?: string;
  severity?: EventSeverity;
}

export interface MapMarker {
  id: string;
  label: string;
  x: number;
  y: number;
  severity?: EventSeverity;
}

export interface InvestigationStats {
  eventCount: number;
  sourceCount: number;
  durationSeconds: number;
  peakSpeedMph: number;
}

export interface Claim {
  id: string;
  title: string;
  status: string;
  incidentDateTime: string;
  vehicleId: string;
  location: string;
  shareUrl: string;
  evidenceFiles: EvidenceFile[];
  timelineEvents: TimelineEvent[];
  speedData: SpeedDataPoint[];
  mapRoute: { x: number; y: number }[];
  mapMarkers: MapMarker[];
}

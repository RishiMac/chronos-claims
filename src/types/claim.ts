export type EvidenceFileType =
  | "pdf"
  | "video"
  | "csv"
  | "text"
  | "zip"
  | "image";

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
  imageWidth?: number;
  imageHeight?: number;
  pdfPageCount?: number;
  textPreview?: string;
  warnings?: string[];
  publicUrl?: string;
}

export interface EvidenceFile {
  id: string;
  name: string;
  fileType: EvidenceFileType;
  status: ProcessingStatus;
  metadata: EvidenceMetadata;
  objectUrl?: string;
  mimeType?: string;
  isUserUploaded?: boolean;
  isSampleFile?: boolean;
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

export interface SessionActivityEntry {
  id: string;
  timestamp: string;
  message: string;
}

export interface TelematicsRow {
  timestamp: string;
  date: Date;
  speedMph: number;
  latitude?: number;
  longitude?: number;
  brakeStatus?: boolean;
  acceleration?: number;
}

export interface ParsedTelematics {
  evidenceId: string;
  fileName: string;
  rows: TelematicsRow[];
  uploadedAt: string;
  timeRange: { start: string; end: string };
  detectedEvents: TimelineEvent[];
  hasGpsCoordinates: boolean;
  warnings: string[];
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

export interface InvestigationSessionExport {
  version: 1;
  exportedAt: string;
  selectedEventId: string;
  selectedEvidenceId: string | null;
  activeVideoEvidenceId: string | null;
  sourceFilter: TimelineSourceFilter;
  severityFilter: SeverityFilter;
  searchQuery: string;
  notesDraft: string;
  notes: InvestigationNote[];
  activityLog: SessionActivityEntry[];
  evidenceFiles: EvidenceFile[];
  telematics: SerializedTelematics[];
  timelineEvents: Array<Omit<TimelineEvent, "sortDate"> & { sortDate?: string }>;
}

export interface SerializedTelematics {
  evidenceId: string;
  fileName: string;
  uploadedAt: string;
  timeRange: { start: string; end: string };
  hasGpsCoordinates: boolean;
  warnings: string[];
  rows: Array<{
    timestamp: string;
    date: string;
    speedMph: number;
    latitude?: number;
    longitude?: number;
    brakeStatus?: boolean;
    acceleration?: number;
  }>;
  detectedEvents: Array<Omit<TimelineEvent, "sortDate"> & { sortDate?: string }>;
}

export interface SampleObservation {
  id: string;
  content: string;
  createdAt: string;
}

export interface Claim {
  id: string;
  shortLabel: string;
  title: string;
  status: string;
  incidentDateTime: string;
  vehicleId: string;
  driverName: string;
  location: string;
  scenarioSummary: string;
  shareUrl: string;
  evidenceFiles: EvidenceFile[];
  timelineEvents: TimelineEvent[];
  speedData: SpeedDataPoint[];
  mapRoute: { x: number; y: number }[];
  mapMarkers: MapMarker[];
  sampleObservations: SampleObservation[];
  sampleEvidencePath: string;
  defaultSelectedEventId: string;
  defaultSelectedEvidenceId: string;
  mapRouteLabel: string;
}

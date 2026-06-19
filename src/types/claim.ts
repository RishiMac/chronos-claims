import type { EvidenceReference } from "@/types/evidence-reference";
import type { EventFlagType, ReviewStatus } from "@/types/collaboration";

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
  | "uploaded"
  | "ai";

export type SeverityFilter = "all" | "info" | "moderate" | "critical";

export type {
  BookmarkFilter,
  FlagFilter,
  ReviewStatusFilter,
} from "@/types/collaboration";

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
  /** Full uploaded text content (persisted up to size cap) */
  storedTextContent?: string;
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
  isAiGenerated?: boolean;
  evidenceReferences?: EvidenceReference[];
  sortDate?: Date;
  rowIndex?: number;
  reviewStatus?: ReviewStatus;
  assignedTo?: string;
  isBookmarked?: boolean;
  flags?: EventFlagType[];
  commentCount?: number;
}

export interface TelematicsRow {
  timestamp: string;
  date: Date;
  speedMph: number;
  latitude?: number;
  longitude?: number;
  brakeStatus?: boolean;
  acceleration?: number;
  heading?: number;
}

export interface ParsedTelematics {
  evidenceId: string;
  fileName: string;
  format: import("@/types/telemetry").TelematicsFormat;
  records: TelematicsRow[];
  rows: TelematicsRow[];
  uploadedAt: string;
  timeRange: { start: string; end: string };
  detectedEvents: TimelineEvent[];
  hasGpsCoordinates: boolean;
  warnings: string[];
  metrics: import("@/types/telemetry").TelemetryMetrics;
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
  notes: import("@/types/investigation-note").InvestigationNote[];
  activityLog: import("@/types/audit-activity").SessionActivityEntry[];
  evidenceFiles: EvidenceFile[];
  telematics: SerializedTelematics[];
  timelineEvents: Array<Omit<TimelineEvent, "sortDate"> & { sortDate?: string }>;
}

export interface SerializedTelematics {
  evidenceId: string;
  fileName: string;
  format: import("@/types/telemetry").TelematicsFormat;
  uploadedAt: string;
  timeRange: { start: string; end: string };
  hasGpsCoordinates: boolean;
  warnings: string[];
  metrics: import("@/types/telemetry").TelemetryMetrics;
  rows: Array<{
    timestamp: string;
    date: string;
    speedMph: number;
    latitude?: number;
    longitude?: number;
    brakeStatus?: boolean;
    acceleration?: number;
    heading?: number;
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

export type { InvestigationNote } from "@/types/investigation-note";
export type {
  AuditActivity,
  SessionActivityEntry,
} from "@/types/audit-activity";
export type { SharePackage } from "@/types/share-package";
export type { StoredClaim } from "@/types/stored-claim";

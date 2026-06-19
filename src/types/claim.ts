export type EvidenceFileType = "pdf" | "video" | "csv" | "text" | "zip";

export type ProcessingStatus = "Processed" | "Pending" | "Failed";

export type ConfidenceLevel = "High" | "Medium" | "Low";

export interface EvidenceMetadata {
  uploadedAt: string;
  fileSize: string;
  source: string;
  description: string;
  duration?: string;
  recordCount?: number;
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
  linkedEvidenceIds: string[];
  notes: string;
  markerId: string;
  videoProgress: number;
}

export interface SpeedDataPoint {
  time: string;
  speed: number;
  markerId?: string;
  label?: string;
}

export interface MapMarker {
  id: string;
  label: string;
  x: number;
  y: number;
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

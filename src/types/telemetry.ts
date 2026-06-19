export type TelematicsFormat =
  | "samsara"
  | "geotab"
  | "verizon_connect"
  | "generic";

export interface TelemetryRecord {
  timestamp: string;
  date: Date;
  speedMph: number;
  latitude?: number;
  longitude?: number;
  acceleration?: number;
  heading?: number;
  brakeStatus?: boolean;
}

export interface TelemetryMetrics {
  peakSpeedMph: number;
  averageSpeedMph: number;
  distanceMiles: number;
  durationSeconds: number;
  hardBrakingEventCount: number;
  stopCount: number;
}

export interface TelematicsParseResult {
  fileName: string;
  format: TelematicsFormat;
  records: TelemetryRecord[];
  uploadedAt: string;
  timeRange: { start: string; end: string };
  warnings: string[];
  metrics: TelemetryMetrics;
}

export interface DerivedTelemetryEvent {
  title: string;
  description: string;
  timestamp: string;
  severity: "info" | "moderate" | "critical";
  confidence: "High" | "Medium" | "Low";
  sourceReferences: string[];
  rowIndex: number;
  markerId: string;
  sortDate: Date;
}

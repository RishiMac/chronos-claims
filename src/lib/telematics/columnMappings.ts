export interface ColumnIndex {
  timestamp: number;
  speed: number;
  latitude: number;
  longitude: number;
  acceleration: number;
  heading: number;
  brake: number;
}

export const GENERIC_COLUMNS = {
  timestamp: ["timestamp", "time", "datetime", "date_time", "event_time"],
  speed: ["speed_mph", "speed", "velocity", "spd", "mph", "vehicle_speed"],
  latitude: ["latitude", "lat", "gps_latitude"],
  longitude: ["longitude", "lon", "lng", "long", "gps_longitude"],
  acceleration: ["acceleration", "accel", "g_force", "harsh_accel"],
  heading: ["heading", "bearing", "direction"],
  brake: ["brake_status", "braking", "brake", "harsh_brake", "brakepedalon"],
};

export const SAMSARA_COLUMNS = {
  timestamp: ["event_time", "timestamp", "time"],
  speed: ["vehicle_speed", "speed_mph", "speed"],
  latitude: ["gps_latitude", "latitude", "lat"],
  longitude: ["gps_longitude", "longitude", "lon", "lng"],
  acceleration: ["harsh_accel", "acceleration", "accel"],
  heading: ["heading", "bearing"],
  brake: ["harsh_brake", "brake_status", "brake"],
};

export const GEOTAB_COLUMNS = {
  timestamp: ["datetime", "date_time", "timestamp", "time"],
  speed: ["speed", "speed_mph", "vehicle_speed"],
  latitude: ["latitude", "lat"],
  longitude: ["longitude", "lon", "lng"],
  acceleration: ["acceleration", "accel"],
  heading: ["bearing", "heading"],
  brake: ["brakepedalon", "brake_status", "brake"],
};

export const VERIZON_COLUMNS = {
  timestamp: ["event time", "event_time", "timestamp", "time"],
  speed: ["vehicle speed", "vehicle_speed", "speed_mph", "speed"],
  latitude: ["lat", "latitude"],
  longitude: ["lon", "lng", "longitude"],
  acceleration: ["acceleration", "accel"],
  heading: ["heading", "bearing"],
  brake: ["brake status", "brake_status", "brake"],
};

export function detectColumnIndex(
  headers: string[],
  mapping: Record<keyof ColumnIndex, string[]>
): ColumnIndex {
  const normalized = normalizeHeaders(headers);
  return {
    timestamp: findColumn(normalized, mapping.timestamp),
    speed: findColumn(normalized, mapping.speed),
    latitude: findColumn(normalized, mapping.latitude),
    longitude: findColumn(normalized, mapping.longitude),
    acceleration: findColumn(normalized, mapping.acceleration),
    heading: findColumn(normalized, mapping.heading),
    brake: findColumn(normalized, mapping.brake),
  };
}

export function findColumn(normalized: string[], aliases: string[]): number {
  for (const alias of aliases) {
    const index = normalized.indexOf(alias);
    if (index >= 0) return index;
  }
  return -1;
}

export function normalizeHeaders(headers: string[]): string[] {
  return headers.map((header) =>
    header.trim().toLowerCase().replace(/\s+/g, " ")
  );
}

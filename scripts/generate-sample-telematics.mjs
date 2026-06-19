import fs from "node:fs";
import path from "node:path";

const root = path.join(process.cwd(), "public", "sample-telematics");

function rows(baseTime, lat, lon, profile) {
  const start = new Date(baseTime);
  const data = [];

  if (profile === "brake") {
    for (let i = 0; i < 10; i++)
      data.push({ offset: i, speed: 36 + (i % 4), brake: false, accel: 0.1, heading: 90 });
    for (let i = 10; i < 16; i++)
      data.push({
        offset: i,
        speed: 40 - (i - 10) * 5,
        brake: i > 11,
        accel: -0.6,
        heading: 90,
      });
    for (let i = 16; i < 24; i++)
      data.push({ offset: i, speed: Math.max(0, 10 - (i - 16) * 2), brake: true, accel: -0.3, heading: 90 });
  } else if (profile === "accel") {
    for (let i = 0; i < 8; i++)
      data.push({ offset: i, speed: 20 + i, brake: false, accel: 0.4, heading: 180 });
    for (let i = 8; i < 14; i++)
      data.push({ offset: i, speed: 28 + (i - 8) * 4, brake: false, accel: 0.9, heading: 180 });
    for (let i = 14; i < 22; i++)
      data.push({ offset: i, speed: 48 - (i - 14), brake: false, accel: 0.1, heading: 180 });
  } else {
    for (let i = 0; i < 12; i++)
      data.push({ offset: i, speed: 30 + (i % 3), brake: false, accel: 0.05, heading: 45 });
    for (let i = 12; i < 20; i++)
      data.push({ offset: i, speed: 18 - (i - 12), brake: i > 14, accel: -0.4, heading: 45 });
    for (let i = 20; i < 28; i++)
      data.push({ offset: i, speed: 0, brake: false, accel: 0, heading: 45 });
  }

  return data.map(({ offset, speed, brake, accel, heading }) => {
    const t = new Date(start.getTime() + offset * 1000);
    return {
      timestamp: t.toISOString().slice(0, 19).replace("T", " "),
      speed,
      lat: (lat + offset * 0.00003).toFixed(6),
      lon: (lon + offset * 0.00002).toFixed(6),
      brake,
      accel,
      heading,
    };
  });
}

fs.mkdirSync(root, { recursive: true });

const genericRows = rows("2026-03-14T14:41:00", 27.9506, -82.4572, "brake");
fs.writeFileSync(
  path.join(root, "generic.csv"),
  [
    "timestamp,speed_mph,latitude,longitude,brake_status,acceleration,heading",
    ...genericRows.map(
      (r) =>
        `${r.timestamp},${r.speed},${r.lat},${r.lon},${r.brake},${r.accel},${r.heading}`
    ),
  ].join("\n") + "\n"
);

const samsaraRows = rows("2026-03-14T14:41:00", 27.9506, -82.4572, "brake");
fs.writeFileSync(
  path.join(root, "samsara.csv"),
  [
    "event_time,vehicle_speed,gps_latitude,gps_longitude,harsh_brake,harsh_accel,heading",
    ...samsaraRows.map(
      (r) =>
        `${r.timestamp},${r.speed},${r.lat},${r.lon},${r.brake},${Math.max(0, r.accel)},${r.heading}`
    ),
  ].join("\n") + "\n"
);

const geotabRows = rows("2026-04-02T09:18:00", 28.5383, -81.3792, "accel");
fs.writeFileSync(
  path.join(root, "geotab.csv"),
  [
    "DateTime,Speed,Latitude,Longitude,BrakePedalOn,Acceleration,Bearing",
    ...geotabRows.map(
      (r) =>
        `${r.timestamp},${r.speed},${r.lat},${r.lon},${r.brake},${r.accel},${r.heading}`
    ),
  ].join("\n") + "\n"
);

const verizonRows = rows("2026-04-18T16:52:00", 27.7676, -82.6403, "brake");
fs.writeFileSync(
  path.join(root, "verizon.csv"),
  [
    "Event Time,Vehicle Speed,Lat,Lon,Brake Status,Acceleration,Heading",
    ...verizonRows.map(
      (r) =>
        `${r.timestamp},${r.speed},${r.lat},${r.lon},${r.brake ? "On" : "Off"},${r.accel},${r.heading}`
    ),
  ].join("\n") + "\n"
);

console.log("Generated sample telematics CSV files.");

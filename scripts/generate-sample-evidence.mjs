import fs from "node:fs";
import path from "node:path";

const root = path.join(process.cwd(), "public", "sample-evidence");

const claims = {
  "CC-2026-001": {
    label: "Rear-End Collision",
    baseTime: "2026-03-14T14:41:00",
    lat: 27.9506,
    lon: -82.4572,
    profile: "rear-end",
    police: `TAMPA POLICE DEPARTMENT — INCIDENT REPORT (SUMMARY)
Report No.: TPD-2026-031418
Date/Time Reported: March 14, 2026 · 2:55 PM
Location: Market St & 5th Ave, Tampa, FL

Involved Units:
- Commercial box truck, Unit FL-4472 (fleet vehicle)
- Passenger vehicle, Plate FL8-D421 (private vehicle)

Road Conditions: Wet pavement following light rain
Visibility: Good, daylight
Weather: Overcast, 72°F

Narrative Summary:
Responding officer notes commercial box truck stopped or slowing near intersection.
Passenger vehicle approaching from rear reported contact with rear of commercial unit.
Scene observations support review of braking sequence and following distance.
Requires human review of synchronized evidence sources.

Officer: Badge #4821 — Officer M. Rivera`,
    driver: `DRIVER STATEMENT — Unit FL-4472
Driver: James Porter (fleet assigned)
Date: March 15, 2026

I was operating the box truck southbound on Market St approaching 5th Ave.
Traffic ahead slowed near the intersection and I applied brakes steadily.
I felt a sudden jolt from the rear shortly after slowing.
I moved to the shoulder and contacted dispatch.
My statement is based on my recollection and requires human review against video and telemetry.`,
    witness: `WITNESS STATEMENT — Case CC-2026-001
Witness: Elena Vasquez (nearby pedestrian)
Date: March 14, 2026

I was waiting at the crosswalk and observed the box truck brake near the intersection.
I recall brake lights on the truck before hearing contact from behind.
Timing and distance estimates are approximate and should support review only.`,
    weather: `WEATHER SERVICE SUMMARY — Tampa, FL
Observation Window: March 14, 2026 · 2:30–3:00 PM

Conditions: Light rain ending, overcast
Precipitation: Trace accumulation in prior hour
Visibility: 8 miles
Road Surface: Wet pavement reported at incident time
Wind: SE 8 mph`,
    tow: `TOW SERVICE RECEIPT
Tow Company: BayLine Recovery Services
Receipt No.: BLR-88421
Vehicle ID: Unit FL-4472
Service Time: March 14, 2026 · 4:05 PM
Service Type: Post-incident repositioning to fleet yard
Notes: Vehicle moved for inspection; no additional damage assessment recorded on receipt.`,
  },
  "CC-2026-002": {
    label: "Side-Impact Intersection",
    baseTime: "2026-04-02T09:18:00",
    lat: 28.5383,
    lon: -81.3792,
    profile: "side-impact",
    police: `ORLANDO POLICE DEPARTMENT — INCIDENT REPORT (SUMMARY)
Report No.: OPD-2026-040209
Date/Time Reported: April 2, 2026 · 9:32 AM
Location: Oak Ridge Blvd & Elm St, Orlando, FL

Involved Units:
- Utility vehicle, Unit UT-2188 (fleet vehicle)
- Sedan, Plate FL2-K903 (private vehicle)

Road Conditions: Dry
Visibility: Clear, morning daylight

Narrative Summary:
Utility vehicle entered intersection under green signal timing per initial observations.
Passenger-side contact reported during crossing phase.
Report narrative supports review of approach speed and intersection occupancy.
Requires human review of synchronized evidence sources.`,
    driver: `DRIVER STATEMENT — Unit UT-2188
Driver: Marcus Chen (fleet assigned)

I entered Oak Ridge Blvd & Elm St with a green signal.
I observed cross traffic on my right during the crossing phase.
I braked hard after sensing impact on the passenger side.
Statement provided to support review and may differ from telemetry timing.`,
    witness: `WITNESS STATEMENT — Case CC-2026-002
Witness: Priya Nair (corner store employee)

I saw the utility vehicle moving through the intersection at moderate speed.
I heard impact shortly after the vehicle entered the crossing area.
My timing estimate is approximate.`,
    weather: `WEATHER SERVICE SUMMARY — Orlando, FL
Observation Window: April 2, 2026 · 9:00–9:45 AM

Conditions: Clear
Precipitation: None
Visibility: 10 miles
Road Surface: Dry`,
    tow: `TOW SERVICE RECEIPT
Tow Company: Central Florida Fleet Assist
Receipt No.: CFFA-22018
Vehicle ID: Unit UT-2188
Service Time: April 2, 2026 · 11:10 AM`,
  },
  "CC-2026-003": {
    label: "Hard Braking Near Intersection",
    baseTime: "2026-04-18T16:52:00",
    lat: 27.7676,
    lon: -82.6403,
    profile: "hard-brake",
    police: `ST. PETERSBURG POLICE DEPARTMENT — INCIDENT REPORT (SUMMARY)
Report No.: SPPD-2026-041816
Location: I-275 Northbound Exit 24, St. Petersburg, FL

Involved Units:
- Delivery van, Unit DV-9031
- Passenger vehicle, Plate FL6-R118

Narrative Summary:
Delivery van reported hard braking event near exit ramp merge area.
Following vehicle contact reported after deceleration sequence.
Wet pavement noted in officer observations.`,
    driver: `DRIVER STATEMENT — Unit DV-9031
Driver: Alicia Gomez

A vehicle cut across lanes ahead near the exit merge.
I braked hard to increase following distance.
I felt contact from behind shortly after braking.
Requires human review against uploaded telemetry and dashcam references.`,
    witness: `WITNESS STATEMENT — Case CC-2026-003
Witness: Tom Bradley (adjacent lane motorist)

I saw the delivery van brake suddenly near the exit.
Brake lights were visible before any contact occurred.
Distance and timing are estimates only.`,
    weather: `WEATHER SERVICE SUMMARY — St. Petersburg, FL
Conditions: Light rain, overcast
Road Surface: Wet
Visibility: 6 miles`,
    tow: `TOW SERVICE RECEIPT
Tow Company: Gulf Coast Roadside
Vehicle ID: Unit DV-9031
Service Time: April 18, 2026 · 5:40 PM`,
  },
  "CC-2026-004": {
    label: "Parking Lot Low-Speed Incident",
    baseTime: "2026-05-06T11:07:00",
    lat: 30.3322,
    lon: -81.6557,
    profile: "parking-lot",
    police: `JACKSONVILLE MUNICIPAL SAFETY — INCIDENT REPORT (SUMMARY)
Report No.: JMS-2026-050611
Location: City Hall Parking Lot, Jacksonville, FL

Involved Units:
- Municipal vehicle, Unit MN-1045
- Parked sedan, Plate FL9-P332

Narrative Summary:
Municipal vehicle reversing in parking lot reported contact with parked vehicle.
Low-speed maneuver documented in scene notes.`,
    driver: `DRIVER STATEMENT — Unit MN-1045
Driver: Robert Ellis (city fleet)

I was reversing into a parking aisle to reposition for a service stop.
I checked mirrors and backup camera before moving.
I felt light contact with a parked vehicle behind me.`,
    witness: `WITNESS STATEMENT — Case CC-2026-004
Witness: Sandra Cole (city employee)

I observed the municipal vehicle reversing slowly.
Contact appeared to occur at low speed in the parking aisle.`,
    weather: `WEATHER SERVICE SUMMARY — Jacksonville, FL
Conditions: Clear, dry
Visibility: 10 miles
Road Surface: Dry asphalt`,
    tow: `TOW SERVICE RECEIPT
Tow Company: Not required — low-speed parking lot incident
Vehicle ID: Unit MN-1045
Notes: Vehicle repositioned on scene; no tow ordered.`,
  },
};

function makeTelematicsRows(profile, baseTime, lat, lon) {
  const rows = [];
  const start = new Date(baseTime);

  const push = (offsetSec, speed, brake, accel, headingDelta = 0) => {
    const t = new Date(start.getTime() + offsetSec * 1000);
    const heading = (profile === "parking-lot" ? 180 : 90) + headingDelta;
    rows.push({
      timestamp: t.toISOString().slice(0, 19).replace("T", " "),
      speed_mph: speed,
      latitude: (lat + offsetSec * 0.00003).toFixed(6),
      longitude: (lon + offsetSec * 0.00002).toFixed(6),
      brake_status: brake ? "true" : "false",
      acceleration: accel.toFixed(2),
      heading: Math.round(heading),
    });
  };

  if (profile === "rear-end") {
    for (let i = 0; i < 8; i++) push(i, 36 + (i % 3), false, 0.05 + i * 0.01);
    for (let i = 8; i < 14; i++) push(i, 42 - (i - 8) * 2, i > 9, -0.2 - (i - 8) * 0.3);
    for (let i = 14; i < 20; i++) push(i, Math.max(0, 18 - (i - 14) * 3), true, -0.8 - (i - 14) * 0.2);
    for (let i = 20; i < 28; i++) push(i, 0, false, 0);
  } else if (profile === "side-impact") {
    for (let i = 0; i < 10; i++) push(i, 28 + (i % 4), false, 0.08);
    for (let i = 10; i < 16; i++) push(i, 32 - (i - 10) * 4, i > 12, -0.4 - (i - 10) * 0.25);
    for (let i = 16; i < 24; i++) push(i, Math.max(0, 8 - (i - 16)), true, -0.6);
    for (let i = 24; i < 32; i++) push(i, 0, false, 0);
  } else if (profile === "hard-brake") {
    for (let i = 0; i < 8; i++) push(i, 48 + (i % 2), false, 0.1);
    for (let i = 8; i < 12; i++) push(i, 52 - (i - 8) * 10, true, -1.2 - (i - 8) * 0.4);
    for (let i = 12; i < 18; i++) push(i, 18 + (i - 12) * 2, false, 0.3);
    for (let i = 18; i < 26; i++) push(i, 24 - (i - 18) * 2, i > 20, -0.3);
    for (let i = 26; i < 34; i++) push(i, Math.max(2, 8 - (i - 26)), false, 0);
  } else {
    for (let i = 0; i < 10; i++) push(i, 6 - (i % 2), false, 0, i * 8);
    for (let i = 10; i < 18; i++) push(i, Math.max(1, 5 - (i - 10) * 0.4), i > 12, -0.05, 180 + (i - 10) * 10);
    for (let i = 18; i < 26; i++) push(i, 0, false, 0, 260);
  }

  return rows;
}

function sceneSvg(label, subtitle) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="420" viewBox="0 0 640 420">
  <rect width="640" height="420" fill="#1e293b"/>
  <rect x="40" y="180" width="560" height="80" fill="#334155" rx="8"/>
  <rect x="120" y="120" width="160" height="90" fill="#64748b" rx="6"/>
  <rect x="360" y="130" width="140" height="70" fill="#94a3b8" rx="6"/>
  <text x="320" y="60" fill="#e2e8f0" font-family="Arial, sans-serif" font-size="24" text-anchor="middle">${label}</text>
  <text x="320" y="90" fill="#94a3b8" font-family="Arial, sans-serif" font-size="14" text-anchor="middle">${subtitle}</text>
  <text x="320" y="390" fill="#64748b" font-family="Arial, sans-serif" font-size="12" text-anchor="middle">Demo scene diagram — supports human review only</text>
</svg>`;
}

for (const [claimId, claim] of Object.entries(claims)) {
  const dir = path.join(root, claimId);
  fs.mkdirSync(dir, { recursive: true });

  fs.writeFileSync(path.join(dir, "police_report.txt"), claim.police);
  fs.writeFileSync(path.join(dir, "driver_statement.txt"), claim.driver);
  fs.writeFileSync(path.join(dir, "witness_statement.txt"), claim.witness);
  fs.writeFileSync(path.join(dir, "weather_report.txt"), claim.weather);
  fs.writeFileSync(path.join(dir, "tow_receipt.txt"), claim.tow);

  const rows = makeTelematicsRows(claim.profile, claim.baseTime, claim.lat, claim.lon);
  const csvHeader = "timestamp,speed_mph,latitude,longitude,brake_status,acceleration,heading";
  const csvBody = rows
    .map(
      (r) =>
        `${r.timestamp},${r.speed_mph},${r.latitude},${r.longitude},${r.brake_status},${r.acceleration},${r.heading}`
    )
    .join("\n");
  fs.writeFileSync(path.join(dir, "telematics.csv"), `${csvHeader}\n${csvBody}\n`);

  fs.writeFileSync(
    path.join(dir, "scene_photo_1.svg"),
    sceneSvg("Scene Photo 1", claim.label)
  );
  fs.writeFileSync(
    path.join(dir, "scene_photo_2.svg"),
    sceneSvg("Scene Photo 2", `${claimId} — alternate angle`)
  );
}

console.log("Generated sample evidence for 4 claims.");

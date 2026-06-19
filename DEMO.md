# Chronos Claims — 5-minute demo script

Use this checklist when demoing the MVP to adjusters, fleet safety, or managers. Target runtime: **~5 minutes** with brief narration.

**Before you start:** Run `npm run dev`, open [http://localhost:3000](http://localhost:3000), and pick claim **CC-2026-001** (or any sample claim). If the workspace looks stale, use **Reset demo** in the header first.

---

## 1. Load sample evidence (~30s)

1. Open the **Evidence** sidebar (left).
2. Click **Load sample evidence**.
3. Point out the bundle: police report, dashcam reference, telematics CSV, statements, scene photos, etc.
4. Note duplicate detection if you click again (“Sample evidence already loaded”).

**Say:** “Evidence is organized as source references for human review — not automated conclusions.”

---

## 2. Upload sample telematics CSV (~45s)

1. In the sidebar, use **Upload evidence** (or drag a CSV).
2. Upload `public/sample-telematics/samsara.csv` (or `generic.csv`).
3. Wait for parsing; show **Uploaded telemetry** badge on new timeline events.
4. Switch to **Telemetry** tab — show speed graph and metrics.
5. Switch to **Map** tab — route from GPS columns when present.

**Say:** “CSV format is auto-detected; events like hard braking and peak speed become timeline anchors.”

---

## 3. Switch between claims (~20s)

1. Header claim dropdown → select **CC-2026-002** (or another sample).
2. Show timeline and evidence change per claim.
3. Switch back to **CC-2026-001**.

**Say:** “Each claim is an isolated investigation workspace with its own evidence and state.”

---

## 4. Click timeline events (~30s)

1. Right panel **Event Timeline** — click an event (e.g. hard braking or impact window).
2. Show **Video** tab seek to the event offset.
3. Show **Telemetry** and **Map** highlight the same moment.
4. **Selected Event Details** updates below the timeline.

**Say:** “One click synchronizes video, telemetry, map, and details.”

---

## 5. Show telemetry graph (~20s)

1. **Telemetry** tab → toggle **Graph** vs **Raw data** if available.
2. Hover or select an event and tie graph markers to timeline severity.

**Say:** “Speed and braking context support review without replacing adjuster judgment.”

---

## 6. Show evidence preview (~30s)

1. Click an **Evidence** tab (center) or a source chip on a timeline event.
2. Open a **text** file — line numbers and search highlighting.
3. Open an **image** or **CSV** preview.
4. Mention PDF/video placeholders for files without inline renderers.

**Say:** “Reviewers open supporting evidence in context without leaving the workspace.”

---

## 7. Generate AI observations (~45s)

1. Open **AI** tab.
2. Click **Generate AI observations** (not automatic).
3. Show extracted observations from text documents with categories, confidence, and source badges.
4. Optional: **Regenerate** or **Clear** and note activity log entries.

**Say:** “AI is reviewer-controlled and local — deterministic extraction for demo, ready to swap for production models later.”

---

## 8. Show traceability (~30s)

1. Select a timeline event with **Supporting Evidence** in event details.
2. Show line/row references linked to police report or telematics rows.
3. Click **Open source** to jump to the **Evidence** preview at the referenced section.

**Say:** “Every event can cite exact lines or rows in source files for audit-friendly review.”

---

## 9. Create share package (~45s)

1. Header → **Share**.
2. Choose sections: timeline, evidence list, notes, activity summary.
3. Optional: set **Passcode required** and enter a demo passcode.
4. **Generate package** → **Copy link**.

**Say:** “Packages snapshot what reviewers chose to include — read-only for external stakeholders.”

---

## 10. Open read-only package (~30s)

1. Paste the share link in a **new tab** (same browser).
2. Enter passcode if required.
3. Walk through read-only timeline, evidence list, notes, activity.
4. Note review metadata on events (status, assignee, flags, comment counts) without edit controls.

**Say:** “Share view is intentionally read-only; editing stays in the investigation workspace.”

---

## 11. Add comment and review status (~30s)

1. Return to the main workspace tab.
2. Select an event → **Selected Event Details** → **Review** section.
3. Set review status (e.g. **Needs review** → **Reviewed**).
4. Assign to a demo reviewer (e.g. **Alex Rivera**).
5. Bookmark or add a flag.
6. Add a **comment** and save.
7. Show timeline badges and **Notes** tab **Review Summary** update.

**Say:** “Collaboration is lightweight — status, assignment, flags, and comments persist locally for demo workflows.”

---

## Wrap-up (optional)

- **Notes** tab → export/import session JSON for portability demos.
- **Reset demo** → explain localStorage and same-browser share limitation.
- Point to [README.md](./README.md) and [ARCHITECTURE.md](./ARCHITECTURE.md) for technical depth.

---

## Troubleshooting during demos

| Issue | Fix |
|-------|-----|
| Share link 404 / not found | Same browser required; regenerate package after **Reset demo**. |
| Sample evidence load fails | **Reset demo**, reload page, try **Load sample evidence** again. |
| Timeline empty after upload | Select uploaded CSV in sidebar; check filters (Source / Severity / Review). |
| AI shows no observations | Ensure text evidence is loaded; click **Generate AI observations**. |

# Chronos Claims

A local-first commercial auto claims investigation workspace for reviewing synchronized evidence, telematics, and timeline events.

Chronos Claims helps adjusters, fleet safety teams, and managers organize source references, trace supporting evidence to timeline events, collaborate on review, and share read-only investigation packages — all in the browser with no backend required for the MVP.

## What the MVP does

Open a claim, upload or load sample evidence, parse telematics CSVs into timeline events, and walk the incident second-by-second across video, telemetry, map, notes, AI observations, and evidence preview. Generate share packages with optional passcodes for read-only review. Assign, comment, flag, and approve events as part of a lightweight collaboration workflow.

## Key features

- **Multi-claim workspace** — Create, rename, duplicate, and switch between claims; each claim keeps its own workspace state.
- **Evidence uploads** — Upload PDF, video, CSV, text, image, and archive files; sidebar shows processing status and metadata.
- **Telematics parsing** — Detects Generic, Samsara, Geotab, and Verizon CSV formats; derives speed graphs, GPS routes, and timeline events.
- **Timeline sync** — Selecting an event seeks video, highlights map markers, and updates event details; playback auto-advances the timeline.
- **Evidence preview** — Center **Evidence** tab previews text (with line numbers), images, CSV tables, and placeholders for PDF/video/archive.
- **AI / document extraction (mock)** — Reviewer-triggered, deterministic local extraction from text documents; no external AI APIs.
- **Share packages** — Snapshot timeline, evidence list, notes, and activity; optional demo passcode; read-only `/share/[token]` viewer.
- **Collaboration workflow** — Per-event review status, assignment, bookmarks, flags, comments, filters, and review summary.

## Tech stack

| Layer | Choice |
|-------|--------|
| Framework | [Next.js 16](https://nextjs.org) (App Router) |
| UI | React 19, Tailwind CSS 4, shadcn/ui, Lucide icons |
| Language | TypeScript |
| Persistence | Browser `localStorage` (client-only) |
| Deployment | Static/SSR-friendly Next.js build (e.g. Vercel) |

## Run locally

**Requirements:** Node.js 20+ and npm.

```bash
git clone <your-repo-url>
cd chronos-claims
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Other scripts

```bash
npm run build   # Production build
npm run start   # Serve production build (run build first)
npm run lint    # ESLint (eslint-config-next)
```

Optional: copy `.env.example` to `.env.local` if you want to set `NEXT_PUBLIC_APP_URL` for future use. No env vars are required today.

## Reset demo data

All investigation data lives in **your browser’s localStorage**, not on a server.

| Action | How |
|--------|-----|
| **Reset everything** | Header → **Reset demo** — clears all Chronos storage keys and reloads sample claims. |
| **Reload sample claims only** | Header claim menu → **Load sample claims** (when applicable). |
| **Manual clear** | DevTools → Application → Local Storage → remove keys prefixed with `chronos_`. |

Storage keys (see `src/lib/storage/chronosStorage.ts`):

- `chronos_claims_v1`
- `chronos_selected_claim_v1`
- `chronos_notes_v1`
- `chronos_activity_v1`
- `chronos_share_packages_v1`

**Share links:** Packages and passcodes are stored locally. A share URL only works in the **same browser** (same localStorage) until a backend exists. Opening a link on another device or after clearing storage will show “Share package not found.”

## Sample data

The repo ships committed sample assets under `public/`:

- **Sample claims** — Four demo claims (`CC-2026-001` … `CC-2026-004`) with pre-built timelines, evidence metadata, and map/speed fixtures in `src/data/sampleClaims.ts`.
- **Sample evidence bundles** — Text reports, statements, scene SVGs, and telematics CSV per claim under `public/sample-evidence/<claim-id>/`.
- **Standalone telematics CSVs** — `public/sample-telematics/` (generic, samsara, geotab, verizon) and `public/sample-telematics.csv` for upload demos.

Use **Load sample evidence** in the evidence sidebar to attach the canonical bundle to the active claim.

## Current limitations

- **localStorage only** — No cross-device sync, backups, or multi-user isolation.
- **Demo passcodes only** — Share passcodes are hashed client-side for demo; not production-grade access control.
- **No real auth** — No sign-in, roles enforcement, or audit trail on a server.
- **No backend** — No API, database, or server-side file storage.
- **No production file storage** — Uploads use in-memory / object URLs; large files are not persisted to cloud storage.
- **AI / OCR is local and deterministic** — Document “extraction” is rule-based mock logic, not live LLM or OCR services.

## Documentation

- [DEMO.md](./DEMO.md) — 5-minute demo script for stakeholders.
- [ARCHITECTURE.md](./ARCHITECTURE.md) — Components, data flow, and future backend migration notes.

## Deploy (e.g. Vercel)

1. Push the repo to GitHub.
2. Import the project in [Vercel](https://vercel.com); framework preset **Next.js** is auto-detected.
3. Build command: `npm run build` (default). No env vars required for the MVP.
4. Deploy. Remember: **user data still lives in each visitor’s browser** until a backend is added.

A minimal [`vercel.json`](./vercel.json) is included for clarity; defaults would work without it.

## Future roadmap

- Backend API and database for claims, evidence blobs, and share tokens.
- Real authentication (e.g. Clerk) and role-based access for adjusters vs. fleet vs. managers.
- Object storage (e.g. S3) for uploads, virus scan, and retention policies.
- Live AI / OCR pipelines with human-in-the-loop review and provenance.
- Cross-browser share links, email invites, and org-wide activity audit.
- Real-time collaboration (comments, assignments) with WebSockets or CRDT sync.

## License

Private / demo — adjust for your organization before public release.

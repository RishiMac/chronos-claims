# Chronos Claims — Architecture

This document describes the current **local-first** MVP: how data flows, where logic lives, and how the system could evolve toward a production backend.

## Design principles

- **Client-only persistence** — All claim workspace state is stored in `localStorage`; there is no server database in the MVP.
- **Computed timelines** — Base claim events, uploaded telematics detections, and AI-derived events are merged at runtime rather than stored as one mutable list.
- **Reviewer in control** — AI generation, share creation, and collaboration actions are explicit user actions with audit log entries.
- **Safe language** — UI and copy emphasize review, source references, and supporting evidence — not automated liability conclusions.

## High-level diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     InvestigationWorkspace                       │
│  (orchestrator: selection, filters, tabs, handlers, persistence) │
└────────────┬───────────────────────────────┬────────────────────┘
             │                               │
    ┌────────▼────────┐             ┌────────▼────────┐
    │ EvidenceViewer  │             │ RightInvestigation│
    │ Tabs (center)   │             │ Panel (timeline + │
    │ Video/Telemetry │             │ event details)    │
    │ Map/Notes/AI/   │             └────────┬──────────┘
    │ Evidence        │                      │
    └────────┬────────┘             ┌────────▼────────┐
             │                      │ TimelinePanel,   │
    ┌────────▼────────┐             │ EventDetailsCard,│
    │ EvidenceSidebar │             │ EventCollaboration│
    │ (uploads)       │             └──────────────────┘
    └─────────────────┘
             │
    ┌────────▼────────────────────────────────────────┐
    │ useChronosPersistence → chronosStorage (localStorage) │
    └─────────────────────────────────────────────────────┘
```

## App entry

| Path | Role |
|------|------|
| `src/app/page.tsx` | Renders `InvestigationWorkspace` |
| `src/app/share/[token]/page.tsx` | Read-only share package viewer |
| `src/components/InvestigationWorkspace.tsx` | Central state, effects, handlers (~1500 lines) |

## Major components

### Layout regions

- **Header** (`Header.tsx`) — Claim switcher, share, reset demo, claim CRUD.
- **Evidence sidebar** (`EvidenceSidebar.tsx`) — File list, upload, sample evidence loader, telematics status.
- **Center tabs** (`EvidenceViewerTabs.tsx`) — Video, Telemetry, Map, Notes, AI, Evidence preview.
- **Right panel** (`RightInvestigationPanel.tsx`) — Resizable timeline + selected event details.

### Feature panels

| Component | Responsibility |
|-----------|----------------|
| `TimelinePanel` | Filters, search, event cards, collaboration badges |
| `EventDetailsCard` | Event metadata, supporting evidence, collaboration panel |
| `EventCollaborationPanel` | Review status, assign, bookmark, flag, comments |
| `EvidencePreviewPanel` | Type-specific preview + reference highlighting |
| `AiObservationsPanel` | Generate / regenerate / clear AI observations |
| `InvestigationNotesPanel` | Draft notes, session export/import, review summary |
| `SharePackageModal` | Create share package settings |
| `SharePackagePageClient` | Passcode gate + read-only package sections |

## Data flow

### 1. Hydration (page load)

1. `useChronosPersistence` calls `loadInitialAppState()` from `chronosStorage.ts`.
2. Default sample claims seed if storage is empty or corrupt.
3. `InvestigationWorkspace` loads active claim workspace via `workspaceFromStored()`.

### 2. Runtime timeline merge

```typescript
baseClaim.timelineEvents
  → merge uploaded telematics detectedEvents
  → merge AI timeline events (if generated)
  → enrichTimelineEventsWithCollaboration(eventCollaboration)
  → filterTimelineEvents(source, severity, review, bookmark, flag, search)
```

Key modules: `telematicsTransforms.ts`, `detectTelematicsEvents.ts`, `aiTimelineBridge.ts`, `collaborationUtils.ts`, `eventUtils.ts`.

### 3. Event selection sync

Selecting an event (`handleSelectEvent`):

- Updates `selectedEventId` (persisted per claim).
- Seeks video to `videoOffsetSeconds`.
- Drives map marker highlight, telemetry context, and event details.
- Logs `opened_timeline_event` to the activity log.

Video playback periodically calls `findActiveEventForPlayback` to auto-select timeline events.

### 4. Persistence sync

A `useEffect` in `InvestigationWorkspace` calls `updateStoredClaimWorkspace` whenever workspace fields change. `useChronosPersistence` debounces writes to localStorage on state change (skips first render).

Global arrays (not nested in `StoredClaim`):

- **Notes** — `chronos_notes_v1`, filtered by `claimId`
- **Activities** — `chronos_activity_v1`, filtered by `claimId`
- **Share packages** — `chronos_share_packages_v1`

## Storage adapter

**Location:** `src/lib/storage/chronosStorage.ts`

| Key | Content |
|-----|---------|
| `chronos_claims_v1` | `StoredClaim[]` — claim + workspace snapshot |
| `chronos_selected_claim_v1` | Active claim ID |
| `chronos_notes_v1` | Investigation notes |
| `chronos_activity_v1` | Audit activity entries |
| `chronos_share_packages_v1` | Share package records |

**Serialization:** `claimSerializer.ts` strips non-persistable fields (e.g. blob `objectUrl`s), serializes telematics maps and detected events.

**Reset:** `resetStorage()` removes all keys; workspace reloads sample claims.

## Telematics parser

**Pipeline:**

1. `parseTelematicsCsv` / `lib/telematics/*` — format detection (generic, Samsara, Geotab, Verizon), column mapping, normalization.
2. `buildParsedTelematics` — metrics (peak speed, duration, hard braking counts).
3. `detectTelematicsEvents` — derives `TimelineEvent[]` with row-level `evidenceReferences`.
4. Stored under `StoredClaim.telematics` per evidence file ID.

Sample CSVs live in `public/sample-telematics/` and per-claim bundles under `public/sample-evidence/`.

## AI / document extraction service

**Location:** `src/lib/ai/aiService.ts`, `src/lib/parsers/documentParser.ts`

- **Trigger:** User clicks Generate in `AiObservationsPanel` — no auto-run on load.
- **Input:** Text evidence files in the active claim.
- **Output:** `StoredAiAnalysis` — observations with categories, confidence, line references; optional AI timeline events bridged via `aiTimelineBridge.ts`.
- **Nature:** Deterministic, rule-based extraction — stand-in for future LLM/OCR integration.

## Share package service

**Location:** `src/lib/share/shareService.ts`, `sharePackageUtils.ts`, `passcodeUtils.ts`

- **Create:** Snapshots included event IDs, evidence IDs, sections, expiration, optional passcode hash.
- **View:** `getSharePackageViewData(token)` resolves claim data from localStorage, filters to included IDs, enriches timeline with collaboration metadata.
- **Access:** Demo passcode verification client-side; unlock state in `sessionStorage` per token.
- **Limitation:** Tokens only resolve on the browser that created the package.

## Collaboration model

**Types:** `src/types/collaboration.ts`

Per-claim `ClaimEventCollaboration` stored on `StoredClaim`:

- `reviewStatusByEventId`
- `assignments`, `bookmarks`, `flags`, `comments`

Merged onto timeline events at display time via `enrichTimelineEventsWithCollaboration`. Filters and review summary operate on enriched events.

Activity actions: `changed_review_status`, `assigned_event`, `bookmarked_event`, `unbookmarked_event`, `flagged_event`, `commented_on_event`, `approved_event`, `dismissed_event`.

## Types (core)

| Module | Purpose |
|--------|---------|
| `types/claim.ts` | Claims, evidence, timeline events, filters |
| `types/stored-claim.ts` | Persisted workspace snapshot |
| `types/share-package.ts` | Share settings and package record |
| `types/collaboration.ts` | Review, comments, flags, assignments |
| `types/audit-activity.ts` | Activity log actions |
| `types/evidence-reference.ts` | Line/row references for traceability |
| `types/ai-types.ts`, `document-types.ts` | AI observation models |

## Session export / import

**Location:** `src/lib/sessionPersistence.ts`

Exports a JSON bundle (notes, activity, filters, telematics, timeline) for demo portability. Import merges into current claim workspace. Not a substitute for a backend backup.

## Future backend migration plan

Suggested phased approach without rewriting the UI:

### Phase A — Read API + auth

- Replace `getClaims()` / `saveClaims()` with API client; keep the same `StoredClaim` shape initially.
- Add auth middleware; map demo assignees to real users.
- Keep optimistic UI; sync on mutation.

### Phase B — File storage

- Upload evidence to S3 (presigned URLs); store metadata + storage keys in DB.
- Replace `objectUrl` pattern with signed download URLs.
- Background jobs for telematics parse and thumbnail generation.

### Phase C — Share service

- Share tokens in DB; public `/share/[token]` resolves server-side.
- Passcodes verified on server; access logging centralized.
- Email / magic-link delivery.

### Phase D — AI pipeline

- Queue document extraction jobs; store observations with model version and source hashes.
- Human approval workflow before observations appear on timeline.

### Phase E — Real-time collaboration

- WebSocket or SSE for comments and assignments.
- Conflict resolution for review status; server-side audit trail.

**Migration tactic:** Introduce a `StorageAdapter` interface mirroring `chronosStorage` methods; swap implementation per environment (`localStorage` vs `api`).

## Related docs

- [README.md](./README.md) — Setup, limitations, reset instructions
- [DEMO.md](./DEMO.md) — Stakeholder demo script

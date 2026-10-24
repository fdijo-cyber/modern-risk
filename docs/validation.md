# Validation record

Validated in the supplied Node 24.22.1 environment.

- `npm test`: **20 passed, 0 failed**. Includes live HTTP multiplayer integration; symmetric 42-region adjacency; deterministic immutable replay; cash/material/force reservation; paid production delays; fuel failure; money transfer conservation; mutual-human diplomacy; enemy privacy; constrained parsing; conquest/capture accounting; grouped failed attack conservation; fixed-round finish; 24-month AI smoke; unique audit IDs; invalid prototype actions; atomic round uniqueness and stale revision rejection.
- `npm run check`: passed JavaScript syntax and required-artifact checks.
- `npm run build`: passed (the application is buildless; this is not a React/TypeScript compilation).
- Browser QA: landing page, create-room lobby, practice start, atlas visual inspection, constrained English interpretation, structured confirmation, queued order, submission, month advancement and private briefing all verified in Chromium through the managed preview.
- A preview startup mismatch exposed unsupported `--host`/`--port` arguments; fixed server argument parsing and preview restarted successfully.
- Combat edge review found grouped retreat remainder accounting and canceled-order ID reuse risks; both fixed and regression-tested.
- Public scoring projection was checked to exclude raw private military/economic factors.

Not run: a deployed production session, Docker image build, PostgreSQL migration on a real server, GitHub Actions, iPad/Safari browser QA, full accessibility audit, heavy concurrency/load, general-language LLM parsing or the entire original master-spec acceptance scenario. No remote repository or deployment is claimed.

## v0.2 validation

- **40 automated tests passed, 0 failed** after the expansion, including solo entry restrictions, private immediate message delivery/deduplication, private human/AI force and fleet projections, expiring/frozen reports, special-forces personnel conservation/return, foreign-border route blocking, naval convoys/blockades, capacity and stockpile constraints, naval procurement and combat, read-only chat projections, provider response extraction/fallback, and a 24-month logistics/AI run.
- Syntax/build checks passed for the expanded modules and browser client.
- Chromium QA verified explicit solo selection, immediate solo start, template-based official drafting, editable review, immediate private send, AI-government acknowledgment, special-forces deployment, monthly observation update, supply-route/fleet dashboard, and explicitly labeled offline adviser conversation.
- Browser QA found `crypto.randomUUID()` unavailable on the HTTP preview origin; message request IDs now use `crypto.getRandomValues`, and drafting/sending was reverified successfully.
- Optional Responses adapter tested with a stub transport only. No live model credentials or paid API request were used. Live provider behavior is unverified.
- GitHub repository identity/write permission were verified; repository is public/empty, so no source upload was performed under the original private-repository requirement.
- No public deployment, remote CI, Docker build, Safari/iPad verification or full original master-spec acceptance is claimed.

## v0.3 geographic-map validation

- **44 automated tests passed, 0 failed** including four new atlas tests: complete 42-region geometry, selectable territory rendering, exact-owned versus hidden-enemy counts, frozen reconnaissance ranges, and map-control markup/transform behavior.
- `npm run build` passed the buildless syntax/required-file checks.
- Chromium visual QA inspected the geographic map, troop/tank/aircraft/fleet symbols and original coastlines. Pointer territory selection updated the contextual inspector; an undiscovered enemy showed FORCES UNKNOWN. Zoom, sea links and the military-intelligence layer updated correctly.
- Pinch handling is implemented but physical iPad/Safari touch testing remains unverified.
- Public source publication is now explicitly authorized by the user. No production hosting/domain deployment is implied by this upload.

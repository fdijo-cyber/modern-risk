# MODERN RISK

A runnable, dependency-free development foundation for the supplied geopolitical strategy specification. **v0.3 is a working multiplayer slice, not the completed 31-section product.** The full source specification is preserved in `docs/master-specification.md` and each major gap is tracked in `docs/progress.md`.

## Run in two commands

Install **Node.js 24 or later**, unzip this folder, open a terminal in it:

```sh
npm test
npm start
```

Open **http://127.0.0.1:3000**. There is no npm dependency installation or compilation step. Node 24's built-in SQLite persists room data in `data/modern-risk.sqlite` (created automatically). It may emit Node's experimental SQLite warning.

1. Choose **Solo** (starts immediately with every opponent AI) or **Online multiplayer** (2–4 humans, remaining governments AI), then choose a government.
2. Open another browser profile/device, join with its code and a different government.
3. The host starts multiplayer with at least two people. Solo mode needs no second player.
4. Use the atlas and ministries to review and confirm orders.
5. Submit directives in every player session. The host advances the month, or the configured deadline closes planning automatically.
6. Inspect the actual ledger, production schedule, confidential briefing, public news and changed territory controllers.

For devices on the same trusted LAN, bind to `0.0.0.0` and open the server computer's LAN address. Firewall configuration may be necessary.

```sh
HOST=0.0.0.0 npm start
```

Windows PowerShell:

```powershell
$env:HOST="0.0.0.0"
npm start
```

Keep the browser session: its local storage contains the capability token used to rejoin. Clearing browser storage loses that session. Room codes permit joining unclaimed governments while in the lobby; they do not grant access to another player's data. Do not expose this development server directly to the public Internet; production identity, abuse protection, TLS proxy configuration and operational recovery remain to be completed.

## Implemented

- Private-code rooms, 2–4 humans, solo practice, four selectable major powers; unclaimed governments use rule-based AI.
- Original interactive, pannable, zoomable geographic 42-region atlas; country identity is separate from strategic geography. The geography is an original simplified abstraction using classic strategic territory names, not precise national borders.
- Host-controlled and persisted timed monthly resolution; simultaneous departures, contested-target combat, fixed-round victory scoring.
- Six department interfaces, structured confirmed orders and explicit constrained English parser.
- Personnel/tanks/fighters, recruitment and procurement delays, fuel/ammunition consumption, upkeep, readiness, casualties, retreat and capture.
- Income, GDP, treasury, debt, tax, transfers, industrial projects, material reservations and auditable financial entries.
- Trade, alliances, peace, aid, immediate AI accept/reject, mutual human agreement checks and treaty expiration.
- Server-enforced foreign-force privacy, expiring scouting/special-forces estimates, private briefings, public WNN event cards and archived briefings.
- Private official messages, six diplomatic templates, automatic drafting, editable confirmation, immediate delivery, private reply threads and idempotent send requests.
- Special-forces personnel commitments and return schedules; hidden foreign fleet and team lists.
- Depot supply paths, infrastructure/distance/shared-capacity constraints, general supplies/spare parts, convoy delivery and blockades.
- Eight naval vessel classes with procurement delays, fleet movement, abstract naval combat, fuel/ammo use and maintenance.
- Private adviser/AI-government chat, optional OpenAI Responses adapter, explicit offline fallback and provider-independent gameplay.
- Transactional SQLite snapshots, a unique resolution key, optimistic revision checks and restart-recovered deadlines.
- Automated engine, persistence and HTTP multiplayer tests; prepared GitHub Actions workflow, Dockerfile, setup and design documentation.

## Project structure

```text
apps/server/              HTTP API, session authorization and SQLite store
apps/web/public/          Responsive browser client (native ES modules)
packages/game-engine/     Pure deterministic simulation, validation and projections
packages/shared/          Original scenario, adjacency, costs and catalog
 database/migrations/     PostgreSQL adapter target schema (not active runtime)
docs/                     Architecture, rules, original brief and tracked gaps
tests/                    Engine, HTTP integration and atomic storage tests
scripts/check.mjs         Syntax and required-file checks
.github/workflows/ci.yml  Checks, tests and PostgreSQL migration CI
```

## Configuration

The server reads `HOST`, `PORT`, and `DB_PATH` from the environment. `.env.example` documents defaults. It does **not** automatically load a `.env` file. Use `node --env-file=.env apps/server/server.mjs` if desired. No API key is required for core gameplay or template-based communication. Optional language-model drafting and conversations are implemented; set OPENAI_API_KEY and OPENAI_MODEL to enable them. No credentials are bundled. Verified account authentication is still pending.

```sh
npm run check
npm test
npm run build
```

`build` validates this buildless JavaScript application. It is not a TypeScript compiler or production bundler. The recommended React/TypeScript/PostgreSQL stack from the master brief is a later architecture milestone; this standalone edition prioritizes an offline-runnable authoritative vertical slice.

## Saving and deployment

Stop the process before copying `data/` for a simple consistent backup (live WAL backups require SQLite-aware tooling). Restarting the same folder preserves rooms, players, queues and deadlines. An expired deadline resolves on restart. There is no in-game import/rollback UI yet.

Docker instructions are in `docs/deployment.md`. The container requires a persistent volume; it must run as a single authoritative writer. Stateless Vercel/Cloudflare deployment cannot host this SQLite process unchanged.

Public source publication to `fdijo-cyber/modern-risk` is authorized. Deployment remains separate: GitHub Pages cannot host this Node/SQLite backend. See `docs/github-setup.md` and `docs/deployment.md`.

## v0.3 operating notes

Read `docs/v0.3-features.md` for privacy, official-message, logistics/naval, and AI setup details. Online friends need the same reachable server address; this ZIP does not create public hosting. Never paste API keys into the game or a message. Live-provider testing and a production deployment remain pending.

## Geographic map (v0.3)

The map uses 42 original SVG territory paths across six continents, troop counters, tank/aircraft silhouettes, and your own fleet markers. Select a territory or use search; scroll/pinch to zoom, drag to pan, toggle labels/sea links, and change the political/intelligence/terrain/supply layers. Enemy forces remain unknown unless a valid reconnaissance report exists. All map artwork is bundled; external map services are not required.

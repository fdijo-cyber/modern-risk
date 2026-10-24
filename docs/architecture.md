# Architecture and authority

The browser is a view and order-entry client. The Node HTTP server authorizes a room-scoped, random bearer capability and chooses that player's country. No API accepts a country ID as an impersonation parameter. Only host actions use host authorization; hosts receive the same filtered national projection as other players.

The pure engine accepts a JSON snapshot and returns a new snapshot. Seed plus round gives reproducible randomness. It never calls a language model, network or database. Validation is reused for human orders, AI orders and final queue checks. Quantities and money are safe integers. Monetary units are millions of fictional Game USD (coarser than cents, appropriate to this balanced prototype).

The SQLite store keeps room snapshots and a resolution table. The server processes one synchronous simulation at a time; snapshots and the unique `(room, round)` result record commit in one `BEGIN IMMEDIATE` transaction. Optimistic revision checks reject stale writes. On a process crash before commit, no effects persist. After commit, a retry of the same resolution key returns the stored result. No external worker or narrative job is involved.

Timer deadlines and bearer-token hashes are inside snapshots. Plain tokens exist only in the initiating response and browser local storage. Polling every two seconds synchronizes clients; WebSocket/SSE is not implemented. Restart recovers deadlines from the database.

## Data contracts

- Game: version, seed, round, maximum rounds, phase, countries, regions, relations, treaties, public news, battles and history.
- Country: private stockpiles, projects, orders, ledger, briefing archive, domestic indicators and AI profile.
- Region: controller, adjacency, terrain, infrastructure, unrest, readiness and exact deployed personnel/tanks/fighters.
- Order: stable within-round ID, validated action parameters, department and reserved cost.
- Project: paid cost, start and due month, destination, quantity and equipment category.
- Briefing: opening/closing treasury, monthly receipts/maintenance, explicit order results, intelligence and rule-based advice.

## Privacy boundary

`view()` returns only the authenticated country's private object. Enemy region records omit quantities/readiness/infrastructure and contain only public metadata plus that viewer's dated observations. Public government data contains names, colors, GDP and player/AI status. Score totals are deliberately public; raw military/economy factors are not returned. Public battle losses and treaties are eligible news. There are no secret treaties in this version.

## Deliberate development tradeoffs

Native JavaScript, DOM rendering and Node built-ins make the download immediately runnable without package-registry connectivity. This differs from the recommended stack. The target PostgreSQL migration is provided but is not an implemented adapter. The current game is a single-process deployment, not a distributed job architecture. Auth capabilities support a playable room flow but not verified accounts, password recovery, moderation or production identity.

The atlas is an original simplified geographic SVG map of the 42 strategic regions. Region labels identify aggregates and are not sovereignty claims. Costs, ownership, adjacency, major powers and AI profiles are data-driven in `packages/shared/scenario.mjs`.

## v0.2 modules and chat authority

Intelligence, message composition/delivery, logistics, naval operations and optional AI-provider code live in separate packages. The pure round engine remains network-free. Immediate official messages commit through the same room store and use per-player request keys to prevent duplicate delivery. Private immediate directive results are copied into the next monthly briefing.

Model calls are read-only/draft-only and run outside the round transaction. A chat result reloads the newest room snapshot after awaiting the provider so it cannot overwrite concurrent orders or a committed month. Adviser prompts receive only the player projection; foreign representatives receive an even smaller public subset plus correspondence already exchanged. No language-model output can directly mutate resources or execute a treaty.

## v0.3 geographic map

`apps/web/public/atlas.js` is a public geometry dataset with 42 original paths, centers, continent labels and optional sea links. The scenario imports those centers; saved games retain their stable region IDs. `world-map.js` renders only the authorized game projection and implements map interaction. Geometry contains no game secrets. Reference screenshots and image pixels are not embedded in source or the game.

# v0.7.2

- Persistent per-formation health, experience, recovery, terrain familiarity, supply and weaponry now affect Chair combat. Wounds follow movement, reserves, blockades and retreats; depleted formations are removed.
- Sustained combat deals 42–63 health damage per engagement, targeting two to three monthly battles for unsupported formations. Monthly funded recovery is six points, falling to two in a financial crisis.
- Paid training courses and successfully completed training initiatives improve real experience and terrain familiarity without creating troops. AI governments can train and consider their own unit condition when planning attacks.
- New matches default to a one-hour monthly timer; existing room timers remain intact.
- Gemini temporary server failures receive up to two retries. Failure messages report HTTP status without provider bodies or keys and no longer claim a local outcome occurred.
- 125 automated tests and build checks pass.

# v0.7.1

- Short attack decisions infer an adjacent owned origin and available troops; budget pressure scales forces down rather than cancelling an affordable offensive. Chair operations cost $12/group and use reduced game resource costs. War can breach peace/alliance terms with an explicit political penalty.
- The map adds a Plan attack shortcut and brief battle/capture effects with reduced-motion support and no heavy filters.
- AI defenders choose affordable, seeded broadcasts, diplomatic appeals, war-weariness campaigns, reserve surges, national rallies or resource-denial withdrawals. Responses have persistent costs and bounded effects; recovery penalties expire. Autonomous offensives prioritize observed opportunities and contested territory.
- 117 automated tests pass; new cases cover simple orders, scaled budgets, treaty breach, varied deterministic defensive decisions and actual infrastructure recovery costs.

# v0.7.0

- Structured Crisis Chair objective graph, constrained schema correction, persistent historical retrieval and read-only explanations.
- Sealed multiplayer submissions from a common monthly snapshot; batched offensives detach troops before combat, independent of HTTP arrival order.
- Partial-support combined-arms operations, actual phased combat outcomes, paid naval blockades, monthly interdiction and conserved surviving fleets.
- Persistent objective outcomes, exact committed costs, classified reports and public event-backed articles. API failures defer without synthetic completed outcomes.
- All five tabs and existing SQLite/authentication/session mechanisms retained.

# Changelog

## 0.6.0

- Exactly five named tabs, illustrated tabletop SVG board with original cartoon miniatures, private movement animations, flags, labels and conflict markers.
- Same-round AI adjudication with generic persistent initiatives, validated effects, operating costs, delivery risk, site/consent checks and per-clause decisions.
- Immediate diplomatic decisions and human accept/reject/counteroffer inbox; financial reports reconcile action and operating costs.
- Illustrated WNN/private newspaper editions with month/topic filters and full reports; complete Bank ledger and stockpiles.
- Optional Spotify soundtrack side link. Higgsfield sprite generation was requested but refused because the account requires a Basic plan; original SVG artwork remains.
- Expanded persistence, finance, privacy, project lifecycle and live-model verification.

## 0.5.1

- Added native Gemini provider for directives, diplomatic conversations and agreement extraction.
- Added a private .env setup guide and ai:check connection command.
- Explicit invalid-key, quota and unavailable-model notices, with safe local fallback.
- Preserved OpenAI support and added mock Gemini integration regression tests.

## 0.5.0

- Submit once: automatic budget reservations, inferred defaults, per-clause failures and monthly execution; removed editing and double approval from the active client.
- Fifth Public Announcements tab with archived public monthly consequences and confidential private briefings.
- Directive-based war declarations and treaty proposals; chat agreement submission and counterpart consent.
- Contextual diplomatic counteroffers, 30-message live AI history, transparent fallback labels and local `.env` loading.
- Expanded API, settlement, fog-of-war, public archive and model-adapter regression tests.

## 0.2.0

- Explicit solo mode and human multiplayer lobby selection.
- Expiring scouts and personnel-backed special-forces reconnaissance; private foreign fleets/teams and AI observation-based ground attack selection.
- In-game private official messages with six templates, optional model drafting, editable confirmation, immediate delivery, reply references, duplicate-request protection and basic AI acknowledgments.
- Private adviser/AI-government conversations with a server-only optional model adapter and transparent offline fallback.
- Depot supply routes, shared capacity/distance, spare parts/general supplies, naval convoys, blockades and shortage effects.
- Eight naval ship classes, production delays, fleets, movement, abstract naval combat, ammunition/fuel and maintenance.
- Expanded tests and operating/limitation documentation. No claim that the entire original specification is complete.

## 0.1.0

- Authoritative deterministic playable multiplayer foundation, original 42-region schematic atlas, ministries, procurement, combat, national ledger, treaties and private/public reporting.

## 0.3.0

- Replaced schematic hex tiles with original hand-drawn SVG geography for all 42 classic strategic regions.
- Added geographic territory selection, visible troop counters, tank/aircraft silhouettes, private fleet markers, sea links, country colors and four map layers.
- Added pointer pan, wheel zoom, pinch zoom, region search, label toggles, fullscreen and contextual force/intelligence inspector.
- Preserved authoritative troop privacy and frozen reconnaissance estimates in every map layer.
- Public GitHub source publication explicitly authorized by the user, superseding the original private-repository requirement.

## 0.4.0

- Replaced the ministry-heavy interface with Map, Presidential Office, Bank, and Foreign Affairs.
- Added a single prose-directive workflow with review/edit, explicit assumptions, executable guards, presidential consent and separate Bank resource authorization.
- New simplified matches start every government at $1,500 and use six grouped unit types, seven building types, oil/fuel costs and monthly upkeep.
- Rebuilt the active map as 42 unfiltered paths with frame-scheduled camera updates and a stable DOM; added 28 strategic trade/economic markers.
- Fixed typing loss by retaining editors, saving per-room local drafts and avoiding page rebuilds on revision polling.
- Added messenger-style diplomacy, chat-derived agreement proposals, two-party approvals, transfers, recurring trade and loan effects.
- Preserved existing advanced saves and engine/tests. Complex live AI interpretation remains configurable rather than falsely presented as active offline.

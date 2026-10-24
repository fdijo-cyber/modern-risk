# Development status — v0.3

GitHub: complete v0.3 source published on public main at fdijo-cyber/modern-risk. Deployment: not configured. This file describes functioning code, not aspiration.

## Delivered and verified locally

- Independent deterministic engine, original 42-region scenario, resources and private projections.
- Host/join/practice flow, room capabilities, human readiness, monthly advancement and timer recovery.
- Queued structured directives, resource reservations, constrained text interpretation and confirmation UI.
- Ground/air quantities, aggregate logistics, scheduled procurement, production, maintenance, combat, retreat and captures.
- National cash ledger, GDP, debt, taxes, industry, resource output and transfers.
- Rule-based government development and opportunistic attacks; diplomacy acceptance/rejection and human reciprocal consent.
- Ministry dashboards, geographic atlas, private briefing archive, public WNN cards and score totals.
- SQLite transactional snapshots and duplicate-round key, Docker definition and GitHub CI definition.

## Master-spec coverage and explicit remaining work

| Sections | Implemented slice | Remaining work |
|---|---|---|
| 1–2 Mission/architecture | State-backed engine and UI | React/TypeScript migration, PostgreSQL adapter, durable distributed workers |
| 3 Menu/rooms | Create/join/practice, limits, rounds, deadline, AI selector | Verified account auth, pause/resume, host transfer, room list, in-game restore, full advanced settings |
| 4 Map | 42 original geographic SVG territory shapes, pan/zoom/select, four layers | Precise real-world borders, remaining map layers, route planning and richer formations |
| 5 Monthly turns | Planning/submission, deterministic resolution, private/public reports | Separate durable worker phases and full dependency scheduler |
| 6 Departments | Six functional order-entry areas and queue | Complete department histories and all remaining actions |
| 7 Free text | Explicit English grammar and confirmation | General LLM parser, ambiguity follow-up, conditionals and continuing directives |
| 8 Military | Personnel, tanks, fighters per region; eight naval vessel types in separate fleets | Named land formations, reserves, artillery and complete equipment statistics |
| 9 Logistics | Depot routes, shared capacity/distance, fuel/ammo/spares/supplies, convoy access and blockades | Detailed extraction/material classes, encirclement effects and broader logistics balancing (routes, distance/capacity, spares and blockades are now implemented) |
| 10 Combat | Seeded terrain/readiness combat, retreat/capture | Weather, air superiority, planning, fortifications, air/naval missions and full multi-party model |
| 11 Economy | Cash ledger, GDP, tax, debt, industry | Inflation, unemployment, tariffs, sanctions and comprehensive budgets |
| 12 Production | Paid timed projects/material reservations | Specialized factories, shipyards, extraction, energy and detailed material requirements |
| 13 Diplomacy | Trade/aid/alliance/peace | Counteroffers, revenue-share contracts, territorial settlements, sanctions, live negotiations |
| 14 AI governments | Legal deterministic economic/recruitment/opportunistic actions | Rich utility model, diplomacy initiation, five meaningfully tuned strategies and LLM adapters |
| 15 Advisers | Read-only monthly advice plus private adviser/government conversation UI and optional model adapter | Five specialist adviser personas, forecasting and live-provider validation (grounded chat adapter/UI now implemented) |
| 16 Fog/intelligence | Server-filtered forces/fleets/teams, scouting, expiring observations and deployed special-forces teams | Richer confidence evolution, covert influence operations and counterintelligence |
| 17 WNN | Public event cards from committed records | Illustrated anchors, newsroom animation, speech and richer infographics |
| 18 Briefings | Per-player ledger/results/advice/archive | Full eight-section structured reporting and detailed stockpile change tables |
| 19–22 UX/audit/settings | Responsive ministries, queue, briefings and audit IDs | Complete remaining detailed requirements, accessibility audit and player preferences |
| 23 Victory | Fixed-round weighted scoring | Sustained early victory, configurable weights and exploit/balance review |
| 24 Balancing | Data-driven scenario/costs and 24-round smoke test | Statistical matchup simulations, parameter tuning and scenario editor |
| 25 Performance | No external AI latency, one transaction per round | Load tests, incremental storage, WebSocket subscriptions and multi-process jobs |
| 26 Testing | Engine/store/HTTP coverage | Full browser E2E, adversarial security audit, PostgreSQL runtime tests, high concurrency |
| 27 Roadmap | Runnable end-to-end vertical slice | Finish remaining milestones in development-roadmap.md |
| 28 Complete scenario | Supported orders individually work | Exact full acceptance scenario awaits richer military, spending and alliance systems |
| 29–30 Product | Source, setup, tests and honest feature ledger | Release-readiness of complete specified product |
| 31 GitHub | Public repository, complete source on main, clean-clone verification, passing remote CI | Ongoing feature PRs, branch protection and deployment |

## Known limitations

- Browser visual QA status is recorded in validation.md. Automated syntax checks do not prove pixel-perfect layout.
- Simple national output and combat rules are intentionally incomplete and not competitively balanced.
- Difficulty 1–2 both avoid opportunistic attacks; 3–5 enable them. Five labels exist but five distinct decision-quality levels do not yet exist.
- Same-month conflict resolution is ordered by target and seeded initiative, not a continuous-time combat simulation.
- Session recovery relies on browser local storage. There is no reset, account restore or reconnect-token entry UI.
- SQLite snapshots grow with history. One process/single writer only. Backup and restore need operational care.
- Public battle losses, treaties, GDP and aggregate score are visible. Enemy treasury, exact forces, orders and briefings are filtered from API responses.
- Arbitrary free text is rejected with grammar examples. The optional language-model adapter exists but no provider credentials are configured by default; live calls remain unverified.

## Next priorities

1. Expand meaningful edge-case coverage for three-sided fights, lost origins and production interruption.
2. Replace capability-only sessions with production identities and rate/abuse controls appropriate to hosting.
3. Implement PostgreSQL repository adapter and durable round workers before distributed deployment.
4. Introduce named land formations, finish the equipment catalog and deepen logistics routing.
5. Validate live-provider conversations and expand specialist advisers after mechanical rules stabilize.
6. Refine geographic artwork, add full WNN presentation, complete accessibility/tablet QA and balance simulations.

Latest validated source commit: `1f10d00a91394ea3b827d50a86323f770b1613a2`. Clean clone: 44 tests and build passed. GitHub Actions run 40142123298 passed both validation and PostgreSQL migration jobs. See validation.md for local checks. The complete original prompt is retained without silently dropping requirements.

## v0.2 completed additions

- Explicit solo start (one human only, every other government AI) and multiplayer capacity/entry rules.
- Exact foreign troops, equipment, fleets and special-forces missions remain absent from other players’ API responses, including hosts.
- Standard scouting creates private expiring personnel ranges. Special-forces reconnaissance commits actual personnel for three observations, adds equipment ranges, then returns survivors.
- AI governments use their own observations when selecting ground attacks rather than reading exact foreign strength.
- Private official-message directives with templates, request-based drafting, editable review, immediate sending, reply references and duplicate-request protection. Human correspondence is delivered only to the intended government; AI recipients acknowledge without creating commitments.
- Depot/route logistics, capacity/distance and stockpile constraints, spares/general supply, readiness penalties and recorded tank breakdowns. Convoy ships can support isolated coasts; hostile blockades interrupt that route.
- Frigates, destroyers, submarines, carriers, patrol vessels, transports, amphibious and logistics ships; production delays, fleet movement, abstract combat, fuel/ammo and maintenance.
- Grounded adviser and foreign-AI conversation UI, optional OpenAI Responses adapter, private conversation history, server-only credentials and labeled deterministic fallback.

Still incomplete: the whole original master specification. Advanced naval aviation, amphibious landings, land formations, production accounts, PostgreSQL runtime, security/load hardening, rich WNN artwork and live hosting are not claimed complete. See v0.2-features.md.

## v0.3 map and public-source update

Original geographic SVG paths now replace all hex tiles. The classic 42-region topology remains unchanged; the map is interactive with counters, unit/fleet symbols, search, four layers, sea links, labels, keyboard selection, pan, wheel zoom, pinch handling and fullscreen. Frozen enemy estimates remain separate from live counts. Public repository publication is explicitly authorized, overriding the original private-only requirement. Hosting and domain setup remain separate.

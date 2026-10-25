# v0.7.1 — Faster game decisions and adaptive war responses

A short “Attack Central America” order is sufficient for the Chair. Missing origins select an adjacent owned territory, missing formations select available forces, and unaffordable commitments are reduced with ground troops taking priority. An explicitly named origin/target is preserved; no resources or units are created. Geography, actual available troops and minimum funding still matter. Starting an operation is easier; victory is not guaranteed. Chair attacks now cost $12 per committed group instead of $20, with oil/fuel multipliers of 0.75 rounded up per group. Conventional fictional aggression is treated as legitimate gameplay, rather than rejected for moral objections. Real-world operational harm instructions remain outside this simulation.

An attack or war declaration can violate an existing peace/alliance. The agreement becomes violated and the attacker loses three political-index points per breached agreement. This replaces a hard veto with a recorded game consequence.

The map’s **Plan attack** button fills a short directive for confirmation in Presidential Office. New public combat events drive brief target ripples, flashes and capture captions. The renderer creates each effect once per mounted map, bounds visible effects and respects reduced-motion preferences. It exposes no hidden inventory. Physical iPad FPS has not been measured.

AI defenders choose from worldwide broadcasts, diplomatic appeals, war-weariness campaigns, emergency reserve deployments, domestic rallies and scorched-withdrawal resource denial. Selection uses scenario seed, month, actual treasury, reserve availability and whether territory was captured. An AI responds at most once per attacker per month; a human government is not automatically controlled. Responses charge real dollars and, where applicable, fuel/oil. They appear in correspondence and public committed events. Political/social effects are bounded, and migration pressure is a simulated indicator rather than guaranteed civilian movement or a source of troops.

Resource denial can remove one captured industrial installation, reduce occupation readiness and impose a $25 monthly recovery expense through the following month. It costs the retreating government $35 plus five oil and five fuel, so it is neither free nor permanent. Reserve deployments transfer real personnel from reserve. Broadcast reach can fail; appeals do not fabricate foreign consent. Autonomous AI offensives now vary their timing, use recorded reconnaissance and prioritize lost/contested frontier opportunities.

Validation: 117 automated tests and build checks pass. The current five-objective fixture spends $402, 18 oil, 24 fuel and seven ammunition; its invasion still loses. This is deliberately easier to commence, not an automatic-win mode. Provider interpretation is tested with deterministic transport fixtures; no new live Gemini call is claimed.

---

# Crisis Chair — v0.7

## Active workflow

`POST /api/simple/submit` calls `prepareChair`, then `submitChair`. The old `interpretLongDirective` fixed-action prompt is no longer the production submission route. `chair.mjs` preserves named objectives and conditional dependencies as declarative proposals. Novel institutions, policies and research use the existing budget-bounded initiative primitives; arbitrary executable effects are forbidden.

The schema separates a historical question, an executable directive and a deferred provider failure. A directive has 1–40 ordered objectives, IDs, titles, dependencies, optional outcome branches and proposed orders. IDs must be unique, dependencies must reference previous objectives, destinations/governments must exist, quantities must be valid catalog groups, budgets must use game dollars, and effects must use authorized statistical primitives. A malformed proposal receives one constrained correction request with the actual treasury, fuel, oil, owned formations and valid governments. A second invalid response is deferred, without fictional success. There is no keyword-execution fallback on provider failure. Players keep their draft.

The new source limit is 32,000 characters. Clauses cannot manufacture the inventory, consent, currency backing or foreign control asserted in their prose. Unknown ideas remain representable through funded, persistent institutions and projects; not every real-world mechanism is independently modeled.

## Monthly fairness and combat

In solo play, a directive resolves immediately in its current month. In multiplayer, submission returns a sealed decision awaiting the shared monthly settlement. The snapshot is captured at month start (or lazily for an existing save), and all human proposals retrieve that same authoritative snapshot. The host advances after players mark ready; the existing persisted timer can also close the month.

Country/plan-key ordering, seeded uncertainty and objective waves make results independent of HTTP arrival order. All offensives in a wave are funded, their actual formations detached, and then combat resolved together. A prior attack can unlock a dependent objective in another wave of the same month. The same-country budgets and formations remain reserved while parallel offensives are funded. Noncombat conflicting commitments use a stable country/plan-key tie-break, not HTTP order. This is a documented deterministic priority rule, not a promise that incompatible claims can all succeed.

Independent AI governments also submit paid development, mobilization, scouting and intelligence-supported offensive programs through this settlement. Their autonomous policy is a deterministic self-interest policy, not an extra live Gemini conversation on every monthly tick. Direct foreign-affairs conversations and human treaty consent remain available through the existing bilateral workflow; actual resources are revalidated at settlement if those obligations changed since the snapshot.

An operation uses its intended origin/target and clips unavailable support to actual available deployed groups, with explicit adjustments. An enemy destination becomes an attack. Naval bombardment and air-superiority phases have capability checks and recorded numerical effects; ground combat uses terrain, readiness, fortifications, national advantages and seeded uncertainty. Successful occupation lowers readiness and creates a social burden. Failed offensives still spend money, oil, fuel and ammunition and suffer recorded losses; surviving formations return. Existing formation sizes are retained, so casualty resolution is in whole groups, with exact personnel/equipment equivalents, not individual wounded-person simulation.

A blockade must have an adjacent foreign coast and an owned coastal origin. It commits real naval formations, spends money/oil/fuel/ammunition, can be repelled with losses, establishes war, reduces actual monthly revenue while active, and returns survivors on expiration. Active patrols count toward national deployed forces, supply need and upkeep. The public map shows an interdiction marker; exact enemy fleet inventory remains private.

An ultimatum costs $5 and creates actual correspondence. AI governments decide using the relative recorded force balance and seeded independent willingness. A refusal can immediately activate the authorized invasion branch. A human government is never automatically recorded as consenting or refusing: such a branch remains continuing until a genuine decision is available. Foreign Affairs exposes accept/refuse controls to the actual recipient. A real reply resumes only the previously authorized matching branch, sealed into the current month in multiplayer. Because human decisions require player input, a reply received after month closure resolves in that later month; it is never retroactively invented.

## Memory, reporting and persistence

The state retains `chairRecords`, `chairAdjudications`, `chairArticles`, `blockades` and the locked `chairRound` submission set. They are additive optional JSON fields inside the existing SQLite room snapshot. No destructive SQL migration or database reset is required. Existing sessions, room revision checks and the unique monthly transaction key remain in use.

Historical retrieval selects relevant dated own decisions, battle reports and briefings using query terms and recency. It supplies own resources, actual authorized deployments/intelligence, policies/projects, bilateral correspondence and recent public history. The engine independently accesses real defending forces; the model cannot directly write world state. Questions beginning with why/explain/what happened and the explicit history endpoint use read-only historical explanations. A specified month is respected for military-history queries.

Every settled objective has a recorded outcome, details and committed financial/resource effects. Private reports include per-directive changes plus national inventory changes for the monthly submission set, covering casualties from incoming attacks. These records are projected only to the owning player. Public WNN articles are generated from public committed event records and reuse the existing newspaper illustrations. Article context is conservative and reusable rather than live AI journalism: no unrecorded international reaction or secret operation is asserted as public fact. Richer bespoke journalism and broader reactive political actor simulation remain future work.

## Verification

`npm run chair:check` runs the new acceptance suite. The combined test passes a structured response through the Chair schema, then resolves an ultimatum, an invasion with unavailable bomber support, a naval blockade, a development-bank investment and a national policy. It checks actual force/resource/treasury changes, wars, persistent institutions/policies, map projection, a public article, private numerical reporting, SQLite save/reload and next-month memory. It then asks why the invasion failed and proves there are no new state effects.

Additional checks reverse multiplayer submission arrival order, verify constrained corrections and safe provider failure, preserve unrelated older directives during an unaffordable attack, check failed-attack costs and phase reports, verify blockade revenue/expiry/formation conservation, and confirm paid independent government decisions. HTTP integration uses a test-only Gemini transport fixture (never loaded in production), checks sealed submission/idempotency/private projections and performs real authenticated SQLite-backed monthly settlement.

This release is verified with deterministic model fixtures, not a new live Gemini call or a physical iPad performance measurement. Configure your private API key in the server `.env`; no key is included in source. Hosting/deployment and previously documented Higgsfield account limitations remain unchanged.

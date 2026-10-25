# MODERN RISK — v0.6

An illustrated 42-territory Risk board combined with an AI-adjudicated MUN crisis simulation. Exactly five main tabs: **Map & Public News**, **Presidential Office**, **Foreign Affairs**, **Bank**, and **Announcements & Reports**. Existing multiplayer rooms and SQLite records are preserved.

## Run

Requires **Node.js 24+**. No external npm packages or compilation are needed.

```sh
git clone https://github.com/fdijo-cyber/modern-risk.git
cd modern-risk
npm test
HOST=0.0.0.0 npm start
```

Open http://localhost:3000 on the server computer. Friends on the same Wi-Fi use the computer's local IP with port 3000, for example http://192.168.8.101:3000. Choose solo or multiplayer, create/join a room and select a government.

Existing installations: stop the server, `git pull --ff-only`, then restart. Start a **new match** for the v0.4 $1,500 rules. Older advanced-rule matches remain in the database; the simplified client does not rewrite their money or force counts.

## Play loop

1. Explore the illustrated board. Select cartoon formations for exact personnel, vehicle and vessel counts, readiness and supply stocks. Enemy forces remain hidden until scouted. The board supports pan/zoom, owner colors, flags, conflict markers, private movement arrows and transitions. An optional Spotify link sits beside it.
2. Write a multi-paragraph directive in **Presidential Office** and confirm submission. The AI evaluates the intention, capabilities, funding, logistics, diplomatic implications, timing and risk. No command template is required.
3. Immediate actions settle **during the current round**. Novel institutions, policies and scientific/infrastructure ideas can become persistent initiatives with budget, implementation period, operating cost, risk, progress, history and measurable effects. Unfeasible clauses receive a reasoned decision while feasible clauses continue.
4. The engine validates every proposed effect. It can revise custom policy/building/action labels into generic initiatives; it cannot mint troops, grant free treasury or transfer ownership through an invented effect. Physical operations still require actual units, funds and geographical access.
5. Advance the month when all humans are ready. Ongoing initiatives progress, recurring bills and loans are paid, production and trade income arrive, supplies/readiness update, and delivery outcomes are recorded. Losing a site or operating funds suspends a project. Foreign-site work requires host permission; unused denied/expired escrow is refunded.
6. Negotiate in **Foreign Affairs** and submit terms for an immediate AI response or a human inbox decision. Accept, reject or counteroffer. Active agreements have actual transfers, debt, trade income or attack restrictions; chat itself does not invent a treaty.
7. **Bank** shows treasury, debt, investments, trade/production/project income, resource stocks and the complete filterable ledger. Monthly financial reports reconcile all same-round spending and recurring costs.
8. **Announcements & Reports** is an illustrated WNN newspaper and private briefing archive, with month/topic/edition filters and full-article dialogs. It reports actual recorded decisions, projects, conflicts and intelligence; secret projects and private decisions are excluded from other players' projections.

## Compact rules

Every government starts with **$1,500**, 100 oil and 100 fuel. Prices are fictional game dollars, not millions or billions.

| Group | One unit represents | Recruitment |
|---|---|---:|
| Infantry | 1,000 personnel | $60 |
| Armor | 120 tanks | $140 |
| Bombers | 6 bomber aircraft | $220 |
| Fighter jets | 12 aircraft | $180 |
| Warships | 3 vessels | $200 |
| Special forces | 100 personnel | $100 |

Seven buildings: air base, naval base, economic center, trade port, military factory, oil refinery, intelligence center. The in-game catalog lists all prices and monthly effects. Direct builds and recruitment settle immediately when validated; long-term novel initiatives progress monthly. A naval group represents two surface warships and one submarine; submarine missions are not simulated as an independent unit type.

Novel ideas use a general initiative/effect schema rather than requiring one handler per idea. The current validated effect primitives cover economic/political/social/research/counterintelligence/readiness scores, funded productivity income and fortifications. Ideas can be imaginative; their simulated consequences remain measurable and budgeted. Unverified external conditions can establish a conditional mandate with escrow, rather than being silently ignored. The engine does not implement an unrestricted real-world simulator.

## Map and performance

The original 42-territory world map is retained, but the active renderer uses **one path per territory**, no SVG filters, and `requestAnimationFrame` for camera changes. Polling checks revisions and returns HTTP 204 for unchanged state. Remote updates patch the existing map instead of recreating it. Editor nodes persist, and unsent text is stored locally per room; polling never replaces a typed draft.

Trade-route markers include 28 representative chokepoints and economic sites: Hormuz, Gibraltar, Suez, Malacca, Bab el-Mandeb, Panama, Bosporus, Dardanelles, Dover, Danish/Korea/Taiwan Straits, Sunda, Lombok, Bering, Magellan, Kiel, major commercial centers and the Cape route. Controlling the modeled linked regions produces a disclosed monthly bonus. These are simplified strategic locations, not an exhaustive nautical chart.

## Live AI

Gemini and OpenAI are supported. For a Google AI Studio key, follow [the Mac setup guide](docs/gemini-setup.md). Set `AI_PROVIDER=gemini`, `GEMINI_API_KEY`, and optionally `GEMINI_MODEL` (default `gemini-3.1-flash-lite`) in your local `.env`. Run `npm run ai:check`, then restart the server. This powers narrative directives, diplomatic replies and agreement extraction through the same adapter.

For OpenAI, set `AI_PROVIDER=openai`, `OPENAI_API_KEY` and `OPENAI_MODEL`. Without an explicit provider, a configured Gemini key selects Gemini; otherwise OpenAI remains the default. Keys remain server-side, are sent only in authentication headers and are never included in room views. Missing credentials, rate limits and provider failures produce explicit local fallback notices. Free-tier eligibility and quotas are controlled by Google; enabling a paid project can incur charges. The adapter is covered by mock transport tests. A live Gemini adjudication was also verified on an imaginative three-paragraph directive without storing its key in the repository.

Offline mode handles common movement, recruitment, buildings, scouting, messages, loans, and policy prose, with disclosed defaults. It cannot faithfully interpret unlimited arbitrary prose. The AI interprets; authoritative server rules calculate costs, validate resources and settle authorized immediate actions and persist long-term projects.

## Storage and deployment

Rooms, messages, directives and monthly results persist in `data/modern-risk.sqlite`. Keep the Mac awake while hosting. Use a persistent disk with a long-lived Node/Docker host for Internet play; **GitHub Pages cannot run the multiplayer server**. A Dockerfile is included. No public host/domain is deployed.

Server configuration: `HOST`, `PORT`, `DB_PATH`. `.env.example` documents optional settings. A local `.env` file is automatically loaded at startup. Copy `.env.example` to `.env`, add your API key and chosen available model, then restart. Do not commit `.env`. Back up SQLite only with the process stopped or SQLite-aware backup tooling.

## Development

```sh
npm test
npm run build
```

The build command validates native JavaScript and required files; it is not a React bundle. The previous advanced engine and regression tests remain for older records. New UI and new matches use `packages/simple-engine/`, `simple-rules.js`, and `simple-map.js`. See `docs/v0.6-crisis-sandbox.md` for current behavior, effect bounds, validation and remaining limitations. Older version documents are historical.

## National forces and reserves

Every government starts with **30–32 total groups across deployed and reserve inventories**, not 30–32 in every territory. Presidential Office shows six columns for each owned region, a separate national reserve row, and total inventory. Reserves cannot move/attack until mobilized through the same automatic paid directive workflow; returning deployed groups to reserve also has a small cost. Aircraft mobilization requires an air base; warships require a coastal naval base.

| Government | Infantry | Tanks | Special forces | Fighters | Warships | Bombers | Total | Advantage |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| United States | 8 | 5 | 3 | 7 | 5 | 4 | 32 | Fighter/bomber combat power +10% |
| European Coalition | 10 | 6 | 4 | 4 | 4 | 3 | 31 | Monthly domestic income +10% |
| China | 13 | 8 | 2 | 4 | 3 | 2 | 32 | Recruitment cost −10% |
| Russia | 8 | 10 | 3 | 3 | 3 | 4 | 31 | Tank combat power +15% |

AI minor governments have deterministic 30- or 31-group defense, maritime or commercial profiles, with a disclosed infantry/naval/income bonus. These are fictional balance profiles, not real military inventories. After recruitment/losses the national total can change.

Examples in the Office: “Mobilize two infantry units from reserve to Alaska.” “Return one tank unit from Alaska to reserve.” Both interpretations show dollar/oil/fuel costs before approval.

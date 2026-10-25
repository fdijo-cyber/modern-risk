# MODERN RISK — v0.5

A small, directive-first geopolitical strategy game. The main interface has **five tabs**: Map, Presidential Office, Bank, Foreign Affairs, and Public Announcements.

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

1. Inspect the map, owned-region forces and national reserves. Enemy units stay hidden until scouted.
2. Write a directive once in **Presidential Office**, then **Submit directive**. The interpreter infers missing details and schedules feasible actions without clarification or editing screens. Every assumption and rejected clause appears in the receipt.
3. **Bank** shows automatically reserved dollars, oil and fuel. No second funding approval is needed. Impossible or unaffordable clauses are reported, while feasible clauses can continue.
4. Ready every player, then **Advance month**. Scheduled moves, investments, messages, recruitment and policies settle automatically. Presidential Office shows exact private outcomes and the paid ledger appears in Bank.
5. **Public Announcements** archives a monthly crisis briefing with named places, completed projects, actual spending/effects, war declarations, battle outcomes and activated treaties. Reconnaissance, troop inventories and private messages remain confidential.
6. Talk in **Foreign Affairs**. Live AI reads the last 30 messages and negotiates concrete terms. The visible local negotiator is used without a provider; it makes contextual counteroffers and remembers the prior offer. Chat alone never transfers money. **Submit agreement** queues a formal proposal; each human counterpart consents using **Accept agreement**, then advances their month.
7. Declare war by writing “Declare war on Russia” or use the **Declare war** shortcut in Foreign Affairs. The shortcut fills the single Office composer. Troop movements require a directive; a declaration alone does not invent an invasion force.

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

Seven buildings: air base, naval base, economic center, trade port, military factory, oil refinery, intelligence center. The in-game catalog lists all prices and monthly effects. New buildings and recruited groups become available during the next funded monthly resolution.

Policies cover economic, political, social and intelligence programs through bounded game effects. Complex ideas such as currency reform are abstract policy proposals; a narrative does not magically create real reserves, currencies, malware, assassinations or guaranteed enemy losses. Unsupported objectives or conditions receive a failure report, with no follow-up questions. Interpretation cannot create game mechanics that do not exist.

## Map and performance

The original 42-territory world map is retained, but the active renderer uses **one path per territory**, no SVG filters or shadows, and `requestAnimationFrame` for camera changes. Polling checks revisions and returns HTTP 204 for unchanged state. Remote updates patch the existing map instead of recreating it. Editor nodes persist, and unsent text is stored locally per room; polling never replaces a typed draft.

Trade-route markers include 28 representative chokepoints and economic sites: Hormuz, Gibraltar, Suez, Malacca, Bab el-Mandeb, Panama, Bosporus, Dardanelles, Dover, Danish/Korea/Taiwan Straits, Sunda, Lombok, Bering, Magellan, Kiel, major commercial centers and the Cape route. Controlling the modeled linked regions produces a disclosed monthly bonus. These are simplified strategic locations, not an exhaustive nautical chart.

## Live AI

Gemini and OpenAI are supported. For a Google AI Studio key, follow [the Mac setup guide](docs/gemini-setup.md). Set `AI_PROVIDER=gemini`, `GEMINI_API_KEY`, and optionally `GEMINI_MODEL` (default `gemini-3.1-flash-lite`) in your local `.env`. Run `npm run ai:check`, then restart the server. This powers narrative directives, diplomatic replies and agreement extraction through the same adapter.

For OpenAI, set `AI_PROVIDER=openai`, `OPENAI_API_KEY` and `OPENAI_MODEL`. Without an explicit provider, a configured Gemini key selects Gemini; otherwise OpenAI remains the default. Keys remain server-side, are sent only in authentication headers and are never included in room views. Missing credentials, rate limits and provider failures produce explicit local fallback notices. Free-tier eligibility and quotas are controlled by Google; enabling a paid project can incur charges. No live credentials were supplied during development; adapter requests are verified with mock transports.

Offline mode handles common movement, recruitment, buildings, scouting, messages, loans, and policy prose, with disclosed defaults. It cannot faithfully interpret unlimited arbitrary prose. The AI interprets; authoritative server rules calculate costs, validate resources and execute scheduled actions when the month advances.

## Storage and deployment

Rooms, messages, directives and monthly results persist in `data/modern-risk.sqlite`. Keep the Mac awake while hosting. Use a persistent disk with a long-lived Node/Docker host for Internet play; **GitHub Pages cannot run the multiplayer server**. A Dockerfile is included. No public host/domain is deployed.

Server configuration: `HOST`, `PORT`, `DB_PATH`. `.env.example` documents optional settings. A local `.env` file is automatically loaded at startup. Copy `.env.example` to `.env`, add your API key and chosen available model, then restart. Do not commit `.env`. Back up SQLite only with the process stopped or SQLite-aware backup tooling.

## Development

```sh
npm test
npm run build
```

The build command validates native JavaScript and required files; it is not a React bundle. The previous advanced engine and regression tests remain for older records. New UI and new matches use `packages/simple-engine/`, `simple-rules.js`, and `simple-map.js`. See `docs/v0.5-automatic-directives.md` for the current automatic submission behavior. `docs/v0.4-directive-game.md` describes the older approval workflow.

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

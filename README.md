# MODERN RISK — v0.4

A small, directive-first geopolitical strategy game. The main interface has **four tabs**: Map, Presidential Office, Bank, and Foreign Affairs.

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

1. Inspect the map and your visible unit groups. Enemy units remain hidden until scouted.
2. Write a directive in **Presidential Office**. Ordinary prose and explicit conditions are supported by the optional AI interpreter; offline interpretation supports common named-region actions and abstract policy programs.
3. Review the actions, inferred assumptions, dollars, oil, fuel and recurring costs. Adjust the interpretation or reject it.
4. Approve the directive in the Office, then **authorize funding in Bank**. Resources and unit groups are reserved without being spent twice.
5. Ready every player and advance the month. Outcomes, paid costs and private briefing come from the committed simulation.
6. Negotiate in **Foreign Affairs**, then extract a proposed agreement from the conversation. Each human government must separately approve the agreement directive and Bank funding. Chat alone never creates a treaty or payment.

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

Policies cover economic, political, social and intelligence programs through bounded game effects. Complex ideas such as currency reform are abstract policy proposals; a narrative does not magically create real reserves, currencies, malware, assassinations or guaranteed enemy losses. Unsupported or ambiguous conditions need clarification.

## Map and performance

The original 42-territory world map is retained, but the active renderer uses **one path per territory**, no SVG filters or shadows, and `requestAnimationFrame` for camera changes. Polling checks revisions and returns HTTP 204 for unchanged state. Remote updates patch the existing map instead of recreating it. Editor nodes persist, and unsent text is stored locally per room; polling never replaces a typed draft.

Trade-route markers include 28 representative chokepoints and economic sites: Hormuz, Gibraltar, Suez, Malacca, Bab el-Mandeb, Panama, Bosporus, Dardanelles, Dover, Danish/Korea/Taiwan Straits, Sunda, Lombok, Bering, Magellan, Kiel, major commercial centers and the Cape route. Controlling the modeled linked regions produces a disclosed monthly bonus. These are simplified strategic locations, not an exhaustive nautical chart.

## Live AI

Set **OPENAI_API_KEY** and **OPENAI_MODEL** in the server environment to enable broad narrative interpretation, general diplomatic replies and AI extraction of agreement terms. Never enter keys in the browser or commit them. Missing credentials/provider failures produce explicit offline mode. No live model call is included in automated verification; the provider contract is tested with a mock transport.

Offline mode handles common movement, recruitment, buildings, scouting, messages, loans, and policy prose, with disclosed defaults. It cannot faithfully interpret unlimited arbitrary prose. The AI proposes; authoritative server rules calculate costs, validate resources and execute approved actions.

## Storage and deployment

Rooms, messages, directives and monthly results persist in `data/modern-risk.sqlite`. Keep the Mac awake while hosting. Use a persistent disk with a long-lived Node/Docker host for Internet play; **GitHub Pages cannot run the multiplayer server**. A Dockerfile is included. No public host/domain is deployed.

Server configuration: `HOST`, `PORT`, `DB_PATH`. `.env.example` documents optional settings. Environment files are not auto-loaded; use `node --env-file=.env apps/server/server.mjs` if needed. Back up SQLite only with the process stopped or SQLite-aware backup tooling.

## Development

```sh
npm test
npm run build
```

The build command validates native JavaScript and required files; it is not a React bundle. The previous advanced engine and regression tests remain for older records. New UI and new matches use `packages/simple-engine/`, `simple-rules.js`, and `simple-map.js`. See `docs/v0.4-directive-game.md` for precise approval/resource/condition semantics and current limits.

## National forces and reserves

Every government starts with **30–32 total groups across deployed and reserve inventories**, not 30–32 in every territory. Presidential Office shows six columns for each owned region, a separate national reserve row, and total inventory. Reserves cannot move/attack until mobilized through the same paid directive/Bank workflow; returning deployed groups to reserve also has a small cost. Aircraft mobilization requires an air base; warships require a coastal naval base.

| Government | Infantry | Tanks | Special forces | Fighters | Warships | Bombers | Total | Advantage |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| United States | 8 | 5 | 3 | 7 | 5 | 4 | 32 | Fighter/bomber combat power +10% |
| European Coalition | 10 | 6 | 4 | 4 | 4 | 3 | 31 | Monthly domestic income +10% |
| China | 13 | 8 | 2 | 4 | 3 | 2 | 32 | Recruitment cost −10% |
| Russia | 8 | 10 | 3 | 3 | 3 | 4 | 31 | Tank combat power +15% |

AI minor governments have deterministic 30- or 31-group defense, maritime or commercial profiles, with a disclosed infantry/naval/income bonus. These are fictional balance profiles, not real military inventories. After recruitment/losses the national total can change.

Examples in the Office: “Mobilize two infantry units from reserve to Alaska.” “Return one tank unit from Alaska to reserve.” Both interpretations show dollar/oil/fuel costs before approval.

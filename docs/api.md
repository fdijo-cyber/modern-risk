# HTTP API, v0.2

JSON requests/responses. Errors currently return HTTP 400 with `{ "error": "message" }`; status-code refinement is pending. Request bodies are limited to 16K characters and local abuse control caps each socket address at 299 requests per minute. All game actions require `Authorization: Bearer <session-token>` except create/join. Never put tokens in URLs.

| Method | Route | Payload / behavior |
|---|---|---|
| POST | /api/create | name, roomName, country, maxPlayers, timer, maxRounds, difficulty; returns token and lobby |
| POST | /api/join | code, name, country; returns a new player token |
| GET | /api/state?code=CODE | Player-filtered room/game snapshot |
| POST | /api/start | code, optional practice=true; host only |
| POST | /api/order | code, order; validates and queues confirmed directive |
| POST | /api/cancel | code, id; removes that player's queued directive |
| POST | /api/interpret | code, text; parses/validates, does not enqueue |
| POST | /api/ready | code, ready boolean; locks/unlocks edits |
| POST | /api/advance | code, round; host only, all players ready, expected round required |
| GET | /health | Liveness |

Orders: move/attack `{origin,target,personnel,tanks,fighters}`, recruit `{target,quantity}`, purchase `{target,quantity,equipment}`, invest `{target,amount}`, tax `{rate}`, borrow/repay/stabilize `{amount}`, trade/aid `{country,amount}`, alliance/peace `{country}`, recon `{target}`. All numeric fields are integers. Unknown extra fields are ignored mechanically but schema hardening to reject extras is a later task.

Room codes are invitations, not authentication. Tokens authorize exactly one player. Host permission never bypasses classified views. Sessions remain valid until the room database is removed; expiry/revocation is pending.

## v0.2 routes

- `POST /api/create` accepts `mode: "solo" | "multiplayer"`. Solo creates an active one-human game immediately and rejects joins. Multiplayer capacities are 2–4.
- `POST /api/draft-message`: country, template, request, optional replyTo. Returns an editable message order; no send happens here.
- `POST /api/send-message`: order and requestId. Validates, delivers immediately inside the game, records a directive result, and deduplicates retries by player/request ID. No external email or messaging service is involved.
- `POST /api/chat`: target ("adviser" or an AI country ID), question. Returns text/source/notice and private conversation history. Uses provider when configured, otherwise labeled offline response. Human recipients must use official correspondence.
- `/api/interpret` additionally accepts `send an official message to China: request trade talks`, `scout 3`, and `special forces 100 from 6 to 3`.
- New orders: special_recon `{origin,target,personnel}`, depot `{target}`, shipbuild `{target,quantity,equipment}`, naval_move/naval_attack/blockade `{fleet,target}`, message `{country,subject,body,template?,replyTo?}`. A message sent through `/api/order` queues for monthly delivery; the browser uses immediate `/api/send-message` instead.
- `/api/state` adds mode, aiAvailable, per-viewer messages, owned fleets and teams. Foreign forces are never embedded in an unfiltered hidden field. Dated reports are estimates, not current state.

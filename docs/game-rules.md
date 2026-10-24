# Playable rules

All numbers are fictional balance parameters; do not treat this game as a modern-force database.

## Planning and validation

Each confirmed order reserves cash without deducting it. Multiple outgoing force orders reserve personnel and equipment at the origin. Queues cannot overcommit stockpiles, materials, production slots, debt capacity or available repayments. Submission locks queue edits until unsubmitted. No submitted orders means hold position; autonomous AI never takes over an absent human. The deadline uses the confirmed queue even when the player did not submit; unconfirmed draft text is not stored.

Industrial construction costs at least $500M and occupies one slot; each industry level provides three slots. Recruitment costs $0.02M per person. Tanks cost $5M and fighters $45M. Purchased equipment requires two material units per item. Aircraft and tank crews are included in deployed personnel; orders need 4 personnel per tank and 2 per fighter.

## Resolution sequence

1. Copy the snapshot and generate legal AI orders.
2. Revalidate every queued order and combined reservations.
3. Apply policies, projects, loans, transfers and diplomacy in stable order.
4. Complete projects whose due month has arrived. Recruitment takes 1 month, tanks 2, fighters 3, industry 2. Lost project sites fail explicitly without refunds.
5. Detach all eligible movement and attack forces; charge fuel and ammunition. Insufficient stockpiles hold that whole operation at origin.
6. Complete friendly moves, group attacks by destination and attacker, resolve destinations in ID order and attackers using seeded initiative.
7. Apply territorial occupation, retreat/capture, casualty and infrastructure effects.
8. Apply national production, tax/trade receipts, upkeep, interest, stability and readiness effects.
9. Produce committed national briefings/public news, clear queues and evaluate fixed-round victory.

Contested multi-party battles use grouped attacks with seeded initiative; they are an explicit simplified rule, not fully simultaneous multi-sided combat. Same-round new treaties can block otherwise validated attacks.

## Logistics and battle

Movement fuel = ceil(personnel / 200 + tanks × 2 + fighters × 10).
Attack ammunition = ceil(personnel / 100 + tanks × 2 + fighters × 5).
Combat power = (personnel / 100 + tanks × 24 + fighters × 160) × readiness / 100.
Defenders receive ×1.35 in mountains and ×1.15 elsewhere. Each side receives a deterministic seeded random factor in [0.85, 1.15). Attacker wins if its modified power is greater than defender ×1.1.

Winning attackers lose 12%; losing attackers lose 35%. Defenders lose 65% on defeat or 15% on victory; each category rounds up. Defeated defender survivors retreat to the first adjacent friendly region, or are captured. Failed attackers return to their surviving origin or another owned fallback region; no surviving territory means remaining forces are lost. Ground personnel are required to attack and occupy.

In v0.2, depot routes, shared capacity, route length, spare parts, general supply and limited naval convoys are simulated. See v0.2-features.md for the current logistics and naval rules. Detailed encirclement and amphibious naval lift remain unfinished. Each owned region generates 300 fuel/month; each industry level generates 200 ammo and 50 materials/month.

## National accounts

GDP increases by owned regions ×100 plus industry ×50, in million Game USD. A landless government's GDP instead decays at 5% monthly. Monthly tax receipts = floor(GDP × annual tax percentage / 1200), only with territory. Active trade agreements generate $100M per participant monthly. Upkeep = ceil(personnel ×0.002 + tanks ×2 + fighters ×5 + industry ×20 + debt ×0.003) for governments with territory; a landless government pays debt interest only. Every cash effect is a ledger entry. Shortfalls create no silent overdraft: maintenance is capped at available treasury and reduces stability/readiness.

Borrowing ceiling is 50% GDP. Borrowing is not included in current planning spendable resources. Tax changes alter approval using a simple baseline comparison against 20%; this is not a full macroeconomic model.

## Diplomacy and scoring

AI trade/peace acceptance: relationship + openness + trade investment/50 >=50. Alliance threshold is 80. Rejection transfers nothing. Human agreements need reciprocal same-type offers in the current month. Trade investments are unilateral payments from each offering government, so reciprocal human trade offers transfer both offered amounts. Agreements start now and last 12 monthly resolutions including the signing month, with inclusive round endpoints. Alliance/peace block new combat between parties. Aid is unconditional.

Only humans are ranked. Military and economy normalize against the highest human value (30% each), diplomacy uses active treaty count (25%), and national stability uses its absolute percentage (15%). Fixed-round victory only; no early-dominance victory yet. This score favors relative strength and needs balance testing before competitive use.

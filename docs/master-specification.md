# MODERN RISK
## Comprehensive Game Development Master Specification
**Project type:** Multiplayer geopolitical grand strategy game  
**Platforms:** Web browsers — desktop, Mac, tablets, and iPad  
**Genre:** Turn-based military, economics, diplomacy, and government simulation  
**Players:** 2–4 humans, with autonomous AI-controlled governments  
**Game duration:** Configurable, default 24 monthly rounds  
**Game identity:** A modern, visually engaging strategy game inspired by classic territorial board games, military simulators, and geopolitical management games.

---

# 1. PROJECT MISSION

Build a complete, functional, multiplayer geopolitical strategy game called **MODERN RISK**.

The game must allow two to four human players to act as national leaders competing for territorial, military, economic, and diplomatic influence across a 42-region world map.

Each player manages a government, commands its armed forces, controls its economy, interacts with other governments, and issues monthly directives.

The remaining countries are governed by independent artificial intelligence.

The central experience is:

1. Players review their national intelligence and government dashboards.
2. Players submit directives across government departments.
3. Directives are translated into structured, executable orders.
4. Players confirm their orders and submit them.
5. The round closes when the host advances it or its timer expires.
6. A central simulation engine executes the orders simultaneously using deterministic and seeded probabilistic rules.
7. National accounts, troop deployments, ownership, infrastructure, casualties, and diplomatic relationships are updated permanently.
8. A visually presented World News Network bulletin announces public developments.
9. Every player receives a private presidential briefing.
10. The next monthly round begins.

**Nonnegotiable:** The game must never merely narrate that something happened without updating the actual game state.

If an army loses 8,000 soldiers, those casualties must be reflected in the military database, national dashboard, troop deployment map, and battle history.

If a country pays $500 million for an agreement, the money must be deducted from its treasury and credited to the appropriate recipient.

The AI must not independently invent military units, financial resources, treaties, territorial transfers, or other mechanical state changes.

---

# 2. TECHNOLOGY AND SOFTWARE ARCHITECTURE

Build the application using a maintainable, secure, production-oriented web architecture.

## Recommended frontend

- React with TypeScript
- Next.js or equivalent modern web framework
- Tailwind CSS for styling
- A consistent UI component library
- MapLibre GL JS or an appropriate vector-map rendering engine
- Zustand or equivalent lightweight client state management
- Responsive layouts for desktop, MacBook, and iPad
- Smooth animations using a lightweight animation library

## Recommended backend

- PostgreSQL as the authoritative database
- Supabase or equivalent managed authentication and database infrastructure
- A secure TypeScript server application for game logic
- Server-side simulation workers for round processing
- WebSocket or database-backed real-time subscriptions for multiplayer synchronization
- Durable job execution for round processing
- Versioned AI adapters with structured outputs

Use fixed-point or integer arithmetic for financial transactions. Never use floating-point numbers where monetary rounding could create inconsistent balances.

## Architectural principle

Separate these systems:

1. Frontend and presentation
2. Authentication and room management
3. Authoritative game-state service
4. Directive parsing and validation
5. Economic simulation
6. Military simulation
7. Supply and logistics simulation
8. Diplomacy and political simulation
9. Autonomous AI government service
10. Public news and confidential intelligence
11. Scoring and victory evaluation
12. Historical records, analytics, and replay

The simulation must remain operational if the language model becomes unavailable. Use deterministic fallback behavior for essential AI-government decisions.

AI language models interpret, advise, negotiate, and narrate. They are not the source of truth.

---

# 3. MAIN MENU AND GAME ROOMS

Create a polished main menu containing:

- New Game
- Join Game
- Single-Player Practice
- How to Play
- Settings
- Previous Games

## Room creation

The host can configure:

- Game room name
- Private room code
- Maximum human players: 2, 3, or 4
- Human starting governments
- AI difficulty
- Game duration in monthly rounds
- Turn timer
- Economic complexity
- Logistics difficulty
- Military aggressiveness
- Fog of war
- Victory conditions
- Random starting events
- Optional advanced game rules

Provide the option to start with preset powers:

- United States
- European Union / European Coalition
- China
- Russia

These starting powers are configurable.

When fewer than four humans join, unselected powers become AI-governed or are incorporated into the neutral world according to the scenario.

## Host capabilities

The host can:

- Start the game
- Configure the scenario
- Set or disable the timer
- Advance a round when all players are ready
- Force-close the planning phase if permitted by room rules
- Pause and resume the game
- View the public game log
- End the match
- Save and restore game sessions

The host must never gain access to confidential information merely because they created the room.

---

# 4. WORLD MAP AND COUNTRY MODEL

Create an interactive strategy map containing exactly 42 primary playable strategic regions, inspired by the classic Risk territorial layout.

Regions are geographically arranged across:

- North America
- South America
- Europe
- Africa
- Asia
- Oceania

Use original map graphics and original region presentation rather than copying proprietary board artwork.

## Country identity system

The game has two separate geographic concepts:

**Strategic region:** One of the 42 playable map regions.

**Political country:** A sovereign state or simplified political entity within the scenario.

A country can own one or more strategic regions.

Each strategic region has:

- Unique ID
- Display name
- Geographic boundaries
- Continent
- Sovereign controller
- Political claims
- Population
- Economic value
- Natural resources
- Infrastructure
- Military installations
- Defensive terrain
- Adjacent territories
- Ports and coastal access
- Airbases
- Transport capacity
- Local stability
- Garrison forces
- Supply status
- Intelligence visibility

Use a custom data-driven geopolitical scenario where appropriate. Do not pretend that a large Risk region and a single real country are always identical.

## Interactive features

Users must be able to:

- Zoom and pan
- Select regions
- View troop numbers
- Inspect known infrastructure
- View borders and alliances
- Switch map layers
- Plan movement routes
- Display active conflicts
- Identify supply routes
- Inspect resource production
- View known diplomatic relationships

Use map modes:

1. Political map
2. Military deployments
3. Economic strength
4. Resources
5. Diplomatic relationships
6. Supply network
7. Intelligence
8. Stability and unrest

Territorial changes must immediately appear on the map after a round resolves.

---

# 5. MONTHLY ROUND SYSTEM

Each turn represents one fictional month.

There are five phases.

## Phase A: Planning

Players issue directives privately.

Orders may be edited or canceled before submission.

The system displays:

- Available treasury
- Available forces
- Fuel stockpiles
- Ammunition stockpiles
- Industrial capacity
- Construction slots
- Diplomatic relationships
- Intelligence estimates
- Available operations
- Estimated directive costs

Do not deduct final costs merely because a player is typing a directive.

Use provisional reservations for planning.

## Phase B: Submission

Players select **Submit Directives**.

Validate every submitted directive against the player's permissions and known resources.

Display validation errors before final submission.

When all players are ready, the host can advance the round. Alternatively, the configured deadline automatically closes planning.

Provide countdown timers and clear readiness indicators.

Players who miss the deadline receive a predefined standing-orders policy, not arbitrary AI decisions.

## Phase C: Simulation

The server processes all accepted orders using a documented, deterministic sequence.

Orders are resolved within one transactionally consistent round.

A recommended sequence:

1. Lock the round and snapshot submitted orders.
2. Validate and reserve committed resources.
3. Resolve immediate political and diplomatic proposals.
4. Evaluate AI-government decisions and accepted agreements.
5. Apply economic policies and scheduled financial transactions.
6. Resolve industrial production and construction progress.
7. Evaluate supply networks and allocate logistics resources.
8. Resolve military movements and contested operations.
9. Resolve battles and territorial occupation.
10. Apply casualties, ammunition use, fuel use, and equipment damage.
11. Apply stability changes and regional economic disruption.
12. Calculate end-of-round balances and economic indicators.
13. Evaluate victory conditions.
14. Generate intelligence observations and public events.
15. Commit the entire authoritative game-state transition.

Use a rule-driven priority system for dependencies inside this pipeline.

If an event fails, produce an explicit failure result instead of silently ignoring it.

## Phase D: Public World News

After completion, generate a world news bulletin containing public developments.

## Phase E: Confidential Briefings

Each government receives its own intelligence and financial report, showing classified outcomes and upcoming strategic concerns.

The following round must not open until the previous round is committed.

Guarantee exactly-once round execution through durable jobs, idempotency keys, and database constraints.

---

# 6. NATIONAL GOVERNMENT AND DIRECTIVE SYSTEM

Every player is a national leader managing six principal government departments.

The gameplay must emphasize directives rather than forcing every action through unrelated menus.

## Department 1 — Ministry of Defence

Responsible for:

- Recruitment
- Military deployments
- Offensive operations
- Defensive posture
- Strategic reserves
- Equipment procurement
- Training
- Mobilization
- Maintenance
- Military infrastructure
- Supply allocation

## Department 2 — Ministry of Finance and Economy

Responsible for:

- National budgets
- Taxation
- Infrastructure spending
- Loans
- Debt repayments
- Industrial investment
- Trade policy
- Strategic resource purchases
- Economic subsidies
- Emergency spending

## Department 3 — Ministry of Foreign Affairs

Responsible for:

- Treaties
- Alliances
- Trade agreements
- Peace negotiations
- Territorial agreements
- Diplomatic recognition
- Military access
- Sanctions
- Foreign aid
- International organizations

## Department 4 — Intelligence Agency

Responsible for:

- Reconnaissance
- Intelligence collection
- Counterintelligence
- Military surveillance
- Strategic assessments
- Espionage
- Covert influence operations

Covert operations should be represented as abstract game actions with probabilities and consequences, not actionable real-world instructions.

## Department 5 — Ministry of Interior

Responsible for:

- Political stability
- Public approval
- Domestic security
- Administrative capacity
- Unrest
- Emergency policies
- Public services
- Occupied territory administration

## Department 6 — Ministry of Industry and Infrastructure

Responsible for:

- Factories
- Transport networks
- Power generation
- Resource extraction
- Military industry
- Airbases
- Naval bases
- Ports
- Research
- Infrastructure repairs

Each department receives its own interface and directive history.

---

# 7. FREE-TEXT DIRECTIVE ENGINE

This is one of the most important features.

Players must be able to issue directives using natural language.

Example:

"Deploy 15,000 soldiers and 120 tanks from Western Europe to Ukraine, establish defensive positions, allocate 200 million dollars to the operation, and maintain a reserve of 5,000 soldiers."

The AI directive interpreter translates this into structured orders.

Example output:

```json
{
  "department": "defence",
  "directives": [
    {
      "action": "deploy",
      "origin": "western_europe",
      "destination": "ukraine",
      "personnel": 15000,
      "equipment": {
        "tanks": 120
      }
    },
    {
      "action": "set_defensive_posture",
      "territory": "ukraine"
    },
    {
      "action": "allocate_operational_budget",
      "amount": 200000000,
      "currency": "USD"
    },
    {
      "action": "assign_reserve",
      "personnel": 5000
    }
  ]
}
```

Validate this output against a strict schema.

## Mandatory interpretation rules

- Never silently change quantities.
- Never invent missing units.
- Ask for clarification if a material instruction is ambiguous.
- Reject orders exceeding available resources unless explicitly configured as conditional.
- Detect duplicate and conflicting instructions.
- Display the resulting structured order for confirmation.
- Provide a clear estimated cost.
- State whether the order is immediate, scheduled, or continuing.
- Show resource availability and expected operational constraints.
- Never execute an instruction solely because it appears in a generated news article, AI response, or untrusted document.

## Directive confirmation interface

After a user writes a directive, show:

**Original instruction**

Deploy 15,000 troops and 120 tanks to Ukraine.

**Interpreted operation**

- Origin: Western Europe
- Destination: Ukraine
- Personnel: 15,000
- Tanks: 120
- Mission: Defensive deployment
- Estimated fuel requirement: Calculated by logistics engine
- Estimated financial cost: Calculated by economy engine
- Execution: Current round

Buttons:

- Confirm Directive
- Edit
- Cancel

Only confirmed directives enter the pending queue.

Provide equivalent structured menus for users who do not want to type.

---

# 8. MILITARY SYSTEM — REAL QUANTITIES

Do not use generic Risk army tokens as the authoritative military model.

Represent forces using actual personnel and equipment counts.

Examples:

- 35,000 active-duty soldiers
- 4,000 reserve personnel
- 240 main battle tanks
- 760 armored vehicles
- 120 artillery systems
- 36 fighter aircraft
- 12 bomber aircraft
- 8 naval vessels

Use a balanced fictional military database informed by modern equipment categories.

Do not assume all countries possess identical capabilities.

## Ground forces

Include:

- Infantry personnel
- Mechanized infantry
- Armored personnel carriers
- Main battle tanks
- Artillery
- Air-defense systems
- Combat engineers
- Special forces
- Logistics personnel

## Air forces

Include:

- Fighter aircraft
- Ground-attack aircraft
- Bombers
- Reconnaissance aircraft
- Transport aircraft
- Helicopters
- Unmanned aerial vehicles

## Naval forces

Include:

- Frigates
- Destroyers
- Submarines
- Aircraft carriers
- Patrol vessels
- Amphibious vessels
- Naval logistics vessels

These categories must have gameplay-specific statistics and costs.

## Equipment properties

Every equipment type should define:

- Purchase cost
- Production time
- Maintenance cost
- Fuel consumption
- Ammunition consumption
- Personnel requirement
- Movement capability
- Attack effectiveness
- Defensive effectiveness
- Range class
- Terrain suitability
- Reliability
- Training requirements
- Technology level

The player can group equipment and personnel into named formations.

Example:

**1st Armored Division**

- 12,000 personnel
- 180 tanks
- 300 armored vehicles
- 48 artillery systems
- 65% fuel availability
- 80% ammunition availability
- 92% equipment readiness

The map should show units and formations, not merely abstract military strength.

---

# 9. LOGISTICS, SUPPLY AND MILITARY READINESS

Supply must meaningfully affect combat performance.

Create a realistic but playable logistics model.

Track:

- Fuel
- Ammunition
- Spare parts
- General supplies
- Equipment condition
- Personnel readiness
- Supply-route capacity
- Transport infrastructure
- Supply distance
- Naval supply access
- Operational consumption

## Supply calculation

For each formation:

`Required Fuel = Sum of Equipment Fuel Requirements × Movement/Activity Modifier`

`Required Ammunition = Sum of Weapon Consumption × Combat Intensity`

`Supply Ratio = Delivered Supply / Required Supply`

Use capped ratios between 0 and 1 for each supply class.

Supply deficiencies should affect performance.

Examples:

- Low fuel reduces movement and armored readiness.
- Low ammunition reduces combat output.
- Poor maintenance increases equipment breakdowns.
- Long supply routes create capacity bottlenecks.
- Encirclement may interrupt overland supplies.
- Destroyed infrastructure reduces delivery capacity.

The game must distinguish between:

- Units purchased
- Units produced
- Units available in national inventory
- Units assigned to formations
- Units actively deployed
- Units lost or damaged

A country cannot deploy equipment that exists only in a pending factory order.

---

# 10. MILITARY OPERATIONS AND BATTLE RESOLUTION

Support these military directives:

- Move
- Defend
- Reinforce
- Attack
- Withdraw
- Patrol
- Establish blockade
- Provide air support
- Conduct reconnaissance
- Mobilize reserves
- Repair equipment
- Resupply
- Occupy territory

## Combat engine

Combat must be calculated by the server.

Use separate factors:

1. Effective personnel strength
2. Equipment capabilities
3. Terrain
4. Fortifications
5. Military technology
6. Training
7. Morale
8. Supply
9. Air superiority
10. Reconnaissance quality
11. Weather
12. Operational planning
13. Seeded randomness

Use a documented balance model.

For example:

`Effective Combat Power = Base Unit Power × Readiness × Supply Modifier × Terrain Modifier × Command Modifier`

Calculate attacker and defender effectiveness independently.

Apply a bounded randomness factor to create uncertainty.

Do not resolve battle outcomes by merely asking a language model which army wins.

## Battle outcomes

A battle may produce:

- Successful conquest
- Failed offensive
- Partial territorial occupation
- Defensive victory
- Tactical withdrawal
- Stalemate
- Heavy casualties
- Equipment destruction
- Infrastructure damage
- Prisoners or captured equipment where supported

## Occupation

Conquering a territory requires an adequate ground force.

Aircraft and naval assets alone cannot establish permanent control.

Occupation creates administrative and economic obligations.

If the army conquers a region but cannot support and administer it, stability and control may deteriorate.

## Simultaneous operations

If multiple players attack the same region, use explicit multi-party combat rules.

If armies move through contested paths, resolve crossings and engagements without depending on which player submitted first.

Resolve all military operations using the locked round snapshot and predeclared conflict rules.

No player receives an unfair advantage because their directive was processed first by the server.

---

# 11. NATIONAL ECONOMY

Use a hybrid economic model.

Economic values must feel like modern national budgets without requiring a complete real-world macroeconomic simulation.

## Currency

Use a common accounting unit:

**Game USD**, displayed in millions or billions.

Examples:

- Treasury: $24.5B
- Monthly government revenue: $5.2B
- Monthly expenditure: $4.1B
- National debt: $18B
- GDP: $420B

The figures above are illustrative, not mandatory starting balances.

Use scenario-specific balanced starting values.

## National accounts

Track:

- GDP
- GDP growth
- Government treasury
- Tax revenue
- Monthly expenditure
- National debt
- Interest obligations
- Trade income
- Inflation
- Unemployment
- Industrial output
- Military spending
- Infrastructure maintenance
- Resource production
- Public approval

## Financial operations

Players can:

- Adjust tax rates
- Increase military budgets
- Fund industrial projects
- Borrow money
- Repay loans
- Buy military equipment
- Subsidize industries
- Invest in foreign countries
- Sign trade deals
- Buy and sell resources
- Impose tariffs or sanctions
- Fund infrastructure

## National budget

Create an interactive budget dashboard.

Example:

**United States — Monthly Budget**

Treasury: $28.5B

Income:
- Tax revenue: $4.2B
- Trade and tariffs: $0.8B
- State enterprises: $0.5B

Total revenue: $5.5B

Expenditure:
- Military operations: $1.4B
- Government services: $1.1B
- Infrastructure: $0.9B
- Debt service: $0.3B

Total expenditure: $3.7B

Net monthly balance: +$1.8B

Every number must come from actual game records.

## Economic equations

`Revenue = Tax Revenue + Trade Receipts + Public Enterprise Income + Other Government Receipts`

`Operating Balance = Revenue − Recurring Expenditure`

`Closing Treasury = Opening Treasury + Revenue + Borrowing + Asset Sales + Incoming Transfers − Expenditure − Debt Repayment − Outgoing Transfers`

Do not double-count transfers, borrowing, or economic investments.

Distinguish between GDP and government revenue. GDP is not spendable treasury money.

Prevent purchases when cash or available financing is insufficient.

All transactions must be recorded in a financial ledger.

---

# 12. RESOURCES AND INDUSTRIAL PRODUCTION

Represent strategic resources such as:

- Oil
- Natural gas
- Industrial metals
- Rare earth materials
- Industrial materials
- Food
- Manufactured military components

Resources are measurable stockpiles or monthly production flows.

## Resource economy

Each territory may provide:

- Resource deposits
- Extraction capacity
- Monthly output
- Transport access
- Storage capacity
- Industrial processing

Players can build:

- Oil extraction facilities
- Refineries
- Mining infrastructure
- Power plants
- Civilian factories
- Military factories
- Shipyards
- Airfield infrastructure
- Transport hubs

All construction requires:

- Financial investment
- Required material inputs
- Available industrial or construction capacity
- Time to completion

An economic center cannot automatically produce tanks.

Military production must require appropriate infrastructure and materials.

## Construction timing

Some projects complete in one round.

Larger projects require multiple rounds.

Every project must show:

- Current progress
- Cost paid
- Remaining requirements
- Expected completion round
- Reasons for any delay

The AI cannot indefinitely delay completion without an explicitly modeled constraint.

---

# 13. DIPLOMACY AND INTERNATIONAL POLITICS

All neutral governments must actively manage their own interests.

Diplomacy includes:

- Trade agreements
- Military alliances
- Non-aggression treaties
- Defensive agreements
- Military access
- Investment agreements
- Foreign aid
- Territorial settlements
- Peace negotiations
- Sanctions
- Political declarations
- Coalition formation

## Diplomatic relationship model

Each pair of governments has measurable attributes:

- Relationship score: -100 to +100
- Trust
- Strategic alignment
- Trade dependence
- Military threat perception
- Historical grievances
- Treaty commitments
- Territorial disputes

Values should evolve based on events.

## AI diplomatic decisions

An AI government evaluates:

- Economic benefits
- Security benefits
- Sovereignty concerns
- Trust
- Military risks
- Diplomatic alignment
- Domestic stability
- Agreement terms

Then responds with:

**Accepted / Rejected / Counteroffer**

## Fast diplomacy requirement

Routine proposals must be evaluated during the current simulation phase.

Example:

**European Coalition proposes:**

"Invest $600 million in Egypt in exchange for a 15% share of simulated Suez trade revenue for 12 months."

Egypt evaluates the offer during the current round.

Possible outcomes:

- Accepted: treaty created, money transferred, future payments scheduled.
- Rejected: no treaty or payment.
- Counteroffer: Egypt requests $850 million or a smaller revenue share.

The proposing player receives the counteroffer in the private briefing or a live negotiation interface where enabled.

Do not introduce artificial multi-round waiting periods.

Counteroffers can be accepted, rejected, or revised in the next planning phase. Where live negotiation is enabled, they may be resolved before the current round closes.

Treaty consequences must be calculated automatically from the contract.

---

# 14. AUTONOMOUS AI GOVERNMENTS

Every AI-controlled country must have its own strategic personality.

AI governments must be able to:

- Develop economies
- Construct infrastructure
- Recruit military units
- Trade
- Form alliances
- React to threats
- Mobilize forces
- Negotiate treaties
- Defend territories
- Initiate limited conflicts
- Request assistance
- Change foreign policy

## AI profiles

Each government has:

- Economic ambition
- Military aggressiveness
- Diplomatic openness
- Risk tolerance
- Territorial ambitions
- Defensive priorities
- Resource needs
- Diplomatic alignment
- Leadership personality

## AI difficulty settings

Provide five options:

1. Very Easy
2. Easy
3. Normal
4. Hard
5. Expert

**Default difficulty: Easy.**

AI should initially be weaker than experienced human players.

However, difficulty must modify legitimate game properties rather than letting AI cheat.

Possible adjustable parameters:

- Economic starting resources
- Strategic planning efficiency
- Decision quality
- Military aggression
- Diplomatic effectiveness
- Construction priorities
- Risk management

Show these modifiers in game settings.

Do not grant extra invisible troops, free money, or impossible logistics unless the host explicitly enables an arcade-mode handicap.

## AI decision architecture

Use a hybrid system.

**Rule engine:** Evaluates legal actions, resources, and constraints.

**Utility scoring:** Ranks available actions according to national goals.

**Language model:** Produces diplomatic responses, policy explanations, and believable leader behavior.

**Validation layer:** Prevents illegal or impossible AI actions.

**Authoritative simulation:** Commits the actual consequences.

Provide AI decision caching, limited context windows, batch processing, and fallback logic to maintain fast round processing.

---

# 15. AI PRESIDENTIAL ADVISERS

Each human player receives government advisers.

Include:

- Defence Minister
- Finance Minister
- Foreign Minister
- Intelligence Director
- National Security Adviser

Players can ask questions such as:

"Can we afford a war with Russia?"

"What happens if I increase the defence budget by 20%?"

"Which neutral countries are most likely to ally with us?"

"How many tanks can we produce this month?"

The adviser must use the player's actual authorized game information.

Advisers should:

- Analyze current resources
- Identify strategic weaknesses
- Recommend policy options
- Estimate risks
- Explain costs
- Identify conflicting directives

They must distinguish facts from uncertain estimates.

They should not reveal enemy classified information without intelligence justification.

Advice must never directly modify game state.

---

# 16. INTELLIGENCE AND FOG OF WAR

Implement separate levels of information.

## Public information

Visible to all:

- Territorial ownership
- Public treaties
- Declared wars
- Public economic indicators
- Major battles
- Announced policies

## National private information

Visible only to authorized players:

- Exact military inventories
- Unit deployment details
- Classified operations
- Confidential treaties
- Treasury details where configured
- Intelligence operations
- Detailed military readiness
- Supply limitations

## Intelligence estimates

Players may gain partial information about foreign military deployments.

Every intelligence report should include:

- Estimated value or range
- Confidence level
- Observation date
- Intelligence source category
- Potential misinformation warning

Example:

**Intelligence report — Western Russia**

Estimated troops: 45,000–65,000

Confidence: Medium

Last updated: Round 8

Do not reveal actual hidden values through frontend network responses, database subscriptions, or unrestricted APIs.

---

# 17. WORLD NEWS NETWORK

Create an engaging, cartoon-inspired animated news presentation.

This is a key visual feature, not a plain text activity log.

Brand the system as:

**WNN — WORLD NEWS NETWORK**

The bulletin should resemble a stylized fictional international television broadcast.

## News presentation

Use:

- Illustrated cartoon news anchors
- Original fictional newsroom artwork
- Animated breaking-news graphics
- Region photographs or stylized illustrations
- Flags and country insignia
- Subtitles
- Brief headline animations
- Optional speech synthesis
- Map highlights
- Battle and diplomacy infographics

Avoid depicting fictional game events as genuine real-world breaking news.

## News cards

Each major event receives:

1. Headline
2. Relevant image or illustration
3. Brief descriptive paragraph
4. Quantitative outcome
5. Affected countries
6. Map location
7. Optional spoken narration

Example:

**BREAKING — EUROPEAN COALITION SEIZES STRATEGIC POSITION IN EASTERN EUROPE**

Image: Stylized illustration of mechanized troops crossing a European landscape.

Subtitle:

"After a major military offensive, European Coalition forces established control over the contested region. Initial reports indicate substantial casualties and infrastructure damage."

Verified game results:

- Attacking casualties: 4,200
- Defending casualties: 7,100
- Destroyed tanks: 35
- Territory transferred: Yes

These numbers must be retrieved from the completed battle record.

## News privacy filtering

Public stories must never expose secret directives merely because they exist in the database.

An undiscovered secret operation remains classified.

A detected covert operation may become news according to simulation rules.

## Rendering strategy

Use original reusable anchor illustrations, news templates, flag assets, maps, and event illustrations.

Support optional AI-generated images where enabled, but never make round completion depend on image generation.

Always provide a visually appropriate fallback.

---

# 18. CONFIDENTIAL PRESIDENTIAL BRIEFINGS

After every round, each player receives a comprehensive private briefing.

It should feel like a government intelligence report.

Header:

**TOP SECRET — PRESIDENTIAL EYES ONLY**

Sections:

## A. Executive summary

A concise description of the country's overall position.

## B. Military operations

For every order:

- Original objective
- Status
- Troops committed
- Equipment committed
- Supplies consumed
- Casualties
- Equipment losses
- Actual result
- Territory changes
- Reasons for success or failure

## C. Economic report

- Opening treasury
- Revenue
- Expenditure
- Military expenses
- Construction expenses
- Debt changes
- Closing treasury
- Resource stockpile changes
- GDP and other economic indicators

## D. Diplomatic results

- Accepted agreements
- Rejected proposals
- Counteroffers
- New alliances
- Relationship changes
- Treaty obligations

## E. Intelligence

- New discoveries
- Military threats
- Foreign movements
- Reliability of intelligence
- Counterintelligence reports

## F. Domestic situation

- Stability
- Public approval
- Economic disruption
- Unrest
- Occupation challenges

## G. Adviser recommendations

Brief recommendations for the next round.

## H. Directive audit trail

Each submitted directive must have a definitive status:

- Completed
- Partially completed
- Failed
- Rejected
- Continuing with specified progress
- Canceled according to a valid rule

Every status must have a reason.

Do not leave unexplained pending directives.

---

# 19. USER INTERFACE AND GAME EXPERIENCE

The application should feel like a polished commercial strategy game.

Use a visual identity combining:

- Modern government command centers
- Military operations interfaces
- Clean geopolitical maps
- Dark navy and charcoal backgrounds
- Subtle blue highlights
- Red for warnings and military conflict
- Gold or green for economic success
- Clear charts and readable typography

## Main game dashboard

Desktop layout:

**Top bar**

- Country flag and name
- Current round
- Treasury
- Monthly income
- GDP
- Military readiness
- Political stability
- Active notifications
- Timer

**Left sidebar**

- World Map
- Presidential Office
- Military Command
- Finance
- Foreign Affairs
- Intelligence
- Interior
- Industry
- WNN News
- Directive History

**Central workspace**

Interactive geopolitical map.

**Right contextual panel**

Information about selected regions, countries, formations, or government departments.

**Bottom command panel**

Directive composer and operation queue.

## Directive UI

Allow typed natural-language orders and structured commands.

Display each directive as a card.

Cards show:

- Department
- Target
- Resources committed
- Execution round
- Validation status
- Estimated consequences

Players can edit or cancel before the planning deadline.

## iPad interface

Implement a responsive layout with:

- Touch-friendly map controls
- Collapsible sidebars
- Full-screen government panels
- Easy directive entry
- Readable military and economic tables
- Touch-based formation selection
- Accessible drag-and-drop alternatives

Do not design a desktop-only interface and merely shrink it for tablets.

---

# 20. PUBLIC AND PRIVATE RESULTS VISUALIZATION

When a round completes, display results as a staged but fast presentation.

## Step 1: Round summary

Example:

**MARCH 2030 — SIMULATION COMPLETE**

- 3 international conflicts
- 8 diplomatic agreements
- 12 industrial projects completed
- 2 territorial changes
- 4 major economic developments

These figures must be calculated from actual event records.

## Step 2: World map animation

Animate meaningful territorial changes and major military movements.

## Step 3: WNN broadcast

Show major events with cartoon illustrations, subtitles, and optional audio.

## Step 4: Confidential briefing

Provide the player's detailed national report.

## Step 5: Next month

Open the following planning phase.

Allow users to skip animations without skipping the underlying simulation or hiding the results.

Also provide a persistent searchable event history.

---

# 21. DATA MODEL

Design normalized relational database tables for:

- users
- games
- game_members
- game_settings
- turns
- countries
- country_states
- territories
- territory_states
- territorial_claims
- diplomatic_relationships
- treaties
- directives
- directive_versions
- directive_resolutions
- armed_forces
- military_formations
- equipment_types
- equipment_inventory
- deployed_units
- military_movements
- battles
- battle_participants
- casualties
- equipment_losses
- resource_types
- resource_stockpiles
- supply_routes
- logistics_allocations
- infrastructure
- construction_projects
- production_orders
- economic_indicators
- national_budgets
- financial_transactions
- debt_contracts
- trade_agreements
- intelligence_operations
- intelligence_reports
- public_events
- classified_events
- news_stories
- private_briefings
- ai_government_profiles
- ai_decision_records
- victory_scores
- audit_logs

Use foreign keys, constraints, transaction identifiers, timestamps, and versioned game state.

Every financial transfer should have traceable debit and credit records.

Every change to troop quantity should identify its cause.

Every territorial ownership change should reference the operation or event responsible.

Every directive must reference the result that resolved it.

---

# 22. SECURITY AND MULTIPLAYER PRIVACY

Security is essential because the game relies on hidden information.

Implement:

- User authentication
- Server-authorized country ownership
- Private game rooms
- Secure room invitations
- Role-based permissions
- Row-level security where appropriate
- Server-side directive validation
- Rate limiting
- Secure AI API key storage
- Output schema validation
- Prompt-injection defenses
- Transactional game-state updates
- Audit logs
- Reconnection support
- Conflict-safe multiplayer synchronization

## Critical restrictions

Never trust client-submitted prices, troop inventories, treasury balances, or battle outcomes.

All authoritative calculations occur server-side.

Clients submit intentions, not final results.

Ensure that one player cannot access another government's classified briefing through guessed identifiers or direct database requests.

The host cannot inspect hidden information unless a specifically enabled scenario rule permits it.

Use server-side AI calls and do not expose API credentials to the browser.

---

# 23. VICTORY CONDITIONS

Support fixed-round and early-victory games.

## Military supremacy

Measured through:

- Territorial control
- Military readiness
- Strategic objectives
- Successful defense
- Sustainable military capability

## Economic supremacy

Measured through:

- GDP
- Growth
- Treasury health
- Industrial capacity
- Trade influence
- Debt sustainability

## Diplomatic supremacy

Measured through:

- Alliances
- Treaty influence
- Diplomatic reputation
- Foreign partnerships
- Strategic international support

## National stability

Measured through:

- Territorial integrity
- Internal stability
- Public approval
- Economic resilience
- National independence

## Final score

Default weighted score:

- Military: 30%
- Economy: 30%
- Diplomacy: 25%
- National stability: 15%

Normalize each category to a common 0–100 score before weighting.

Provide configurable scoring weights.

Define clear early-victory thresholds and require the player to sustain any dominance condition for the configured period.

Prevent an early win based on one temporary financial anomaly or a one-round territorial exploit.

Show score changes and explain their causes.

---

# 24. GAME BALANCING

The initial setup must be playable.

Major powers can begin with greater economic and military strength, but they should also face larger commitments and operational costs.

Smaller governments may have:

- Lower military maintenance
- Defensive terrain advantages
- Diplomatic bargaining power
- Strategic resources
- Regional influence
- Coalition opportunities

AI difficulty should be configurable.

Make costs and game parameters data-driven so balancing adjustments do not require rewriting the engine.

Provide a scenario editor or developer configuration file for:

- Starting treasuries
- Starting military inventories
- National industrial capacity
- Resource production
- Military costs
- Monthly government income
- Construction costs
- AI behavior
- Victory thresholds

Create automated simulations to evaluate whether any starting power is overwhelmingly dominant.

---

# 25. PERFORMANCE REQUIREMENTS

The game must feel fast.

For ordinary rounds:

- Validate directives immediately.
- Show clear simulation progress.
- Avoid unnecessary sequential AI calls.
- Batch compatible AI decisions.
- Cache stable AI-government profiles.
- Generate narrative after authoritative calculations.
- Do not block simulation completion on image generation.
- Use deterministic fallbacks if AI services fail.

Target a typical small match round to complete within several seconds where infrastructure and AI-provider latency permit.

Treat this as a performance target, not an absolute guarantee.

Store results durably before releasing the next planning phase.

Handle interruptions and retries safely.

If a client disconnects, preserve its confirmed orders and game state.

---

# 26. TESTING AND RELIABILITY

Implement unit, integration, and end-to-end tests.

## Financial tests

- Treasury never becomes negative without explicit debt authorization.
- Transfers conserve money between accounts.
- Loans increase cash and liabilities correctly.
- Purchases deduct the correct amount.
- Production cannot create free units.
- Economic reports match ledger transactions.

## Military tests

- Soldiers cannot exist in two places simultaneously.
- Casualties reduce the correct formations.
- Destroyed equipment cannot be reused.
- Fuel restrictions affect movement.
- Ammunition restrictions affect battles.
- Territory occupation requires appropriate forces.
- Multiple simultaneous attacks resolve consistently.
- Force movement follows legal geography and access rules.

## Diplomacy tests

- AI proposals resolve promptly.
- Accepted treaties create valid effects.
- Rejected treaties do not transfer money.
- Counteroffers do not automatically activate unaccepted terms.
- Treaty expiration is enforced.

## Privacy tests

- Players cannot read enemy classified directives.
- Players cannot query enemy financial ledgers unless public.
- Hosts cannot bypass confidentiality.
- AI advisers cannot leak hidden database values.
- News only includes eligible public information.

## Round-processing tests

- The same round cannot execute twice.
- Replaying a completed job cannot duplicate money or units.
- The next round cannot begin during incomplete processing.
- Every directive receives a terminal resolution or an explicit continuing state.
- Reports match committed outcomes.

Include tests for extreme values, disconnected clients, malformed instructions, and simultaneous player actions.

---

# 27. DEVELOPMENT ROADMAP

Build the game in functional phases.

## Phase 1 — Playable foundation

Deliver:

- Authentication
- Main menu
- Multiplayer rooms
- Configurable 2–4-player matches
- Original interactive 42-region map
- Country and territorial ownership
- Monthly rounds
- Directive queue
- Structured military movement
- Simple combat
- Treasury and basic spending
- Persisted game state
- Round results

This phase must be playable end to end.

## Phase 2 — National government systems

Add:

- Government departments
- National economy
- Budgeting
- Construction
- Recruitment
- Resources
- Industrial production
- Detailed financial ledger
- Directive audit trail

## Phase 3 — Advanced warfare

Add:

- Actual personnel counts
- Equipment inventories
- Military formations
- Fuel
- Ammunition
- Logistics
- Maintenance
- Supply routes
- Multi-party battles
- Occupation and stability

## Phase 4 — Diplomacy and AI

Add:

- Independent AI governments
- Diplomatic negotiation
- AI difficulty controls
- Alliances
- Treaties
- Autonomous AI economic decisions
- Autonomous AI military decisions
- Presidential advisers
- Natural-language directive parsing

## Phase 5 — Intelligence and news

Add:

- Fog of war
- Intelligence reports
- Reconnaissance
- Classified directives
- Private presidential briefings
- Public world news
- Cartoon newsroom presentation
- Map-based event animations
- Optional voice narration

## Phase 6 — Polish and release readiness

Add:

- Game balancing
- AI decision optimization
- Victory scoring
- Match history
- Save and restore
- Accessibility improvements
- Tablet optimization
- Performance profiling
- Multiplayer load testing
- Security testing
- Deployment and operational monitoring

Every phase must integrate with existing systems.

Do not replace working functionality with decorative mockups.

---

# 28. ACCEPTANCE TEST — COMPLETE GAMEPLAY SCENARIO

The following scenario must work correctly.

Three players start a game.

Player 1 controls the United States.

Player 2 controls the European Coalition.

Player 3 controls China.

Remaining territories are independently AI-controlled.

## United States directives

1. Recruit 10,000 infantry personnel.
2. Purchase 50 tanks.
3. Allocate $800 million toward military industry.
4. Offer an AI-controlled country a trade agreement.

## European Coalition directives

1. Move 20,000 troops to a border region.
2. Transfer 100 tanks from reserve inventory.
3. Offer Egypt $500 million for a commercial partnership.
4. Increase military spending.

## Chinese directives

1. Increase industrial investment.
2. Deploy 30 fighter aircraft.
3. Negotiate a defensive alliance.
4. Begin a military offensive against an adjacent hostile region.

All three players submit their orders.

The host advances the round.

## Required outcomes

The system must:

- Validate every military resource.
- Deduct every legitimate expenditure.
- Reject unaffordable purchases.
- Process recruitment and production using their scheduled availability dates.
- Move eligible units.
- Consume required supplies.
- Evaluate AI diplomatic proposals.
- Resolve military combat.
- Update casualties and equipment inventories.
- Transfer conquered territory when conditions are met.
- Update political relationships.
- Recalculate economic indicators.
- Produce a public WNN bulletin.
- Produce three different confidential presidential briefings.
- Preserve all results in the database.
- Begin the next round without duplicating any effects.

If a proposal is rejected, it must not create an agreement.

If a factory is unfinished, it must not produce equipment.

If a military offensive fails, the defender must retain control unless another valid operation changes that outcome.

The UI must display those results using the committed game state.

---

# 29. IMPLEMENTATION INSTRUCTIONS FOR THE CODING AGENT

You are acting as the lead game designer, full-stack engineer, systems architect, and QA engineer.

Your objective is to build and verify the application—not merely produce mockups, sample screens, or a design document.

Follow these rules:

1. Inspect the existing repository before modifying it.
2. Create a clear folder structure and implementation plan.
3. Establish authoritative shared data models.
4. Implement the simulation engine independently of the UI.
5. Implement actual database persistence.
6. Build functional multiplayer synchronization.
7. Implement the interface around real server state.
8. Add AI services with strict structured schemas and deterministic fallbacks.
9. Test major systems before adding the next layer.
10. Maintain migration files and clear setup instructions.
11. Never fabricate test success, completed features, or deployment status.
12. Never silently omit a requirement. Record blockers or deferred work.
13. Use secure environment-variable configuration for credentials.
14. Ensure the application builds and runs in the target environment.
15. Include seed data for at least one complete playable scenario.
16. Implement the minimum viable game first and expand without breaking existing functionality.

Do not waste time generating elaborate placeholder content while core gameplay remains incomplete.

A successful implementation should allow real human players to join one game, manage actual national resources, issue military and diplomatic directives, complete simultaneous rounds, and see persistent, mechanically accurate consequences.

---

# 30. FINAL PRODUCT STANDARD

MODERN RISK must ultimately deliver:

- A functional interactive 42-region world map.
- Two to four human players.
- Autonomous AI governments.
- Real personnel and equipment numbers.
- Military movement and combat.
- Fuel, ammunition, supply, and maintenance.
- A functioning national economy.
- Resource production and spending.
- Government ministries and directives.
- Natural-language instruction interpretation.
- Immediate, consistent AI diplomatic decisions.
- Concurrent monthly orders.
- Public and classified information separation.
- Visually engaging cartoon-style world news.
- Private presidential intelligence briefings.
- Persistent, accurate game records.
- Configurable AI strength.
- Military, economic, diplomatic, and stability scoring.
- Responsive web support for PC, Mac, and iPad.

**Above all, every meaningful player decision must produce a measurable, persistent, and explainable consequence.**

The player should feel like they are running a nation, not playing against a chatbot that invents outcomes.

Build MODERN RISK as a genuine strategy game powered by AI—not an AI conversation disguised as a game.
# 31. GITHUB REPOSITORY, VERSION CONTROL AND DEVELOPMENT WORKFLOW

## 31.1 Mandatory GitHub Integration

MODERN RISK must be developed and maintained in a **private GitHub repository**.

GitHub is the official source of truth for the game's source code, architecture, database migrations, documentation, and development history.

The AI coding agent must use GitHub throughout the entire development process, rather than treating repository creation as a final step.

**Repository name:** `modern-risk`

**Repository visibility:** Private

**Primary branch:** `main`

## 31.2 Initial Repository Setup

Before beginning development:

1. Check whether a GitHub repository already exists.
2. If it exists, inspect its structure, branches, dependencies, and existing code.
3. If it does not exist, create a private repository named `modern-risk`, using an authorized GitHub connection.
4. Initialize the application with the agreed technology stack.
5. Add a proper `.gitignore` file.
6. Create the initial project structure and documentation.
7. Commit the initial working foundation.
8. Configure GitHub-based development workflows.

Do not delete or overwrite existing work without authorization.

If direct GitHub access is unavailable, prepare the local repository and explain what connection or authorization is required. Never claim code has been pushed unless GitHub confirms it.

## 31.3 Required Repository Structure

Organize the project approximately as follows:

```text
modern-risk/
├── apps/
│   └── web/
│       ├── src/
│       ├── components/
│       ├── pages/
│       └── public/
│
├── packages/
│   ├── game-engine/
│   ├── military-engine/
│   ├── economy-engine/
│   ├── diplomacy-engine/
│   ├── ai-engine/
│   ├── intelligence/
│   └── shared/
│
├── database/
│   ├── migrations/
│   └── seeds/
│
├── docs/
│   ├── architecture.md
│   ├── game-rules.md
│   ├── development-roadmap.md
│   └── progress.md
│
├── tests/
├── .github/
│   └── workflows/
│
├── .env.example
├── .gitignore
├── README.md
└── package.json
```

Adapt the structure to the actual framework when necessary.

## 31.4 GitHub Development Rules

All development must follow a controlled versioning workflow.

- Preserve the `main` branch as the stable version.
- Develop major features on separate branches.
- Use meaningful commit messages.
- Commit changes after completing and validating coherent units of work.
- Create pull requests for major changes.
- Run relevant tests before merging.
- Never force-push over established work without explicit authorization.
- Never delete important working functionality merely to simplify a new feature.

Example feature branches:

- `feature/world-map`
- `feature/military-engine`
- `feature/economic-system`
- `feature/ai-diplomacy`
- `feature/round-simulation`
- `feature/world-news`

Each completed feature should include the necessary code, tests, documentation, and database migrations.

## 31.5 Automated Testing with GitHub Actions

Configure GitHub Actions to run checks automatically on pull requests and protected branches.

Include:

1. TypeScript type checking
2. Code linting
3. Application build verification
4. Unit tests
5. Simulation-engine tests
6. Database migration validation
7. Security and dependency checks

Do not merge broken changes into `main`.

Configure branch protection so required checks must pass before merging where supported by the repository settings.

## 31.6 Development Progress Tracking

Maintain a development roadmap using GitHub Issues or equivalent repository project tracking.

Organize tasks into milestones:

- Milestone 1: Playable world map and multiplayer
- Milestone 2: Military and economics
- Milestone 3: Logistics and combat
- Milestone 4: AI governments and diplomacy
- Milestone 5: Presidential briefings and WNN
- Milestone 6: Testing, optimization, and release

Maintain `docs/progress.md`, including:

- Completed features
- Features in development
- Known bugs
- Current blockers
- Next development priorities
- Latest validated commit

Never mark a feature complete merely because its interface exists. Completion requires functioning game logic and successful verification.

## 31.7 Deployment

Connect the GitHub repository to an appropriate web-hosting platform, such as Vercel or Cloudflare, depending on the selected backend architecture.

Use:

- Production deployments from approved stable commits
- Preview deployments for feature branches or pull requests
- Secure environment variables
- Appropriate database migration procedures
- Deployment health checks

The GitHub repository stores source code, while the production database maintains active game sessions and persistent multiplayer data.

Never store production database passwords, API secrets, service-role credentials, or private access tokens in GitHub.

Do not assume that pushing code to GitHub automatically deploys the application until deployment integration is explicitly configured and verified.

## 31.8 Instructions for Astra Coding Agent

When working on MODERN RISK:

1. Read the repository documentation and relevant code before making changes.
2. Identify the current development milestone.
3. Implement a small, testable set of improvements.
4. Validate that existing systems continue functioning.
5. Commit the completed changes to an appropriate feature branch.
6. Create or update the corresponding pull request when GitHub access permits.
7. Summarize what changed, which tests passed, and what remains incomplete.
8. Merge only after the required checks and approvals.
9. Continue development using the latest authorized repository state.

Avoid rebuilding the application from scratch after each instruction.

**GitHub is the permanent source of truth. The AI agent is responsible for implementing changes consistently against that codebase, not repeatedly generating disconnected versions of the game.**

## 31.9 Completion Requirements

The GitHub integration is considered functional only when:

- The repository exists and is private.
- The application source code is committed.
- The repository contains the necessary build and development instructions.
- Feature branches and pull requests can be created.
- Automated checks execute successfully.
- The application can be built from a clean clone.
- Authorized changes can be deployed through the established deployment workflow.
- The game's development history is traceable.

**Final instruction:** Treat GitHub integration as a mandatory engineering requirement from the first development milestone, not an optional feature to add after the game is built.
Astra, update the existing **MODERN RISK** game project to fully integrate GitHub into its development workflow.

Use the development specifications I've already provided and implement **Section 31 — GitHub Repository, Version Control and Development Workflow**.

**Your instructions:**

1. Connect the existing MODERN RISK project to my GitHub account and create a private repository named `modern-risk`, unless one already exists.
2. Upload and commit the entire existing game source code, including the frontend, backend, simulation engine, database migrations, and configuration files.
3. Preserve all existing game features, code, and progress. **Do not rebuild the game from scratch.**
4. Establish `main` as the stable branch and use separate feature branches for future development.
5. Configure automated testing, build verification, and deployment workflows.
6. Maintain development documentation and progress tracking inside GitHub.
7. Ensure that future updates to MODERN RISK are reflected in the repository through tested commits and pull requests.
8. Never expose API keys, passwords, or database credentials.
9. Verify that the project can be restored and built from the repository.

**Important:** Continue developing the actual game according to the original master prompt. GitHub integration is an additional requirement, not a replacement for the military, economy, AI, diplomacy, interactive map, or multiplayer systems.

If GitHub authorization is required, request access before proceeding.

Once the changes are implemented, provide the repository link, the latest commit, the deployment status, and a summary of what was completed and what remains.

**Start by inspecting the existing MODERN RISK project, then implement these changes directly. Do not merely explain how to do them.**
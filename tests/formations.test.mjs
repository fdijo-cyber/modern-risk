import test from 'node:test';
import assert from 'node:assert/strict';
import {seedSimple,adjudicateDirective,simpleView} from '../packages/simple-engine/index.mjs';
import {ensureFormations,damageFormations,monthlyConditions,trainFormations,conditionPower} from '../packages/simple-engine/formations.mjs';
import {submitChair} from '../packages/simple-engine/chair.mjs';
const world=()=>{const g=seedSimple({seed:33,maxRounds:12});for(const c of Object.values(g.countries))c.human=true;ensureFormations(g);return g;};
test('rookies start healthy, supplied and equipped with native terrain familiarity; sustained combat destroys cohorts in 2–3 rounds',()=>{
 const g=world(),f=g.regions[6].formations.infantry[0];assert.equal(f.health,100);assert.equal(f.experience,0);assert.equal(f.weaponry,100);assert.ok(f.terrainAdaptations.includes(g.regions[6].terrain));
 const winning={infantry:[structuredClone(f)]};for(let round=1;round<=3;round++){damageFormations(winning,42,round,()=>0);if(round<3){assert.equal(winning.infantry.length,1);winning.infantry[0].health+=6;}}assert.equal(winning.infantry.length,0);
 const losing={infantry:[structuredClone(f)]};damageFormations(losing,55,1,()=>0);damageFormations(losing,55,2,()=>0);assert.equal(losing.infantry.length,0);
});
test('movement, reserve return and remobilization preserve the exact wounded formation and experience',()=>{
 let g=world();const f=g.regions[6].formations.infantry[0];f.health=24;f.experience=50;const id=f.id;
 g=adjudicateDirective(g,'us',{text:'Move',orders:[{action:'move',origin:6,target:7,units:{infantry:1}}]}).game;assert.ok(g.regions[7].formations.infantry.some(x=>x.id===id&&x.health===24&&x.experience===50));
 // Move the wounded cohort to the front of that region's chosen reserve transfer.
 g.regions[7].formations.infantry.sort((a,b)=>Number(b.id===id)-Number(a.id===id));g=adjudicateDirective(g,'us',{text:'Stand down',orders:[{action:'reserve',origin:7,units:{infantry:1}}]}).game;assert.ok(g.countries.us.reserveFormations.infantry.some(x=>x.id===id&&x.health===24));
 g.countries.us.reserveFormations.infantry.sort((a,b)=>Number(b.id===id)-Number(a.id===id));g=adjudicateDirective(g,'us',{text:'Mobilize',orders:[{action:'mobilize',target:6,units:{infantry:1}}]}).game;assert.ok(g.regions[6].formations.infantry.some(x=>x.id===id&&x.health===24));assert.ok(!JSON.stringify(simpleView(g,'eu')).includes(id));
});
test('paid courses improve actual experience and terrain performance without manufacturing forces',()=>{
 const g=world(),r=g.regions[6],initial=r.units.infantry,f=r.formations.infantry[0];const before=conditionPower({infantry:[f]},'mountain');trainFormations(g,'us',{target:6,terrain:'mountain',budget:100,title:'Mountain course'});assert.equal(g.countries.us.treasury,1400);assert.equal(r.units.infantry,initial);assert.equal(f.experience,10);assert.ok(f.terrainAdaptations.includes('mountain'));assert.ok(conditionPower({infantry:[f]},'mountain')>before);assert.ok(g.countries.us.trainingPrograms.length);assert.throws(()=>trainFormations(g,'us',{target:6,terrain:'invented',budget:100}));assert.equal(g.countries.us.treasury,1400);
});
test('financial and supply crises reduce equipment quality and recovery; normal logistics restore support without resetting health or experience',()=>{
 const g=world(),c=g.countries.us,f=g.regions[6].formations.infantry[0];f.health=30;f.experience=40;c.treasury=0;c.supplies=0;c.lastUpkeep=0;c.lastUpkeepRequired=50;monthlyConditions(g);assert.equal(f.health,32);assert.equal(f.healingRate,2);assert.equal(f.weaponry,65);assert.equal(f.supply,0);assert.equal(f.experience,40);
 c.treasury=500;c.supplies=100;c.lastUpkeep=50;monthlyConditions(g);assert.equal(f.health,38);assert.equal(f.weaponry,100);assert.equal(f.healingRate,6);
});
test('Chair accepts a training directive as an actual paid experience and adaptation effect',()=>{
 const g=world(),r=submitChair(g,'us','Train our troops for mountain warfare',{kind:'directive',analysis:'Training decision',objectives:[{id:'train',title:'Mountain training',order:{action:'training',target:6,terrain:'mountain',budget:100}}]});assert.equal(r.directive.objectives[0].outcome,'successful');assert.equal(r.game.countries.us.treasury,1400);assert.ok(r.game.regions[6].formations.infantry.every(f=>f.experience===10));
});

test('real consecutive monthly battles preserve wounds and eliminate an unsupported cohort on its second defeat',async()=>{
 const {resolveChairRound}=await import('../packages/simple-engine/chair.mjs');let g=world();g.regions[6].units.infantry=5;g.regions[8].units.infantry=90;ensureFormations(g);const id=g.regions[6].formations.infantry[0].id;
 const plan={kind:'directive',analysis:'Attack',objectives:[{id:'offensive',title:'Attack',order:{action:'operation',origin:6,target:8,units:{infantry:1}}}]};
 g=submitChair(g,'us','Attack',plan).game;const wounded=g.regions[6].formations.infantry.find(f=>f.id===id);assert.ok(wounded.health>0&&wounded.health<60);g=resolveChairRound(g);g.regions[6].formations.infantry.sort((a,b)=>Number(b.id===id)-Number(a.id===id));g=submitChair(g,'us','Attack again',plan).game;assert.ok(!g.regions[6].formations.infantry.some(f=>f.id===id));assert.equal(g.countries.us.battleReports.at(-1).ownLosses.infantry,1);
});

test('a completed funded training initiative grants experience once and persists it across later months',async()=>{
 const {resolveSimple}=await import('../packages/simple-engine/index.mjs');let g=world();g=adjudicateDirective(g,'us',{text:'Military mountain training initiative',orders:[{action:'initiative',title:'Military mountain training',intent:'Military mountain training exercises',category:'training',target:6,budget:100,duration:1,risk:5}]}).game;
 // The seeded fixture delivers this project; only completed, paid work can train troops.
 g=resolveSimple(g,{skipAutonomous:true});const p=g.countries.us.initiatives[0];assert.equal(p.status,'completed');assert.equal(p.trainingApplied,true);const id=g.regions[6].formations.infantry[0].id,experience=g.regions[6].formations.infantry[0].experience;assert.equal(experience,10);g=resolveSimple(g,{skipAutonomous:true});assert.equal(g.regions[6].formations.infantry.find(f=>f.id===id).experience,experience);
});

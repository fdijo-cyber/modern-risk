import test from 'node:test';
import assert from 'node:assert/strict';
import {seedSimple,totalForces,resolveSimple,simpleView} from '../packages/simple-engine/index.mjs';
import {submitChair,prepareChair} from '../packages/simple-engine/chair.mjs';
import {reactToBattle} from '../packages/simple-engine/reactions.mjs';
const world=seed=>{const g=seedSimple({seed,maxRounds:12});for(const c of Object.values(g.countries))c.human=true;g.regions[6].units.infantry=5;return g;};
test('a short attack decision infers actual origin and troops, launches combat and pays the lighter game cost',async()=>{
 const g=world(71),p=await prepareChair(g,'us','Attack Central America',{}, {model:async()=>({text:JSON.stringify({kind:'directive',analysis:'Conventional fictional war order',objectives:[{id:'attack',title:'Attack Central America',order:{action:'operation',target:8}}]})})});
 const r=submitChair(g,'us','Attack Central America',p);assert.ok(r.game.combatEvents.length);assert.ok(r.directive.cost.money>0);assert.ok(r.directive.objectives[0].details.some(s=>s.includes('automatically')));const movement=r.game.movements[0];assert.equal(movement.origin,6);assert.equal(r.directive.cost.money,Object.values(movement.units).reduce((s,n)=>s+n,0)*12);assert.equal(simpleView(r.game,'eu').combatEvents[0].target,8);assert.equal(simpleView(r.game,'eu').regions[6].units,undefined);
});
test('a treaty breach is a paid attack with an actual diplomatic consequence rather than a veto',()=>{
 const g=world(72),other=g.regions[8].owner;g.agreements.push({id:'peace',status:'active',expires:4,parties:['us',other],terms:{kind:'peace'}});
 const r=submitChair(g,'us','Attack despite the peace agreement',{kind:'directive',analysis:'Breach with consequences',objectives:[{id:'war',title:'Attack',order:{action:'operation',origin:6,target:8,units:{infantry:2}}}]});assert.equal(r.game.agreements[0].status,'violated');assert.ok(r.game.combatEvents.length);assert.ok(r.directive.results.some(x=>x.includes('Treaty breached')));assert.equal(r.directive.cost.money,24);
});
test('defender choices are seeded, varied, affordable, once per attacker/month, and conserve reserve personnel',()=>{
 const seen=new Set();for(let seed=1;seed<=100;seed++){
  const g=world(seed),defender=g.regions[8].owner;g.countries[defender].human=false;g.regions[9].owner=defender;const initial=totalForces(g,defender),cash=g.countries[defender].treasury;g.regions[8].owner='us';const afterLoss=totalForces(g,defender);const input=structuredClone(g);
  const r=reactToBattle(g,{attacker:'us',defender,region:8,captured:true});seen.add(r.kind);const again=reactToBattle(input,{attacker:'us',defender,region:8,captured:true});assert.deepEqual(r,again);assert.equal(g.countries[defender].treasury,cash-r.cost);assert.equal(totalForces(g,defender),afterLoss);assert.ok(initial>=afterLoss);assert.equal(reactToBattle(g,{attacker:'us',defender,region:8,captured:true}),null);
 }assert.ok(seen.has('broadcast'));assert.ok(seen.has('diplomatic-appeal'));assert.ok(seen.has('scorched-withdrawal'));assert.ok(seen.has('reserve-surge'));assert.ok(seen.has('war-weariness'));
});
test('resource denial causes real recovery costs, is temporary, and cannot be paid with nonexistent funds',()=>{
 for(let seed=1;seed<=100;seed++){
  let g=world(seed),defender=g.regions[8].owner;g.countries[defender].human=false;g.regions[8].owner='us';g.regions[8].buildings.port=1;const r=reactToBattle(g,{attacker:'us',defender,region:8,captured:true});if(r.kind!=='scorched-withdrawal')continue;
  assert.equal(g.regions[8].buildings.port,undefined);g=resolveSimple(g,{skipAutonomous:true});assert.ok(g.countries.us.ledger.some(l=>l.reason==='Occupied infrastructure recovery'&&l.amount===-25));g=resolveSimple(g,{skipAutonomous:true});g=resolveSimple(g,{skipAutonomous:true});assert.equal(g.countries.us.lastRecoveryCost,0);g.countries[defender].treasury=0;assert.equal(reactToBattle(g,{attacker:'us',defender,region:8,captured:true}),null);return;
 }assert.fail('Seed range must include a denial response');
});

test('limited funds scale a requested force down instead of cancelling an affordable ground attack',()=>{
 const g=world(75);g.countries.us.treasury=24;const r=submitChair(g,'us','Attack with whatever we can afford',{kind:'directive',analysis:'A scaled offensive',objectives:[{id:'attack',title:'Attack',order:{action:'operation',origin:6,target:8,units:{infantry:5,tanks:2}}}]});assert.ok(r.game.combatEvents.length);assert.equal(r.directive.cost.money,24);assert.equal(r.game.countries.us.treasury,0);assert.equal(r.game.movements[0].units.infantry,2);assert.equal(r.game.movements[0].units.tanks,0);assert.ok(r.directive.results.some(s=>s.includes('scaled to')));
});

test('a declaration can break a treaty and unlock its dependent offensive in the same decision',()=>{
 const g=world(76),country=g.regions[8].owner;g.agreements.push({id:'peace',status:'active',expires:4,parties:['us',country],terms:{kind:'peace'}});
 const r=submitChair(g,'us','Declare war and attack',{kind:'directive',analysis:'War decision',objectives:[{id:'war',title:'Declare war',order:{action:'war',country}},{id:'attack',title:'Attack',dependsOn:['war'],order:{action:'operation',target:8}}]});assert.equal(r.game.agreements[0].status,'violated');assert.ok(r.game.combatEvents.length);assert.ok(r.game.wars.some(w=>w.parties.includes(country)&&w.parties.includes('us')));
});

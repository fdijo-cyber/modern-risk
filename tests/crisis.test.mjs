import test from 'node:test';import assert from 'node:assert/strict';import {mkdtempSync,rmSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';
import {seedSimple,adjudicateDirective,resolveSimple,simpleView,totalForces} from '../packages/simple-engine/index.mjs';
import {interpretLongDirective} from '../packages/simple-engine/planner.mjs';import {openStore} from '../apps/server/store.mjs';
const world=()=>{const g=seedSimple({seed:314,maxRounds:24});for(const c of Object.values(g.countries))c.human=true;return g;};
const initiative=(extra={})=>({action:'initiative',title:'Oceanic Civic Academy',intent:'A floating institution combining marine research and civic education',category:'scientific institution',target:0,budget:200,duration:2,risk:5,visibility:'public',effects:[{stat:'research',value:4},{stat:'income',value:10}],...extra});
test('one imaginative multiline directive is adjudicated, paid, simulated, saved and reported in the same round',async()=>{
 const text='Establish a floating marine academy in Alaska with $200.\n\nBuild a refinery in Western United States.\n\nMove one infantry unit from Western United States to Eastern United States.\n\nSend a message to China asking for a four-month trade deal.';let g=world();const before=g.regions[6].units.infantry,p=await interpretLongDirective(g,'us',text,{}, {env:{}});assert.ok(p.orders.some(o=>o.action==='initiative'));const r=adjudicateDirective(g,'us',{text,...p});g=r.game;assert.equal(g.round,1);assert.equal(r.directive.questions.length,0);assert.ok(r.directive.adjudicated);assert.ok(r.directive.analysis);assert.equal(g.regions[6].buildings.refinery,1);assert.equal(g.regions[6].units.infantry,before-1);assert.equal(g.countries.us.initiatives.length,1);assert.ok(g.messages.some(m=>m.to==='china'));assert.ok(g.countries.us.treasury<1500);assert.ok(r.directive.results.some(r=>r.includes('established')));
 const dir=mkdtempSync(join(tmpdir(),'crisis-persist-')),store=openStore(join(dir,'game.sqlite'));try{store.save({code:'CRISIS',game:g});const restored=store.load('CRISIS').game;assert.deepEqual(restored.countries.us.initiatives,g.countries.us.initiatives);assert.deepEqual(restored.countries.us.directives[0].results,r.directive.results);}finally{store.db.close();rmSync(dir,{recursive:true,force:true});}
 assert.ok(simpleView(g,'us').publicEvents.some(e=>e.headline.includes('academy')));assert.equal(simpleView(g,'eu').you.directives.length,0);
});
test('generic effects cannot mint troops, ownership or free treasury and bound proposed magnitudes',()=>{
 const g=world(),troops=totalForces(g,'us'),ownership=g.regions.map(r=>r.owner),r=adjudicateDirective(g,'us',{text:'Invent a treasury machine and a new institute',orders:[initiative({effects:[{stat:'treasury',value:999999},{stat:'owner',value:1},{stat:'infantry',value:900},{stat:'economic',value:9999},{stat:'income',value:99999}]})]});const p=r.game.countries.us.initiatives[0];assert.equal(r.game.countries.us.treasury,1300);assert.deepEqual(r.game.regions.map(r=>r.owner),ownership);assert.equal(totalForces(r.game,'us'),troops);assert.ok(p.effects.every(e=>['economic','income'].includes(e.stat)));assert.ok(p.effects.find(e=>e.stat==='economic').value<=8);assert.ok(r.directive.results.some(r=>r.includes('Adjudication adjustment')));
});
test('ongoing initiatives progress, charge real operating costs and deliver only recorded outcomes',()=>{
 let g=adjudicateDirective(world(),'us',{text:'Create academy',orders:[initiative()]}).game;assert.equal(g.countries.us.initiatives[0].progress,0);g=resolveSimple(g);assert.equal(g.countries.us.initiatives[0].progress,1);g=resolveSimple(g);const p=g.countries.us.initiatives[0];assert.ok(['completed','failed'].includes(p.status));assert.ok(p.history.length>=3);assert.ok(g.countries.us.ledger.some(l=>l.reason==='Operating cost: Oceanic Civic Academy'));if(p.status==='completed'){assert.equal(g.countries.us.research,4);assert.equal(g.countries.us.lastProjectIncome,10);}else assert.equal(g.countries.us.research??0,0);assert.ok(g.publicBriefings[1].events.some(e=>e.headline.includes(p.title)));
});
test('secret initiatives and private adjudication never enter another player projection or public articles',()=>{
 const r=adjudicateDirective(world(),'us',{text:'Secret observatory classified-indigo',orders:[initiative({title:'classified-indigo',visibility:'secret',category:'intelligence',effects:[{stat:'counterintel',value:4}]})]});let g=resolveSimple(r.game);const foreign=JSON.stringify(simpleView(g,'eu'));assert.ok(!foreign.includes('classified-indigo'));assert.ok(!JSON.stringify(g.publicBriefings).includes('classified-indigo'));assert.ok(simpleView(g,'us').you.initiatives.some(p=>p.title==='classified-indigo'));
});
test('foreign-site projects require human consent, preserve sovereignty, and refund declined escrow',()=>{
 let g=world();const owner=g.regions[21].owner;g=adjudicateDirective(g,'us',{text:'Cooperative Suez observatory',orders:[initiative({target:21})]}).game;const p=g.countries.us.initiatives[0],a=g.agreements.find(a=>a.terms.project===p.id);assert.equal(p.status,'awaiting_consent');assert.equal(a.status,'offered');assert.equal(g.regions[21].owner,owner);assert.equal(g.countries.us.treasury,1300);a.status='rejected';const before=g.countries.us.ledger.length;g=resolveSimple(g);assert.equal(g.countries.us.initiatives[0].status,'cancelled');assert.ok(g.countries.us.ledger.slice(before).some(l=>l.amount===200&&l.reason.includes('Refund')));
});
test('AI governments give same-round treaty counteroffers and treaties have paid persistent effects',()=>{
 let g=world();g.countries.china.human=false;let r=adjudicateDirective(g,'us',{text:'Request a large loan',orders:[{action:'treaty',kind:'loan',country:'china',from:'china',amount:800,months:6}]});g=r.game;assert.equal(g.agreements[0].status,'counteroffer');assert.equal(g.agreements[0].counterTerms.amount,500);assert.equal(g.round,1);r=adjudicateDirective(g,'us',{text:'Accept a smaller loan',orders:[{action:'treaty',kind:'loan',country:'china',from:'china',amount:500,months:6}]});g=r.game;assert.equal(g.agreements[1].status,'active');assert.equal(g.countries.us.debt,500);assert.ok(r.directive.results.some(r=>r.includes('activated this month')));
});
test('unaffordable clauses fail independently while a novel feasible project survives',()=>{
 const r=adjudicateDirective(world(),'us',{text:'Impossible movement and an attainable academy',orders:[{action:'move',origin:6,target:7,units:{infantry:90}},initiative()]});assert.equal(r.directive.status,'partial');assert.equal(r.game.countries.us.initiatives.length,1);assert.equal(r.game.countries.us.treasury,1300);assert.ok(r.directive.results.some(r=>r.includes('Not enough')));
});
test('unsupported AI action labels are revised into a generic project rather than mechanic rejection',()=>{
 const r=adjudicateDirective(world(),'us',{text:'Create a novel ocean senate',orders:[{action:'establishOceanSenate',title:'Ocean Senate',intent:'A new institution',budget:100}]});assert.equal(r.directive.status,'executed');assert.equal(r.game.countries.us.initiatives[0].title,'Ocean Senate');
});

test('natural-language project location and confidentiality are preserved by the local fallback',async()=>{
 const g=world();const text='Create a confidential scientific observatory in Alaska with $100.';const plan=await interpretLongDirective(g,'us',text,{region:6},{env:{}});const r=adjudicateDirective(g,'us',{text,...plan});const p=r.game.countries.us.initiatives[0];assert.equal(p.target,0);assert.equal(p.visibility,'secret');assert.equal(p.category,'scientific');assert.ok(!JSON.stringify(simpleView(r.game,'eu')).includes('confidential scientific observatory'));
});
test('a user request for a diplomatic message is not silently turned into an activated treaty',async()=>{
 const g=world(),text='Send a message to China asking for trade talks.';const p=await interpretLongDirective(g,'us',text,{}, {env:{}});assert.equal(p.orders[0].action,'message');const r=adjudicateDirective(g,'us',{text,...p});assert.equal(r.game.agreements.length,0);assert.ok(r.game.messages.length>0);
});

test('monthly financial reports reconcile same-round action spending and recurring project costs',()=>{
 let g=adjudicateDirective(world(),'us',{text:'Academy funding',orders:[initiative()]}).game;g=resolveSimple(g);const b=g.countries.us.briefings[0];assert.equal(b.opening,1500);assert.equal(b.opening+b.inflows-b.expenditure,b.closing);assert.ok(b.expenditure>=200+4);assert.equal(b.projectOperations,4);
});

test('new construction and policy labels persist as generic initiatives instead of fixed-mechanic errors',()=>{
 const r=adjudicateDirective(world(),'us',{text:'Build an ocean senate and launch a scientific charter',orders:[{action:'build',building:'ocean-senate',target:0,budget:100},{action:'policy',category:'scientific',purpose:'Marine science charter',budget:100,visibility:'secret'}]});assert.equal(r.directive.status,'executed');assert.equal(r.game.countries.us.initiatives.length,2);assert.equal(r.game.countries.us.initiatives[1].visibility,'secret');assert.equal(r.game.regions[0].buildings['ocean-senate'],undefined);
});
test('unknown AI conditions establish a conditional mandate rather than silently ignoring the condition',()=>{
 const r=adjudicateDirective(world(),'us',{text:'If an external event happens, establish an academy',orders:[initiative()],conditions:[{kind:'external_event',event:'independent committee approval'}]});assert.equal(r.directive.status,'executed');assert.equal(r.game.countries.us.initiatives[0].status,'awaiting_condition');assert.equal(r.game.countries.us.research??0,0);
});

test('completed project effects cannot be applied twice by suspending and resuming operating funds',()=>{
 let g=adjudicateDirective(world(),'us',{text:'Academy',orders:[initiative({risk:5,duration:1})]}).game;g=resolveSimple(g);const p=g.countries.us.initiatives[0];assert.equal(p.status,'completed');const research=g.countries.us.research;g.countries.us.treasury=0;g=resolveSimple(g);assert.equal(g.countries.us.initiatives[0].status,'suspended');g.countries.us.treasury=500;g=resolveSimple(g);assert.equal(g.countries.us.initiatives[0].status,'completed');assert.equal(g.countries.us.research,research);
});
test('loss of a project site suspends its work and benefit without creating foreign access',()=>{
 let g=adjudicateDirective(world(),'us',{text:'Academy',orders:[initiative()]}).game;g.regions[0].owner='russia';g=resolveSimple(g);assert.equal(g.countries.us.initiatives[0].status,'suspended');assert.equal(g.countries.us.initiatives[0].progress,0);assert.equal(g.countries.us.research??0,0);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {seedSimple,simpleView,assertSimple} from '../packages/simple-engine/index.mjs';
import {prepareChair,submitChair,resolveChairRound,lockChairRound,chairHistory,validateChairPlan,respondUltimatum} from '../packages/simple-engine/chair.mjs';
import {openStore} from '../apps/server/store.mjs';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const world=()=>{const g=seedSimple({seed:534,maxRounds:12});for(const c of Object.values(g.countries))c.human=true;g.regions[6].units={infantry:5,tanks:3,fighters:2,bombers:0,navy:3,special:1};g.regions[6].coastal=true;g.regions[8].coastal=true;return g;};
const obj=(id,order,extra={})=>({id,title:id,order,...extra});
const complex={kind:'directive',analysis:'Issue an ultimatum, attack on refusal with available combined arms, interdict shipping, invest and introduce a new national policy.',objectives:[
 obj('ultimatum',{action:'ultimatum',country:'centralamerica',target:8,demand:'surrender',body:'Surrender or face the authorized offensive.'}),
 obj('invasion',{action:'operation',origin:6,target:8,units:{infantry:3,tanks:2,fighters:1,bombers:1},strategy:'Air superiority followed by a ground offensive'},{when:{objective:'ultimatum',outcome:'refused'}}),
 obj('blockade',{action:'blockade',origin:6,target:8,units:{navy:1},months:2}),
 obj('investment',{action:'initiative',title:'National Development Bank',intent:'Finance infrastructure; invite foreign participation without assuming consent.',budget:200,duration:3,category:'institution',effects:[{stat:'income',value:10}]}),
 obj('policy',{action:'policy',category:'political',purpose:'Transparent national procurement legislation',budget:100})]};
function plan(g){const p=structuredClone(complex);p.objectives[0].order.country=g.regions[8].owner;return p;}
test('acceptance: five objectives commit real battle, blockade, investment, ultimatum, policy, reports and next-month memory',async()=>{
 let g=world();g.countries[g.regions[8].owner].human=false;
 // Guarantee credible resistance to the surrender demand, not guaranteed victory in battle.
 g.regions[8].units.infantry=10;
 const p=plan(g),before=structuredClone(g),text='Demand surrender; if refused, launch Southern Thunder with 3,000 infantry and available support. Blockade the coast, fund a development bank and enact procurement legislation.';
 const interpreted=await prepareChair(g,'us',text,{}, {model:async()=>({text:JSON.stringify(p)})});assert.equal(interpreted.objectives.length,5);const r=submitChair(g,'us',text,interpreted);g=r.game;const d=r.directive;
 assert.equal(d.objectives.length,5);assert.equal(d.objectives[0].decision,'refused');assert.ok(g.countries.us.battleReports.length);assert.ok(d.objectives[1].details.some(s=>s.includes('bombers: requested 1, available 0')));assert.ok(g.movements.some(m=>m.action==='attack'&&m.target===8));
 assert.ok(g.countries.us.treasury<before.countries.us.treasury-300);assert.ok(g.countries.us.ammo<100);assert.ok(g.countries.us.fuel<100);assert.ok(g.wars.some(w=>w.parties.includes('us')));assert.equal(g.countries.us.policies.length,1);assert.equal(g.countries.us.initiatives[0].title,'National Development Bank');assert.ok(g.blockades.length);
 assert.ok(d.privateReport.includes('treasury'));assert.equal(d.cost.money,before.countries.us.treasury-g.countries.us.treasury);assert.ok(g.chairArticles.some(a=>a.body.split(/\s+/).length>=100));
 if(process.env.CHAIR_EVIDENCE)console.info(JSON.stringify({scenario:'five-objective acceptance',outcomes:d.objectives.map(o=>({objective:o.id,outcome:o.outcome})),treasuryBefore:before.countries.us.treasury,treasuryAfter:g.countries.us.treasury,committedCost:d.cost,ownLosses:g.countries.us.battleReports[0].ownLosses,ownerBefore:before.regions[8].owner,ownerAfter:g.regions[8].owner,policyCount:g.countries.us.policies.length,articleCount:g.chairArticles.length}));
 const own=simpleView(g,'us');assert.equal(own.regions[8].owner,g.regions[8].owner);assert.ok(!JSON.stringify(simpleView(g,'eu')).includes(text));
 const noAction=await prepareChair(g,'us','Why did my invasion fail?',{},{env:{}});assert.equal(noAction.kind,'question');assert.ok(noAction.answer.includes('Month 1'));assert.deepEqual(submitChair(g,'us','Why did my invasion fail?',noAction).game,g);
 const dir=mkdtempSync(join(tmpdir(),'chair-'));const store=openStore(join(dir,'game.sqlite'));try{store.save({code:'CHAIR',game:g});g=store.load('CHAIR').game;assert.deepEqual(g.countries.us.chairRecords[0].objectives,d.objectives);}finally{store.db.close();rmSync(dir,{recursive:true,force:true});}
 g=resolveChairRound(g);assert.equal(g.round,2);assert.ok(chairHistory(g,'us','Southern Thunder').records.length);assert.ok(g.countries.us.chairRecords[0].objectives.some(o=>o.id==='policy'));assertSimple(g);
});
test('same locked snapshot, simultaneous troop detachment, stable replay regardless of request arrival order',()=>{
 const base=world(),defender=base.regions[8].owner;base.countries[defender].human=true;lockChairRound(base);
 const a={kind:'directive',analysis:'Attack',objectives:[obj('a',{action:'operation',origin:6,target:8,units:{infantry:2,tanks:1}})]};
 const b={kind:'directive',analysis:'Counterattack',objectives:[obj('b',{action:'operation',origin:8,target:6,units:{infantry:1}})]};base.regions[8].units.infantry=3;
 const run=reverse=>{let g=structuredClone(base);for(const [cid,p] of (reverse?[[defender,b],['us',a]]:[['us',a],[defender,b]])){g=submitChair(g,cid,p.analysis,p,{sealed:true}).game;assert.equal(g.countries.us.treasury,1500);}return resolveChairRound(g);};
 const one=run(false),two=run(true);assert.deepEqual(one.regions,two.regions);assert.equal(one.countries.us.treasury,two.countries.us.treasury);assert.deepEqual(one.countries.us.battleReports.map(r=>r.ownLosses),two.countries.us.battleReports.map(r=>r.ownLosses));assert.equal(one.countries.us.chairRecords[0].snapshotHash,two.countries.us.chairRecords[0].snapshotHash);
});
test('Chair schema correction uses actual resource limits and failure defers without imaginary effects',async()=>{
 const g=world();let calls=0;
 const p=await prepareChair(g,'us','Establish a bank',{}, {model:async args=>{calls++;if(calls===1)return {text:JSON.stringify({kind:'directive',analysis:'Invalid budget',objectives:[obj('bank',{action:'initiative',budget:999999})]})};assert.equal(args.input.correction.limits.treasury,1500);return {text:JSON.stringify({kind:'directive',analysis:'Bounded proposal',objectives:[obj('bank',{action:'initiative',title:'Bank',budget:200})]})};}});
 assert.equal(calls,2);assert.equal(p.corrections,1);
 const offline=await prepareChair(g,'us','Launch an invasion',{}, {model:async()=>({text:null,reason:'Unavailable'})});const r=submitChair(g,'us','Launch an invasion',offline);assert.equal(r.directive.status,'deferred');assert.equal(r.game.countries.us.treasury,1500);assert.deepEqual(r.game.regions,g.regions);
 assert.throws(()=>validateChairPlan({kind:'directive',analysis:'cycle',objectives:[obj('a',{action:'policy'},{dependsOn:['b']})]},g,'us'));
});
test('blockade deployment is conserved, drains actual revenue, expires and returns survivors',()=>{
 let g=world(),defender=g.regions[8].owner;const initial=g.regions[6].units.navy;g.regions[8].units.navy=0;
 g=submitChair(g,'us','Blockade', {kind:'directive',analysis:'Naval interdiction',objectives:[obj('naval',{action:'blockade',origin:6,target:8,units:{navy:1},months:1})]}).game;
 assert.equal(g.regions[6].units.navy,initial-1);g=resolveChairRound(g);assert.ok(g.countries[defender].ledger.some(l=>l.reason==='Blockade trade disruption'));g=resolveChairRound(g);assert.equal(g.blockades[0].status,'completed');assert.equal(g.regions[6].units.navy,initial);
});

test('a defeated operation still pays costs and records exact losses; phases do not claim absent equipment',()=>{
 let g=world();g.regions[8].units.infantry=90;const before=structuredClone(g),p={kind:'directive',analysis:'Attempt the offensive without nonexistent bombers',objectives:[obj('attack',{action:'operation',origin:6,target:8,units:{infantry:3,bombers:1}})]};
 const r=submitChair(g,'us','Attack with available infantry and bomber support',p);g=r.game;assert.equal(r.directive.objectives[0].outcome,'unsuccessful');assert.equal(g.regions[8].owner,before.regions[8].owner);assert.equal(g.countries.us.treasury,1464);assert.equal(g.countries.us.ammo,97);assert.equal(r.directive.cost.money,36);
 const b=g.countries.us.battleReports[0];assert.ok(b.phases.some(p=>p.phase==='air operations'&&p.outcome==='unavailable'));assert.equal(g.regions[6].units.infantry,before.regions[6].units.infantry-b.ownLosses.infantry);assert.equal(g.regions[6].personnel,g.regions[6].units.infantry*1000+g.regions[6].units.special*100);
});
test('an unaffordable combat objective does not delete older unfunded directives or charge an invented expense',()=>{
 const g=world();g.countries.us.treasury=10;g.countries.us.directives.push({id:'old-review',round:1,status:'review',orders:[],cost:{money:0,oil:0,fuel:0}});
 const r=submitChair(g,'us','Attack', {kind:'directive',analysis:'Unaffordable offensive',objectives:[obj('attack',{action:'operation',origin:6,target:8,units:{infantry:3}})]});assert.ok(r.game.countries.us.directives.some(d=>d.id==='old-review'));assert.equal(r.game.countries.us.treasury,10);assert.equal(r.directive.cost.money,0);assert.equal(r.game.movements?.length??0,0);
});
test('independent government programs resolve through the same Chair and persist paid decisions',()=>{
 let g=world();g.countries.china.human=false;g=resolveChairRound(g);const c=g.countries.china;assert.ok(c.chairRecords.some(r=>r.source==='seeded-government'));assert.ok(c.ledger.some(l=>l.amount<0));assert.ok(c.directives.some(d=>d.chair&&d.adjudicated));
});

test('human ultimatum preserves consent and resumes only its authorized refusal branch after a real response',()=>{
 let g=world();const owner=g.regions[8].owner,p=plan(g);p.objectives=p.objectives.slice(0,2);g=submitChair(g,'us','Surrender or invade',p).game;assert.equal(g.movements?.length??0,0);assert.equal(g.ultimatums[0].status,'pending');const id=g.ultimatums[0].id;assert.throws(()=>respondUltimatum(g,'eu',id,'refused'));g=respondUltimatum(g,owner,id,'refused',{sealed:false});assert.ok(g.movements.some(m=>m.action==='attack'));assert.equal(g.ultimatums[0].status,'refused');assert.throws(()=>respondUltimatum(g,owner,id,'refused'));
});

test('secret policy intent cannot leak through legacy public policy events',()=>{
 const g=world(),r=submitChair(g,'us','Confidential velvet policy',{kind:'directive',analysis:'Secret political program',objectives:[obj('secret',{action:'policy',category:'political',purpose:'velvet-private-name',budget:100,visibility:'secret'})]});assert.ok(r.game.countries.us.initiatives.some(p=>p.visibility==='secret'));assert.ok(!JSON.stringify(simpleView(r.game,'eu')).includes('velvet-private-name'));assert.ok(!JSON.stringify(r.game.chairArticles).includes('velvet-private-name'));
});

import {combatContext} from './combat-context.mjs';
import {ensureFormations,detachFormations,mergeFormations,conditionPower,damageFormations,countsFromFormations,monthlyConditions} from './formations.mjs';
import {reactToBattle} from './reactions.mjs';
import {normalizeInitiative,launchInitiative,tickInitiatives} from './initiatives.mjs';
import {localDiplomat} from './diplomat.mjs';
import {seedGame} from '../shared/scenario.mjs';
import {UNIT_TYPES,BUILDINGS,SITES,sumUnits} from '../../apps/web/public/simple-rules.js';
export {UNIT_TYPES,BUILDINGS,SITES};
const clone=structuredClone,cap=(n,a=0,b=100)=>Math.max(a,Math.min(b,n));
const must=(ok,msg)=>{if(!ok)throw new Error(msg);};
const integer=(n,min=0,max=9999)=>Number.isSafeInteger(n)&&n>=min&&n<=max;
export const deployedForces=(g,cid)=>g.regions.filter(r=>r.owner===cid).reduce((s,r)=>s+sumUnits(r),0)+(g.blockades??[]).filter(b=>b.country===cid&&b.status==='active').reduce((n,b)=>n+Object.values(b.units).reduce((s,v)=>s+v,0),0);
export const totalForces=(g,cid)=>deployedForces(g,cid)+Object.values(g.countries[cid].reserves??{}).reduce((s,n)=>s+n,0);
export function syncRegion(r){r.personnel=(r.units.infantry??0)*1000+(r.units.special??0)*100;r.tanks=(r.units.tanks??0)*120;r.fighters=(r.units.fighters??0)*12;r.bombers=(r.units.bombers??0)*6;return r;}
export function seedSimple(options){const g=seedGame(options);g.ruleset='simple';g.version=5;g.militaryVersion=2;g.fleets=[];g.missions=[];g.messages=[];g.agreements=[];g.serial=0;
 for(const c of Object.values(g.countries)){Object.assign(c,{treasury:1500,debt:0,oil:100,fuel:100,economic:65,political:70,social:70,stability:70,approval:70,supplies:100,ammo:100,spares:50,readiness:100,orders:[],directives:[],ledger:[],briefings:[],loans:[],recurring:[],results:[],intel:{}});}
 const profiles={
  us:{label:'Air superiority',advantage:'Fighter and bomber combat power +10%.',bonus:'air',units:{infantry:8,tanks:5,special:3,fighters:7,navy:5,bombers:4}},
  eu:{label:'Commercial network',advantage:'Monthly domestic income +10%.',bonus:'income',units:{infantry:10,tanks:6,special:4,fighters:4,navy:4,bombers:3}},
  china:{label:'Industrial scale',advantage:'Recruitment prices −10%.',bonus:'recruit',units:{infantry:13,tanks:8,special:2,fighters:4,navy:3,bombers:2}},
  russia:{label:'Armored doctrine',advantage:'Tank combat power +15%.',bonus:'armor',units:{infantry:8,tanks:10,special:3,fighters:3,navy:3,bombers:4}}
 };
 const minorProfiles=[{label:'Territorial defense',advantage:'Infantry combat power +10%.',bonus:'infantry',units:{infantry:14,tanks:5,special:4,fighters:3,navy:3,bombers:2}},{label:'Maritime tradition',advantage:'Warship combat power +15%.',bonus:'navy',units:{infantry:8,tanks:3,special:3,fighters:5,navy:8,bombers:3}},{label:'Trade specialization',advantage:'Monthly domestic income +10%.',bonus:'income',units:{infantry:12,tanks:5,special:3,fighters:4,navy:3,bombers:3}}];
 for(const r of g.regions){r.units=Object.fromEntries(Object.keys(UNIT_TYPES).map(k=>[k,0]));r.buildings={};r.readiness=100;}
 for(const c of Object.values(g.countries)){
  const owned=g.regions.filter(r=>r.owner===c.id),home=owned[0],profile=profiles[c.id]??minorProfiles[home.id%minorProfiles.length];c.forceProfile=profile.label;c.advantage=profile.advantage;c.bonus=profile.bonus;c.startingUnits=clone(profile.units);c.reserves={};
  for(const [type,total] of Object.entries(profile.units)){const eligible=type==='navy'?owned.filter(r=>r.coastal):owned;const deployed=eligible.length?Math.min(total,Math.max(type==='infantry'?eligible.length:0,Math.floor(total*.6))):0;c.reserves[type]=total-deployed;for(let i=0;i<deployed;i++)eligible[i%eligible.length].units[type]++;}
  home.buildings.economic=1;home.buildings.airbase=1;home.buildings.factory=1;if(home.coastal)home.buildings.navalbase=1;
 }
 for(const r of g.regions)syncRegion(r);
 return g;
}
const own=(g,cid,id)=>g.regions[id]?.owner===cid;
export function inspectOrder(g,cid,raw){const c=g.countries[cid],o=clone(raw);must(c&&g.phase==='planning','Planning is closed');const target=g.regions[o.target];let money=0,oil=0,fuel=0,recurring=0,summary='';
 const needsRegion=['move','attack','scout','build','recruit','mobilize'];if(needsRegion.includes(o.action))must(target,'Select a valid region');
 if(['move','attack'].includes(o.action)){
  const source=g.regions[o.origin];must(source?.owner===cid,'Origin must be one of your territories');must(source.adjacent.includes(o.target),'Choose an adjacent destination');must(o.action==='move'?target.owner===cid:target.owner!==cid,'Movement must match territory ownership');
  must(o.units&&typeof o.units==='object','Choose unit groups');must(Object.keys(o.units).length>0&&Object.entries(o.units).every(([k,n])=>Object.hasOwn(UNIT_TYPES,k)&&integer(n,0,99)),'Invalid unit groups');must(Object.values(o.units).some(n=>n>0),'Commit at least one unit');
  for(const [type,n] of Object.entries(o.units)){must(n<=(source.units[type]??0),`Not enough ${UNIT_TYPES[type].name} units in ${source.name}`);money+=n*(o.action==='attack'?(o.chairOperation?12:20):8);oil+=n*Math.ceil(UNIT_TYPES[type].oil*(o.chairOperation?.75:1));fuel+=n*Math.ceil(UNIT_TYPES[type].fuel*(o.chairOperation?.75:1));}
  must(!(o.units.navy>0)||source.coastal&&target.coastal,'Warships can only operate between coastal regions');
  must(o.action!=='attack'||(o.units.infantry??0)+(o.units.special??0)>0,'Ground units are required to occupy territory');summary=`${o.action==='attack'?'Attack':'Move'} from ${source.name} to ${target.name}`;
 }else if(o.action==='mobilize'||o.action==='reserve'){
  must(o.units&&Object.keys(o.units).length&&Object.entries(o.units).every(([k,n])=>Object.hasOwn(UNIT_TYPES,k)&&integer(n,0,99))&&Object.values(o.units).some(n=>n>0),'Choose valid unit groups');
  const location=g.regions[o.action==='mobilize'?o.target:o.origin];must(location?.owner===cid,'Choose an owned deployment region');
  for(const [type,n] of Object.entries(o.units)){
   const stock=o.action==='mobilize'?(c.reserves?.[type]??0):(location.units[type]??0);must(n<=stock,`Insufficient ${UNIT_TYPES[type].name} groups in ${o.action==='mobilize'?'reserve':location.name}`);
   if(o.action==='mobilize'&&n>0){if(['fighters','bombers'].includes(type))must(location.buildings.airbase,'Air base required to mobilize aircraft');if(type==='navy')must(location.coastal&&location.buildings.navalbase,'Coastal naval base required to mobilize warships');}
   money+=n*(o.action==='mobilize'?5:2);oil+=n;fuel+=n*Math.ceil(UNIT_TYPES[type].fuel/2);
  }
  summary=o.action==='mobilize'?`Mobilize reserves to ${location.name}`:`Return ${location.name} units to reserve`;
 }else if(o.action==='recruit'){
  must(own(g,cid,o.target),'Recruit at an owned territory');must(Object.hasOwn(UNIT_TYPES,o.unit)&&integer(o.quantity,1,20),'Choose a unit type and 1–20 groups');const required={tanks:'factory',fighters:'airbase',bombers:'airbase',navy:'navalbase'}[o.unit];must(!required||target.buildings[required],`${BUILDINGS[required]?.name} required at ${target.name}`);must(o.unit!=='navy'||target.coastal,'Naval groups require a coast');money=Math.ceil(UNIT_TYPES[o.unit].cost*o.quantity*(c.bonus==='recruit'?.9:1));oil=UNIT_TYPES[o.unit].oil*o.quantity;fuel=UNIT_TYPES[o.unit].fuel*o.quantity;summary=`Recruit ${o.quantity} ${UNIT_TYPES[o.unit].name} unit(s) at ${target.name}`;
 }else if(o.action==='build'){
  must(own(g,cid,o.target),'Build at an owned territory');must(Object.hasOwn(BUILDINGS,o.building),'Choose one of the seven building types');must(!target.buildings[o.building],'That building is already present');must(!['navalbase','port'].includes(o.building)||target.coastal,'This building requires a coast');const b=BUILDINGS[o.building];({cost:money,oil,fuel,upkeep:recurring}=b);summary=`Build ${b.name} in ${target.name}`;
 }else if(o.action==='scout'){
  must(target.owner!==cid,'Scout a foreign region');o.method=o.method??'scouts';must(['scouts','special'].includes(o.method),'Choose scouts or special forces');money=Math.ceil((o.method==='special'?60:25)*(c.bonus==='scout'?.8:1));oil=1;fuel=o.method==='special'?4:2;
  if(o.method==='special'){must(own(g,cid,o.origin)&&g.regions[o.origin].adjacent.includes(o.target),'Special forces need an adjacent owned origin');must((g.regions[o.origin].units.special??0)>0,'No special-forces unit at the origin');}
  summary=`${o.method==='special'?'Special-forces reconnaissance':'Scout'} ${target.name}`;
 }else if(o.action==='policy'){
  must(['economic','political','social','intelligence'].includes(o.category),'Choose a policy category');must(typeof o.purpose==='string'&&o.purpose.trim().length>0&&o.purpose.length<=3000,'Describe the policy');o.budget=o.budget??100;must(integer(o.budget,25,1000),'Policy budget must be $25–$1,000');money=o.budget;oil=Math.ceil(money/100);fuel=Math.ceil(money/100);summary=`${o.category} policy: ${o.purpose.slice(0,100)}`;
 }else if(o.action==='initiative'){
  Object.assign(o,normalizeInitiative(g,cid,o));money=o.budget;oil=Math.ceil(money/150);fuel=Math.ceil(money/150);recurring=o.upkeep;summary=`Establish ${o.title} in ${g.regions[o.target].name}`;
 }else if(o.action==='message'){
  must(g.countries[o.country]&&o.country!==cid,'Select a recipient');must(typeof o.body==='string'&&o.body.trim().length>0&&o.body.length<=6000,'Message must contain 1–6,000 characters');o.subject=String(o.subject??'Official communication').slice(0,160);money=5;summary=`Send official message to ${g.countries[o.country].name}`;
 }else if(o.action==='loan'){
  must(integer(o.amount,50,1000)&&integer(o.months??6,2,12),'Loan must be $50–$1,000 for 2–12 months');must(c.debt+o.amount<=2000,'Debt ceiling is $2,000');o.months??=6;summary=`Request $${o.amount} loan over ${o.months} months`;
 }else if(o.action==='repay'){
  must(integer(o.amount,1,2000)&&o.amount<=c.debt,'Repayment exceeds current debt');money=o.amount;summary=`Repay $${o.amount} of debt`;
 }else if(o.action==='war'){
  must(g.countries[o.country]&&o.country!==cid,'Select a foreign government');if(!o.chairDecision)must(!g.agreements.some(a=>a.status==='active'&&a.expires>=g.round&&['peace','alliance'].includes(a.terms.kind)&&a.parties.includes(cid)&&a.parties.includes(o.country)),'An active peace or alliance treaty prevents war');summary=`Declare war on ${g.countries[o.country].name}`;
 }else if(o.action==='treaty'){
  must(g.countries[o.country]&&o.country!==cid,'Select a foreign government');must(['trade','aid','loan','peace','alliance'].includes(o.kind??'trade'),'Unknown agreement type');must(integer(o.amount??0,0,1000)&&integer(o.months??6,1,12),'Invalid treaty terms');must(!['aid','loan'].includes(o.kind)||o.amount>0,'Aid or loan requires a positive amount');must(!o.from||[cid,o.country].includes(o.from),'Invalid payer');o.kind??='trade';o.amount??=0;o.months??=6;o.from??=cid;money=5+(o.from===cid?o.amount:0);summary=`Propose ${o.kind} agreement to ${g.countries[o.country].name}: $${o.amount}, ${o.months} months`;
 }else if(o.action==='agreement'){
  const a=g.agreements.find(a=>a.id===o.agreement&&a.parties.includes(cid));must(a&&['negotiating','offered'].includes(a.status),'Agreement no longer available');summary=`Accept ${a.terms.kind}: ${g.countries[a.terms.from].name} → ${g.countries[a.terms.to].name}, $${a.terms.amount}, ${a.terms.months} months`;const terms=a.terms;
  money=terms.from===cid?terms.amount:0;recurring=terms.kind==='loan'&&terms.to===cid?Math.ceil(terms.amount*1.1/terms.months):0;
 }else throw new Error('This action needs clarification before it can be simulated');
 must([money,oil,fuel,recurring].every(n=>Number.isSafeInteger(n)&&n>=0),'Invalid cost');return {...o,cost:money,oil,fuel,recurring,summary};
}
export function reservations(g,cid,exclude=null){const active=g.countries[cid].directives.filter(d=>d.id!==exclude&&d.status==='funded');return {money:active.reduce((s,d)=>s+d.cost.money,0),oil:active.reduce((s,d)=>s+d.cost.oil,0),fuel:active.reduce((s,d)=>s+d.cost.fuel,0),orders:active.flatMap(d=>d.orders)};}
export function reviewPlan(g,cid,rawOrders){must(Array.isArray(rawOrders)&&rawOrders.length>0&&rawOrders.length<=20,'Interpret 1–20 actions per directive');const orders=rawOrders.map(o=>inspectOrder(g,cid,o));return {orders,cost:{money:orders.reduce((s,o)=>s+o.cost,0),oil:orders.reduce((s,o)=>s+o.oil,0),fuel:orders.reduce((s,o)=>s+o.fuel,0),recurring:orders.reduce((s,o)=>s+o.recurring,0)}};}
export function makeDirective(g,cid,{text,orders,assumptions=[],conditions=[],source='offline',questions=[],internal=false}){
 must(typeof text==='string'&&text.length<=16000,'Directive text is too long');const c=g.countries[cid];must(internal||c.directives.filter(d=>d.round===g.round).length<30,'Maximum 30 directives per month');
 must(Array.isArray(assumptions)&&assumptions.length<=30&&assumptions.every(s=>typeof s==='string'&&s.length<=3000),'Invalid interpretation assumptions');must(Array.isArray(questions)&&questions.length<=20&&questions.every(s=>typeof s==='string'&&s.length<=3000),'Invalid clarification');must(Array.isArray(conditions)&&conditions.length<=10&&conditions.every(k=>k&&(['treasury_at_least'].includes(k.kind)&&integer(k.amount,0,100000)||k.kind==='owns'&&g.regions[k.region]||k.kind==='no_treaty'&&g.countries[k.country])),'Condition needs clarification');
 const plan=questions.length?{orders:[],cost:{money:0,oil:0,fuel:0,recurring:0}}:reviewPlan(g,cid,orders);
 const d={id:`directive-${++g.serial}`,round:g.round,text,...plan,assumptions,conditions,source,questions,status:questions.length?'clarification':'review',results:[]};c.directives.push(d);return d;
}
function ensureAvailable(g,cid,d){const c=g.countries[cid],r=reservations(g,cid,d.id);must(c.treasury-r.money>=d.cost.money,'Insufficient unreserved dollars');must(c.oil-r.oil>=d.cost.oil,'Insufficient oil reserves');must(c.fuel-r.fuel>=d.cost.fuel,'Insufficient fuel reserves');
 const allOrders=[...r.orders,...d.orders];must(allOrders.filter(o=>o.action==='repay').reduce((s,o)=>s+o.amount,0)<=c.debt,'Pending repayments exceed outstanding debt');must(c.debt+allOrders.filter(o=>o.action==='loan').reduce((s,o)=>s+o.amount,0)<=2000,'Pending loan requests exceed the $2,000 debt ceiling');
 const grouped={};for(const o of allOrders){
  if(['move','attack','reserve'].includes(o.action))for(const [type,n] of Object.entries(o.units)){const key=`${o.origin}:${type}`;grouped[key]=(grouped[key]??0)+n;must(grouped[key]<=(g.regions[o.origin].units[type]??0),`Unit groups are already reserved at ${g.regions[o.origin].name}`);}
  if(o.action==='mobilize')for(const [type,n] of Object.entries(o.units)){const key='reserve:'+type;grouped[key]=(grouped[key]??0)+n;must(grouped[key]<=(c.reserves?.[type]??0),'Reserve groups are already committed to another funded directive');}
  if(o.action==='scout'&&o.method==='special'){const key=`${o.origin}:special`;grouped[key]=(grouped[key]??0)+1;must(grouped[key]<=(g.regions[o.origin].units.special??0),'Special-forces units are already reserved');}
 }
}
export function decideDirective(g,cid,id,decision){const c=g.countries[cid],d=c.directives.find(d=>d.id===id);must(d&&d.round===g.round,'Directive not available in this month');must(g.phase==='planning','Planning is closed');
 if(decision==='reject'){must(!['executed','rejected'].includes(d.status),'Directive already closed');d.status='rejected';return d;}
 if(decision==='approve'){must(d.status==='review'&&!d.questions.length,'Resolve clarification first');d.status='awaiting_bank';return d;}
 if(decision==='fund'){must(d.status==='awaiting_bank','Approve the directive in Presidential Office first');const refreshed=reviewPlan(g,cid,d.orders);d.orders=refreshed.orders;d.cost=refreshed.cost;ensureAvailable(g,cid,d);d.status='funded';return d;}
 throw new Error('Unknown approval decision');
}
function cash(c,round,amount,reason){must(Number.isSafeInteger(amount)&&c.treasury+amount>=0,'Payment unavailable');c.treasury+=amount;c.ledger.push({round,amount,reason,balance:c.treasury});}
export function sendOfficial(g,cid,country,body,{automated=false,replyTo=null}={}){must(g.countries[country]&&country!==cid,'Select a government');must(typeof body==='string'&&body.trim()&&body.length<=6000,'Message is empty or too long');const m={id:`msg-${++g.serial}`,from:cid,to:country,body,round:g.round,automated,replyTo};g.messages.push(m);return m;}
export function proposeAgreement(g,cid,country,terms){must(g.countries[country]&&country!==cid,'Select a government');must(['trade','aid','loan','peace','alliance'].includes(terms.kind),'Unknown agreement type');const kind=terms.kind;must(integer(terms.amount??0,0,1000)&&integer(terms.months??6,1,12),'Agreement amount or duration invalid');if(['aid','loan'].includes(kind))must(terms.amount>0,'Aid/loan needs a positive amount');
 const from=terms.from??cid,to=from===cid?country:cid;must([cid,country].includes(from),'Agreement payer must be one of the two governments');
 const a={id:`agreement-${++g.serial}`,title:`${kind} agreement`,parties:[cid,country],status:'offered',created:g.round,consent:[],terms:{kind,from,to,amount:terms.amount??0,months:terms.months??6}};g.agreements.push(a);sendOfficial(g,cid,country,`Formal proposal: ${kind}; ${g.countries[from].name} pays ${g.countries[to].name} $${a.terms.amount}; ${a.terms.months} months. Both governments must approve its directive and funding.`,{});
 if(!g.countries[country].human){const atWar=(g.wars??[]).some(w=>w.parties.includes(cid)&&w.parties.includes(country)),acceptable=(kind!=='loan'||a.terms.amount<=500)&&(!atWar||kind==='peace');a.response=acceptable?'accepted':'counteroffer';a.responseReason=atWar&&kind!=='peace'?'A peace agreement must precede cooperation during war.':kind==='loan'&&a.terms.amount>500?'The requested loan exceeds our lending threshold.':'Terms are feasible within current relations and resources.';if(!acceptable){a.status='counteroffer';a.counterTerms={...a.terms,kind:atWar?'peace':kind,amount:atWar?0:Math.min(500,a.terms.amount)};}if(acceptable)a.consent.push(country);sendOfficial(g,country,cid,acceptable?`We accept: ${kind}, $${a.terms.amount}, ${a.terms.months} months. ${a.responseReason}`:`Counteroffer: ${a.counterTerms.kind}, $${a.counterTerms.amount}, ${a.terms.months} months. ${a.responseReason}`,{automated:true});}
 return a;
}
function activateAgreement(g,a){if(a.status==='active')return;const {from,to,amount,kind,months}=a.terms;const payer=g.countries[from],recipient=g.countries[to];must(payer.treasury>=amount,'Agreement payer cannot fund the transfer');if(kind==='loan')must(recipient.debt+amount<=2000,'Borrower would exceed the $2,000 debt ceiling');if(amount){cash(payer,g.round,-amount,`${kind} agreement`);cash(recipient,g.round,amount,`${kind} agreement`);}a.status='active';a.starts=g.round;a.expires=g.round+months-1;
 if(['peace','alliance'].includes(kind))g.wars=(g.wars??[]).filter(w=>!w.parties.every(id=>a.parties.includes(id)));
 if(kind==='loan'){recipient.debt+=amount;recipient.loans.push({id:a.id,lender:from,principal:amount,remaining:amount,installment:Math.ceil(amount*1.1/months),monthsLeft:months});}
 g.news.push({type:'diplomacy',round:g.round,headline:`${g.countries[from].name} and ${g.countries[to].name}: ${kind} agreement activated`});
}
const random=seed=>{let x=seed>>>0;return ()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296;};};
const force=(r,bonus)=>Object.entries(r.units).reduce((s,[type,n])=>s+n*UNIT_TYPES[type].power*(bonus==='air'&&['fighters','bombers'].includes(type)?1.1:bonus==='armor'&&type==='tanks'?1.15:bonus==='infantry'&&type==='infantry'?1.1:bonus==='navy'&&type==='navy'?1.15:1),0);
export function resolveSimple(input,{immediate=false,directiveId=null,skipAutonomous=false}={}){must(input.phase==='planning','Month already resolved');const g=clone(input);ensureFormations(g);const rng=random(g.seed+g.round*7919),round=g.round;g.news??=[];g.publicEvents??=[];g.publicBriefings??=[];const opening=Object.fromEntries(Object.values(g.countries).map(c=>[c.id,((c.ledger.find(l=>l.round===g.round)?.balance??c.treasury)-(c.ledger.find(l=>l.round===g.round)?.amount??0))]));
 // Autonomous governments pay for development through exactly the same approval path.
 for(const c of Object.values(g.countries))if(!immediate&&!skipAutonomous&&!c.human){
  const owned=g.regions.filter(r=>r.owner===c.id),home=owned[0];if(!home)continue;const orders=[];
  if(c.treasury>500&&!home.buildings.refinery)orders.push({action:'build',target:home.id,building:'refinery'});
  else if(c.treasury>300&&home.units.infantry<8&&(c.reserves.infantry??0)>0)orders.push({action:'mobilize',target:home.id,units:{infantry:1}});
  else if(c.treasury>700&&home.units.infantry<8)orders.push({action:'recruit',target:home.id,unit:'infantry',quantity:1});
  const border=owned.flatMap(r=>r.adjacent.map(id=>({origin:r,target:g.regions[id]}))).filter(b=>b.target.owner!==c.id);
  const candidate=border.find(b=>c.intel[b.target.id]&&c.intel[b.target.id].expires>=round&&sumUnits(b.origin)>c.intel[b.target.id].high*1.7&&b.origin.units.infantry>=2);
  if(candidate&&g.difficulty>=2&&c.profile.aggression>40&&round>3){const units={infantry:Math.max(1,Math.floor(candidate.origin.units.infantry*.7)),tanks:Math.floor(candidate.origin.units.tanks*.7),bombers:Math.floor(candidate.origin.units.bombers*.7)};orders.push({action:'attack',origin:candidate.origin.id,target:candidate.target.id,units});}
  else if(border.length&&c.treasury>100){const target=border[(round+home.id)%border.length].target;orders.push({action:'scout',target:target.id,method:'scouts'});}
  if(orders.length)try{const d=makeDirective(g,c.id,{text:'Government development and security program.',orders});decideDirective(g,c.id,d.id,'approve');decideDirective(g,c.id,d.id,'fund');}catch{}
 }
 const movements=[];g.phase='resolving';
 for(const c of Object.values(g.countries)){for(const d of c.directives.filter(d=>d.round===round&&d.status==='funded'&&(!directiveId||d.id===directiveId))){d.results=d.automatic?d.results.filter(r=>r.startsWith('Not implemented')||r.includes(' — failed:')):[];
  // Conditions are explicit executable guards, never narrative promises.
  const conditionFailed=d.conditions.some(k=>k.kind==='treasury_at_least'&&c.treasury<k.amount||k.kind==='owns'&&g.regions[k.region]?.owner!==c.id||k.kind==='no_treaty'&&g.agreements.some(a=>a.status==='active'&&a.expires>=round&&a.parties.includes(c.id)&&a.parties.includes(k.country)));
  if(conditionFailed){d.status='executed';d.results.push('Not executed: a stated condition was not satisfied. No payment charged.');c.results.push({id:d.id,summary:d.text.slice(0,120),results:clone(d.results)});continue;}
  for(const o of d.orders)try{
   const t=g.regions[o.target];must(c.treasury>=o.cost&&c.oil>=o.oil&&c.fuel>=o.fuel,'Resources no longer available; action skipped without payment');
   if(['move','attack'].includes(o.action)){
    must(g.regions[o.origin].owner===c.id,'Origin no longer owned');for(const [type,n] of Object.entries(o.units))must(g.regions[o.origin].units[type]>=n,'Committed units no longer available');
    if(o.action==='attack'){must((c.ammo??100)>=Object.values(o.units).reduce((a,n)=>a+n,0),'Insufficient ammunition for this attack');}if(o.action==='attack'&&!o.chairOperation)must(!g.agreements.some(a=>a.status==='active'&&a.expires>=round&&['peace','alliance'].includes(a.terms.kind)&&a.parties.includes(c.id)&&a.parties.includes(t.owner)),'Active treaty prevents this attack');
   }
   if(['build','recruit','mobilize'].includes(o.action))must(t.owner===c.id,'Destination no longer owned');
   if(o.action==='build')must(!t.buildings[o.building],'Building already completed by another directive');
   if(o.action==='mobilize')for(const [k,n] of Object.entries(o.units))must((c.reserves?.[k]??0)>=n,'Reserved groups no longer available');
   if(o.action==='reserve')for(const [k,n] of Object.entries(o.units))must(g.regions[o.origin].owner===c.id&&g.regions[o.origin].units[k]>=n,'Deployed groups no longer available');
   if(o.action==='treaty'){
    cash(c,round,-5,'Diplomatic proposal');const a=proposeAgreement(g,c.id,o.country,{kind:o.kind,amount:o.amount,months:o.months,from:o.from});a.consent.push(c.id);o.agreement=a.id;
    d.results.push(`${o.summary} — sent; $5 communication fee paid. ${a.parties.every(id=>a.consent.includes(id))?'Both governments consented; activation pending settlement.':'Awaiting counterparty consent; transfer not yet charged.'}`);continue;
   }
   if(o.action==='war'){
    if(o.chairDecision)for(const a of g.agreements.filter(a=>a.status==='active'&&a.expires>=round&&['peace','alliance'].includes(a.terms.kind)&&a.parties.includes(c.id)&&a.parties.includes(o.country))){a.status='violated';c.political=cap(c.political-3);d.results.push('Treaty breached: '+a.terms.kind+' ended; political index −3.');}
    g.wars??=[];if(!g.wars.some(w=>w.parties.includes(c.id)&&w.parties.includes(o.country)))g.wars.push({parties:[c.id,o.country],round});
    const headline=`${c.name} declares war on ${g.countries[o.country].name}`;g.news.push({type:'diplomacy',round,headline});sendOfficial(g,c.id,o.country,headline);d.results.push(headline+' — declaration delivered; no troop movement unless ordered.');continue;
   }
   if(o.action==='agreement'){const a=g.agreements.find(a=>a.id===o.agreement);must(a&&a.status!=='active','Agreement already activated');if(!a.consent.includes(c.id))a.consent.push(c.id);d.results.push('Agreement consent recorded; payment is pending until both governments’ funding approvals.');continue;}
   cash(c,round,-o.cost,o.summary);c.oil-=o.oil;c.fuel-=o.fuel;if(o.action==='attack'&&o.chairOperation){for(const a of g.agreements.filter(a=>a.status==='active'&&a.expires>=round&&['peace','alliance'].includes(a.terms.kind)&&a.parties.includes(c.id)&&a.parties.includes(t.owner))){a.status='violated';c.political=cap(c.political-3);g.news.push({type:'diplomacy',round,country:c.id,headline:`${c.name} breaks its ${a.terms.kind} agreement by attacking ${t.name}`});d.results.push('Treaty breached: '+a.terms.kind+' ended; political index −3.');}}
   if(['move','attack'].includes(o.action)){if(o.action==='attack')c.ammo=(c.ammo??100)-Object.values(o.units).reduce((a,n)=>a+n,0);g.movements??=[];g.movements.push({id:`movement-${++g.serial}`,round,country:c.id,origin:o.origin,target:o.target,action:o.action,units:clone(o.units)});o.formations=detachFormations(g.regions[o.origin].formations,o.units);for(const [type,n] of Object.entries(o.units))g.regions[o.origin].units[type]-=n;if(o.action==='move'&&t.owner===c.id){for(const [type,n] of Object.entries(o.units))t.units[type]+=n;mergeFormations(t.formations,o.formations);}else movements.push({...o,cid:c.id,directive:d.id});}
   else if(o.action==='mobilize'){mergeFormations(t.formations,detachFormations(c.reserveFormations,o.units));for(const [k,n] of Object.entries(o.units)){c.reserves[k]-=n;t.units[k]+=n;}}
   else if(o.action==='reserve'){mergeFormations(c.reserveFormations,detachFormations(g.regions[o.origin].formations,o.units));for(const [k,n] of Object.entries(o.units)){g.regions[o.origin].units[k]-=n;c.reserves[k]=(c.reserves[k]??0)+n;}}
   else if(o.action==='recruit')t.units[o.unit]+=o.quantity;
   else if(o.action==='build')t.buildings[o.building]=1;
   else if(o.action==='initiative'){const launched=launchInitiative(g,c.id,o);d.results.push(launched.result);d.results.push(...o.adjustments.map(a=>'Adjudication adjustment: '+a));}
   else if(o.action==='policy'){const effect=Math.min(10,Math.floor(o.budget/25));if(o.category==='economic')c.economic=cap(c.economic+effect);else if(o.category==='social')c.social=cap(c.social+effect);else if(o.category==='political')c.political=cap(c.political+effect);else c.counterintel=cap((c.counterintel??0)+effect);c.policies??=[];c.policies.push({id:`policy-${++g.serial}`,created:round,category:o.category,intent:o.purpose,budget:o.budget,effect,visibility:o.category==='intelligence'?'secret':'public',status:'implemented'});}
   else if(o.action==='scout'){const precision=(o.method==='special'?.15:g.regions.some(r=>r.owner===c.id&&r.buildings.intelligence)?.25:.35)+(g.countries[t.owner].counterintel??0)/500;const units=sumUnits(t);c.intel[t.id]={round,expires:round+(o.method==='special'?2:1),controller:t.owner,low:Math.max(0,Math.floor(units*(1-precision))),high:Math.ceil(units*(1+precision)),unitEstimate:true,source:o.method==='special'?'Special forces':'Scouts',confidence:o.method==='special'?'High':'Medium'};}
   else if(o.action==='loan'){cash(c,round,o.amount,'Bank loan');c.debt+=o.amount;c.loans.push({id:`loan-${++g.serial}`,lender:'bank',principal:o.amount,remaining:o.amount,installment:Math.ceil(o.amount*1.1/o.months),monthsLeft:o.months});}
   else if(o.action==='repay'){let remaining=o.amount;for(const l of c.loans){const paid=Math.min(remaining,l.remaining);l.remaining-=paid;remaining-=paid;}c.debt-=o.amount;}
   else if(o.action==='message'){const m=sendOfficial(g,c.id,o.country,o.body);if(!g.countries[o.country].human)Object.assign(sendOfficial(g,o.country,c.id,localDiplomat(g,o.country,c.id),{automated:true,replyTo:m.id}),{source:'local-negotiator',notice:'Directive correspondence uses the local negotiator; open Foreign Affairs for live AI conversation.'});}
   let detail=o.summary+' — completed';
   if(o.units)detail+=`; ${Object.entries(o.units).filter(([,n])=>n).map(([k,n])=>`${n} ${UNIT_TYPES[k].name} group(s)`).join(', ')}`;
   if(o.action==='policy'){const key=o.category==='intelligence'?'counterintel':o.category;detail+=`; ${key} now ${c[key]}%`;}
   if(o.action==='scout'){const i=c.intel[t.id];detail+=`; estimate ${i.low}–${i.high} groups, valid through month ${i.expires}`;}
   detail+=`; paid $${o.cost}, ${o.oil} oil, ${o.fuel} fuel`;
   d.results.push(detail);
   if(o.action==='build'||o.action==='policy'&&o.category!=='intelligence'){
    const headline=o.action==='build'?`${c.name} completes ${BUILDINGS[o.building].name} in ${t.name}`:`${c.name} implements ${o.category} program`;
    const body=o.action==='build'?`${t.name}: one ${BUILDINGS[o.building].name} completed for $${o.cost}; recurring upkeep $${o.recurring}/month.`:`${o.purpose.slice(0,500)} — investment $${o.cost}; ${o.category} index now ${c[o.category]}%.`;
    g.publicEvents.push({round,country:c.id,headline,body});g.news.push({type:'development',round,headline});
   }
  }catch(err){d.results.push(o.summary+' — failed: '+err.message);}
  d.status='executed';c.results.push({id:d.id,summary:d.text.slice(0,120),results:clone(d.results)});
 }}
 for(const m of movements.filter(m=>m.action==='move')){const t=g.regions[m.target];if(t.owner===m.cid)for(const [k,n] of Object.entries(m.units))t.units[k]+=n;else{const safe=g.regions.find(r=>r.owner===m.cid);if(safe)for(const [k,n] of Object.entries(m.units))safe.units[k]+=n;}}
 // Seeded initiative makes submitted ordering irrelevant; every unit is detached once.
 for(const m of movements.filter(m=>m.action==='attack').map(m=>({...m,initiative:rng()})).sort((a,b)=>a.initiative-b.initiative)){
  const t=g.regions[m.target],d=g.countries[m.cid].directives.find(d=>d.id===m.directive);if(t.owner===m.cid){for(const [k,n] of Object.entries(m.units))t.units[k]+=n;mergeFormations(t.formations,m.formations);continue;}
  const phases=[];let support=1;if(m.chairOperation){const naval=(m.units.navy??0)>0,navalSuccess=naval&&(m.units.navy??0)>=(t.units.navy??0);if(navalSuccess)t.readiness=Math.max(40,(t.readiness??100)-5);phases.push({phase:'naval bombardment',outcome:naval?(navalSuccess?'successful':'contested'):'unavailable',effect:navalSuccess?'Defender readiness reduced by 5 points.':'No readiness reduction.'});const air=(m.units.fighters??0)+(m.units.bombers??0)>0,superiority=air&&(m.units.fighters??0)>=(t.units.fighters??0);if(superiority)support=1.08;phases.push({phase:'air operations',outcome:air?(superiority?'successful':'contested'):'unavailable',effect:superiority?'Combined-arms attack power increased by 8%.':'No air-superiority bonus.'});}
  const attackerContext=combatContext(g,m.cid,t),defenderContext=combatContext(g,t.owner,t);
  const attacking=(m.chairOperation?attackerContext.multiplier:1)*(m.chairOperation?conditionPower(m.formations,t.terrain):1)*support*force({units:m.units},g.countries[m.cid].bonus)*((g.countries[m.cid].readiness??100)/100)*(.85+rng()*.3),defending=(m.chairOperation?defenderContext.multiplier:1)*(m.chairOperation?conditionPower(t.formations,t.terrain):1)*force(t,g.countries[t.owner].bonus)*((t.readiness??100)/100)*(t.terrain==='mountain'?1.3:1.1)*(1+(t.fortification??0)*.08)*(.85+rng()*.3),win=attacking>defending;
  const oldOwner=t.owner,defenderBefore=clone(t.units);g.wars??=[];if(!g.wars.some(w=>w.parties.includes(m.cid)&&w.parties.includes(oldOwner)))g.wars.push({parties:[m.cid,oldOwner],round});t.contestedUntil=round+1;let casualties={},defenderConditionLosses={};
  if(m.chairOperation){const pressure=(opponent,self)=>Math.max(.1,Math.min(1,opponent/Math.max(1,self)));casualties=damageFormations(m.formations,(win?42:55)*pressure(defending,attacking),round,rng);defenderConditionLosses=damageFormations(t.formations,(win?55:42)*pressure(attacking,defending),round,rng);m.units=countsFromFormations(m.formations);t.units=countsFromFormations(t.formations);}
  else for(const [type,n] of Object.entries(m.units)){casualties[type]=Math.min(n,Math.floor(n*(win?.2:.4)+(rng()<.3?1:0)));m.units[type]-=casualties[type];if(m.formations?.[type])m.formations[type]=m.formations[type].slice(0,m.units[type]);}
  const defenderConditions=clone(t.formations);
  if(win&&(m.units.infantry??0)+(m.units.special??0)>0){const retreat=t.adjacent.map(id=>g.regions[id]).find(r=>r.owner===oldOwner);if(retreat){if(m.chairOperation){for(const [k,n] of Object.entries(t.units))retreat.units[k]+=n;mergeFormations(retreat.formations,t.formations);}else for(const [k,n] of Object.entries(t.units)){const retreating=Math.floor(n*.5);retreat.units[k]+=retreating;mergeFormations(retreat.formations,{[k]:(t.formations[k]??[]).slice(0,retreating)});}}else if(m.chairOperation){for(const [k,n] of Object.entries(t.units))defenderConditionLosses[k]=(defenderConditionLosses[k]??0)+n;}
   t.owner=m.cid;t.units=Object.fromEntries(Object.keys(UNIT_TYPES).map(k=>[k,m.units[k]??0]));t.formations=m.formations;g.countries[m.cid].political=cap(g.countries[m.cid].political+2);
  }else{const home=g.regions[m.origin].owner===m.cid?g.regions[m.origin]:g.regions.find(r=>r.owner===m.cid);if(home){for(const [k,n] of Object.entries(m.units))home.units[k]+=n;mergeFormations(home.formations,m.formations);}}
  if(!m.chairOperation&&t.owner!==m.cid)for(const [k,n] of Object.entries(t.units))t.units[k]=Math.max(0,n-Math.floor(n*.15));
  const conquered=t.owner===m.cid;if(m.chairOperation){phases.push({phase:'ground offensive',outcome:conquered?'successful':'unsuccessful',effect:conquered?'Territorial control transferred; occupation readiness set to 60%.':'Surviving attackers withdrew; no territorial transfer.'});if(conquered){t.readiness=60;g.countries[m.cid].social=cap(g.countries[m.cid].social-1);}d.results.push(...phases.map(p=>p.phase+': '+p.outcome+'. '+p.effect));}
  if(m.chairOperation){const survivors=Object.values(m.formations).flat();if(survivors.length)d.results.push(`Survivor condition: average health ${Math.round(survivors.reduce((n,f)=>n+f.health,0)/survivors.length)}%, experience ${Math.round(survivors.reduce((n,f)=>n+f.experience,0)/survivors.length)}; healing depends on next month's funded supply.`);}
  const defenderLosses=m.chairOperation?defenderConditionLosses:Object.fromEntries(Object.entries(defenderBefore).map(([k,n])=>[k,conquered?n-(t.adjacent.some(id=>g.regions[id].owner===oldOwner)?Math.floor(n*.5):0):n-(t.units[k]??0)]));for(const [cid,losses] of [[m.cid,casualties],[oldOwner,defenderLosses]]){const c=g.countries[cid];c.battleReports??=[];c.battleReports.push({round,directive:m.directive,phases:clone(phases),region:t.id,attacker:m.cid,defender:oldOwner,outcome:conquered?'captured':'attack stopped',ownLosses:clone(losses),operationalContext:clone(cid===m.cid?attackerContext:defenderContext),condition:clone(cid===m.cid?m.formations:defenderConditions)});}const headline=`${g.countries[m.cid].name}: ${conquered?'captures':'attack stopped at'} ${t.name}`;g.news.push({type:'battle',round,headline});g.combatEvents??=[];g.combatEvents.push({id:`combat-${++g.serial}`,round,attacker:m.cid,defender:oldOwner,origin:m.origin,target:t.id,captured:conquered});const response=reactToBattle(g,{attacker:m.cid,defender:oldOwner,region:t.id,captured:conquered});if(response)d.results.push('Defending government response: '+response.headline+'. '+response.detail);d.results.push(headline+`; attacking group losses: ${Object.entries(casualties).filter(([,n])=>n).map(([k,n])=>`${n} ${UNIT_TYPES[k].name}`).join(', ')||'none'}`);
 }
 for(const a of g.agreements.filter(a=>a.status==='offered'&&a.parties.every(id=>a.consent.includes(id))))try{activateAgreement(g,a);for(const c of Object.values(g.countries))for(const d of c.directives.filter(d=>d.round===round&&d.orders.some(o=>o.agreement===a.id)))d.results.push(`${a.title} activated this month; $${a.terms.amount} transferred if applicable; term ${a.terms.months} months.`);}catch(err){a.status='failed';a.failure=err.message;}
 if(immediate){ensureFormations(g);for(const r of g.regions)syncRegion(r);g.phase='planning';assertSimple(g);return g;}
 for(const a of g.agreements)if(a.status==='active'&&a.expires<round)a.status='expired';
 for(const c of Object.values(g.countries)){
  for(const b of (g.blockades??[]).filter(b=>b.country===c.id&&b.status==='active'&&b.expires<round)){const home=g.regions[b.origin]?.owner===c.id?g.regions[b.origin]:g.regions.find(r=>r.owner===c.id&&r.coastal);if(home)mergeFormations(home.formations,b.formations);else mergeFormations(c.reserveFormations,b.formations);for(const [k,n] of Object.entries(b.units))if(home)home.units[k]+=n;else c.reserves[k]=(c.reserves[k]??0)+n;b.status='completed';}
  const projectResults=tickInitiatives(g,c.id);
  c.results=c.directives.filter(d=>d.round===round&&['executed','failed','partial'].includes(d.status)).map(d=>({id:d.id,summary:d.text.slice(0,120),results:clone(d.results)}));
  if(projectResults.length)c.results.push({id:'projects-'+round,summary:'Ongoing national programs',results:projectResults});
  const owned=g.regions.filter(r=>r.owner===c.id),counts=Object.fromEntries(Object.keys(BUILDINGS).map(k=>[k,owned.reduce((s,r)=>s+(r.buildings[k]??0),0)]));
  const siteIncome=SITES.filter(s=>s.regions.every(id=>g.regions[id].owner===c.id)).reduce((s,p)=>s+p.bonus,0);
  const trade=g.agreements.filter(a=>a.status==='active'&&a.expires>=round&&a.parties.includes(c.id)&&a.terms.kind==='trade').length*25;
  const baseIncome=owned.length*35+(owned.length?Math.floor(c.economic/2):0)+counts.economic*40+counts.port*30+siteIncome+trade,income=Math.floor(baseIncome*(c.bonus==='income'?1.1:1)),upkeep=Object.entries(counts).reduce((s,[k,n])=>s+n*BUILDINGS[k].upkeep,0)+Math.ceil(deployedForces(g,c.id)*1.5+(totalForces(g,c.id)-deployedForces(g,c.id))*.5);
  const disruption=Math.min(income,(g.blockades??[]).filter(b=>b.status==='active'&&b.defender===c.id&&b.expires>=round).reduce((n,b)=>n+b.interdiction,0));cash(c,round,income,'Monthly income');if(disruption)cash(c,round,-disruption,'Blockade trade disruption');const recovery=Math.min(c.treasury,owned.filter(r=>r.disruption?.until>=round).reduce((n,r)=>n+r.disruption.penalty,0));if(recovery)cash(c,round,-recovery,'Occupied infrastructure recovery');c.lastRecoveryCost=recovery;c.lastBlockadeLoss=disruption;const paid=Math.min(c.treasury,upkeep);cash(c,round,-paid,'Unit and building upkeep');if(paid<upkeep)g.publicEvents.push({round,country:c.id,headline:`${c.name} faces an operating-budget shortfall`,body:`Only $${paid} of $${upkeep} in unit and building upkeep was paid this month; shortfall $${upkeep-paid}.`});
  for(const l of c.loans.filter(l=>l.remaining>0)){const installment=l.monthsLeft<=1?Math.ceil(l.remaining*1.1):Math.min(l.installment,Math.ceil(l.remaining*1.1));if(c.treasury>=installment){cash(c,round,-installment,'Loan installment');if(g.countries[l.lender])cash(g.countries[l.lender],round,installment,'Loan repayment received');const principal=Math.min(l.remaining,Math.max(1,Math.floor(installment/1.1)));l.remaining-=principal;c.debt=Math.max(0,c.debt-principal);l.monthsLeft--;if(l.monthsLeft<=0&&l.remaining<=1){c.debt=Math.max(0,c.debt-l.remaining);l.remaining=0;}}else{c.political=cap(c.political-5);l.overdue=true;}}
  const supplyNeed=deployedForces(g,c.id),supplyOpening=c.supplies??100,supplyMade=owned.length*3+counts.factory*4;c.supplies=Math.max(0,supplyOpening+supplyMade-supplyNeed);c.lastSupplyUse=supplyNeed;c.ammo=(c.ammo??100)+counts.factory*4;c.spares=(c.spares??50)+counts.factory*2;
  for(const r of owned)r.readiness=Math.min(c.readiness??100,supplyOpening+supplyMade>=supplyNeed?100:60);
  c.oil+=owned.length*2+counts.refinery*12;c.fuel+=owned.length*3+counts.refinery*15;c.stability=Math.round((c.economic+c.political+c.social)/3);c.lastIncome=income;c.lastUpkeep=paid;c.lastUpkeepRequired=upkeep;c.lastSiteIncome=siteIncome;c.lastTradeIncome=trade;c.lastProductionIncome=counts.economic*40+counts.port*30;c.lastResourceOutput={oil:owned.length*2+counts.refinery*12,fuel:owned.length*3+counts.refinery*15};c.gdp=c.economic*20;
  const monthLedger=c.ledger.filter(l=>l.round===round),inflows=monthLedger.filter(l=>l.amount>0).reduce((n,l)=>n+l.amount,0),expenditure=-monthLedger.filter(l=>l.amount<0).reduce((n,l)=>n+l.amount,0);c.lastExpenditure=expenditure;c.lastNetChange=c.treasury-opening[c.id];
  c.briefings.push({round,opening:opening[c.id],income,inflows,expenditure,netChange:c.lastNetChange,projectOperations:c.lastProjectUpkeep??0,projectIncome:c.lastProjectIncome??0,upkeep:paid,closing:c.treasury,results:clone(c.results),summary:`${owned.length} territories · ${deployedForces(g,c.id)} deployed + ${totalForces(g,c.id)-deployedForces(g,c.id)} reserve groups · stability ${c.stability}%`});
  for(const [id,i] of Object.entries(c.intel))if(i.expires<round+1||g.regions[+id].owner!==i.controller)delete c.intel[id];
  for(const d of c.directives.filter(d=>d.round===round&&['review','awaiting_bank','clarification'].includes(d.status))){d.status='expired';d.results=['Not funded before month closed. No resources spent.'];}
 }
 g.publicBriefings.push({round,title:`Month ${round} · World crisis briefing`,events:[...g.publicEvents.filter(e=>e.round===round),...g.news.filter(n=>n.round===round&&['battle','diplomacy'].includes(n.type)).map(n=>({...n,body:n.headline}))],countries:Object.values(g.countries).map(c=>({id:c.id,name:c.name,territories:g.regions.filter(r=>r.owner===c.id).length,economic:c.economic,political:c.political,social:c.social,stability:c.stability}))});
 monthlyConditions(g);g.news=g.news.slice(-80);
 for(const r of g.regions)syncRegion(r);g.history.push({round,news:clone(g.news)});if(round>=g.maxRounds){g.phase='finished';g.winner=Object.values(g.countries).filter(c=>c.human).sort((a,b)=>(totalForces(g,b.id)+b.treasury/100+b.stability)-(totalForces(g,a.id)+a.treasury/100+a.stability))[0]?.id??null;}else{g.round++;g.phase='planning';}assertSimple(g);return g;
}
export function assertSimple(g){const ids=new Set();for(const stock of [...g.regions.map(r=>r.formations),...Object.values(g.countries).map(c=>c.reserveFormations),...(g.blockades??[]).filter(b=>b.status==='active').map(b=>b.formations)].filter(Boolean))for(const f of Object.values(stock).flat()){must(!ids.has(f.id),'Duplicate active formation identity');ids.add(f.id);must(Number.isFinite(f.health)&&f.health>0&&f.health<=100&&Number.isFinite(f.experience)&&f.experience>=0&&f.experience<=100,'Invalid formation condition');}for(const c of Object.values(g.countries))for(const k of ['treasury','oil','fuel','debt',...['ammo','supplies','spares'].filter(k=>c[k]!==undefined)])must(Number.isSafeInteger(c[k])&&c[k]>=0,'Invalid national '+k);for(const c of Object.values(g.countries))for(const n of Object.values(c.reserves??{}))must(Number.isSafeInteger(n)&&n>=0,'Invalid reserve inventory');for(const r of g.regions)for(const n of Object.values(r.units))must(Number.isSafeInteger(n)&&n>=0,'Invalid unit inventory');}
export function simpleView(g,cid){const c=g.countries[cid];return {ruleset:'simple',round:g.round,maxRounds:g.maxRounds,phase:g.phase,winner:g.winner,wars:clone(g.wars??[]),combatEvents:clone((g.combatEvents??[]).filter(e=>e.round>=g.round-1)),chairArticles:clone(g.chairArticles??[]),ultimatums:clone((g.ultimatums??[]).filter(u=>u.from===cid||u.to===cid)),blockades:clone((g.blockades??[]).map(b=>b.country===cid?b:{id:b.id,country:b.country,target:b.target,expires:b.expires,status:b.status})),movements:clone((g.movements??[]).filter(m=>m.country===cid&&m.round>=g.round-1).slice(-20)),you:clone(c),regions:g.regions.map(r=>r.owner===cid?clone(r):{id:r.id,name:r.name,x:r.x,y:r.y,adjacent:r.adjacent,owner:r.owner,coastal:r.coastal,terrain:r.terrain,continent:r.continent,contestedUntil:r.contestedUntil??null,disruption:r.disruption?{until:r.disruption.until}:null,estimate:c.intel[r.id]&&c.intel[r.id].expires>=g.round&&c.intel[r.id].controller===r.owner?clone(c.intel[r.id]):null}),countries:Object.values(g.countries).map(x=>({id:x.id,name:x.name,color:x.color,human:x.human,advantage:x.advantage,forceProfile:x.forceProfile})),news:clone(g.news),publicBriefings:clone(g.publicBriefings??[]),publicEvents:clone((g.publicEvents??[]).filter(e=>e.round===g.round)),messages:clone(g.messages.filter(m=>m.from===cid||m.to===cid)),agreements:clone(g.agreements.filter(a=>a.parties.includes(cid))),fleets:[],missions:[],treaties:[]};}

// Submission authorizes execution. Each clause is settled independently against live resources.
function simulateSubmission(input,cid,{text,orders=[],assumptions=[],conditions=[],failures=[],questions=[],source='offline',internal=false}){
 must(input.phase==='planning','Planning is closed');must(typeof text==='string'&&text.trim()&&text.length<=16000,'Write a directive of 1–16,000 characters');
 let g=clone(input),c=g.countries[cid];must(internal||c.directives.filter(d=>d.round===g.round).length<30,'Maximum 30 directives per month');
 const id=`directive-${++g.serial}`;c.directives.push({id,round:g.round,text,orders:[],assumptions:assumptions.filter(x=>typeof x==='string').slice(0,30),conditions:[],source,questions:[],status:'executed',cost:{money:0,oil:0,fuel:0,recurring:0},results:[]});
 const results=[...failures,...questions].filter(x=>typeof x==='string').map(x=>'Not implemented: '+x),completed=[],total={money:0,oil:0,fuel:0,recurring:0};
 let blocked=false;
 for(const k of conditions){
  const supported=k&&(k.kind==='treasury_at_least'&&integer(k.amount,0,100000)||k.kind==='owns'&&g.regions[k.region]||k.kind==='no_treaty'&&g.countries[k.country]);
  if(!supported){results.push('Not implemented: condition cannot be evaluated by the simulation.');blocked=true;break;}
  const passed=k.kind==='treasury_at_least'?c.treasury>=k.amount:k.kind==='owns'?g.regions[k.region].owner===cid:!g.agreements.some(a=>a.status==='active'&&a.expires>=g.round&&a.parties.includes(cid)&&a.parties.includes(k.country));
  if(!passed){results.push('Not implemented: stated condition was not satisfied. No payment charged.');blocked=true;break;}
 }
 if(!blocked)for(const raw of orders.slice(0,20)){
  try{
   const order=raw;
   const d=g.countries[cid].directives.find(d=>d.id===id),plan=reviewPlan(g,cid,[order]);Object.assign(d,plan,{status:'awaiting_bank'});decideDirective(g,cid,id,'fund');
   const ledgerStart=g.countries[cid].ledger.length,oilStart=g.countries[cid].oil,fuelStart=g.countries[cid].fuel;g=resolveSimple(g,{immediate:true,directiveId:id});const settled=g.countries[cid].directives.find(d=>d.id===id);
   results.push(...settled.results);if(!settled.results.some(r=>r.includes(' — failed:'))){completed.push(...settled.orders);total.money+=g.countries[cid].ledger.slice(ledgerStart).filter(l=>l.amount<0).reduce((n,l)=>n-l.amount,0);total.oil+=oilStart-g.countries[cid].oil;total.fuel+=fuelStart-g.countries[cid].fuel;total.recurring+=settled.cost.recurring;}
   // Treaty commitments reserve transfer dollars even while awaiting the other government.
   if(order.action==='treaty'&&order.from===cid)total.money+=order.amount??0;
  }catch(err){results.push(`Not implemented (${raw?.action??'action'}): ${err.message}. No action payment charged.`);}
 }
 if(!orders.length&&!results.length)results.push('Not implemented: no executable objective could be identified. No payment charged.');
 if(orders.length>20)results.push('Not implemented: actions after the first 20 exceed the per-directive limit.');
 const d=g.countries[cid].directives.find(d=>d.id===id);Object.assign(d,{orders:completed,cost:total,conditions,results,status:results.some(x=>/Not implemented|failed:/.test(x))?(completed.length?'partial':'failed'):'executed'});
 g.countries[cid].results=g.countries[cid].directives.filter(d=>d.round===g.round&&['executed','failed','partial'].includes(d.status)).map(d=>({id:d.id,summary:d.text.slice(0,120),results:clone(d.results)}));
 assertSimple(g);return {game:g,directive:d};
}

export function submitDirective(input,cid,plan){
 const simulated=simulateSubmission(input,cid,plan),g=clone(input),d=clone(simulated.directive);g.serial=simulated.game.serial;
 d.results=d.results.filter(r=>r.startsWith('Not implemented')||r.includes(' — failed:'));
 d.results.push(...d.orders.map(o=>`Scheduled: ${o.summary}; budget $${o.cost}, ${o.oil} oil, ${o.fuel} fuel. Executes when the month advances.`));
 d.status=d.orders.length?'funded':'failed';d.automatic=true;d.hasFailures=d.results.some(r=>r.startsWith('Not implemented')||r.includes(' — failed:'));
 // The simulated settlement only validates sequential clauses. No preview effects are committed.
 // Preserve the full commitment, including transfers awaiting diplomatic consent.
 d.cost={money:d.orders.reduce((s,o)=>s+o.cost,0),oil:d.orders.reduce((s,o)=>s+o.oil,0),fuel:d.orders.reduce((s,o)=>s+o.fuel,0),recurring:d.orders.reduce((s,o)=>s+o.recurring,0)};
 g.countries[cid].directives.push(d);return {game:g,directive:d};
}

// MUN mode: the authoritative settlement happens in the current round, not at month end.
export function adjudicateDirective(input,cid,plan){
 const physical=new Set(['move','attack','mobilize','reserve','scout','recruit','build','policy','message','loan','repay','war','treaty','agreement','initiative']);
 const normalized={...plan,orders:(plan.orders??[]).map(o=>{
  const custom=!physical.has(o?.action)||o.action==='policy'&&!['economic','political','social','intelligence'].includes(o.category)||o.action==='build'&&!Object.hasOwn(BUILDINGS,o.building)||o.action==='recruit'&&!Object.hasOwn(UNIT_TYPES,o.unit);
  return custom?{action:'initiative',title:o?.title??o?.building??'National strategic initiative',intent:o?.intent??o?.purpose??plan.text,category:o?.category??(o?.action==='recruit'?'scientific':String(o?.action??'institutional')),target:o?.target,visibility:o?.visibility,budget:o?.budget??100,duration:o?.duration??2,effects:o?.effects??[]}:o;
 })};
 const unknownCondition=(normalized.conditions??[]).find(k=>!['treasury_at_least','owns','no_treaty'].includes(k.kind));
 if(unknownCondition){normalized.conditions=[];normalized.orders=[{action:'initiative',title:'Conditional national mandate',intent:plan.text,budget:100,duration:2,visibility:/secret|confidential|covert/i.test(plan.text)?'secret':'public',trigger:JSON.stringify(unknownCondition),rationale:'The objective is retained as a conditional mandate. No implementation benefit is claimed until the external trigger can be verified; escrow is refundable.'}];}

 const result=simulateSubmission(input,cid,normalized),d=result.directive;
 d.adjudicated=true;d.analysis=String(plan.analysis??'The directive was assessed against the current treasury, military inventory, location and diplomatic position. Each clause below records the actual decision.').slice(0,3000);
 d.assumptions.push(...d.orders.filter(o=>o.action==='initiative').flatMap(o=>o.adjustments??[]));
 result.game.countries[cid].stability=Math.round((result.game.countries[cid].economic+result.game.countries[cid].political+result.game.countries[cid].social)/3);
 return result;
}

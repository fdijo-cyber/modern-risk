import {observe,visibleEstimate,expireIntel,resolveTeams} from '../intelligence/index.mjs';
import {deliverMessage} from '../diplomacy-engine/messages.mjs';
import {resolveSupply} from '../logistics/index.mjs';
import {SHIPS,seaAdjacent,navalActions} from '../naval-engine/index.mjs';
import {ACTIONS,EQUIPMENT,POWERS} from '../shared/scenario.mjs';
export const clone=structuredClone;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const must=(ok,message)=>{if(!ok)throw new Error(message);};
const int=(x,min=0,max=1000000000)=>Number.isSafeInteger(x)&&x>=min&&x<=max;
export const pair=(a,b)=>[a,b].sort().join(':');
function random(seed){let x=seed>>>0;return ()=>{x=(Math.imul(1664525,x)+1013904223)>>>0;return x/4294967296;};}
export function cost(o){if(o.action==='recruit')return Math.ceil(o.quantity*.02);if(o.action==='purchase')return o.quantity*(EQUIPMENT[o.equipment]?.cost??0);if(['invest','trade','aid','stabilize','repay'].includes(o.action))return o.amount;if(o.action==='recon')return 100;if(o.action==='special_recon')return 200;if(o.action==='depot')return 500;if(o.action==='shipbuild')return (SHIPS[o.equipment]?.cost??0)*o.quantity;return 0;}
export function validate(game,cid,o,prior=[]){
 const c=game.countries[cid];must(c&&game.phase==='planning','Planning is closed');must(o&&Object.hasOwn(ACTIONS,o.action),'Unknown directive');
 const target=game.regions[o.target],origin=game.regions[o.origin];
 if(['move','attack'].includes(o.action)){
  must(origin?.owner===cid,'Origin must be controlled by your government');must(target,'Select a destination');must(origin.adjacent.includes(o.target),'Destination must be adjacent');
  must(o.action!=='move'||target.owner===cid,'Movement requires friendly territory');must(o.action!=='attack'||target.owner!==cid,'Cannot attack your own territory');
  must(o.action!=='attack'||!game.treaties.some(t=>t.type==='alliance'&&t.parties.includes(cid)&&t.parties.includes(target.owner)&&t.expires>=game.round),'Alliance blocks attacks until it expires');
  must(int(o.personnel,1,1000000)&&int(o.tanks)&&int(o.fighters),'Invalid personnel or equipment');
  must(o.personnel>=o.tanks*4+o.fighters*2,'Insufficient personnel to crew equipment');
  const reserved=prior.filter(p=>['move','attack','special_recon'].includes(p.action)&&p.origin===o.origin);
  for(const k of ['personnel','tanks','fighters'])must(reserved.reduce((s,p)=>s+(p[k]??0),0)+o[k]<=origin[k],`Insufficient ${k} at origin`);
 }
 if(['recruit','purchase','invest','depot','shipbuild'].includes(o.action))must(target?.owner===cid,'Project destination must be controlled by your government');
 if(['recruit','purchase'].includes(o.action))must(int(o.quantity,1,o.action==='recruit'?100000:500),'Quantity outside supported limits');
 if(o.action==='purchase')must(Object.hasOwn(EQUIPMENT,o.equipment),'Unknown equipment');
 if(o.action==='invest')must(int(o.amount,500,50000),'Industrial investment requires at least $500M');
 if(['invest','trade','aid','stabilize','repay','borrow'].includes(o.action))must(int(o.amount,1,50000),'Amount must be 1–50,000 million Game USD');
 if(['trade','aid','alliance','peace'].includes(o.action))must(game.countries[o.country]&&o.country!==cid,'Select a foreign government');
 if(o.action==='alliance'||o.action==='peace')must(!prior.some(p=>p.action===o.action&&p.country===o.country),'Duplicate diplomatic proposal');
 if(o.action==='tax')must(int(o.rate,5,50),'Tax rate must be 5–50%');
 if(o.action==='tax')must(!prior.some(p=>p.action==='tax'),'Only one tax policy per round');
 if(o.action==='borrow')must(c.debt+prior.filter(p=>p.action==='borrow').reduce((s,p)=>s+p.amount,0)+o.amount<=Math.floor(c.gdp/2),'Debt ceiling is 50% of GDP');
 if(o.action==='repay')must(prior.filter(p=>p.action==='repay').reduce((s,p)=>s+p.amount,0)+o.amount<=c.debt,'Repayment exceeds debt');
 if(['recon','special_recon'].includes(o.action))must(target&&target.owner!==cid,'Select a foreign region');
 if(o.action==='special_recon'){
  must(origin?.owner===cid&&origin.adjacent.includes(o.target),'Special forces need an adjacent friendly origin');
  must(int(o.personnel,100,500),'Deploy 100–500 personnel on special reconnaissance');
  const used=prior.filter(p=>['move','attack','special_recon'].includes(p.action)&&p.origin===o.origin).reduce((s,p)=>s+(p.personnel??0),0);
  must(used+o.personnel<=origin.personnel,'Special forces exceed unreserved personnel');
 }
 if(o.action==='message'){
  must(game.countries[o.country]&&o.country!==cid,'Select a foreign recipient');
  must(typeof o.subject==='string'&&o.subject.trim().length>0&&o.subject.length<=160,'Subject must be 1–160 characters');
  must(typeof o.body==='string'&&o.body.trim().length>0&&o.body.length<=6000,'Message must be 1–6,000 characters');
  must(prior.filter(p=>p.action==='message').length+(game.messages??[]).filter(m=>m.from===cid&&m.round===game.round&&!m.automated).length<10,'Maximum 10 official messages per month');
  if(o.replyTo)must((game.messages??[]).some(m=>m.id===o.replyTo&&m.to===cid&&m.from===o.country),'Reply must address a message received from this government');
 }
 if(o.action==='depot')must(!(c.depots??[]).includes(o.target)&&!prior.some(p=>p.action==='depot'&&p.target===o.target),'A depot already exists or is queued here');
 if(o.action==='shipbuild'){must(target.coastal,'Shipyards require a coastal region');must(Object.hasOwn(SHIPS,o.equipment)&&int(o.quantity,1,10),'Select a ship type and quantity 1–10');}
 if(['naval_move','blockade','naval_attack'].includes(o.action)){
  const fleet=(game.fleets??[]).find(f=>f.id===o.fleet&&f.owner===cid);must(fleet,'Select your own fleet');
  must(target?.coastal&&(fleet.region===o.target||seaAdjacent(game,fleet.region,o.target)),'Target must be the same or connected coastal waters');
  must(!prior.some(p=>p.fleet===o.fleet&&['naval_move','blockade','naval_attack'].includes(p.action)),'Fleet already has an operation this month');
  if(o.action==='blockade')must(target.owner!==cid,'Cannot blockade your own port');
 }
 must(prior.reduce((s,p)=>s+cost(p),0)+cost(o)<=c.treasury,'Insufficient unreserved treasury (borrowing is available next round)');
 const purchases=prior.filter(p=>p.action==='purchase').reduce((s,p)=>s+p.quantity*2,0)+(o.action==='purchase'?o.quantity*2:0);
 must(purchases<=c.materials,'Insufficient industrial materials');
 must(c.projects.length+prior.filter(p=>['invest','purchase','recruit','shipbuild'].includes(p.action)).length+(['invest','purchase','recruit','shipbuild'].includes(o.action)?1:0)<=c.industry*3,'All construction/production slots are reserved');
 return {...o,cost:cost(o),department:ACTIONS[o.action]};
}
export function queueOrder(game,cid,order){const c=game.countries[cid];const o=validate(game,cid,order,c.orders);c.orderSerial=(c.orderSerial??0)+1;o.id=`${game.round}-${cid}-${c.orderSerial}`;c.orders.push(o);return o;}
function ledger(c,round,amount,reason){must(int(Math.abs(amount)),'Invalid ledger amount');must(c.treasury+amount>=0,'Treasury exhausted');c.treasury+=amount;c.ledger.push({round,amount,reason,balance:c.treasury});}
function transfer(g,a,b,amount,reason){must(g.countries[a].treasury>=amount,'Transfer exceeds treasury');ledger(g.countries[a],g.round,-amount,reason);ledger(g.countries[b],g.round,amount,reason);}
function result(c,o,status,reason){c.results.push({id:o.id,action:o.action,status,reason});}
function aiOrders(g,c){const own=g.regions.filter(r=>r.owner===c.id);if(!own.length)return;const r=own[0];const proposed=[];
 if(c.treasury>2000&&c.projects.length<c.industry*3)proposed.push({action:'invest',target:r.id,amount:500});
 const neighboring=own.flatMap(r=>r.adjacent).find(id=>g.regions[id].owner!==c.id);if(neighboring!==undefined&&c.treasury>300)proposed.push({action:'recon',target:neighboring});
 if(r.personnel<9000&&c.treasury>500)proposed.push({action:'recruit',target:r.id,quantity:1500});
 const enemies=own.flatMap(a=>a.adjacent.map(id=>[a,g.regions[id]])).filter(([a,b])=>b.owner!==c.id&&visibleEstimate(g,c.id,b)&&a.personnel>visibleEstimate(g,c.id,b).high*2.5);
 if(g.difficulty>=3&&c.profile.aggression>45&&enemies.length){const [a,b]=enemies[0];proposed.push({action:'attack',origin:a.id,target:b.id,personnel:Math.floor(a.personnel*.6),tanks:Math.floor(a.tanks*.6),fighters:Math.floor(a.fighters*.6)});}
 for(const o of proposed)try{queueOrder(g,c.id,o);}catch{/* Legal-action fallback: hold position. */}
}
function power(u,modifier=1){return (u.personnel/100+u.tanks*24+u.fighters*160)*(u.readiness??90)/100*(.25+.75*(u.supply?.ratio??1))*modifier;}
export function resolveRound(input){
 must(input.phase==='planning','Round already resolved');const g=clone(input),rng=random(g.seed+g.round*7919);const round=g.round;g.news=[];g.messages??=[];g.missions??=[];g.fleets??=[];
 const opening=Object.fromEntries(Object.values(g.countries).map(c=>[c.id,c.treasury]));
 // AI decisions use the same validator and resources as humans.
 for(const c of Object.values(g.countries)){c.results=clone(c.immediateResults??[]);c.immediateResults=[];if(!c.human)aiOrders(g,c);}
 const orders=Object.values(g.countries).flatMap(c=>c.orders.map(o=>({...o,cid:c.id}))).sort((a,b)=>a.id.localeCompare(b.id));
 // Revalidate the whole queue before changing authoritative state.
 for(const c of Object.values(g.countries)){let prior=[];for(const o of c.orders){validate(g,c.id,o,prior);prior.push(o);}}
 g.phase='resolving';
 for(const o of orders.filter(o=>!['move','attack'].includes(o.action))){const c=g.countries[o.cid],t=g.regions[o.target];
  if(['recruit','purchase','invest','shipbuild'].includes(o.action)){
   ledger(c,round,-cost(o),o.action);if(o.action==='purchase')c.materials-=o.quantity*2;
   c.projects.push({id:o.id,action:o.action,target:o.target,quantity:o.quantity??0,equipment:o.equipment??null,amount:cost(o),started:round,due:round+(o.action==='purchase'?EQUIPMENT[o.equipment].time:o.action==='shipbuild'?SHIPS[o.equipment].time:o.action==='invest'?2:1)});result(c,o,'continuing','Paid; scheduled completion recorded');
  }else if(o.action==='borrow'){c.debt+=o.amount;ledger(c,round,o.amount,'Loan principal');result(c,o,'completed','Debt and cash increased');}
  else if(o.action==='repay'){ledger(c,round,-o.amount,'Debt principal repayment');c.debt-=o.amount;result(c,o,'completed','Debt principal repaid');}
  else if(o.action==='tax'){c.tax=o.rate;c.approval=clamp(c.approval-(o.rate-20),0,100);result(c,o,'completed',`Tax rate set to ${o.rate}%`);}
  else if(o.action==='stabilize'){ledger(c,round,-o.amount,'Public services');c.stability=clamp(c.stability+Math.floor(o.amount/100),0,100);result(c,o,'completed','Services funded; stability improved');}
  else if(o.action==='message')deliverMessage(g,o,result);
  else if(o.action==='depot'){ledger(c,round,-500,'Supply depot construction');c.depots??=[];c.depots.push(o.target);result(c,o,'completed','Supply depot operational');}
  else if(o.action==='recon'){ledger(c,round,-100,'Scouting');observe(g,c.id,t.id);result(c,o,'completed','Private scouting estimate recorded; no live foreign counts unlocked');}
  else if(o.action==='special_recon'){const home=g.regions[o.origin];if(home.personnel<o.personnel||c.fuel<20){result(c,o,'failed','Team personnel or fuel unavailable');continue;}
   ledger(c,round,-200,'Special-forces reconnaissance');home.personnel-=o.personnel;c.fuel-=20;g.missions.push({id:o.id,owner:c.id,origin:o.origin,target:o.target,personnel:o.personnel,until:round+2});result(c,o,'continuing','Reconnaissance team deployed for three monthly observations');}
  else if(o.action==='aid'){transfer(g,c.id,o.country,o.amount,'Foreign aid');g.relations[pair(c.id,o.country)]=clamp((g.relations[pair(c.id,o.country)]??0)+10,-100,100);result(c,o,'completed','Aid transferred');}
  else if(['trade','alliance','peace'].includes(o.action)){
   const other=g.countries[o.country],key=pair(c.id,other.id);const matching=orders.some(p=>p.cid===other.id&&p.country===c.id&&p.action===o.action);
   const accepted=other.human?matching:((g.relations[key]??0)+other.profile.openness+(o.action==='trade'?Math.floor(o.amount/50):0)>= (o.action==='alliance'?80:50));
   if(accepted){if(o.action==='trade')transfer(g,c.id,other.id,o.amount,'Trade agreement investment');
    if(!g.treaties.some(t=>t.type===o.action&&pair(...t.parties)===key&&t.expires>=round)){g.treaties.push({id:o.id,type:o.action,parties:[c.id,other.id],starts:round,expires:round+11});g.news.push({type:'diplomacy',headline:`${c.name} and ${other.name} sign ${o.action} agreement`,round});}
    g.relations[key]=clamp((g.relations[key]??0)+15,-100,100);result(c,o,'completed','Accepted; agreement is active');
   }else result(c,o,'rejected',other.human?'No matching reciprocal human proposal':'Government rejected the proposed terms; no funds transferred');
  }
 }
 // Production commissioned in earlier rounds only; no immediate invented equipment.
 for(const c of Object.values(g.countries)){
  c.projects=c.projects.filter(p=>{if(p.due>round)return true;const t=g.regions[p.target];if(t.owner!==c.id){c.results.push({id:p.id,action:p.action,status:'failed',reason:'Project lost after control changed'});return false;}
   if(p.action==='recruit')t.personnel+=p.quantity;else if(p.action==='purchase')t[p.equipment]+=p.quantity;else if(p.action==='shipbuild'){g.fleets.push({id:`built-${p.id}`,owner:c.id,name:`${p.equipment} group`,region:t.id,ships:{[p.equipment]:p.quantity},readiness:90});}else{c.industry++;t.infrastructure=clamp(t.infrastructure+10,0,100);}
   c.results.push({id:p.id,action:p.action,status:'completed',reason:'Scheduled production completed'});return false;});
 }
 resolveTeams(g,result);
 navalActions(g,orders,rng,result,ledger);
 if(g.logistics)resolveSupply(g);
 // Detach all movements before arrivals and battles (simultaneous departures).
 const arrivals=[];
 for(const o of orders.filter(o=>['move','attack'].includes(o.action))){const c=g.countries[o.cid],a=g.regions[o.origin],b=g.regions[o.target];
  if(o.action==='attack'&&g.treaties.some(t=>['alliance','peace'].includes(t.type)&&t.parties.includes(c.id)&&t.parties.includes(b.owner)&&t.expires>=round)){result(c,o,'failed','Diplomatic agreement blocks combat');continue;}
  const fuel=Math.ceil(o.personnel/200+o.tanks*2+o.fighters*10);const ammo=o.action==='attack'?Math.ceil(o.personnel/100+o.tanks*2+o.fighters*5):0;
  if(c.fuel<fuel||c.ammo<ammo){result(c,o,'failed','Insufficient fuel or ammunition; force held at origin');continue;}
  c.fuel-=fuel;c.ammo-=ammo;for(const k of ['personnel','tanks','fighters'])a[k]-=o[k];arrivals.push({...o,readiness:a.readiness,supply:a.supply,fuel,ammo});
 }
 // Friendly arrivals reinforce before contested arrivals. Attacks at each destination are
 // coalition-grouped and ranked by seeded initiative, avoiding country submission order bias.
 for(const o of arrivals.filter(o=>o.action==='move')){const t=g.regions[o.target];for(const k of ['personnel','tanks','fighters'])t[k]+=o[k];result(g.countries[o.cid],o,'completed',`Moved to ${t.name}; fuel ${o.fuel}`);}
 const destinations=[...new Set(arrivals.filter(o=>o.action==='attack').map(o=>o.target))].sort((a,b)=>a-b);
 for(const target of destinations){const t=g.regions[target],byCountry={};for(const o of arrivals.filter(o=>o.action==='attack'&&o.target===target)){(byCountry[o.cid]??=[]).push(o);}
  const groups=Object.entries(byCountry).map(([cid,os])=>({cid,os,initiative:rng()})).sort((a,b)=>a.initiative-b.initiative);
  for(const {cid,os} of groups){const force={personnel:0,tanks:0,fighters:0,readiness:Math.min(...os.map(o=>o.readiness)),supply:{ratio:Math.min(...os.map(o=>o.supply?.ratio??1))}};for(const o of os)for(const k of ['personnel','tanks','fighters'])force[k]+=o[k];
   if(t.owner===cid){for(const k of ['personnel','tanks','fighters'])t[k]+=force[k];for(const o of os)result(g.countries[cid],o,'completed','Joined friendly occupation');continue;}
   const defender=t.owner,atk=power(force)*(.85+rng()*.3),def=power(t,t.terrain==='mountain'?1.35:1.15)*(.85+rng()*.3),win=atk>def*1.1;
   const losses={attacker:{},defender:{}};for(const k of ['personnel','tanks','fighters']){losses.attacker[k]=Math.min(force[k],Math.ceil(force[k]*(win?.12:.35)));losses.defender[k]=Math.min(t[k],Math.ceil(t[k]*(win?.65:.15)));force[k]-=losses.attacker[k];t[k]-=losses.defender[k];}
   // Defender survivors retreat to the lowest-ID adjacent friendly region; otherwise captured.
   const captured={personnel:0,tanks:0,fighters:0};
   if(win&&force.personnel>0){const retreat=t.adjacent.map(id=>g.regions[id]).find(r=>r.owner===defender);for(const k of ['personnel','tanks','fighters']){if(retreat)retreat[k]+=t[k];else captured[k]=t[k];t[k]=force[k];}t.owner=cid;t.unrest=45;t.infrastructure=Math.max(10,t.infrastructure-15);}
   else{
    const allocated={personnel:0,tanks:0,fighters:0};
    os.forEach((o,index)=>{const origin=g.regions[o.origin];const safe=origin.owner===cid?origin:g.regions.find(r=>r.owner===cid);const share=o.personnel/os.reduce((sum,p)=>sum+p.personnel,0);
     for(const k of ['personnel','tanks','fighters']){const amount=index===os.length-1?force[k]-allocated[k]:Math.floor(force[k]*share);allocated[k]+=amount;if(safe)safe[k]+=amount;else losses.attacker[k]+=amount;}
    });
   }
   const battle={round,target,attacker:cid,defender,win,losses,captured};g.battles.push(battle);g.relations[pair(cid,defender)]=-100;
   g.news.push({type:'battle',headline:`${g.countries[cid].name}: ${win?'captures':'offensive repelled at'} ${t.name}`,round,target,losses,captured});
   for(const o of os)result(g.countries[cid],o,win?'completed':'failed',`${win?'Captured':'Failed at'} ${t.name}; force casualties ${losses.attacker.personnel}; fuel ${o.fuel}, ammunition ${o.ammo}`);
   g.countries[defender].results.push({id:`battle-${round}-${target}-${cid}`,action:'defend',status:win?'failed':'completed',reason:`${t.name}: ${losses.defender.personnel} casualties; ${captured.personnel} captured`});
  }
 }
 g.treaties=g.treaties.filter(t=>t.expires>=round);
 for(const c of Object.values(g.countries)){
  const own=g.regions.filter(r=>r.owner===c.id),troops=own.reduce((s,r)=>s+r.personnel,0)+(g.missions??[]).filter(m=>m.owner===c.id).reduce((s,m)=>s+m.personnel,0),equipment=own.reduce((s,r)=>s+r.tanks*2+r.fighters*5,0);
  c.gdp=Math.max(0,c.gdp+own.length*100+c.industry*50-(own.length?0:Math.floor(c.gdp*.05)));
  const income=own.length?Math.floor(c.gdp*c.tax/1200):0;const trade=g.treaties.filter(t=>t.type==='trade'&&t.parties.includes(c.id)).length*100;
  const upkeep=own.length?Math.ceil(troops*.002+equipment+c.industry*20+c.debt*.003):Math.ceil(c.debt*.003);
  ledger(c,round,income+trade,'Tax and trade receipts');const paid=Math.min(c.treasury,upkeep);ledger(c,round,-paid,'Government, military maintenance and interest');
  if(paid<upkeep){c.stability=clamp(c.stability-10,0,100);for(const r of own)r.readiness=Math.max(20,r.readiness-15);}
  c.fuel+=own.length*300;c.ammo+=c.industry*200;c.materials+=c.industry*50;c.spares=(c.spares??0)+c.industry*30;c.supplies=(c.supplies??0)+own.length*200;
  for(const r of own){r.unrest=Math.max(0,r.unrest-5);r.readiness=clamp(r.readiness+(paid===upkeep?2:0),20,100);}
  c.briefings.push({round,opening:opening[c.id],income:income+trade,upkeep:paid,unpaid:upkeep-paid,closing:c.treasury,results:clone(c.results),intel:clone(c.intel??{}),advice:paid<upkeep?'Cut commitments or raise funding; maintenance is underfunded.':c.fuel<1000?'Fuel stocks are low. Avoid committing all formations.':'Keep a reserve and review neighboring forces before attacking.'});c.orders=[];
 }
 expireIntel(g);
 g.history.push({round,news:clone(g.news)});
 const rankings=score(g);if(round>=g.maxRounds){g.phase='finished';g.winner=rankings[0]?.id??null;}else{g.round++;g.phase='planning';}
 assertInvariants(g);return g;
}
export function score(g){const list=Object.values(g.countries).filter(c=>c.human);const raw=list.map(c=>{const own=g.regions.filter(r=>r.owner===c.id);return {id:c.id,name:c.name,military:own.reduce((s,r)=>s+power(r),0),economy:c.gdp+Math.max(0,c.treasury-c.debt),diplomacy:g.treaties.filter(t=>t.parties.includes(c.id)).length,stability:c.stability};});return raw.map(c=>{const norm=k=>c[k]/Math.max(1,...raw.map(x=>x[k]))*100;return {...c,score:Math.round(norm('military')*.3+norm('economy')*.3+norm('diplomacy')*.25+c.stability*.15)};}).sort((a,b)=>b.score-a.score);}
export function assertInvariants(g){must(g.regions.length===42,'Scenario must contain 42 regions');for(const r of g.regions){must(g.countries[r.owner],'Invalid controller');for(const k of ['personnel','tanks','fighters'])must(int(r[k]),`Invalid ${k}`);}for(const c of Object.values(g.countries))for(const k of ['treasury','debt','fuel','ammo','materials'])must(int(c[k]),`Invalid national ${k}`);}
export function view(g,cid){const c=g.countries[cid];must(c,'Unknown government');return {round:g.round,maxRounds:g.maxRounds,phase:g.phase,winner:g.winner,messages:clone((g.messages??[]).filter(m=>m.from===cid||m.to===cid)),fleets:clone((g.fleets??[]).filter(f=>f.owner===cid)),missions:clone((g.missions??[]).filter(m=>m.owner===cid)),you:clone(c),regions:g.regions.map(r=>r.owner===cid?clone(r):{id:r.id,name:r.name,continent:r.continent,x:r.x,y:r.y,adjacent:r.adjacent,owner:r.owner,terrain:r.terrain,coastal:r.coastal,estimate:visibleEstimate(g,cid,r)}),countries:Object.values(g.countries).map(x=>({id:x.id,name:x.name,color:x.color,human:x.human,gdp:x.gdp})),news:clone(g.news),treaties:clone(g.treaties),rankings:score(g).map(({id,name,score})=>({id,name,score}))};}
// Constrained, explicit grammar. No invented origins, numbers, or LLM execution.
export function parseDirective(text){must(typeof text==='string'&&text.length<=1000,'Directive too long');const t=text.trim();let m;
 if(m=/^(?:scout|recon) (\d+)$/i.exec(t))return {action:'recon',target:+m[1]};
 if(m=/^(?:deploy |send )?special forces (\d+) from (\d+) to (\d+)$/i.exec(t))return {action:'special_recon',personnel:+m[1],origin:+m[2],target:+m[3]};
 if(m=/^recruit (\d+) (?:troops|personnel) (?:in|at) (\d+)$/i.exec(t))return {action:'recruit',quantity:+m[1],target:+m[2]};
 if(m=/^buy (\d+) (tanks|fighters) (?:in|at) (\d+)$/i.exec(t))return {action:'purchase',quantity:+m[1],equipment:m[2].toLowerCase(),target:+m[3]};
 if(m=/^(move|attack) (\d+) troops (\d+) tanks (\d+) fighters from (\d+) to (\d+)$/i.exec(t))return {action:m[1].toLowerCase(),personnel:+m[2],tanks:+m[3],fighters:+m[4],origin:+m[5],target:+m[6]};
 if(m=/^invest (\d+) (?:in|at) (\d+)$/i.exec(t))return {action:'invest',amount:+m[1],target:+m[2]};
 if(m=/^set tax (\d+)%?$/i.exec(t))return {action:'tax',rate:+m[1]};
 throw new Error('Needs clarification. Supported examples: recruit 1000 troops in 6; buy 10 tanks in 6; move 1000 troops 5 tanks 0 fighters from 6 to 7; set tax 25. Use region IDs shown in the map inspector.');
}

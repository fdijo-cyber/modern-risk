import {UNIT_TYPES} from '../../apps/web/public/simple-rules.js';
const clamp=(n,a=0,b=100)=>Math.max(a,Math.min(b,n));
const create=(g,type,terrain)=>({id:`formation-${++g.serial}`,type,health:100,experience:0,healingRate:6,terrainAdaptations:[terrain??'plains'],supply:100,weaponry:100,battles:0,trained:0,lastCombat:null});
function reconcile(g,units,stock,terrain){for(const type of Object.keys(UNIT_TYPES)){stock[type]??=[];if(stock[type].length>units[type])stock[type].length=units[type];while(stock[type].length<(units[type]??0))stock[type].push(create(g,type,terrain));}return stock;}
export function ensureFormations(g){
 for(const r of g.regions)r.formations=reconcile(g,r.units,r.formations??{},r.terrain);
 for(const c of Object.values(g.countries)){const home=g.regions.find(r=>r.owner===c.id);c.reserveFormations=reconcile(g,c.reserves??{},c.reserveFormations??{},home?.terrain);}
 for(const b of g.blockades??[])b.formations=reconcile(g,b.units,b.formations??{},g.regions[b.origin]?.terrain);
 g.conditionVersion=1;
}
export function detachFormations(stock,units){const out={};for(const [k,n] of Object.entries(units))out[k]=(stock[k]??[]).splice(0,n);return out;}
export function mergeFormations(stock,formations){for(const [k,groups] of Object.entries(formations??{})){stock[k]??=[];stock[k].push(...groups);}}
export function conditionPower(formations,terrain){const groups=Object.values(formations??{}).flat();if(!groups.length)return 1;return groups.reduce((n,f)=>n+(f.health/100)*(.85+f.experience/200)*(.6+f.supply/250)*(.75+f.weaponry/400)*(f.terrainAdaptations.includes(terrain)?1.1:.95),0)/groups.length;}
export function damageFormations(formations,damage,round,rng){const losses={};for(const [type,groups] of Object.entries(formations)){let lost=0;formations[type]=groups.filter(f=>{f.health=clamp(f.health-damage-Math.floor(rng()*9));f.experience=clamp(f.experience+12);f.battles++;f.lastCombat=round;if(f.health<=0){lost++;return false;}return true;});losses[type]=lost;}return losses;}
export function countsFromFormations(formations){return Object.fromEntries(Object.keys(UNIT_TYPES).map(k=>[k,formations[k]?.length??0]));}
export function monthlyConditions(g){
 ensureFormations(g);
 for(const c of Object.values(g.countries)){
  const owned=g.regions.filter(r=>r.owner===c.id),stocks=[...owned.map(r=>r.formations),c.reserveFormations,...(g.blockades??[]).filter(b=>b.country===c.id&&b.status==='active').map(b=>b.formations)],groups=stocks.flatMap(s=>Object.values(s).flat());
  const funded=(c.lastUpkeep??0)>=(c.lastUpkeepRequired??1)||groups.length===0,need=Math.max(1,c.lastSupplyUse??groups.length),supply=clamp(Math.round((c.supplies??100)/need*100)),crisis=c.treasury===0||!funded;
  c.logisticsCondition={supply:crisis?Math.min(60,supply):supply,weaponry:crisis?65:(c.spares??50)>0?100:75,healingRate:crisis?2:supply>=75?6:3};
  for(const f of groups){f.supply=c.logisticsCondition.supply;f.weaponry=c.logisticsCondition.weaponry;f.healingRate=c.logisticsCondition.healingRate;f.health=clamp(f.health+f.healingRate);}
  c.migrationPressure=Math.max(0,(c.migrationPressure??0)-1);
 }
}
export function awardTraining(g,cid,{target,terrain,budget=100,title='Military training'}){
 const c=g.countries[cid],r=g.regions[target];if(!r||r.owner!==cid)throw Error('Training requires the actual owned training site');
 const valid=new Set(g.regions.map(r=>r.terrain));if(terrain!==undefined&&!valid.has(terrain))throw Error('Training terrain must be an existing board terrain');
 ensureFormations(g);const groups=[...Object.values(r.formations).flat(),...Object.values(c.reserveFormations).flat()],gain=Math.min(25,Math.floor(budget/10));for(const f of groups){f.experience=clamp(f.experience+gain);f.trained++;if(terrain&&!f.terrainAdaptations.includes(terrain))f.terrainAdaptations.push(terrain);}
 c.trainingPrograms??=[];c.trainingPrograms.push({id:`training-${++g.serial}`,round:g.round,target,terrain:terrain??r.terrain,budget,title,groups:groups.length,experienceGain:gain});return `Training completed for ${groups.length} formations at ${r.name} and in national reserve; experience +${gain}${terrain?'; adaptation: '+terrain:''}.`;
}
export function trainFormations(g,cid,options){
 const {budget=100,title='Military training',target,terrain}=options,c=g.countries[cid];if(!Number.isSafeInteger(budget)||budget<25||budget>1000||c.treasury<budget)throw Error('Training requires an affordable $25–$1,000 budget');
 if(g.regions[target]?.owner!==cid||terrain!==undefined&&!g.regions.some(r=>r.terrain===terrain))throw Error('Choose an owned site and a represented board terrain');
 const result=awardTraining(g,cid,{target,terrain,budget,title});c.treasury-=budget;c.ledger.push({round:g.round,amount:-budget,reason:'Training: '+title,balance:c.treasury});return result+` Paid $${budget}.`;
}

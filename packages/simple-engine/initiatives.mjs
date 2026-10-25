// Extensible state effects: novel institutions and policies use this schema, not new handlers.
const STATS=new Set(['economic','political','social','research','counterintel','readiness']);
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const whole=(v,f,a,b)=>Number.isFinite(Number(v))?clamp(Math.round(Number(v)),a,b):f;
export function normalizeInitiative(g,cid,raw){
 const adjustments=(Array.isArray(raw.adjustments)?raw.adjustments:[]).filter(x=>typeof x==='string').map(x=>x.slice(0,400)).slice(0,12),budget=whole(raw.budget,100,25,1000),duration=whole(raw.duration,2,1,12),lifetime=whole(raw.lifetime,12,1,24),title=String(raw.title??raw.purpose??'National initiative').trim().slice(0,120)||'National initiative';
 const intent=String(raw.intent??raw.purpose??title).slice(0,3000),category=String(raw.category??'domestic').slice(0,50),visibility=raw.visibility==='secret'?'secret':'public';
 let target=Number.isInteger(raw.target)&&g.regions[raw.target]?raw.target:g.regions.find(r=>r.owner===cid)?.id;
 if(target===undefined)throw new Error('No territory remains to support the initiative');
 const foreign=g.regions[target].owner!==cid;
 let remaining=Math.max(1,Math.min(10,Math.floor(budget/25))),effects=[];
 for(const e of (Array.isArray(raw.effects)?raw.effects:[]).slice(0,6)){
  if(STATS.has(e.stat)){const value=whole(e.value,1,-remaining,remaining);if(value){effects.push({stat:e.stat,value});remaining-=Math.abs(value);}}
  else if(e.stat==='income'){const value=whole(e.value,0,0,Math.floor(budget/12));if(value)effects.push({stat:'income',value});}
  else if(e.stat==='fortification'){effects.push({stat:'fortification',value:whole(e.value,1,1,Math.min(3,Math.max(1,Math.floor(budget/100))))});}
  else adjustments.push(`Proposed effect “${String(e.stat).slice(0,60)}” revised: it cannot directly create resources, troops or ownership.`);
 }
 if(!effects.length){const stat=/research|scient|space|technolog|academy|university/i.test(category+' '+intent)?'research':/econom|currency|invest|trade|infrastructure/i.test(category+' '+intent)?'economic':/intelligen|cyber|covert|secur/i.test(category+' '+intent)?'counterintel':/social|health|educat|food|housing|domestic/i.test(category+' '+intent)?'social':'political';effects=[{stat,value:Math.max(1,Math.min(6,Math.floor(budget/25)))}];adjustments.push(`Novel objective represented by a persistent ${category} project with measurable ${stat} effects.`);}
 if(foreign&&effects.some(e=>e.stat==='fortification')){effects=effects.filter(e=>e.stat!=='fortification');effects.push({stat:'economic',value:1});adjustments.push('Foreign military construction revised to a civilian cooperation benefit; host military access was not granted.');}
 const requested=JSON.stringify(raw.effects??[]);if(effects.some(e=>!requested.includes(String(e.value))))adjustments.push('Effect magnitudes bounded by the funded budget; no unsupported resource creation allowed.');
 const risk=whole(raw.risk,15,5,65),upkeep=whole(raw.upkeep,Math.ceil(budget/50),0,Math.floor(budget/5));
 return {title,intent,category,visibility,target,trigger:typeof raw.trigger==='string'?raw.trigger.slice(0,500):null,budget,duration,lifetime,effects,risk,upkeep,adjustments,foreign,rationale:String(raw.rationale??'The government can establish the program now; delivery depends on funding, implementation time and national capacity.').slice(0,1600)};
}
function event(g,cid,p,headline,body){if(p.visibility==='public'){g.publicEvents??=[];g.news??=[];g.publicEvents.push({round:g.round,country:cid,type:'initiative',headline,body});g.news.push({round:g.round,type:'initiative',headline});}}
export function launchInitiative(g,cid,o){
 const c=g.countries[cid];c.initiatives??=[];const p={...o,id:`project-${++g.serial}`,created:g.round,progress:0,paid:o.budget,status:o.trigger?'awaiting_condition':o.foreign?'awaiting_consent':'active',history:[],outcome:null};delete p.action;delete p.cost;delete p.oil;delete p.fuel;c.initiatives.push(p);
 const location=g.regions[p.target];
 if(p.foreign){const owner=location.owner,atWar=(g.wars??[]).some(w=>w.parties.includes(cid)&&w.parties.includes(owner)),acceptable=!atWar&&!/military|intelligence|covert/i.test(p.category)&&g.countries[owner].profile.openness>=35;g.agreements??=[];const agreement={id:`agreement-${++g.serial}`,title:`Host authorization: ${p.title}`,parties:[cid,owner],status:g.countries[owner].human?'offered':acceptable?'active':'rejected',created:g.round,consent:g.countries[owner].human||!acceptable?[cid]:[cid,owner],terms:{kind:'cooperation',from:cid,to:owner,amount:0,months:p.lifetime,project:p.id}};if(agreement.status==='active'){agreement.starts=g.round;agreement.expires=g.round+p.lifetime-1;p.status='active';}g.agreements.push(agreement);
  g.messages.push({id:`msg-${++g.serial}`,round:g.round,from:cid,to:owner,body:`We request host permission for ${p.title} in ${location.name}. Investment escrow $${p.budget}, implementation ${p.duration} month(s). No territory or forces change hands.`,automated:false});
  if(!g.countries[owner].human&&!acceptable){p.status='cancelled';c.treasury+=p.budget;c.ledger.push({round:g.round,amount:p.budget,balance:c.treasury,reason:`Refund: ${p.title} host declined`});}
  if(!g.countries[owner].human)g.messages.push({id:`msg-${++g.serial}`,round:g.round,from:owner,to:cid,body:acceptable?`We authorize the civilian project ${p.title}. Local sovereignty and military access remain unchanged.`:`We decline ${p.title}: current security relations or the proposed scope do not permit this authorization.`,automated:true,source:'local-negotiator'});
 }
 const result=`${p.title}: ${p.status==='cancelled'?'host declined; investment escrow refunded':p.status==='awaiting_condition'?'conditional program recorded; escrow held pending trigger':p.status==='awaiting_consent'?'funded escrow established; host consent requested':'established'} in ${location.name}. $${p.budget} paid; ${p.duration} month(s) implementation; $${p.upkeep}/month operating cost; assessed risk ${p.risk}%. ${p.rationale}`;
 p.history.push({round:g.round,text:result});event(g,cid,p,`${c.name}: ${p.title} ${p.status==='cancelled'?'declined by host':'established'}`,`${location.name}: $${p.budget} committed; ${p.duration}-month implementation. ${p.status==='cancelled'?'Host declined; escrow refunded.':p.status==='awaiting_condition'?'Implementation awaits trigger verification.':p.status==='awaiting_consent'?'Work awaits host authorization.':'Work is authorized.'}`);return {project:p,result};
}
export function tickInitiatives(g,cid){
 const c=g.countries[cid],results=[];let income=0,upkeep=0;
 for(const p of c.initiatives??[]){
  if(['failed','expired','cancelled'].includes(p.status))continue;
  if(p.status==='awaiting_condition'){
   if(g.round-p.created>=3){p.status='cancelled';c.treasury+=p.budget;c.ledger.push({round:g.round,amount:p.budget,balance:c.treasury,reason:`Refund: ${p.title} trigger unverified`});results.push(`${p.title}: condition could not be verified within three months; escrow refunded.`);}else results.push(`${p.title}: conditional mandate is established; trigger “${p.trigger}” has not been verified. No implementation effects claimed.`);continue;
  }
  if(p.status==='awaiting_consent'){
   const a=g.agreements.find(a=>a.terms.project===p.id);if(a?.status==='active')p.status='active';else if(a?.status==='rejected'||g.round-p.created>=3){p.status='cancelled';c.treasury+=p.budget;c.ledger.push({round:g.round,amount:p.budget,balance:c.treasury,reason:`Refund: ${p.title} host authorization unavailable`});results.push(`${p.title}: cancelled; escrow $${p.budget} refunded.`);continue;}else{results.push(`${p.title}: host consent remains pending; escrow intact.`);continue;}
  }
  if(p.expires!==undefined&&g.round>p.expires){p.status='expired';results.push(`${p.title}: effect term ended.`);continue;}
  const host=g.regions[p.target]?.owner,access=host===cid||g.agreements.some(a=>a.status==='active'&&a.expires>=g.round&&a.terms.project===p.id&&a.parties.includes(host));
  if(!access){p.resumeStatus??=p.status==='completed'?'completed':'active';p.status='suspended';results.push(`${p.title}: site access lost; work and benefits suspended without an operating charge.`);continue;}
  if(c.treasury<p.upkeep){p.resumeStatus??=p.status==='completed'?'completed':'active';p.status='suspended';results.push(`${p.title}: suspended; $${p.upkeep} operating funds unavailable.`);continue;}
  c.treasury-=p.upkeep;upkeep+=p.upkeep;c.ledger.push({round:g.round,amount:-p.upkeep,balance:c.treasury,reason:`Operating cost: ${p.title}`});
  if(p.status==='suspended'){p.status=p.resumeStatus??'active';delete p.resumeStatus;}
  if(p.status==='active'){
   p.progress++;
   if(p.progress>=p.duration){const roll=((g.seed+g.round*73+p.created*97+Number(p.id.split('-').at(-1))*31)>>>0)%100;
    const fails=roll<p.risk;p.status=fails?'failed':'completed';p.outcome=fails?'Implementation failed its delivery assessment. Investment was spent; no claimed benefits applied.':'Implementation completed; validated effects applied.';
    if(!fails){p.completedAt=g.round;p.expires=g.round+p.lifetime-1;}
    if(!fails&&!p.effectsApplied)for(const e of p.effects){if(STATS.has(e.stat))c[e.stat]=clamp((c[e.stat]??(e.stat==='readiness'?100:0))+e.value,0,100);if(e.stat==='fortification'&&g.regions[p.target].owner===cid)g.regions[p.target].fortification=clamp((g.regions[p.target].fortification??0)+e.value,0,5);}
    if(!fails)p.effectsApplied=true;
    event(g,cid,p,`${c.name}: ${p.title} ${p.status}`,`${p.outcome}${fails?'':` Measured effects: ${p.effects.map(e=>e.stat==='income'?`$${e.value}/month productivity income`:`${e.stat} ${e.value>0?'+':''}${e.value}`).join(', ')}.`}`);
   }
  }
  if(p.status==='completed')for(const e of p.effects)if(e.stat==='income')income+=e.value;
  const text=`${p.title}: ${p.status}, ${p.progress}/${p.duration} implementation months. ${p.outcome??'Work is ongoing.'}`;p.history.push({round:g.round,text});results.push(text);
 }
 if(income){c.treasury+=income;c.ledger.push({round:g.round,amount:income,balance:c.treasury,reason:'Project productivity income'});}
 c.lastProjectIncome=income;c.lastProjectUpkeep=upkeep;return results;
}

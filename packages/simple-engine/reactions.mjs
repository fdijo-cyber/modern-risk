// Abstract, seeded defensive decisions. No real-world operational instructions.
import {createHash} from 'node:crypto';
const chance=(g,key)=>parseInt(createHash('sha256').update(`${g.seed}:${g.round}:${key}`).digest('hex').slice(0,8),16)/0x100000000;
const clamp=n=>Math.max(0,Math.min(100,n));
const pay=(g,c,n,reason)=>{c.treasury-=n;c.ledger.push({round:g.round,amount:-n,reason,balance:c.treasury});};
const message=(g,from,to,body)=>g.messages.push({id:`msg-${++g.serial}`,round:g.round,from,to,body,automated:true,source:'strategic-government'});
export function reactToBattle(g,{attacker,defender,region,captured}){
 const c=g.countries[defender],enemy=g.countries[attacker],t=g.regions[region];if(c.human)return null;
 c.warResponses??=[];const key=`${g.round}:${attacker}`;if(c.warResponses.some(r=>r.key===key))return null;
 const staging=g.regions.filter(r=>r.owner===defender).sort((a,b)=>Number(b.adjacent.includes(region))-Number(a.adjacent.includes(region))||a.id-b.id)[0];
 const choices=[{kind:'broadcast',cost:15},{kind:'diplomatic-appeal',cost:10},{kind:'rally',cost:20},{kind:'war-weariness',cost:30}];
 if(staging&&(c.reserves.infantry??0)>0&&c.oil>=1&&c.fuel>=1)choices.push({kind:'reserve-surge',cost:5});
 if(captured&&c.oil>=5&&c.fuel>=5)choices.push({kind:'scorched-withdrawal',cost:35});
 const affordable=choices.filter(o=>c.treasury>=o.cost);if(!affordable.length)return null;
 // Falling territory increases the attraction of denial, without making it inevitable.
 if(captured&&affordable.some(o=>o.kind==='scorched-withdrawal'))affordable.push(affordable.find(o=>o.kind==='scorched-withdrawal'));
 const pick=affordable[Math.floor(chance(g,key+':choice')*affordable.length)],r={id:`response-${++g.serial}`,key,round:g.round,attacker,defender,region,kind:pick.kind,cost:pick.cost};pay(g,c,pick.cost,'War response: '+pick.kind);
 if(pick.kind==='broadcast'){
  const persuaded=chance(g,key+':reach')<.65;c.political=clamp(c.political+2);if(persuaded)enemy.political=clamp(enemy.political-1);
  r.headline=`${c.name} condemns ${enemy.name} in a worldwide broadcast`;r.detail=`A public appeal rallies domestic support (+2 political index)${persuaded?' and increases diplomatic pressure on the attacker (−1 political index)':''}. No civilian behavior is guaranteed.`;
 }else if(pick.kind==='diplomatic-appeal'){
  const recipients=Object.values(g.countries).filter(x=>![attacker,defender].includes(x.id)&&!(g.wars??[]).some(w=>w.parties.includes(defender)&&w.parties.includes(x.id))).sort((a,b)=>chance(g,key+a.id)-chance(g,key+b.id)).slice(0,2);
  for(const x of recipients)message(g,defender,x.id,`We request diplomatic support in response to ${enemy.name}'s attack on ${t.name}. No treaty or military commitment is presumed.`);
  r.headline=`${c.name} seeks international support after the attack`;r.detail=`${recipients.length} governments received official appeals. Their consent is not assumed.`;
 }else if(pick.kind==='war-weariness'){
  enemy.social=clamp(enemy.social-2);enemy.migrationPressure=clamp((enemy.migrationPressure??0)+1);r.headline=`${c.name} challenges ${enemy.name}'s war effort in a public campaign`;r.detail='The abstract influence campaign reduces the attacker’s social index by two and adds one simulated migration-pressure point. It neither guarantees civilian decisions nor moves military personnel.';
 }else if(pick.kind==='reserve-surge'){
  c.reserves.infantry--;staging.units.infantry++;c.oil--;c.fuel--;
  r.headline=`${c.name} deploys emergency reserves`;r.detail=`One infantry group mobilized at ${staging.name}; $5, one oil and one fuel consumed. National personnel were transferred from reserve, not created.`;
 }else if(pick.kind==='scorched-withdrawal'){
  c.oil-=5;c.fuel-=5;const building=['refinery','port','economic','factory'].find(k=>t.buildings[k]>0);if(building){t.buildings[building]--;if(!t.buildings[building])delete t.buildings[building];}
  t.disruption={until:g.round+1,penalty:25,actor:defender};t.readiness=Math.max(30,(t.readiness??100)-10);
  r.headline=`Withdrawal disrupts infrastructure in ${t.name}`;r.detail=`The retreating government spent $35, five oil and five fuel on resource denial. ${building?'One '+building+' installation was lost. ':''}Recovery costs the current controller $25 per month through month ${g.round+1}; occupation readiness fell 10 points. This is an abstract board-game effect.`;
 }else{
  c.social=clamp(c.social+2);c.readiness=clamp((c.readiness??100)+3);c.retaliationTarget=region;
  r.headline=`${c.name} rallies national resistance`;r.detail='A national solidarity campaign adds two social-index points and three readiness points; military planners prioritize the contested frontier.';
 }
 c.warResponses.push(r);g.publicEvents??=[];g.publicEvents.push({round:g.round,type:'diplomacy',country:defender,headline:r.headline,body:r.detail});g.news.push({round:g.round,type:'diplomacy',country:defender,headline:r.headline});
 message(g,defender,attacker,r.headline+'. '+r.detail);
 c.stability=Math.round((c.economic+c.political+c.social)/3);enemy.stability=Math.round((enemy.economic+enemy.political+enemy.social)/3);return r;
}

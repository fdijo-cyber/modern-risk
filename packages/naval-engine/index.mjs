export const SHIPS={frigates:{cost:300,time:3,power:5,fuel:20},destroyers:{cost:900,time:4,power:12,fuel:35},submarines:{cost:700,time:4,power:10,fuel:15},carriers:{cost:5000,time:8,power:40,fuel:100},patrol:{cost:80,time:2,power:1,fuel:5},transports:{cost:150,time:3,power:1,fuel:10},amphibious:{cost:400,time:4,power:4,fuel:25},logistics:{cost:200,time:3,power:1,fuel:10}};
export const SEA_LANES=[[0,29],[6,32],[7,18],[7,20],[8,9],[11,20],[16,13],[16,18],[19,21],[21,34],[22,35],[25,35],[32,39],[35,38],[36,38],[38,40],[39,41],[40,41]];
export function seaAdjacent(g,a,b){return a!==b&&g.regions[a]?.coastal&&g.regions[b]?.coastal&&(g.regions[a].adjacent.includes(b)||SEA_LANES.some(([x,y])=>x===a&&y===b||x===b&&y===a));}
const strength=f=>Object.entries(f.ships).reduce((n,[type,count])=>n+SHIPS[type].power*count,0)*f.readiness/100;
export function navalActions(g,orders,rng,writeResult,ledger){g.fleets??=[];g.blockades=[];
 for(const o of orders.filter(o=>['naval_move','blockade','naval_attack'].includes(o.action))){const c=g.countries[o.cid],f=g.fleets.find(f=>f.id===o.fleet);if(!f){writeResult(c,o,'failed','Fleet no longer available');continue;}
  const fuel=Object.entries(f.ships).reduce((n,[k,v])=>n+SHIPS[k].fuel*v,0);if(c.fuel<fuel){writeResult(c,o,'failed','Insufficient naval fuel');continue;}c.fuel-=fuel;
  if(o.action==='naval_move'){f.region=o.target;writeResult(c,o,'completed',`Fleet repositioned to waters at ${g.regions[o.target].name}`);}
  else if(o.action==='blockade'){f.region=o.target;g.blockades.push({owner:c.id,target:o.target,fleet:f.id,round:g.round});writeResult(c,o,'completed','Blockade active this month; foreign naval supply is interrupted');}
  else {const ammo=Math.max(1,Math.ceil(fuel/2));if(c.ammo<ammo){writeResult(c,o,'failed','Insufficient naval ammunition');continue;}c.ammo-=ammo;const enemies=g.fleets.filter(other=>other.owner!==c.id&&other.region===o.target);if(!enemies.length){writeResult(c,o,'failed','No opposing fleet encountered; fuel consumed');continue;}
   const target=enemies[0];if(g.treaties.some(t=>['alliance','peace'].includes(t.type)&&t.expires>=g.round&&t.parties.includes(c.id)&&t.parties.includes(target.owner))){writeResult(c,o,'failed','Treaty prevents naval combat');continue;}
   const ap=strength(f)*(.85+rng()*.3),dp=strength(target)*(.85+rng()*.3);const win=ap>dp;const losses={attacker:{},defender:{}};
   for(const [side,fl,ratio] of [['attacker',f,win?.1:.35],['defender',target,win?.35:.1]])for(const k of Object.keys(fl.ships)){const n=Math.min(fl.ships[k],Math.floor(fl.ships[k]*ratio+(rng()<ratio?1:0)));fl.ships[k]-=n;losses[side][k]=n;}
   f.region=o.target;g.news.push({type:'naval',round:g.round,headline:`Naval engagement near ${g.regions[o.target].name}`,navalLosses:losses});writeResult(c,o,'completed',`Naval engagement ${win?'won':'lost'}; see public battle report`);
  }
 }
 g.fleets=g.fleets.filter(f=>Object.values(f.ships).some(n=>n>0));
 for(const f of g.fleets){const c=g.countries[f.owner],bill=Object.values(f.ships).reduce((a,n)=>a+n,0)*10;const paid=Math.min(c.treasury,bill);ledger(c,g.round,-paid,'Fleet maintenance');f.readiness=Math.max(20,Math.min(100,f.readiness+(paid===bill?2:-10)));}
}

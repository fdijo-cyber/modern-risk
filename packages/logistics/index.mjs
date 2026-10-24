const classes=['fuel','ammo','spares','supplies'];
export const needFor=r=>({fuel:Math.ceil(r.tanks*.5+r.fighters*3),ammo:Math.ceil(r.personnel/400+r.tanks*.2),spares:Math.ceil((r.tanks+r.fighters)/10),supplies:Math.ceil(r.personnel/100)});
// BFS over friendly land edges. Capacity is shared by every route using an edge.
export function supplyPath(g,cid,start,target){const seen=new Set([start]),todo=[[start]];while(todo.length){const path=todo.shift(),id=path.at(-1);if(id===target)return path;for(const next of [...g.regions[id].adjacent].sort((a,b)=>a-b)){const r=g.regions[next];if(!seen.has(next)&&r.owner===cid){seen.add(next);todo.push([...path,next]);}}}return null;}
export function resolveSupply(g){const edgeUse=new Map();
 for(const c of Object.values(g.countries)){
  c.spares??=500;c.supplies??=3000;c.supplyLog=[];const own=g.regions.filter(r=>r.owner===c.id);c.depots??=own.length?[own[0].id]:[];c.depots=c.depots.filter(id=>g.regions[id]?.owner===c.id);
  for(const r of own){r.depot=c.depots.includes(r.id);const need=needFor(r);const candidates=c.depots.map(id=>supplyPath(g,c.id,id,r.id)).filter(Boolean).sort((a,b)=>a.length-b.length);const path=candidates[0]??null;let capacity=path?Math.max(0,Math.floor(Math.min(...path.map(id=>g.regions[id].infrastructure))*8/(1+(path.length-1)*.15))):0;
   if(path)for(let i=1;i<path.length;i++){const key=[path[i-1],path[i]].sort((a,b)=>a-b).join(':');capacity=Math.min(capacity,Math.max(0,500-(edgeUse.get(key)??0)));}
   // A friendly convoy can link an isolated coastal region to a stocked coastal depot.
   let naval=false;if(!path&&r.coastal&&c.depots.some(id=>g.regions[id].coastal)&&!g.blockades?.some(b=>b.target===r.id&&b.owner!==c.id)){
    const convoy=(g.fleets??[]).find(f=>f.owner===c.id&&f.region===r.id&&(f.ships.logistics??0)+(f.ships.transports??0)>0);if(convoy){capacity=((convoy.ships.logistics??0)*300+(convoy.ships.transports??0)*100);naval=true;}
   }
   const total=classes.reduce((s,k)=>s+need[k],0),capacityRatio=total?Math.min(1,capacity/total):1;const delivered={};
   for(const k of classes){delivered[k]=Math.min(c[k],Math.floor(need[k]*capacityRatio));c[k]-=delivered[k];}
   const ratio=Math.min(1,...classes.map(k=>need[k]?delivered[k]/need[k]:1));r.supply={round:g.round,ratio,path,naval,capacity,need,delivered};
   if(path){const used=Object.values(delivered).reduce((s,n)=>s+n,0);for(let i=1;i<path.length;i++){const key=[path[i-1],path[i]].sort((a,b)=>a-b).join(':');edgeUse.set(key,(edgeUse.get(key)??0)+used);}}
   if(ratio<.5){r.readiness=Math.max(20,r.readiness-Math.ceil((1-ratio)*12));const broken=Math.min(r.tanks,Math.ceil(r.tanks*(1-ratio)*.01));r.tanks-=broken;c.supplyLog.push({region:r.id,ratio,reason:path?'Supply or capacity shortage':naval?'Convoy capacity shortage':'No friendly depot route',brokenTanks:broken});}
  }
 }
}

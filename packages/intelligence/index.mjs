// All observations are frozen snapshots, never live references to foreign state.
export function intelRoll(seed,round,key){let h=(seed^Math.imul(round,7919))>>>0;for(const ch of String(key))h=(Math.imul(h^ch.charCodeAt(0),16777619))>>>0;return (h%10000)/10000;}
export function observe(g,cid,target,source='Scouting'){
 const r=g.regions[target],c=g.countries[cid],precise=source==='Special forces';
 const percent=precise?10:25;
 const band=(n,step)=>({low:Math.max(0,Math.floor(n*(100-percent)/(100*step))*step),high:Math.ceil(n*(100+percent)/(100*step))*step});
 const troops=band(r.personnel,precise?50:500);
 const report={...troops,round:g.round,expires:g.round+(precise?2:1),controller:r.owner,confidence:precise?'High':'Medium',source,warning:'Dated estimate, not a live count; movements can change the situation.'};
 if(precise){report.tanks=band(r.tanks,5);report.fighters=band(r.fighters,2);}
 c.intel??={};c.intel[target]=report;return report;
}
export function visibleEstimate(g,cid,r){const i=g.countries[cid].intel?.[r.id];if(!i||i.controller&&i.controller!==r.owner||g.round>(i.expires??i.round+1))return null;return {...structuredClone(i),stale:g.round>i.round};}
export function expireIntel(g){for(const c of Object.values(g.countries))for(const [id,i] of Object.entries(c.intel??{}))if(!visibleEstimate(g,c.id,g.regions[+id]))delete c.intel[id];}
export function resolveTeams(g,writeResult){g.missions??=[];g.missions=g.missions.filter(m=>{
 const c=g.countries[m.owner],r=g.regions[m.target];
 if(g.round>m.until){const home=g.regions[m.origin]?.owner===m.owner?g.regions[m.origin]:g.regions.find(r=>r.owner===m.owner);if(home)home.personnel+=m.personnel;writeResult(c,{id:m.id,action:'special_recon'},home?'completed':'failed',home?'Special-forces team returned to friendly territory':'Team captured after all friendly territory was lost');return false;}
 if(r.owner!==m.owner){observe(g,m.owner,m.target,'Special forces');writeResult(c,{id:m.id,action:'special_recon'},'continuing',`Reconnaissance observation updated for ${r.name}; team returns after month ${m.until}`);}
 return true;
 });}

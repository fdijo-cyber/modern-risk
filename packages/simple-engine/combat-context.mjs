// Original MODERN RISK balance rules; no model-generated combat arithmetic.
import {createHash} from 'node:crypto';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,Number.isFinite(n)?n:a));
export function combatContext(game,country,region){
 const c=game.countries[country];
 const weatherRoll=parseInt(createHash('sha256').update(`${game.seed}:${game.round}:${region.id}:weather`).digest('hex').slice(0,8),16)/0x100000000;
 const weather=weatherRoll<.15?'severe':weatherRoll<.4?'rain':'clear';
 const factors={morale:.75+clamp(c.social??70,0,100)/280,supply:.5+clamp(c.supplies??100,0,100)/200,technology:1+clamp(c.research??0,0,100)/500,command:.85+clamp(c.political??70,0,100)/466.6667,weather:weather==='severe'?.85:weather==='rain'?.95:1};
 return {weather,factors,multiplier:Object.values(factors).reduce((a,b)=>a*b,1)};
}

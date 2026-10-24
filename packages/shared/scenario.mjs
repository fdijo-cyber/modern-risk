import {ATLAS} from '../../apps/web/public/atlas.js';
// Original geographic scenario: region labels are aggregates, not claims of sovereignty.
const groups = [
 ['North America', [['Alaska',70,100],['Northwest Canada',140,90],['Greenland',310,65],['Alberta',140,155],['Ontario',210,150],['Quebec',280,140],['Western United States',140,220],['Eastern United States',225,215],['Central America',180,285]]],
 ['South America', [['Venezuela',260,335],['Peru',245,405],['Brazil',330,395],['Argentina',285,475]]],
 ['Europe', [['Iceland',420,100],['Scandinavia',535,100],['Ukraine',610,175],['United Kingdom',435,175],['Northern Europe',520,170],['Western Europe',465,240],['Southern Europe',545,240]]],
 ['Africa', [['North Africa',465,325],['Egypt',555,310],['East Africa',585,395],['Congo',505,405],['Southern Africa',520,480],['Madagascar',640,475]]],
 ['Asia', [['Ural',695,120],['Siberia',770,75],['Yakutsk',855,65],['Kamchatka',1000,100],['Irkutsk',845,135],['Mongolia',875,205],['Japan',1015,230],['Afghanistan',695,235],['Middle East',635,305],['India',765,315],['Southeast Asia',855,335],['China',845,265]]],
 ['Oceania', [['Indonesia',865,415],['New Guinea',990,405],['Western Australia',900,495],['Eastern Australia',1000,485]]]
];
const links = [[0,1],[0,3],[0,29],[1,2],[1,3],[1,4],[2,4],[2,5],[2,13],[3,4],[3,6],[4,5],[4,6],[4,7],[5,7],[6,7],[6,8],[7,8],[8,9],[9,10],[9,11],[10,11],[10,12],[11,12],[11,20],[13,14],[13,16],[14,15],[14,17],[15,17],[15,19],[15,26],[15,33],[15,34],[16,17],[16,18],[17,18],[17,19],[18,19],[18,20],[19,20],[19,21],[19,34],[20,21],[20,22],[20,23],[21,22],[21,34],[22,23],[22,24],[22,25],[22,34],[23,24],[24,25],[26,27],[26,30],[26,33],[26,37],[27,28],[27,30],[28,29],[28,30],[29,30],[29,31],[29,32],[30,31],[31,32],[31,37],[33,34],[33,35],[33,37],[34,35],[35,36],[35,37],[36,37],[36,38],[38,39],[38,40],[39,40],[39,41],[40,41]];
let serial=0;
export const REGIONS=groups.flatMap(([continent,items])=>items.map(([name,x,y])=>({id:serial++,name,continent,x,y,adjacent:[],terrain:['plains','urban','mountain'][serial%3],coastal:true})));
for(const r of REGIONS){const a=ATLAS[r.id];r.x=a.center[0];r.y=a.center[1];}
for(const [a,b] of links){REGIONS[a].adjacent.push(b);REGIONS[b].adjacent.push(a);}
export const POWERS=['us','eu','china','russia'];
export const COLORS=['#56b6ec','#c5a66b','#f17b75','#b08bdf','#66c9a4','#82a9ad','#d39060','#a2ad76'];
export const EQUIPMENT={tanks:{cost:5,time:2,power:24,fuel:2,ammo:2,crew:4},fighters:{cost:45,time:3,power:160,fuel:10,ammo:5,crew:2}};
export const ACTIONS={move:'defence',attack:'defence',recruit:'defence',purchase:'defence',invest:'industry',trade:'foreign',aid:'foreign',alliance:'foreign',peace:'foreign',tax:'finance',borrow:'finance',repay:'finance',stabilize:'interior',recon:'intelligence',special_recon:'intelligence',message:'foreign',depot:'industry',shipbuild:'industry',naval_move:'defence',blockade:'defence',naval_attack:'defence'};
export function seedGame({seed=12345,maxRounds=24,difficulty=2}={}){
 const majors={us:[6,7,0],eu:[16,17,18,19],china:[37,31],russia:[15,26,27,28,30,29]};
 const names={us:'United States',eu:'European Coalition',china:'China',russia:'Russia'};
 const countries={};
 for(const id of POWERS) countries[id]={id,name:names[id],color:COLORS[POWERS.indexOf(id)],treasury:28000,debt:5000,gdp:420000,tax:20,stability:75,approval:68,fuel:12000,ammo:12000,materials:3000,spares:1000,supplies:6000,industry:4,projects:[],ledger:[],orders:[],results:[],briefings:[],human:false,profile:{aggression:30,openness:65}};
 const regions=REGIONS.map(r=>{let owner=Object.keys(majors).find(k=>majors[k].includes(r.id));if(!owner){owner=`n${r.id}`;countries[owner]={...structuredClone(countries.us),id:owner,name:r.name==='Egypt'?'Egypt':r.name+' Government',color:COLORS[4+r.id%4],treasury:6000,gdp:48000,debt:1000,industry:1,fuel:3000,ammo:3000,materials:800,profile:{aggression:15+(r.id*17)%60,openness:35+(r.id*11)%50}};}return {...structuredClone(r),owner,infrastructure:70,unrest:10,personnel:POWERS.includes(owner)?18000:6000,tanks:POWERS.includes(owner)?120:20,fighters:POWERS.includes(owner)?12:2,readiness:90};});
 for(const c of Object.values(countries))c.depots=regions.filter(r=>r.owner===c.id).map(r=>r.id);
 for(const id of [26,27,28,30,31,33])regions[id].coastal=false;
 const fleets=POWERS.map(id=>({id:`fleet-${id}-1`,owner:id,name:`${names[id]} First Fleet`,region:({us:6,eu:16,china:37,russia:29})[id],ships:{frigates:2,destroyers:1,transports:1,logistics:1},readiness:90}));
 return {version:2,logistics:true,fleets,messages:[],missions:[],seed,round:1,maxRounds,difficulty,phase:'planning',countries,regions,treaties:[],proposals:[],relations:{},news:[],battles:[],history:[],winner:null};
}

import test from 'node:test';
import assert from 'node:assert/strict';
import {ATLAS,SEA_CONNECTIONS} from '../apps/web/public/atlas.js';
import {atlasSvg,forceLabel,mapPageMarkup} from '../apps/web/public/world-map.js';
import {seedGame,REGIONS} from '../packages/shared/scenario.mjs';
import {view} from '../packages/game-engine/engine.mjs';
test('geographic atlas defines exactly the scenario regions with original valid paths',()=>{
 assert.equal(Object.keys(ATLAS).length,42);
 for(const r of REGIONS){const a=ATLAS[r.id];assert.ok(a.path.startsWith('M'));assert.ok(a.path.endsWith('Z'));assert.ok(a.center[0]>0&&a.center[0]<1200);assert.ok(a.center[1]>0&&a.center[1]<630);assert.deepEqual([r.x,r.y],a.center);}
 for(const [a,b] of SEA_CONNECTIONS){assert.ok(ATLAS[a]);assert.ok(ATLAS[b]);}
});
test('map renders 42 keyboard-selectable territories and only owned exact forces',()=>{
 const g=seedGame();g.countries.us.human=true;g.regions[6].personnel=54321;g.regions[37].personnel=987654;const projection=view(g,'us');const svg=atlasSvg({game:projection,selected:6});
 assert.equal((svg.match(/class="territory /g)??[]).length,42);assert.equal((svg.match(/aria-pressed=/g)??[]).length,42);
 assert.ok(svg.includes('54321 of your personnel'));assert.ok(!svg.includes('987654'));assert.ok(!svg.includes('987,654'));assert.equal(forceLabel(projection.regions[37],'us'),'?');
 assert.ok(svg.includes('unit-tank'));assert.ok(svg.includes('fleet-marker'));assert.ok(svg.includes('World map with 42 interactive'));
});
test('reconnaissance markers show the authorized frozen range, never actual foreign count',()=>{
 const g=seedGame();g.countries.us.intel={37:{low:10000,high:20000,round:1,expires:2,source:'Scouting',confidence:'Medium',controller:'china'}};g.regions[37].personnel=98765;const projection=view(g,'us');
 assert.equal(forceLabel(projection.regions[37],'us'),'10k–20k');const svg=atlasSvg({game:projection,selected:37});assert.ok(svg.includes('10k–20k'));assert.ok(!svg.includes('98765'));
});
test('sea connections, labels, transform and contextual inspector follow view controls',()=>{
 const g=view(seedGame(),'us');const svg=atlasSvg({game:g,selected:3,labels:false,routes:true,zoom:2,pan:{x:-50,y:-70}});
 assert.ok(svg.includes('translate(-50 -70) scale(2)'));assert.ok(svg.includes('class="sea-link"'));assert.ok(!svg.includes('class="territory-name"'));
 const html=mapPageMarkup({game:g,room:{},selected:37,layer:'military',zoom:1,pan:{x:0,y:0},routes:false,labels:true});assert.ok(html.includes('FORCES UNKNOWN'));assert.ok(html.includes('Send reconnaissance'));assert.ok(html.includes('Find territory'));
});

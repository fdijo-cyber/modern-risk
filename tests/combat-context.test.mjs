import test from 'node:test';import assert from 'node:assert/strict';
import {combatContext} from '../packages/simple-engine/combat-context.mjs';
import {seedSimple} from '../packages/simple-engine/index.mjs';
test('combat conditions replay identically and supply shortages reduce effective force',()=>{const g=seedSimple({seed:42});const a=combatContext(g,'us',g.regions[8]);assert.deepEqual(a,combatContext(structuredClone(g),'us',g.regions[8]));g.countries.us.supplies=0;const b=combatContext(g,'us',g.regions[8]);assert.equal(b.multiplier,a.multiplier/2);assert.equal(b.weather,a.weather);});
test('morale, command stability and technology have bounded independent effects',()=>{const g=seedSimple({seed:42});const a=combatContext(g,'us',g.regions[8]);g.countries.us.social=0;g.countries.us.political=0;assert.ok(combatContext(g,'us',g.regions[8]).multiplier<a.multiplier);g.countries.us.research=100;assert.equal(combatContext(g,'us',g.regions[8]).factors.technology,1.2);});

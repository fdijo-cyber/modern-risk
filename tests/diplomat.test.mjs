import test from 'node:test';import assert from 'node:assert/strict';
import {seedSimple,sendOfficial} from '../packages/simple-engine/index.mjs';
import {localDiplomat,replyDiplomat} from '../packages/simple-engine/diplomat.mjs';
test('local diplomacy uses numbers, duration and history instead of one acknowledgment',()=>{
 const g=seedSimple();sendOfficial(g,'us','china','We want a trade agreement for 4 months.');const first=localDiplomat(g,'china','us');assert.ok(first.includes('4-month'));assert.ok(first.includes('$25'));sendOfficial(g,'china','us',first,{automated:true});sendOfficial(g,'us','china','Instead lend us $700 over 8 months.');const counter=localDiplomat(g,'china','us');assert.ok(counter.includes('$700'));assert.ok(counter.includes('$500'));assert.ok(counter.includes('8 months'));assert.notEqual(counter,first);sendOfficial(g,'china','us',counter,{automated:true});sendOfficial(g,'us','china','Yes, I accept those terms.');const follow=localDiplomat(g,'china','us');assert.ok(follow.includes('$500'));assert.ok(follow.includes('previous position'));assert.equal(g.agreements.length,0);
});
test('live AI receives the actual thread and replies conversationally, without executing actions',async()=>{
 const g=seedSimple();sendOfficial(g,'us','china','Would you lend us $700?');sendOfficial(g,'china','us','We can offer $400 over 6 months.',{automated:true});sendOfficial(g,'us','china','Could you extend it to 8 months?');let sent;
 const r=await replyDiplomat(g,'china','us',{env:{OPENAI_API_KEY:'test',OPENAI_MODEL:'test'},fetchImpl:async(url,options)=>{sent=JSON.parse(options.body);return {ok:true,json:async()=>({output:[{type:'message',content:[{type:'output_text',text:'We can extend the $400 offer to eight months, at 10% total interest.'}]}]})};}});
 assert.equal(r.source,'language-model');assert.ok(r.body.includes('$400'));assert.equal(JSON.parse(sent.input).thread.length,3);assert.ok(sent.instructions.includes('Never repeat'));assert.equal(g.countries.us.treasury,1500);assert.equal(g.agreements.length,0);
});
test('an unavailable live provider is explicitly labeled and uses a contextual reply',async()=>{
 const g=seedSimple();sendOfficial(g,'us','china','Can we agree on peace for 3 months?');const r=await replyDiplomat(g,'china','us',{env:{}});assert.equal(r.source,'local-negotiator');assert.ok(r.notice.includes('not configured'));assert.ok(r.body.includes('3-month'));
});

test('accepted counteroffers extract the offered amount and payer rather than a rejected request',async()=>{
 const {extractAgreement}=await import('../packages/simple-engine/planner.mjs');const g=seedSimple();sendOfficial(g,'us','china','Would you lend us $700 over 8 months?');sendOfficial(g,'china','us',localDiplomat(g,'china','us'),{automated:true});sendOfficial(g,'us','china','Yes, I accept those terms.');sendOfficial(g,'china','us',localDiplomat(g,'china','us'),{automated:true});const terms=await extractAgreement(g,'us','china',{env:{}});assert.equal(terms.kind,'loan');assert.equal(terms.amount,500);assert.equal(terms.months,8);assert.equal(terms.from,'china');
});

test('diplomatic context grounds negotiating limits in own capacity without including enemy forces',async()=>{
 const g=seedSimple();g.countries.china.treasury=75;g.countries.china.initiatives=[{title:'Harbor',status:'active',upkeep:12}];sendOfficial(g,'us','china','Fund an experimental cross-border university.');const before=structuredClone(g);let input;
 const r=await replyDiplomat(g,'china','us',{env:{AI_PROVIDER:'gemini',GEMINI_API_KEY:'fixture'},fetchImpl:async(url,options)=>{const body=JSON.parse(options.body);input=JSON.parse(body.contents[0].parts[0].text);return {ok:true,json:async()=>({candidates:[{finishReason:'STOP',content:{parts:[{text:'We support a limited research pilot, subject to an affordable funding agreement. We cannot commit to the full program now.'}]}}]})};}});
 assert.equal(input.ownCapacity.treasury,75);assert.equal(input.ownCapacity.commitments[0].upkeep,12);assert.equal(input.visitor,'United States');assert.ok(!JSON.stringify(input).includes('reserveFormations'));assert.equal(r.source,'language-model');assert.deepEqual(g,before);
});

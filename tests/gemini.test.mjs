import test from 'node:test';import assert from 'node:assert/strict';
import {aiConfigured,aiSettings,modelText} from '../packages/ai-engine/service.mjs';
import {interpretLongDirective} from '../packages/simple-engine/planner.mjs';
import {replyDiplomat} from '../packages/simple-engine/diplomat.mjs';
import {seedSimple,sendOfficial} from '../packages/simple-engine/index.mjs';
const env={AI_PROVIDER:'gemini',GEMINI_API_KEY:'private-test-key'};
const response=text=>({ok:true,json:async()=>({candidates:[{finishReason:'STOP',content:{parts:[{thought:true,text:'hidden reasoning'},{text}]}}]})});
test('Gemini can be selected explicitly or from its key, with a default model; OpenAI remains supported',()=>{
 assert.equal(aiSettings(env).model,'gemini-3.1-flash-lite');assert.equal(aiSettings({GEMINI_API_KEY:'x'}).provider,'gemini');assert.equal(aiConfigured(env),true);assert.equal(aiConfigured({AI_PROVIDER:'gemini',OPENAI_API_KEY:'x',OPENAI_MODEL:'y'}),false);assert.equal(aiConfigured({OPENAI_API_KEY:'x',OPENAI_MODEL:'y'}),true);assert.equal(aiConfigured({AI_PROVIDER:'unknown',GEMINI_API_KEY:'x'}),false);assert.ok(!JSON.stringify(aiSettings(env)).includes('private-test-key'));
});
test('Gemini uses its native endpoint, header-only key, system instruction and JSON output without exposing thoughts',async()=>{
 let payload;const out=await modelText({env,instructions:'Return JSON',input:{fact:42},jsonMode:true,fetchImpl:async(url,opts)=>{assert.equal(url,'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent');assert.equal(opts.headers['x-goog-api-key'],env.GEMINI_API_KEY);assert.ok(!url.includes(env.GEMINI_API_KEY));assert.ok(!opts.body.includes(env.GEMINI_API_KEY));payload=JSON.parse(opts.body);return response('{"ok":true}');}});
 assert.equal(out.text,'{"ok":true}');assert.equal(out.provider,'gemini');assert.equal(payload.systemInstruction.parts[0].text,'Return JSON');assert.equal(payload.generationConfig.responseMimeType,'application/json');assert.equal(JSON.parse(payload.contents[0].parts[0].text).fact,42);
});
test('quota/key/model/network and incomplete responses give safe specific failures without leaking provider bodies',async()=>{
 for(const [status,fragment] of [[429,'Quota'],[403,'key rejected'],[404,'Model not available']]){const r=await modelText({env,input:{},instructions:'Test',fetchImpl:async()=>({ok:false,status,json:async()=>({secret:env.GEMINI_API_KEY})})});assert.equal(r.source,'offline');assert.ok(r.reason.includes(fragment));assert.ok(!JSON.stringify(r).includes(env.GEMINI_API_KEY));}
 const failed=await modelText({env,input:{},instructions:'Test',fetchImpl:async()=>{throw new Error(env.GEMINI_API_KEY);}});assert.ok(!JSON.stringify(failed).includes(env.GEMINI_API_KEY));
 for(const finishReason of ['MAX_TOKENS','SAFETY']){const r=await modelText({env,input:{},instructions:'Test',fetchImpl:async()=>({ok:true,json:async()=>({candidates:[{finishReason,content:{parts:[{text:'incomplete'}]}}]})})});assert.equal(r.text,null);}
});
test('Gemini powers both narrative directive interpretation and diplomatic conversation through the shared adapter',async()=>{
 const g=seedSimple(),plan={orders:[{action:'policy',category:'economic',purpose:'Industry investment',budget:100}],assumptions:['Budget $100'],questions:[],conditions:[]};
 const p=await interpretLongDirective(g,'us','Invest in our industry.',{},{env,fetchImpl:async()=>response(JSON.stringify(plan))});assert.equal(p.source,'language-model');assert.equal(p.orders[0].budget,100);
 sendOfficial(g,'us','china','Could we negotiate a four-month trade deal?');const r=await replyDiplomat(g,'china','us',{env,fetchImpl:async()=>response('We can agree in principle to four months without an upfront transfer.')});assert.equal(r.source,'language-model');assert.ok(r.body.includes('four months'));assert.equal(g.agreements.length,0);
});

test('temporary Gemini server failures retry safely, preserve HTTP status and never claim a local outcome',async()=>{
 let calls=0;const r=await modelText({env,input:{},instructions:'Test',retryDelay:async()=>{},fetchImpl:async()=>{calls++;return calls<3?{ok:false,status:503}:response('OK');}});assert.equal(calls,3);assert.equal(r.text,'OK');
 calls=0;const failed=await modelText({env,input:{},instructions:'Test',retryDelay:async()=>{},fetchImpl:async()=>{calls++;return {ok:false,status:503};}});assert.equal(calls,3);assert.ok(failed.reason.includes('HTTP 503'));assert.ok(!failed.reason.includes('Local fallback'));assert.equal(failed.text,null);
});

 test('complex requests can use a longer timeout and incomplete outputs identify a safe reason',async()=>{
 const previous=AbortSignal.timeout;let timeout;AbortSignal.timeout=ms=>{timeout=ms;return previous(ms);};
 try {const out=await modelText({env,input:{},instructions:'Chair',timeoutMs:45000,fetchImpl:async()=>response('OK')});assert.equal(out.text,'OK');assert.equal(timeout,45000);}finally{AbortSignal.timeout=previous;}
 const out=await modelText({env,input:{},instructions:'Chair',fetchImpl:async()=>({ok:true,json:async()=>({candidates:[{finishReason:'MAX_TOKENS'}]})})});assert.match(out.reason,/MAX_TOKENS/);assert.equal(out.text,null);
 });

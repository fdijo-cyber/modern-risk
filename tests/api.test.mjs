import test from 'node:test';import assert from 'node:assert/strict';import {spawn} from 'node:child_process';import {mkdtempSync,rmSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';
test('multiplayer API persists rounds, enforces host and classified views',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'mr-api-'));const child=spawn(process.execPath,['apps/server/server.mjs'],{env:{...process.env,PORT:'0',DB_PATH:join(dir,'db.sqlite')}});let stderr='';child.stderr.on('data',d=>stderr+=d);let base;
 try{base=await new Promise((yes,no)=>{const timeout=setTimeout(()=>no(new Error('Server timeout '+stderr)),10000);child.on('exit',()=>{clearTimeout(timeout);no(new Error('Server exited '+stderr));});child.stdout.on('data',d=>{const m=/http:\/\/[^\s]+/.exec(String(d));if(m){clearTimeout(timeout);yes(m[0]);}});});
 const call=async(path,data,token)=>{const r=await fetch(base+'/api/'+path,{method:data?'POST':'GET',headers:{...(data?{'Content-Type':'application/json'}:{}),...(token?{Authorization:`Bearer ${token}`}:{})},body:data?JSON.stringify(data):undefined});return {status:r.status,body:await r.json()};};
 const a=(await call('create',{name:'A',country:'us',maxRounds:2,ruleset:'legacy'})).body;assert.ok(a.token);const code=a.room.code;
 const solo=(await call('create',{name:'Solo',country:'china',mode:'solo',ruleset:'legacy'})).body;assert.equal(solo.room.status,'active');assert.equal(solo.room.game.countries.filter(c=>c.human).length,1);assert.equal((await call('join',{code:solo.room.code,name:'Intruder',country:'us'})).status,400);
 const b=(await call('join',{code,name:'B',country:'eu'})).body;assert.ok(b.token);
 assert.equal((await call('start',{code},b.token)).status,400);assert.equal((await call('start',{code},a.token)).status,200);
 assert.equal((await call('state?code='+code)).status,400);
 const v=(await call('state?code='+code,null,b.token)).body;assert.equal(v.game.you.id,'eu');assert.equal(v.game.regions[6].personnel,undefined);assert.equal(v.host,false);
 assert.equal((await call('order',{code,order:{action:'recruit',target:6,quantity:1000}},a.token)).status,200);
 const draft=(await call('draft-message',{code,country:'eu',template:'trade',request:'Ask for trade talks'},a.token)).body;assert.equal(draft.order.action,'message');assert.equal((await call('order',{code,order:draft.order},a.token)).status,200);
 const sent=await call('send-message',{code,order:draft.order,requestId:'test-official-0001'},a.token);assert.equal(sent.status,200);assert.equal(sent.body.game.messages.length,1);assert.equal((await call('state?code='+code,null,b.token)).body.game.messages.length,1);assert.equal((await call('send-message',{code,order:draft.order,requestId:'test-official-0001'},a.token)).body.game.messages.length,1);
 const chat=(await call('chat',{code,question:'What is my treasury?'},a.token)).body;assert.ok(chat.text);
 assert.equal((await call('ready',{code,ready:true},a.token)).status,200);assert.equal((await call('ready',{code,ready:true},b.token)).status,200);
 const advanced=await call('advance',{code,round:1},a.token);assert.equal(advanced.status,200);assert.equal(advanced.body.game.round,2);
 assert.equal((await call('advance',{code,round:1},a.token)).status,400);
 assert.equal((await call('state?code='+code,null,a.token)).body.game.you.projects.length,1);
 assert.equal((await call('state?code='+code,null,b.token)).body.game.messages.length,2);
 const page=await fetch(base);assert.equal(page.status,200);assert.ok(page.headers.get('content-security-policy'));
 }finally{child.kill();await new Promise(r=>child.once('exit',r));rmSync(dir,{recursive:true,force:true});}
});

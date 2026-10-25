import {prepareChair,submitChair,lockChairRound,resolveChairRound,respondUltimatum} from '../../packages/simple-engine/chair.mjs';
import {replyDiplomat} from '../../packages/simple-engine/diplomat.mjs';
import {existsSync} from 'node:fs';
import {seedSimple,simpleView,resolveSimple,submitDirective,adjudicateDirective,makeDirective,decideDirective,reviewPlan,sendOfficial,proposeAgreement} from '../../packages/simple-engine/index.mjs';
import {interpretLongDirective,extractAgreement} from '../../packages/simple-engine/planner.mjs';
import {modelText} from '../../packages/ai-engine/service.mjs';
import {parseMessageRequest,deliverMessage} from '../../packages/diplomacy-engine/messages.mjs';
import {draftOfficialMessage,converse,aiConfigured,aiSettings} from '../../packages/ai-engine/service.mjs';
import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve,extname} from 'node:path';
import {randomBytes,createHash,timingSafeEqual} from 'node:crypto';
import {seedGame,POWERS} from '../../packages/shared/scenario.mjs';
import {view,queueOrder,parseDirective,validate,resolveRound} from '../../packages/game-engine/engine.mjs';
import {openStore} from './store.mjs';
if(existsSync('.env'))process.loadEnvFile('.env');
const flag=name=>{const i=process.argv.indexOf(name);return i<0?undefined:process.argv[i+1];};
const bindHost=process.env.HOST??flag('--host')??'127.0.0.1';
const bindPort=Number(process.env.PORT??flag('--port')??3000);
const root=fileURLToPath(new URL('../web/public/',import.meta.url));
const store=openStore(process.env.DB_PATH??resolve('data/modern-risk.sqlite'));
const token=()=>randomBytes(24).toString('base64url');const hash=t=>createHash('sha256').update(t).digest('hex');
const equal=(a,b)=>typeof a==='string'&&a.length===b.length&&timingSafeEqual(Buffer.from(a),Buffer.from(b));
const fail=(ok,msg)=>{if(!ok)throw new Error(msg);};
function finishRound(room){const previous=room.game.round;room.game=room.game.ruleset==='simple'?resolveChairRound(room.game):resolveRound(room.game);room.players.forEach(p=>p.ready=false);room.deadline=room.timer&&room.game.phase==='planning'?Date.now()+room.timer*1000:null;return store.commitRound(room,previous,room.revision);}
function roomView(r,p){return {code:r.code,name:r.name,status:r.status,revision:r.revision,host:p.id===r.host,you:p.id,players:r.players.map(x=>({id:x.id,name:x.name,country:x.country,ready:x.ready})),mode:r.mode??'multiplayer',aiAvailable:aiConfigured(),aiProvider:aiSettings().provider,aiModel:aiSettings().model,maxPlayers:r.maxPlayers,deadline:r.deadline,timer:r.timer,game:r.status==='active'?(r.game.ruleset==='simple'?simpleView(r.game,p.country):view(r.game,p.country)):null};}
const requests=new Map();
async function body(req){let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>100000)throw new Error('Request too large');}try{return JSON.parse(raw||'{}');}catch{throw new Error('Invalid JSON');}}
export const server=http.createServer(async(req,res)=>{
 res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','same-origin');res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
 const send=(status,obj)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(obj));};
 try{
  const url=new URL(req.url,'http://localhost');
  if(url.pathname==='/health')return send(200,{ok:true});
  if(url.pathname.startsWith('/api/')){
   const ip=req.socket.remoteAddress;let rate=requests.get(ip);if(!rate||rate.until<Date.now()){rate={n:0,until:Date.now()+60000};requests.set(ip,rate);}fail(++rate.n<300,'Rate limit exceeded; retry shortly');
   if(req.method==='POST'&&req.headers.origin)fail(new URL(req.headers.origin).host===req.headers.host,'Cross-origin write rejected');
   const data=req.method==='POST'?await body(req):{};
   if(url.pathname==='/api/create'&&req.method==='POST'){
    fail(typeof data.name==='string'&&data.name.trim().length>0&&data.name.length<=40,'Enter a name (1–40 characters)');
    fail(POWERS.includes(data.country),'Select a starting power');
    const mode=data.mode??'multiplayer';fail(['solo','multiplayer'].includes(mode),'Choose solo or multiplayer');
    const maxPlayers=mode==='solo'?1:Number(data.maxPlayers??4),timer=Number(data.timer??3600),maxRounds=Number(data.maxRounds??24),difficulty=Number(data.difficulty??2);
    fail((mode==='solo'?maxPlayers===1:[2,3,4].includes(maxPlayers))&&[0,60,180,300,600,3600].includes(timer)&&Number.isInteger(maxRounds)&&maxRounds>=2&&maxRounds<=120&&Number.isInteger(difficulty)&&difficulty>=1&&difficulty<=5,'Invalid room configuration');
    const code=randomBytes(5).toString('hex').toUpperCase(),secret=token(),id=token();
    const room={code,name:String(data.roomName||'World in motion').slice(0,60),host:id,mode,maxPlayers,timer,deadline:null,status:'lobby',players:[{id,name:data.name.trim(),country:data.country,tokenHash:hash(secret),ready:false}],game:(data.ruleset==='legacy'?seedGame:seedSimple)({seed:randomBytes(4).readUInt32LE(),maxRounds,difficulty})};if(mode==='solo'){room.status='active';room.game.countries[data.country].human=true;room.deadline=timer?Date.now()+timer*1000:null;}store.save(room);return send(201,{token:secret,room:roomView(room,room.players[0])});
   }
   if(url.pathname==='/api/join'&&req.method==='POST'){
    const room=store.load(String(data.code).toUpperCase());fail(room,'Room not found');fail(room.mode!=='solo','Solo matches do not accept other players');fail(room.status==='lobby','Match has started');fail(room.players.length<room.maxPlayers,'Room is full');fail(POWERS.includes(data.country)&&!room.players.some(p=>p.country===data.country),'Government already claimed');fail(typeof data.name==='string'&&data.name.trim().length>0&&data.name.length<=40,'Enter a name (1–40 characters)');
    const secret=token(),p={id:token(),name:data.name.trim(),country:data.country,tokenHash:hash(secret),ready:false};room.players.push(p);store.save(room,room.revision);return send(200,{token:secret,room:roomView(room,p)});
   }
   const code=(url.searchParams.get('code')??data.code??'').toUpperCase();let room=store.load(code);fail(room,'Room not found');
   const auth=req.headers.authorization?.replace(/^Bearer /,'')??'';const p=room.players.find(x=>equal(x.tokenHash,hash(auth)));fail(p,'Session invalid; use your saved session');
   if(url.pathname==='/api/state'&&req.method==='GET'){if(url.searchParams.get('revision')===String(room.revision)){res.writeHead(204,{'Cache-Control':'no-store'});return res.end();}return send(200,roomView(room,p));}
   fail(req.method==='POST','Method not supported');
   if(url.pathname.startsWith('/api/simple/')){
    fail(room.status==='active'&&room.game.ruleset==='simple','Start a new simplified match to use the new directive workflow');
    const country=p.country;const active=()=>{fail(room.game.phase==='planning','Planning is closed');fail(!room.players.find(x=>x.id===p.id).ready,'Unsubmit before making changes');};
    const endpoint=url.pathname.slice('/api/simple/'.length);
    if(endpoint==='history'){const planned=await prepareChair(room.game,country,'Explain '+String(data.question??''));return send(200,{answer:planned.answer,room:roomView(room,p)});}
    if(endpoint==='submit'||endpoint==='interpret'){
     active();room.directiveReceipts??={};const receiptKey=p.id+':'+data.requestId;if(data.requestId&&room.directiveReceipts[receiptKey])return send(200,{directive:room.game.countries[country].directives.find(d=>d.id===room.directiveReceipts[receiptKey]),room:roomView(room,p)});const expectedRound=room.game.round;if(room.mode!=='solo')lockChairRound(room.game);const planned=await prepareChair(room.game.chairRound?.snapshot??room.game,country,data.text,{region:data.region});
     room=store.load(code);active();fail(room.game.round===expectedRound,'Month changed during analysis. Nothing was executed; submit in the new month');
     room.directiveReceipts??={};if(data.requestId&&room.directiveReceipts[receiptKey])return send(200,{directive:room.game.countries[country].directives.find(d=>d.id===room.directiveReceipts[receiptKey]),room:roomView(room,p)});if(room.mode!=='solo')lockChairRound(room.game);const settled=submitChair(room.game,country,data.text,planned,{sealed:room.mode!=='solo'});room.game=settled.game;const directive=settled.directive;if(data.requestId&&directive.id!=='history')room.directiveReceipts[receiptKey]=directive.id;store.save(room,room.revision);return send(200,{directive,room:roomView(room,p)});
    }
    if(endpoint==='edit'){
     active();const d=room.game.countries[country].directives.find(d=>d.id===data.id);fail(d&&['review','awaiting_bank','clarification'].includes(d.status)&&d.round===room.game.round,'This directive cannot be edited');
     const plan=reviewPlan(room.game,country,data.orders);Object.assign(d,plan,{status:'review',questions:[],assumptions:[...d.assumptions,'Interpretation manually edited by the president.']});
    }else if(endpoint==='decide'){active();decideDirective(room.game,country,data.id,data.decision);}
    else if(endpoint==='message'){
     active();fail(room.game.countries[data.country]&&data.country!==country,'Choose a foreign government');fail(typeof data.requestId==='string'&&data.requestId.length>=8&&data.requestId.length<=80,'Invalid request ID');
     room.messageReceipts??={};const key=p.id+':'+data.requestId;if(room.messageReceipts[key])return send(200,roomView(room,p));
     const c=room.game.countries[country];const reserved=c.directives.filter(d=>d.status==='funded').reduce((n,d)=>n+d.cost.money,0);fail(c.treasury-reserved>=5,'Message costs $5; available money is reserved or insufficient');
     const message=sendOfficial(room.game,country,data.country,data.body);c.treasury-=5;c.ledger.push({round:room.game.round,amount:-5,reason:'Official communication',balance:c.treasury});room.messageReceipts[key]=message.id;store.save(room,room.revision);
     if(!room.game.countries[data.country].human){
      const response=await replyDiplomat(room.game,data.country,country);
      room=store.load(code);const newer=room.game.messages.some(m=>m.from===country&&m.to===data.country&&m.id!==message.id&&room.game.messages.indexOf(m)>room.game.messages.findIndex(x=>x.id===message.id));
      if(!newer&&!room.game.messages.some(m=>m.replyTo===message.id))Object.assign(sendOfficial(room.game,data.country,country,response.body,{automated:true,replyTo:message.id}),{source:response.source,notice:response.notice});store.save(room,room.revision);
     }
     return send(200,roomView(room,p));
    }else if(endpoint==='extract-agreement'){
     active();fail(room.game.countries[data.country]&&data.country!==country,'Choose a recipient');const expectedRound=room.game.round,terms=await extractAgreement(room.game,country,data.country);room=store.load(code);active();fail(room.game.round===expectedRound,'Month changed; re-extract the agreement');
     const settled=adjudicateDirective(room.game,country,{text:'Diplomatic agreement: '+(terms.summary??terms.kind),orders:[{action:'treaty',country:data.country,...terms}],assumptions:['Submitted from the conversation; counterpart consent remains required.']});room.game=settled.game;store.save(room,room.revision);return send(200,{directive:settled.directive,room:roomView(room,p)});
    }else if(endpoint==='respond-ultimatum'){active();room.game=respondUltimatum(room.game,country,data.id,data.decision,{sealed:room.mode!=='solo'});
    }else if(endpoint==='respond-agreement'){
     active();const a=room.game.agreements.find(a=>a.id===data.id&&a.parties.includes(country)&&['offered','counteroffer'].includes(a.status));fail(a,'Agreement unavailable');
     if(data.decision==='reject'){a.status='rejected';a.responseReason='Declined by '+room.game.countries[country].name;sendOfficial(room.game,country,a.parties.find(id=>id!==country),'We reject '+a.title+'.');}
     else if(data.decision==='counter'){const amount=Number(data.amount),months=Number(data.months);fail(Number.isSafeInteger(amount)&&amount>=0&&amount<=1000&&Number.isSafeInteger(months)&&months>=1&&months<=12,'Invalid counteroffer');a.status='rejected';const settled=adjudicateDirective(room.game,country,{text:'Counteroffer to '+a.title,orders:[{action:'treaty',country:a.parties.find(id=>id!==country),kind:a.counterTerms?.kind??a.terms.kind,from:a.terms.from,amount,months}]});room.game=settled.game;}
     else if(data.decision==='accept'){
      fail(a.status==='counteroffer'||!a.consent.includes(country),'You have already consented; the other government must respond');
      if(a.status==='counteroffer'){const settled=adjudicateDirective(room.game,country,{text:'Accept diplomatic counteroffer',orders:[{action:'treaty',country:a.parties.find(id=>id!==country),...a.counterTerms}]});room.game=settled.game;room.game.agreements.find(x=>x.id===a.id).status='superseded';}
      else{const settled=adjudicateDirective(room.game,country,{text:'Accept '+a.title,orders:[{action:'agreement',agreement:a.id}]});room.game=settled.game;}
     }else throw new Error('Choose accept, reject or counter');
    }else if(endpoint==='review-agreement'){
     active();const a=room.game.agreements.find(a=>a.id===data.id&&a.parties.includes(country)&&a.status==='offered');fail(a,'Agreement unavailable');
     const existing=room.game.countries[country].directives.find(d=>d.round===room.game.round&&d.status==='funded'&&d.orders.some(o=>o.action==='agreement'&&o.agreement===a.id));if(existing)return send(200,roomView(room,p));
     const settled=adjudicateDirective(room.game,country,{text:'Accept '+a.title,orders:[{action:'agreement',agreement:a.id}]});room.game=settled.game;
    }else throw new Error('Unknown simplified endpoint');
    store.save(room,room.revision);return send(200,roomView(room,p));
   }
   if(room.game.ruleset==='simple'&&['/api/order','/api/interpret','/api/send-message','/api/draft-message','/api/cancel','/api/chat'].includes(url.pathname))throw new Error('Use the Presidential Office directive workflow in simplified matches');
   if(url.pathname==='/api/draft-message'){
    fail(room.status==='active'&&room.game.phase==='planning','Planning unavailable');
    fail(!p.ready,'Unsubmit before drafting directives');const recipient=room.game.countries[data.country];fail(recipient&&data.country!==p.country,'Select a foreign recipient');
    const draft=await draftOfficialMessage({sender:room.game.countries[p.country].name,recipient:recipient.name,request:data.request,template:data.template??'general'});
    return send(200,{order:{action:'message',country:data.country,...draft,replyTo:data.replyTo??null}});
   }
   if(url.pathname==='/api/chat'){
    fail(room.status==='active','Start a match first');const country=room.game.countries[p.country];const target=data.target??'adviser';const history=(country.chat??[]).filter(h=>h.target===target);
    const answer=await converse({projection:view(room.game,p.country),target,question:data.question,history});
    // The provider wait must never overwrite a round or order committed meanwhile.
    const latest=store.load(code),national=latest.game.countries[p.country];national.chat??=[];national.chat.push({target,role:'user',text:data.question,round:latest.game.round},{target,role:'assistant',text:answer.text,source:answer.source,round:latest.game.round});national.chat=national.chat.slice(-80);store.save(latest,latest.revision);
    return send(200,{...answer,chat:national.chat});
   }
   if(url.pathname==='/api/start'){fail(p.id===room.host,'Host only');fail(room.status==='lobby','Already started');fail(room.players.length>=2||data.practice===true,'Join at least two human players or start practice');room.status='active';for(const player of room.players)room.game.countries[player.country].human=true;if(room.game.ruleset==='simple')lockChairRound(room.game);room.deadline=room.timer?Date.now()+room.timer*1000:null;}
   else{
    fail(room.status==='active'&&room.game.phase==='planning','Planning unavailable');
    if(url.pathname==='/api/advance'){fail(p.id===room.host,'Host only');fail(data.round===room.game.round,'Round already advanced; refresh');fail(room.players.every(x=>x.ready),'All players must submit directives');room=finishRound(room);return send(200,roomView(room,p));}
    else if(url.pathname==='/api/send-message'){
     fail(!p.ready,'Unsubmit before sending a directive');const order=validate(room.game,p.country,data.order,room.game.countries[p.country].orders);fail(order.action==='message','Only official messages can be sent immediately');
     fail(typeof data.requestId==='string'&&/^[a-zA-Z0-9-]{8,80}$/.test(data.requestId),'Invalid message request ID');
     room.messageReceipts??={};const receiptKey=p.id+':'+data.requestId;
     if(!room.messageReceipts[receiptKey]){
      const c=room.game.countries[p.country];c.immediateResults??=[];
      fail((room.game.messages??[]).filter(m=>m.from===p.country&&m.round===room.game.round&&!m.automated).length<10,'Maximum 10 official messages per month');
      c.orderSerial=(c.orderSerial??0)+1;order.id=`${room.game.round}-${p.country}-${c.orderSerial}`;order.cid=p.country;
      deliverMessage(room.game,order,(country,o,status,reason)=>{country.immediateResults??=[];country.immediateResults.push({id:o.id,action:'message',status,reason});});
      room.messageReceipts[receiptKey]=order.id;
     }
    }
    else if(url.pathname==='/api/ready'){p.ready=!!data.ready;}
    else{fail(!p.ready,'Unsubmit before editing orders');const c=room.game.countries[p.country];
     if(url.pathname==='/api/interpret'){let order=parseMessageRequest(room.game,p.country,data.text)??parseDirective(data.text);if(order.action==='message')order={...order,...await draftOfficialMessage({sender:room.game.countries[p.country].name,recipient:room.game.countries[order.country].name,request:order.request,template:order.template})};return send(200,{order:validate(room.game,p.country,order,c.orders)});}
     else if(url.pathname==='/api/order')queueOrder(room.game,p.country,data.order);
     else if(url.pathname==='/api/cancel'){fail(c.orders.some(o=>o.id===data.id),'Order not found');c.orders=c.orders.filter(o=>o.id!==data.id);}
     else throw new Error('Unknown endpoint');
    }
   }
   store.save(room,room.revision);return send(200,roomView(room,p));
  }
  fail(req.method==='GET','Method not supported');
  const path=url.pathname==='/'?'index.html':decodeURIComponent(url.pathname).slice(1);const full=resolve(root,path);fail(full.startsWith(root),'Invalid path');
  const content=await readFile(full);res.writeHead(200,{'Content-Type':({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml'})[extname(full)]??'application/octet-stream'});res.end(content);
 }catch(e){send(400,{error:e.message});}
});
// Persisted deadline is recovered on restart. A single writer plus unique SQL key
// commits the game snapshot and resolution record atomically.
const ticker=setInterval(()=>{for(const room of store.list())if(room.status==='active'&&room.game.phase==='planning'&&room.deadline&&room.deadline<=Date.now())try{finishRound(room);}catch(e){console.error('Round failed:',room.code,e.message);}},1000);ticker.unref();
server.listen(bindPort,bindHost,()=>console.log(`MODERN RISK ready on http://${bindHost}:${server.address().port}`));

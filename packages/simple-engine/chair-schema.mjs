// A single structured-output contract for the Gemini Crisis Chair.
// Numerical/game-rule validation remains in validateChairPlan; this schema guides
// generation and does not authorize effects or bypass resource accounting.
const S={type:'STRING'}, I={type:'INTEGER'}, N={type:'NUMBER'};
const array=items=>({type:'ARRAY',items});
const unitProperties=Object.fromEntries(['infantry','tanks','fighters','bombers','navy','special'].map(k=>[k,I]));
const orderProperties={
 action:S,origin:I,target:I,country:S,units:{type:'OBJECT',properties:unitProperties},
 budget:I,amount:I,category:S,purpose:S,title:S,intent:S,
 duration:I,lifetime:I,upkeep:I,risk:I,visibility:{type:'STRING',enum:['public','secret']},
 effects:array({type:'OBJECT',properties:{stat:S,value:N},required:['stat','value']}),
 strategy:S,months:I,body:S,demand:S,building:S,unit:S,quantity:I,
 terrain:S,method:S,from:S,kind:S
};
export const chairResponseSchema={
 type:'OBJECT',
 properties:{
  kind:{type:'STRING',enum:['directive','question']},
  analysis:S,
  answer:S,
  assumptions:array(S),
  objectives:array({type:'OBJECT',properties:{
   id:S,title:S,dependsOn:array(S),
   when:{type:'OBJECT',properties:{objective:S,outcome:{type:'STRING',enum:['accepted','refused','successful','partial','unsuccessful','continuing']}},required:['objective','outcome']},
   order:{type:'OBJECT',properties:orderProperties,required:['action']}
  },required:['id','title','order']})
 },
 required:['kind','analysis']
};

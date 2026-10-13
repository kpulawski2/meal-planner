import test,{mock} from 'node:test';
import assert from 'node:assert/strict';
import {once} from 'node:events';
const recipe={id:'known-curry',name:'Chicken Curry',category:'Dinner',nutrition:{kcal:450,p:40,c:50,f:8},ingredients:[['Chicken breast',150,'g'],['Rice',50,'g']],servings:1,minutes:20,equipment:['Hob'],steps:['Cook the measured ingredients thoroughly.']};
test('chat uses protected text-model grounding and shared free allowance; malformed providers and unsafe topics stay local',async t=>{
 process.env.PORT='0';process.env.GROQ_API_KEY='test-only';const nativeFetch=globalThis.fetch;let clock=Date.now(),bad=false;const calls=[];
 mock.method(Date,'now',()=>clock);
 mock.method(globalThis,'fetch',async(url,options)=>{
  if(!String(url).includes('api.groq.com'))return nativeFetch(url,options);
  const body=JSON.parse(options.body);calls.push(body);
  return new Response(JSON.stringify({choices:[{message:{content:bad?'invalid JSON':JSON.stringify({answer:'This measured curry is a practical option for your request. Would you like a lighter variation?',recipeIds:['known-curry'],followUps:['Make it lower fat']})}}]}),{status:200});
 });
 const {httpServer}=await import('./server.js');if(!httpServer.listening)await once(httpServer,'listening');t.after(async()=>{httpServer.closeAllConnections();await new Promise(resolve=>httpServer.close(resolve));mock.restoreAll();});
 const base='http://127.0.0.1:'+httpServer.address().port;
 const post=(body,origin=base)=>nativeFetch(base+'/api/kitchen/chat',{method:'POST',headers:{'Content-Type':'application/json',...(origin?{Origin:origin}:{})},body:JSON.stringify(body)});
 const body={text:'Find high-protein chicken dinners',focus:{},recipes:[recipe],history:[{role:'user',text:'I like chicken curry'}],context:{equipment:['Hob'],targets:'1600 kcal max',foodLog:'private'},personalNotes:'private'};
 assert.equal((await post(body,null)).status,401);assert.equal((await post(body,'https://another.example')).status,403);
 const first=await post(body);assert.equal(first.status,200);const data=await first.json();assert.equal(data.source,'ai');assert.deepEqual(data.recipeIds,['known-curry']);assert.equal(calls[0].model,'openai/gpt-oss-20b');assert.equal(calls[0].max_completion_tokens,1000);
 const sent=calls[0].messages[1].content.map(part=>part.text).join('');assert.match(sent,/known-curry/);assert.match(sent,/I like chicken curry/);assert.doesNotMatch(sent,/private|personalNotes|foodLog/);
 const next=await post({...body,text:'Make it lower fat',focus:data.focus});assert.equal((await next.json()).source,'local');assert.equal(calls.length,1,'The shared minute allowance prevents extra provider calls.');
 clock+=61000;bad=true;const malformed=await post(body);assert.equal((await malformed.json()).source,'local');assert.equal(calls.length,2);
 clock+=61000;const safety=await post({...body,text:'How long can I keep rice in the fridge?'});assert.equal((await safety.json()).kind,'storage');assert.equal(calls.length,2);
 const invalid=await post({...body,recipes:[{...recipe,nutrition:{kcal:null}}]});assert.equal(invalid.status,400);assert.equal(calls.length,2);
 assert.equal((await nativeFetch(base+'/health')).status,200);
});

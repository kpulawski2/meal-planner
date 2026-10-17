import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';

test('standalone meal endpoint returns sourced whole-pack options, validates requests and leaves health responsive',async t=>{
  process.env.PORT='0';const {httpServer}=await import('./server.js');
  t.after(async()=>{httpServer.closeAllConnections();await new Promise(resolve=>httpServer.close(resolve));});
  if(!httpServer.listening)await once(httpServer,'listening');const base='http://127.0.0.1:'+httpServer.address().port;
  const body={store:'Aldi',budget:10,people:1,category:'Dinner',recipes:[{id:'fixture-wrap',name:'Fixture cottage dinner wrap',cat:'Dinner',servings:1,ings:[['Wholemeal wrap',1,'pieces'],['Cottage cheese',150,'g']],cookTime:5,nutrition:{kcal:300,p:20,c:30,f:5,complete:true}}]};
  const send=data=>fetch(base+'/api/meals/one-off',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
  const [response,health]=await Promise.all([send(body),fetch(base+'/health')]);assert.equal(health.status,200);assert.equal(response.status,200);
  const result=await response.json();assert.equal(result.options[0].totalCostGBP,1.84);assert.equal(result.options[0].estimatedPrice,true);
  assert.equal(result.store,'Aldi');assert.equal(result.brief.people,1);assert.equal(result.brief.budget,10);
  assert.ok(result.options[0].recommendations.every(row=>row.plan.products.every(product=>product.sourceStore==='Aldi'&&product.sourceDate)));
  for(const patch of [{budget:-1},{people:0},{store:'Unknown'},{recipes:[]}]){const bad=await send({...body,...patch});assert.equal(bad.status,400);assert.equal(typeof(await bad.json()).error,'string');}
});

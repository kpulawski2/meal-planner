import test from 'node:test';
import assert from 'node:assert/strict';
import '../public/app-experience-core.js';
import '../public/recipe-discovery-core.js';
const Core=globalThis.AppExperienceCore,Discovery=globalThis.RecipeDiscoveryCore;
const row=(id,name,nutrition={},cookTime=null)=>({id,name,cat:'Lunch',nutrition,cookTime,ings:[['Tuna',100,'g'],['Pickled gherkins',40,'g'],['Mayonnaise',5,'g'],['Wholemeal wrap',60,'g']]});
test('appearance and day preferences are bounded and selection works across two weeks without mutating meals',()=>{
 const value={theme:'unexpected',recipeSort:'invalid',homeDay:'x'.repeat(1000),planView:'all'};
 assert.equal(Core.preferences(value).theme,'system');assert.equal(Core.preferences(value).homeDay.length,100);assert.equal(Core.preferences(value).recipeSort,'recommended');assert.equal(Core.preferences(value).planView,'all');
 const week=[{day:'Monday',meals:['a']},{day:'Tuesday (Week 2)',meals:['b']}],before=structuredClone(week);
 assert.equal(Core.selectedDay(week,'Tuesday (Week 2)','Monday').day,'Tuesday (Week 2)');assert.equal(Core.selectedDay(week,'missing','Monday').day,'Monday');assert.equal(Core.selectedDay([],null,'Monday'),null);assert.deepEqual(week,before);
 assert.equal(Core.format(null,true),'—');assert.equal(Core.format(42,false),'—');assert.equal(Core.format(0,true),'0');
});
test('multi-word recipe searches match across titles and ingredients and understand mayo/pickle aliases',()=>{
 const wrap=row('wrap','Tuna, Egg & Mayo Wrap');assert.equal(Discovery.matches(wrap,'tuna pickles wrap'),true);assert.equal(Discovery.matches(wrap,'mayonnaise tuna'),true);assert.equal(Discovery.matches(wrap,'Chicken tuna'),false);assert.equal(Discovery.matches({...wrap,name:'Café recipe'},'cafe recipe'),true);assert.equal(Discovery.matches(wrap,''),true);
});
test('numeric recipe sorting keeps missing and partial estimates last, supports verified zero and leaves the library unchanged',()=>{
 const rows=[row('missing','Missing',{kcal:null,p:null,complete:false}),row('partial','Partial',{kcal:50,p:100,complete:false},null),row('low','Low',{kcal:0,p:0,complete:true},0),row('high','High',{kcal:500,p:60,complete:true},12)],before=structuredClone(rows);
 assert.deepEqual(Discovery.sort(rows,{mode:'protein'}).map(r=>r.id),['high','low','missing','partial']);
 assert.deepEqual(Discovery.sort(rows,{mode:'calories'}).map(r=>r.id),['low','high','missing','partial']);
 assert.deepEqual(Discovery.sort(rows,{mode:'time'}).map(r=>r.id),['low','high','missing','partial']);assert.deepEqual(rows,before);
});
test('recommended sorting favours suitable and saved recipes, while picking respects the current eligible results',()=>{
 const rows=[row('skipped','Skipped'),row('ready','Ready'),row('saved','Saved')],ready=r=>r.id!=='skipped';
 assert.deepEqual(Discovery.sort(rows,{ready,favorites:['saved']}).map(r=>r.id),['saved','ready','skipped']);
 assert.equal(Discovery.pick(rows,ready,'ready',()=>0).id,'saved');assert.equal(Discovery.pick([rows[0]],ready),null);assert.equal(Discovery.pick([rows[1]],ready,'ready').id,'ready');
});

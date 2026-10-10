import test from 'node:test';
import assert from 'node:assert/strict';
import '../public/budget-core.js';
const core=globalThis.MealBudgetCore;
const recipe={id:'tub',name:'Frozen yoghurt',servings:2,fixedBatch:true,ings:[['Skyr yoghurt',240,'g'],['Skimmed milk',180,'ml']]};
const shopping=(servings,pantry=[])=>core.buildShopping({recipes:[recipe],week:servings.map((_,index)=>({day:String(index),meals:['tub']})),mealServings:Object.fromEntries(servings.map((count,index)=>[String(index)+'::0',count])),pantry});
test('one consumed serving costs a full tub and labels its frozen extra serving',()=>{
 const rows=shopping([1]);assert.equal(rows['skyr yoghurt'].groups.mass.need,240);assert.equal(rows['skimmed milk'].groups.volume.need,180);
 assert.match(rows['skyr yoghurt'].quantityNotes.join(' '),/1 extra serving kept frozen/);
});
test('two servings across separate days share a single tub; three buy two tubs',()=>{
 assert.equal(shopping([1,1])['skyr yoghurt'].groups.mass.need,240);
 assert.equal(shopping([1,1,1])['skyr yoghurt'].groups.mass.need,480);
 assert.equal(shopping([.5,.5,1])['skyr yoghurt'].groups.mass.need,240);
});
test('pantry is deducted once after full tub rounding',()=>{
 const rows=shopping([1,1,1],[{name:'Skyr yoghurt',qty:100,unit:'g'},{name:'Skimmed milk',qty:.1,unit:'l'}]);
 assert.equal(rows['skyr yoghurt'].groups.mass.remaining,380);assert.equal(rows['skimmed milk'].groups.volume.remaining,260);
});
test('ordinary recipes still scale directly to consumed portions',()=>{
 const rows=core.buildShopping({recipes:[{...recipe,fixedBatch:false}],week:[{day:'Monday',meals:['tub']}],mealServings:{'Monday::0':1}});
 assert.equal(rows['skyr yoghurt'].groups.mass.need,120);
});

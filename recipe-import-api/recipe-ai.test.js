import test from 'node:test';
import assert from 'node:assert/strict';
import { parseAiRecipe, buildRecipeMaterial } from './recipe-ai.js';
const base={outputLanguage:'en',sourceLanguage:'pl',name:'Chicken and Potato Soup',category:'Lunch',servings:2,prepMinutes:null,cookMinutes:20,caloriesPerServing:null,proteinGramsPerServing:null,estimatedCostPerServing:null,ingredients:[{name:'Chicken breast',quantity:300,unit:'g',notes:'Raw weight'},{name:'Potato',quantity:150,unit:'g',notes:''}],steps:['Dice the potatoes.','Cook the chicken and potatoes through.'],confidence:'medium',warnings:[]};
const generated = result => ({ generate: async () => JSON.stringify(result) });

test('English extraction combines foreign speech, captions and frames without changing the output language',async()=>{
 let request;const sourceText='Składniki: 300 g piersi z kurczaka, 150 g ziemniaków. Pokrój ziemniaki.';
 const result=await parseAiRecipe({sourceText,sourceLanguage:'pl'}, {frameImages:['frame-a','frame-b'],generate:async value=>{request=value;return JSON.stringify(base);}});
 assert.match(request.system,/Translate every ingredient name/);assert.match(request.system,/comma decimal/);assert.match(request.system,/untrusted data/);
 assert.match(request.userText,/Składniki/);assert.deepEqual(request.frameImages,['frame-a','frame-b']);
 assert.equal(result.outputLanguage,'en');assert.equal(result.sourceLanguage,'pl');assert.equal(result.sourceLanguageBasis,'selected');
 assert.equal(result.ingredients[0].name,'Chicken breast');assert.equal(result.ingredients[0].quantity,300);
});
test('automatic source-language detection retains unknown language and uncertain quantities',async()=>{
 const result=await parseAiRecipe({sourceText:'Some oil; the spoken number is unclear.'},generated({...base,sourceLanguage:null,servings:null,ingredients:[{name:'Cooking oil',quantity:null,unit:'unknown',notes:'The amount was unclear in the source.'}]}));
 assert.equal(result.sourceLanguage,null);assert.equal(result.sourceLanguageBasis,'unknown');assert.equal(result.servings,null);
 assert.equal(result.ingredients[0].quantity,null);assert.equal(result.caloriesPerServing,null);assert.match(result.warnings.join(' '),/Confirm|unclear/);
});
test('a translated cooked-weight note stays distinct from a raw or dry ingredient',async()=>{
 const result=await parseAiRecipe({sourceText:'100 g ugotowanego ryżu'},generated({...base,ingredients:[{name:'Rice',quantity:100,unit:'g',notes:'Cooked weight'},{name:'Chicken breast',quantity:200,unit:'g',notes:'Cook thoroughly before serving.'}]}));
 assert.equal(result.ingredients[0].name,'Cooked Rice');assert.equal(result.ingredients[0].quantity,100);assert.equal(result.ingredients[1].name,'Chicken breast');
});
test('structured translation preserves every original fact even when the model changes numbers',async()=>{
 const sourceRecipe={...base,name:'Zupa',outputLanguage:undefined,ingredients:base.ingredients.map(row=>({...row,quantity:row.quantity===300?250:null})),totalMinutes:35};
 const translated={...base,sourceLanguage:'ro',servings:99,cookMinutes:999,caloriesPerServing:999,ingredients:base.ingredients.map((row,index)=>({...row,sourceIndex:index,quantity:900,unit:'kg'}))};
 const result=await parseAiRecipe({sourceRecipe,sourceLanguage:'ro'},generated(translated));
 assert.equal(result.servings,2);assert.equal(result.cookMinutes,20);assert.equal(result.totalMinutes,35);assert.equal(result.caloriesPerServing,null);
 assert.deepEqual(result.ingredients.map(row=>[row.quantity,row.unit]),[[250,'g'],[null,'g']]);assert.equal(result.steps.length,2);
});
test('translation rejects dropped, merged or reordered source ingredients and missing steps',async()=>{
 for(const patch of [{ingredients:[{...base.ingredients[0],sourceIndex:0}]},{ingredients:base.ingredients.map((row,index)=>({...row,sourceIndex:1-index}))},{ingredients:base.ingredients.map(row=>({...row,sourceIndex:0}))},{steps:['Only one step.']}]){
  await assert.rejects(parseAiRecipe({sourceRecipe:base,sourceLanguage:'pl'},generated({...base,ingredients:base.ingredients.map((row,index)=>({...row,sourceIndex:index})),...patch})),/preserve every/);
 }
});
test('malformed or explicitly non-English output never reports a successful English import',async()=>{
 for(const raw of ['not-json','null',JSON.stringify({...base,outputLanguage:'ro'}),JSON.stringify({...base,outputLanguage:undefined})])await assert.rejects(parseAiRecipe({}, {generate:async()=>raw}),/English recipe/);
});
test('large source evidence remains valid JSON with both its start and end and a review warning',async()=>{
 let request;const result=await parseAiRecipe({sourceText:'START INGREDIENTS '+'.'.repeat(20000)+' END METHOD'}, {frameImages:['frame'],generate:async value=>{request=value;return JSON.stringify(base);}});
 const json=JSON.parse(request.userText.slice(request.userText.indexOf('{')));assert.match(json.sourceText,/START INGREDIENTS/);assert.match(json.sourceText,/END METHOD/);
 assert.equal(json.sourceTextShortened,true);assert.ok(json.sourceText.length<4400);assert.match(result.warnings.join(' '),/complete original/);
 assert.throws(()=>buildRecipeMaterial({sourceRecipe:{notes:'x'.repeat(13000)}}),/too long/);
});
test('oversized extracted recipes are rejected instead of silently losing ingredients or steps',async()=>{
 await assert.rejects(parseAiRecipe({},generated({...base,ingredients:Array.from({length:81},()=>base.ingredients[0])})),/no details are dropped/);
 await assert.rejects(parseAiRecipe({},generated({...base,steps:Array(51).fill('A step.')})),/no details are dropped/);
});
test('source language input accepts only supported hints and automatic detection',()=>{
 const core=globalThis.RecipeLanguageCore;assert.equal(core.source(), 'auto');assert.equal(core.source('ro'),'ro');assert.equal(core.label('pl'),'Polish');
 for(const bad of ['zz','ro;do something',{},1])assert.throws(()=>core.source(bad),/source language/);
 assert.equal(core.needsTranslation('pl'),true);assert.equal(core.needsTranslation('en'),false);
});

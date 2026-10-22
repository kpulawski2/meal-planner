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

test('legacy daily and weekly selections migrate to one planned day with weekly choice taking precedence',()=>{
 const old={homeDay:'Wednesday',planDay:'Thursday',theme:'dark'},before=structuredClone(old);
 const preferences=Core.preferences(old);
 assert.equal(preferences.plannedDay,'Thursday');assert.equal(preferences.homeDay,'Thursday');assert.equal(preferences.planDay,'Thursday');assert.deepEqual(old,before);
 assert.equal(Core.preferences({homeDay:'Thursday'}).plannedDay,'Thursday');
 assert.equal(Core.preferences({plannedDay:'Tuesday (Week 2)',planDay:'Thursday',homeDay:'Wednesday'}).plannedDay,'Tuesday (Week 2)');
 assert.equal(Core.preferences({homeDay:5,planDay:{}}).plannedDay,'');
});

test('day changes refresh daily and weekly meals together, preserve week two on reload, and leave plan data intact',async()=>{
 const {readFile}=await import('node:fs/promises'),{default:vm}=await import('node:vm');
 const [core,ui]=await Promise.all(['app-experience-core','app-experience-ui'].map(name=>readFile(new URL('../public/'+name+'.js',import.meta.url),'utf8')));
 const state={interfacePreferences:{homeDay:'Wednesday',planDay:'Thursday'},profile:{people:1,calories:1600,protein:150},week:[{day:'Wednesday',meals:['enchilada']},{day:'Thursday',meals:['teriyaki']},{day:'Thursday (Week 2)',meals:['burrito']}],mealServings:{'Thursday::0':2},pantry:[{name:'Rice',qty:500,unit:'g'}],foodLog:[{name:'Snack',kcal:100}],shopping:{checked:['Rice']},cooked:{'Wednesday::0':1}};
 const data=()=>JSON.stringify({...state,interfacePreferences:undefined}),before=data();let saved=0;
 const elements=Object.fromEntries(['home','week','todayPlanDay','planDay'].map(id=>[id,{innerHTML:'',focus(){}}]));
 const context={document:{getElementById:id=>elements[id],querySelectorAll:()=>[],querySelector:()=>null,documentElement:{dataset:{}}},MacroGoalsCore:{targets:()=>({max:1600,fatMax:null,carbMax:null}),summary:()=>[]}};
 vm.runInNewContext(core+'\n'+ui,context);
 const totals=()=>({kcal:500,p:50,kcalKnown:true,pKnown:true,kcalComplete:true,pComplete:true});
 const api={state:()=>state,save:()=>saved++,store:()=> 'Lidl',planner:()=>({status:'idle'}),totals,targetsMet:()=>true,recipe:id=>({id}),mealCard:(recipe,day)=>'<p>'+day+':'+recipe.id+'</p>',nextMealIndex:()=>0,budgetPanel:()=>'',tailoredPanel:()=>''};
 context.AppExperienceUI.configure(api);context.AppExperienceUI.renderHome();context.AppExperienceUI.renderWeek();
 for(const id of ['home','week'])assert.match(elements[id].innerHTML,/Thursday:teriyaki/);
 context.AppExperienceUI.selectDay('week',2);
 for(const id of ['home','week'])assert.match(elements[id].innerHTML,/Thursday \(Week 2\):burrito/);
 context.AppExperienceUI.configure(api);context.AppExperienceUI.renderHome();context.AppExperienceUI.renderWeek();
 for(const id of ['home','week'])assert.match(elements[id].innerHTML,/Thursday \(Week 2\):burrito/);
 context.AppExperienceUI.selectDay('home',0);
 for(const id of ['home','week'])assert.match(elements[id].innerHTML,/Wednesday:enchilada/);
 state.week[0].meals=['changed'];context.AppExperienceUI.renderHome();context.AppExperienceUI.renderWeek();
 for(const id of ['home','week'])assert.match(elements[id].innerHTML,/Wednesday:changed/);
 state.week[0].meals=['enchilada'];assert.equal(data(),before);assert.equal(saved,2);
 const preferences=JSON.stringify(state.interfacePreferences);
 for(const index of [-1,99,.5])context.AppExperienceUI.selectDay('week',index);
 context.AppExperienceUI.selectDay('invalid',0);assert.equal(JSON.stringify(state.interfacePreferences),preferences);assert.equal(saved,2);
 state.week=[];context.AppExperienceUI.renderHome();context.AppExperienceUI.renderWeek();assert.match(elements.home.innerHTML,/Choose the meals/);assert.match(elements.week.innerHTML,/Build a plan/);
});

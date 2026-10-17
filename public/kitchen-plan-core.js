/* Conversational plan briefs contain preferences, never generated food facts. */
(function(root){
 'use strict';
 const cats=['Breakfast','Lunch','Dinner','Snack'],clean=(value,max=240)=>typeof value==='string'?value.trim().slice(0,max):'';
 const number=(value,fallback)=>value!==null&&value!==''&&Number.isFinite(Number(value))?Number(value):fallback;
 const words={one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10,eleven:11,twelve:12,thirteen:13,fourteen:14,a:1,an:1};
 function defaults(p={}){
  const requests={};
  if(p.varietyMode==='Tailored')for(const cat of cats){const row=p.tailoredMeals?.[cat];if(row?.query)requests[cat]={query:row.query,mode:row.mode,selected:row.mode==='repeat'?row.recipeIds?.[0]:''};}
  return {days:number(p.days,7),meals:number(p.meals,3),calories:number(p.calories,2000),protein:number(p.protein,200),nutritionTargets:{...root.MacroGoalsCore.normalise(p.nutritionTargets)},requests,
   scheduledMeals:(p.varietyMode==='Tailored'?p.scheduledMeals||[]:[]).map(row=>({day:row.day,category:row.category,query:row.query,selected:row.recipeIds?.[0]})),budget:number(p.budget,45),people:number(p.people,1),exclude:[],diet:p.diet||'No restrictions'};
 }
 function profileSnapshot(p){return JSON.stringify([p.days,p.meals,p.budget,p.people,p.calories,p.protein,p.nutritionTargets,p.diet,p.varietyMode,p.tailoredMeals,p.scheduledMeals,p.repeatMeals]);}
 function rebase(raw,p){const draft=normalizeDraft(raw);if(!draft)return null;const snapshot=profileSnapshot(p);if(draft.profileSnapshot===snapshot)return draft;const current=defaults(p);return {...draft,...current,requests:{...draft.requests,...current.requests},profileSnapshot:snapshot};}
 function normalizeDraft(raw){
  if(!raw||typeof raw!=='object'||Array.isArray(raw))return null;
  const result={requests:{},scheduledMeals:[],nutritionTargets:{},exclude:[]};
  result.profileSnapshot=clean(raw.profileSnapshot,20000);
  for(const key of ['days','meals','calories','protein','budget','people']){if(!Number.isFinite(Number(raw[key]))||Math.abs(Number(raw[key]))>1000000)return null;result[key]=Number(raw[key]);}
  for(const key of ['carbs','fatMax'])result.nutritionTargets[key]=raw.nutritionTargets?.[key]==null?null:number(raw.nutritionTargets[key],null);
  result.nutritionTargets.calorieMode=raw.nutritionTargets?.calorieMode==='max'?'max':'range';result.nutritionTargets.carbMode=raw.nutritionTargets?.carbMode==='max'?'max':'target';result.nutritionTargets.minimiseFat=raw.nutritionTargets?.minimiseFat===true;
  for(const cat of cats){const row=raw.requests?.[cat];if(clean(row?.query)&&['repeat','vary','choose'].includes(row.mode))result.requests[cat]={query:clean(row.query),mode:row.mode,selected:clean(row.selected,120)};}
  for(const row of (Array.isArray(raw.scheduledMeals)?raw.scheduledMeals:[]).slice(0,56))if(Number.isInteger(Number(row?.day))&&cats.includes(row.category)&&clean(row.query))result.scheduledMeals.push({day:Number(row.day),category:row.category,query:clean(row.query),selected:clean(row.selected,120),atEnd:row.atEnd===true});
  result.exclude=[...new Set((Array.isArray(raw.exclude)?raw.exclude:[]).map(value=>clean(value,35)).filter(Boolean))].slice(0,16);
  result.diet=['Vegan','Vegetarian'].includes(raw.diet)?raw.diet:'No restrictions';result.pendingCategory=cats.includes(raw.pendingCategory)?raw.pendingCategory:'';result.pendingDay=number(raw.pendingDay,0);result.pendingField=['days','meals','calories','protein','carbs','fatMax','budget','people'].includes(raw.pendingField)?raw.pendingField:'';result.requireProtein=raw.requireProtein===true;
  return result;
 }
 function isPlan(text,kind,prior,lastKind){
  if(['storage','diary','compare','cook'].includes(kind))return false;
  if(/\b(?:per|each)\s+(?:meal|portion|serving)\b/i.test(text)&&!/\b(?:make|create|build|generate|tailor|fit)\b.{0,60}\bplan\b/i.test(text))return false;
  if(/\b(?:don’t|don't|do not)\s+(?:make|create|save|replace|build)\b/i.test(text))return false;
  if(/^(?:what|why|how|is|are|should|can i)\b/i.test(text.trim())&&!/\b(?:make|create|build|generate|tailor|fit|change|update)\b.{0,60}\bplan\b/i.test(text))return false;
  if(kind==='plan'||/\bmeal[ -]?plan\b/i.test(text))return true;
  if(kind==='prep')return false;
  if((text.match(/\b(?:breakfast|lunch|dinner)\b/gi)||[]).length>=2)return true;
  return Boolean(prior&&lastKind==='plan'&&(/\b(?:instead|change|swap|replace|less|lower|more|protein|calories?|carbs?|fat|budget|weekly|days?|weeks?|breakfast|lunch|dinner|without|repeat|variety|vegetarian|vegan|people)\b|£/i.test(text)||prior.pendingCategory||prior.pendingField));
 }
 function wording(raw,prior){
  let value=clean(raw,2000).replace(/\b(?:change|swap|replace)\s+(?:my\s+)?(breakfast|lunch|dinner|snack)\s+(?:to|for|with)\s+/gi,'$1: ')
   .replace(/\b(breakfast|lunch|dinner|snack)\s+(?![:=\-]|for\b|in\b|on\b)(?=overnight|oats|tuna|chicken|steak|salad|wrap|egg|yoghurt|yogurt|pasta|rice|tofu|lentil|bean)/gi,'$1: ');
  value=value.replace(/\b(?:this|coming) week\b/gi,'for 7 days').replace(/[ \t]*[,.;]?[ \t]+(?=(?:(?:under|below|at most|no more than|maximum|up to|max)\s+)?\d+(?:\.\d+)?\s*(?:g(?:rams?)?\s*)?(?:kcal|calories?|protein|carbs?|fats?)\b)/gi,'; ')
   .replace(/[ \t]*[,.;]?[ \t]+(?=(?:calories?|protein|carbs?|fats?)\s*[:=])/gi,'; ')
   .replace(/[ \t]*[,.;]?[ \t]+(?=£|(?:weekly\s+)?budget\b|(?:for\s+)?\d+\s+people\b)/gi,'; ');
  if(prior?.pendingField&&/^\d+(?:\.\d+)?\s*(?:g|grams?|kcal|days?|people)?[.!]?$/i.test(value)){const amount=value.match(/^\d+(?:\.\d+)?/)[0],label={days:'For '+amount+' days',meals:amount+' meals per day',calories:amount+' calories',protein:amount+'g protein',carbs:amount+'g carbs',fatMax:amount+'g fat',budget:'£'+amount+' weekly budget',people:amount+' people'};value=label[prior.pendingField];}
  if(prior?.pendingCategory&&!/^(?:yes[, ]*)?(?:repeat|repeat it|same|same meal|use that|that one)(?: please)?[.!]?$/i.test(value)&&!/\b(?:breakfast|lunch|dinner|snack|budget|calories?|protein|carbs?|fat|days?|weeks?)\b|£/i.test(value))value=prior.pendingCategory+': '+value.replace(/\s+instead\b/gi,'');
  const duration=value.match(/\b(\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen)\s*[- ]?\s*(days?|weeks?)\b/i);
  if(duration){const amount=words[duration[1].toLowerCase()]??Number(duration[1]);value=value.replace(duration[0],amount+' '+duration[2]);if(!/(?:next|for|over)\s+\d+\s+(?:days?|weeks?)/i.test(value))value='For '+amount+' '+duration[2]+'. '+value;}
  return value;
 }
 function merge(raw,prior,p={},ai=null){
  const base=normalizeDraft(prior)||{...defaults(p),profileSnapshot:profileSnapshot(p)},text=wording(raw,base),scalarText=base.pendingField?text:raw,local=root.MealIntentCore.parse(text,base),macro=root.MealIntentCore.parse(scalarText,base),explicit=root.MealIntentCore.macroValues(scalarText),duration=/(?:next|for|over)\s+(?:\d+|one|two|three|seven|fourteen|a|an)?\s*(?:days?|weeks?|fortnight|months?)/i.test(text),days=duration?local.days:base.days;
  const result={...base,days,meals:/[234]\s*meals?\s*(?:a|per|each|in a)\s*day/i.test(text)||local.requests.Breakfast&&local.requests.Lunch&&local.requests.Dinner?local.meals:base.meals,
   calories:explicit.calories?macro.calories:base.calories,protein:explicit.protein?macro.protein:base.protein,nutritionTargets:{...base.nutritionTargets},requests:{...base.requests},scheduledMeals:base.scheduledMeals.map(row=>({...row,day:row.atEnd?days:row.day})),exclude:[...base.exclude],pendingCategory:'',pendingDay:0,pendingField:'',requireProtein:explicit.protein?false:base.requireProtein};
  if(explicit.calories)result.nutritionTargets.calorieMode=macro.nutritionTargets.calorieMode;if(explicit.carbs){result.nutritionTargets.carbs=macro.nutritionTargets.carbs;result.nutritionTargets.carbMode=macro.nutritionTargets.carbMode;}if(explicit.fat)result.nutritionTargets.fatMax=macro.nutritionTargets.fatMax;if(macro.nutritionTargets.minimiseFat)result.nutritionTargets.minimiseFat=true;
  if(/(?:strictly|exactly|maximum|at most)\s*(?:zero|no)\s+fat/i.test(raw))result.nutritionTargets.fatMax=0;
  // AI may recognise food wording. Explicit/default numbers always remain local.
  const named=cats.filter(cat=>new RegExp('\\b'+cat+'\\b','i').test(raw));if(/\bmorning\b/i.test(raw))named.push('Breakfast');if(/\bevening\b/i.test(raw))named.push('Dinner');
  if(ai?.source==='ai'&&ai.requests&&typeof ai.requests==='object')for(const cat of cats){const row=ai.requests[cat],scope=named.includes(cat)||!prior&&p.varietyMode!=='Repeat favourites'||!named.length&&/\b(?:eat|food|cuisine)\b/i.test(raw);if(!local.requests[cat]&&scope&&clean(row?.query)&&['repeat','vary','choose'].includes(row.mode))result.requests[cat]={query:clean(row.query),mode:row.mode};}
  Object.assign(result.requests,local.requests);
  if(base.pendingDay&&base.pendingCategory&&local.requests[base.pendingCategory]){const row=result.scheduledMeals.find(row=>row.day===base.pendingDay&&row.category===base.pendingCategory);if(row){row.query=local.requests[base.pendingCategory].query;row.selected='';if(base.requests[base.pendingCategory])result.requests[base.pendingCategory]={...base.requests[base.pendingCategory]};else delete result.requests[base.pendingCategory];}}
  const mentioned=cats.filter(cat=>new RegExp('\\b'+cat+'\\b','i').test(raw));
  const changed=mentioned.length?mentioned:base.pendingCategory?[base.pendingCategory]:cats;
  if(!Object.keys(local.requests).length&&/\b(?:variety|varied|different|mix)\b/i.test(raw))for(const cat of changed)if(result.requests[cat])result.requests[cat].mode='vary';
  if(!Object.keys(local.requests).length&&/\b(?:same|repeat)\b/i.test(raw))for(const cat of changed)if(result.requests[cat])result.requests[cat].mode='repeat';
  for(const row of Object.values(result.requests))row.query=row.query.replace(/\s+instead\b/gi,'').replace(/\s+(?:without|avoid)\s+[a-z]+/gi,'').trim();
  for(const match of raw.toLowerCase().matchAll(/\b(?:without|avoid|no)\s+([a-z]+)/g))if(!['fat','fats','more','less','restrictions'].includes(match[1]))result.exclude.push(match[1]);
  if(result.exclude.includes('fish'))result.exclude.push('tuna','salmon','cod','haddock','prawn','shrimp','anchovy','sardine','mackerel');
  if(local.scheduledMeals.length)result.scheduledMeals=local.scheduledMeals.map(row=>({...row,atEnd:/\b(?:end|last|final)\b/i.test(raw)&&row.day===local.days}));
  else if(ai?.source==='ai'&&Array.isArray(ai.scheduledMeals)&&/\b(?:on day\s+\d+|last day|final day|at the end|once|one day)\b/i.test(raw)){
   const daysRequested=[...raw.matchAll(/\bon day\s+(\d+)\b/gi)].map(match=>Number(match[1]));if(/\b(?:last day|final day|at the end)\b/i.test(raw))daysRequested.push(days);
   const incoming=root.MealIntentCore.scheduled(ai.scheduledMeals,Math.max(1,Math.min(14,days)),false,false).filter(row=>daysRequested.includes(row.day)&&row.query.toLowerCase().split(/\W+/).some(word=>word.length>2&&!['the','for','with','day','dinner','lunch','breakfast','meal','dish'].includes(word)&&raw.toLowerCase().includes(word)));
   for(const row of incoming)result.scheduledMeals=[...result.scheduledMeals.filter(old=>old.day!==row.day||old.category!==row.category),{...row,atEnd:row.day===days&&/\b(?:end|last|final)\b/i.test(raw)}];
  }
  if(!local.scheduledMeals.length&&/\bsteak\b/i.test(raw)&&/\b(?:last day|final day|at the end|on day\s+\d+)\b/i.test(raw)&&!/\b(?:no|without|skip|remove)\s+steak\b/i.test(raw)){const day=raw.match(/\bon day\s+(\d+)\b/i),slot=raw.match(/\b(?:for|at)\s+(breakfast|lunch|dinner|snack)\b/i),category=slot?slot[1][0].toUpperCase()+slot[1].slice(1).toLowerCase():'Dinner';result.scheduledMeals=[...result.scheduledMeals.filter(row=>!row.query.toLowerCase().includes('steak')),{day:day?Number(day[1]):days,category,query:'steak',atEnd:!day}];}
  if(/\b(?:no|without|skip|remove)\s+(?:the\s+)?steak\b/i.test(raw))result.scheduledMeals=result.scheduledMeals.filter(row=>!row.query.toLowerCase().includes('steak'));
  const money=scalarText.match(/£\s*(-?\d+(?:\.\d+)?)|(?:weekly\s+budget|budget)\s*(?:of|is|to|:|=)?\s*£?\s*(-?\d+(?:\.\d+)?)|(-?\d+(?:\.\d+)?)\s*(?:pounds?\s*|gbp\s*)?(?:weekly|(?:a|per|each)\s+week)\b/i);if(money)result.budget=Number(money[1]??money[2]??money[3])*(/\b(?:total|whole (?:plan|period))\b/i.test(raw)?7/result.days:1);
  const people=scalarText.match(/(?:for\s+)?(\d+)\s+(?:people|persons?)\b/i);if(people)result.people=Number(people[1]);
  if(prior&&/\b(?:more|higher)\s+protein\b/i.test(raw)&&!explicit.protein)result.requireProtein=true;
  if(/\bvegan\b/i.test(raw))result.diet='Vegan';else if(/\bvegetarian\b/i.test(raw)&&p.diet!=='Vegan'&&base.diet!=='Vegan')result.diet='Vegetarian';
  for(const [field,names] of Object.entries({calories:'calories?|kcal',protein:'protein',carbs:'carbs?|carbohydrates?',fatMax:'fats?'})){const negative=raw.match(new RegExp('(?:'+names+')[ \\t]*[:=]?[ \\t]*(-\\d+(?:\\.\\d+)?)','i'))||raw.match(new RegExp('(-\\d+(?:\\.\\d+)?)[ \\t]*(?:g|grams?)?[ \\t]*(?:'+names+')\\b','i'));if(negative){if(['calories','protein'].includes(field))result[field]=Number(negative[1]);else result.nutritionTargets[field]=Number(negative[1]);}}
  if(/\b(?:lower|less|minimise|minimize)\s+(?:the\s+)?fat\b/i.test(raw))result.nutritionTargets.minimiseFat=true;
  return {draft:normalizeDraft(result),text,source:ai?.source==='ai'?'ai':'local'};
 }
 function prepare(draft,p,recipes,{allowed=()=>true,nutrition=r=>r.nutrition}={}){
  const b=normalizeDraft(draft);if(!b)throw new TypeError('Please describe the meals and targets again.');
  if(b.requireProtein){const e=new Error('What daily minimum protein would you like? You can reply with a number of grams.');e.field='protein';throw e;}
  const reviewed=root.MealIntentCore.normaliseBrief(b),profile={...p,days:reviewed.days,meals:reviewed.meals,calories:reviewed.calories,protein:reviewed.protein,nutritionTargets:reviewed.nutritionTargets,budget:b.budget,people:b.people,diet:p.diet==='Vegan'?'Vegan':b.diet,dislikes:[...new Set([...(p.dislikes||'').split(',').map(value=>value.trim()).filter(Boolean),...b.exclude])].join(', '),varietyMode:'Tailored',tailoredMeals:{},scheduledMeals:[]};
  if(!Number.isFinite(b.budget)||b.budget<0||b.budget>10000)throw new TypeError('What weekly household budget should I use, from £0 to £10,000?');
  if(!Number.isInteger(b.people)||b.people<1||b.people>50)throw new TypeError('How many people is this for, from 1 to 50?');
  const slots=root.MealBudgetCore.mealSlots(b.meals),find=(category,query)=>recipes.filter(r=>(r.cat===category||category==='Snack'&&r.cat==='Fruit')&&allowed(r,profile)&&root.MacroGoalsCore.complete(nutrition(r),profile)&&root.MealIntentCore.matches(r,query)&&!b.exclude.some(word=>new RegExp('\\b'+word.replace(/[^a-z ]/g,'')+'s?\\b','i').test((r.ings||[]).map(row=>row[0]).join(' '))))
   .sort((a,z)=>{const n=nutrition(a),m=nutrition(z);return (profile.nutritionTargets.minimiseFat||profile.nutritionTargets.fatMax!==null?n.f*5-m.f*5:0)-n.p+m.p||a.name.localeCompare(z.name);}).slice(0,30);
  for(const cat of slots){const row=b.requests[cat];if(!row?.query||row.mode==='choose'){const saved=p.varietyMode==='Repeat favourites'&&p.repeatMeals?.[cat];if(saved){const r=recipes.find(row=>row.id===saved);if(!r||!allowed(r,profile)||!root.MacroGoalsCore.complete(nutrition(r),profile)){const e=new Error('Your saved repeat '+cat.toLowerCase()+' is not ready with these settings. What would you like instead?');e.category=cat;throw e;}profile.tailoredMeals[cat]={query:r.name,mode:'repeat',recipeIds:[r.id]};}continue;}const found=find(cat,row.query);if(!found.length){const e=new Error('I couldn’t find a measured '+cat.toLowerCase()+' matching “'+row.query+'” with your diet, equipment and cooking-time settings. What would you like for '+cat.toLowerCase()+' instead?');e.category=cat;throw e;}
   if(row.mode==='vary'&&b.days-b.scheduledMeals.filter(item=>item.category===cat).length>1&&found.length<2){const e=new Error('I found only one matching '+cat.toLowerCase()+'. Would you like to repeat it, or describe a broader '+cat.toLowerCase()+' choice?');e.category=cat;throw e;}
   const pick=found.find(r=>r.id===row.selected)||found[0];profile.tailoredMeals[cat]={query:row.query,mode:row.mode,recipeIds:row.mode==='repeat'?[pick.id]:found.map(r=>r.id)};}
  for(const row of reviewed.scheduledMeals){const found=find(row.category,row.query);if(!found.length){const e=new Error('I couldn’t find a measured '+row.query+' for day '+row.day+'. What would you like for that '+row.category.toLowerCase()+' instead?');e.category=row.category;e.day=row.day;throw e;}profile.scheduledMeals.push({...row,recipeIds:[found[0].id]});}
  return profile;
 }
 function planSignature(state){const p=state.profile||{};return JSON.stringify([state.week,state.mealServings,p.days,p.meals,p.people,p.budget,p.calories,p.protein,p.nutritionTargets,p.diet,p.equipment,p.dislikes,p.cookTime,p.varietyMode,p.tailoredMeals,p.scheduledMeals,state.shoppingStore||p.supermarket]);}
 function normalizeReceipt(raw){if(!raw||!['saved','needs_info','no_feasible_plan','unavailable','stale','cancelled'].includes(raw.status))return null;return {status:raw.status,days:number(raw.days,0),meals:number(raw.meals,0),store:clean(raw.store,20),cost:number(raw.cost,null),budget:number(raw.budget,null),signature:clean(raw.signature,30000)};}
 root.KitchenPlanCore=Object.freeze({defaults,normalizeDraft,rebase,isPlan,wording,merge,prepare,planSignature,normalizeReceipt});
})(globalThis);

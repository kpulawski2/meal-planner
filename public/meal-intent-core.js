/* Reviewable meal requests. Recipe matches always come from the saved library. */
(function(root){
 'use strict';
 const categories=['Breakfast','Lunch','Dinner','Snack'];
 const aliases={oats:/\boats?\b/,tuna:/\btuna\b/,pickles:/\b(?:pickles?|gherkins?|cornichons?)\b/,eggs:/\beggs?\b/,mayo:/\b(?:mayo|mayonnaise)\b/,wrap:/\b(?:wraps?|tortillas?)\b/,chicken:/\bchicken\b/};
 const stop=new Set('i want would like have eat a an the and or with of for in my some kind dish dishes meal meals breakfast lunch dinner snack morning evening every day daily same repeat repeated high low protein rich healthy quick easy prep so different variety varied varieties over over again please salad as little no fats at all next'.split(' '));
 const clean=value=>String(value||'').trim().slice(0,240);
 function rule(profile,category){return profile?.varietyMode==='Tailored'?profile.tailoredMeals?.[category]:null;}
 function allowed(recipe,profile){const category=recipe.cat==='Fruit'?'Snack':recipe.cat,choice=rule(profile,category);return !choice||Array.isArray(choice.recipeIds)&&choice.recipeIds.includes(recipe.id);}
 function rules(value,strict=false){
  const result={};
  for(const category of categories){const row=value?.[category];if(!row)continue;
   if(!['repeat','vary'].includes(row.mode)||!Array.isArray(row.recipeIds)||!row.recipeIds.length||row.recipeIds.length>30||row.recipeIds.some(id=>typeof id!=='string'||!id.trim()||id.length>120)||row.mode==='repeat'&&row.recipeIds.length!==1){if(strict)throw new TypeError('Review the '+category.toLowerCase()+' meal choices.');continue;}
   result[category]={mode:row.mode,query:clean(row.query),recipeIds:[...new Set(row.recipeIds)]};
  }return result;
 }
 function matches(recipe,query){
  const raw=clean(query).toLowerCase().replace(/overnights?\b/g,'overnight oats'),ingredients=(recipe.ings||[]).filter(row=>Number(row[1])>0).map(row=>String(row[0]).toLowerCase()),hay=[recipe.name,...ingredients,...(recipe.tags||[])].join(' ').toLowerCase();
  const words=raw.replace(/-/g,' ').replace(/[^a-z0-9\s]/g,' ').split(/\s+/).filter(word=>word&&!stop.has(word));
  const terms=[...new Set(words.map(word=>/^oats?$/.test(word)?'oats':/^(pickles?|gherkins?|cornichons?)$/.test(word)?'pickles':/^eggs?$/.test(word)?'eggs':/^mayonnaise$/.test(word)?'mayo':/^(wraps?|tortillas?)$/.test(word)?'wrap':word))];
  return terms.length>0&&terms.every(term=>term==='overnight'?/overnight/.test([hay,...(Array.isArray(recipe.method)?recipe.method:[recipe.method||''])].join(' ').toLowerCase()):aliases[term]?ingredients.some(value=>aliases[term].test(value)&&(term!=='chicken'||!/stock|broth|seasoning|flavour|plant|vegan/.test(value))):new RegExp('\\b'+term.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'(?:s)?\\b').test(hay));
 }
 function parse(text,defaults={}){
  const raw=String(text||'').trim().slice(0,2000),lower=raw.toLowerCase(),warnings=[];
  let days=Number(defaults.days)||7;
  const duration=lower.match(/(?:next|for|over)\s+(?:(\d+|one|two|three|seven|fourteen|a|an)\s+)?(days?|weeks?|fortnight|months?)/);
  if(duration){const words={one:1,two:2,three:3,seven:7,fourteen:14},amount=duration[1]&&/^\d+$/.test(duration[1])?Number(duration[1]):words[duration[1]]||1;days=/month/.test(duration[2])?30*amount:/fortnight/.test(duration[2])?14*amount:/week/.test(duration[2])?7*amount:amount;}
  const result={days,meals:Number(defaults.meals)||3,calories:Number(defaults.calories)||2000,protein:root.MacroGoalsCore.known(defaults.protein)?Number(defaults.protein):200,nutritionTargets:root.MacroGoalsCore.normalise(defaults.nutritionTargets),requests:{},warnings};
  if(days<1||days>14)warnings.push('The planner supports 1–14 days. Choose a supported period before generating.');
  const calories=lower.match(/(\d+(?:\.\d+)?)\s*(?:kcal|calories?)/),protein=lower.match(/(\d+(?:\.\d+)?)\s*g(?:rams?)?\s*(?:of\s+)?protein/),carbs=lower.match(/(\d+(?:\.\d+)?)\s*g(?:rams?)?\s*(?:of\s+)?carb(?:s|ohydrates?)?/),fat=lower.match(/(\d+(?:\.\d+)?)\s*g(?:rams?)?\s*(?:of\s+)?fat(?:s)?/);
  const maximum=match=>match&&/(?:under|below|at most|maximum|up to|no more than)\s*$/.test(lower.slice(Math.max(0,match.index-25),match.index))||match&&/^\s*(?:a day|per day|daily)?\s*(?:or\s*)?(?:under|less|maximum)/.test(lower.slice(match.index+match[0].length));
  if(calories){result.calories=Number(calories[1]);result.nutritionTargets.calorieMode=maximum(calories)?'max':'range';}
  if(protein)result.protein=Number(protein[1]);
  if(carbs){result.nutritionTargets.carbs=Number(carbs[1]);result.nutritionTargets.carbMode=maximum(carbs)?'max':'target';}
  if(fat)result.nutritionTargets.fatMax=Number(fat[1]);
  if(/(?:little|low|lower|minim\w*|less|no)\s+(?:or no\s+)?fat(?:s)?|fat.?free/.test(lower))result.nutritionTargets.minimiseFat=true;
  if(/(?:strictly|exactly|maximum|at most)\s*(?:zero|no)\s+fat/.test(lower))result.nutritionTargets.fatMax=0;
  const count=lower.match(/([234])\s*meals?\s*(?:a|per|each|in a)\s*day/);if(count)result.meals=Number(count[1]);
  const labelled=/(breakfast|lunch|dinner|snack)\s*[:=-]\s*([^;\n]+?)(?=\s+(?:breakfast|lunch|dinner|snack)\s*[:=-]|[;\n]|$)/gi;
  let match;while((match=labelled.exec(raw)))result.requests[match[1][0].toUpperCase()+match[1].slice(1).toLowerCase()]={query:clean(match[2]),mode:/variety|different|varied|mix/.test(match[2].toLowerCase())?'vary':'repeat'};
  let start=0;const ending=/\s+(?:for\s+(breakfast|lunch|dinner|snack)|in the (morning|evening))/gi;
  while((match=ending.exec(raw))){const category=match[1]?match[1][0].toUpperCase()+match[1].slice(1).toLowerCase():match[2]==='morning'?'Breakfast':'Dinner';let query=raw.slice(start,match.index).replace(/^(?:for|over) (?:the )?next \d+ days?[,;]?\s*/i,'').replace(/^.*?(?:i want|i would like|i'd like)\s+/i,'').replace(/^\s*[,;.]?\s*(?:and\s+)?/i,'').trim();start=ending.lastIndex;
   if(query&&!result.requests[category])result.requests[category]={query:clean(query),mode:/variety|different|varied|mix|(?:a|some) chicken dish/i.test(query)?'vary':'repeat'};
  }
  if(result.requests.Breakfast&&result.requests.Lunch&&result.requests.Dinner)result.meals=result.requests.Snack?4:3;
  if(!Object.keys(result.requests).length)warnings.push('Add a request for each meal below, for example “overnight oats for breakfast”.');
  if(result.nutritionTargets.minimiseFat||result.nutritionTargets.fatMax===0)warnings.push('Oats, eggs, mayo and chicken contain some fat. Lower fat is a preference; a strict fat cap is never relaxed.');
  return result;
 }
 function normaliseBrief(value,defaults={}){
  if(!value||typeof value!=='object'||Array.isArray(value))throw new TypeError('Review the meal request.');
  const num=(key,min,max)=>{const n=Number(value[key]??defaults[key]);if(!Number.isFinite(n)||n<min||n>max||['days','meals'].includes(key)&&!Number.isInteger(n))throw new TypeError('Check '+key+' ('+min+'–'+max+').');return n;};
  const result={days:num('days',1,14),meals:num('meals',2,4),calories:num('calories',400,10000),protein:num('protein',0,1000),nutritionTargets:root.MacroGoalsCore.normalise(value.nutritionTargets,true),requests:{}};
  for(const category of categories){const row=value.requests?.[category];if(row?.query){if(!['repeat','vary','choose'].includes(row.mode))throw new TypeError('Choose repeat, variety or planner choice.');result.requests[category]={query:clean(row.query),mode:row.mode};}}
  return result;
 }
 root.MealIntentCore=Object.freeze({categories,rule,rules,allowed,matches,parse,normaliseBrief});
})(globalThis);

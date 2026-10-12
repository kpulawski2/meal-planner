/* Search across separate words; unknown nutrition and time sort last. */
(function(root){
 'use strict';
 const normal=value=>String(value||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const words=value=>normal(value).split(/[^a-z0-9@]+/).filter(Boolean);
 const aliases={mayo:['mayo','mayonnaise'],mayonnaise:['mayo','mayonnaise'],pickles:['pickle','pickles','gherkin','gherkins','cornichon'],pickle:['pickle','pickles','gherkin','gherkins','cornichon'],yogurt:['yogurt','yoghurt'],yoghurt:['yogurt','yoghurt']};
 function matches(recipe,query){const hay=normal([recipe.name,recipe.cat,recipe.creator,...(recipe.equipment||[]),...(recipe.tags||[]),...(recipe.ings||[]).map(row=>row[0])].join(' '));return words(query).every(word=>(aliases[word]||[word]).some(term=>hay.includes(term)));}
 const known=value=>value!==null&&value!==undefined&&value!==''&&Number.isFinite(Number(value))&&Number(value)>=0;
 function sort(rows,{mode='recommended',nutrition=recipe=>recipe.nutrition||{},ready=()=>false,feedback=()=>0,favorites=[]}={}){
  const saved=new Set(favorites),decorated=rows.map((recipe,index)=>{const n=nutrition(recipe),time=recipe.cookTime??recipe.time;return {recipe,index,p:n.complete&&known(n.p)?Number(n.p):null,kcal:n.complete&&known(n.kcal)?Number(n.kcal):null,time:known(time)?Number(time):null,score:(ready(recipe)?100:0)+(saved.has(recipe.id)?40:0)+feedback(recipe)*4};});
  const numeric=(a,b,key,direction)=>a[key]===null?(b[key]===null?0:1):b[key]===null?-1:(a[key]-b[key])*direction;
  decorated.sort((a,b)=>mode==='protein'?numeric(a,b,'p',-1)||a.recipe.name.localeCompare(b.recipe.name):mode==='calories'?numeric(a,b,'kcal',1)||a.recipe.name.localeCompare(b.recipe.name):mode==='time'?numeric(a,b,'time',1)||a.recipe.name.localeCompare(b.recipe.name):mode==='name'?a.recipe.name.localeCompare(b.recipe.name):b.score-a.score||a.index-b.index);
  return decorated.map(row=>row.recipe);
 }
 function pick(rows,ready,lastId='',random=Math.random){const eligible=rows.filter(ready),alternatives=eligible.filter(row=>row.id!==lastId),choices=alternatives.length?alternatives:eligible;if(!choices.length)return null;return choices[Math.max(0,Math.min(choices.length-1,Math.floor(random()*choices.length)))];}
 root.RecipeDiscoveryCore=Object.freeze({matches,sort,pick});
})(globalThis);

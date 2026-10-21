import '../public/barcode-core.js';
import '../public/food-nutrients-core.js';
const fields='code,product_name,product_name_en,brands,nutriments,nutrition_data_per,no_nutrition_data,obsolete,product_type,serving_size,serving_quantity,product_quantity,product_quantity_unit';
const invalid=message=>Object.assign(new TypeError(message),{status:400});
export function createFoodSearch({fetchImpl=fetch,now=Date.now}={}){
 const cache=new Map(),inflight=new Map();let starts=[];
 return async function search(value){
  if(typeof value!=='string')throw invalid('Enter a food name to search.');const query=value.trim().replace(/\s+/g,' ');if(query.length<2||query.length>80||/[\x00-\x1f]/.test(query))throw invalid('Use 2–80 characters for a food search.');
  const key=query.toLowerCase(),saved=cache.get(key);if(saved?.expires>now())return structuredClone(saved.result);if(inflight.has(key))return structuredClone(await inflight.get(key));
  starts=starts.filter(at=>now()-at<60000);if(starts.length>=8||inflight.size>=2){const error=new Error('Food search is busy. Try again shortly, scan a barcode or use your saved foods.');error.status=429;throw error;}starts.push(now());
  const promise=(async()=>{
   const url=new URL('https://world.openfoodfacts.org/cgi/search.pl');for(const [k,v] of Object.entries({search_terms:query,search_simple:'1',action:'process',json:'1',fields,page_size:'20',page:'1',sort_by:'unique_scans_n',tagtype_0:'countries',tag_contains_0:'contains',tag_0:'united-kingdom',lc:'en'}))url.searchParams.set(k,v);
   let response;try{response=await fetchImpl(url,{headers:{'User-Agent':'MealPlanner/2.1.0 (https://github.com/kpulawski2/meal-planner)',Accept:'application/json'},redirect:'error',signal:AbortSignal.timeout(12000)});}catch{throw new Error('The food database could not connect. Retry online, scan a barcode or use saved foods.');}
   if(response.status===429)throw Object.assign(new Error('The food database is busy. Try again shortly or use your saved foods.'),{status:429});
   if(!response.ok)throw new Error('The food database could not respond. Try a barcode or your saved foods.');const max=512*1024;if(Number(response.headers?.get('content-length'))>max)throw new Error('Food search response was too large. Try a more specific name.');
   let raw;if(response.body?.getReader){const reader=response.body.getReader(),parts=[];let size=0;try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>max){await reader.cancel();throw new Error('Food search response was too large.');}parts.push(value);}}finally{reader.releaseLock();}raw=JSON.parse(Buffer.concat(parts).toString('utf8'));}else{const body=await response.text();if(Buffer.byteLength(body)>max)throw new Error('Food search response was too large.');raw=JSON.parse(body);}
   if(!Array.isArray(raw.products))throw new Error('The food database returned an incomplete result. Try a barcode instead.');
   const products=[],seen=new Set();for(const product of raw.products.slice(0,20)){try{if(product.product_type&&product.product_type!=='food')continue;const parsed=globalThis.BarcodeCore.product({product},product.code);if(!parsed.name||seen.has(parsed.barcode))continue;seen.add(parsed.barcode);products.push(parsed);}catch{}}
   const result={query,products,source:'Open Food Facts',license:'ODbL'};if(cache.size>=100)cache.delete(cache.keys().next().value);cache.set(key,{expires:now()+30*60*1000,result});return result;
  })();inflight.set(key,promise);promise.then(()=>inflight.delete(key),()=>inflight.delete(key));return structuredClone(await promise);
 };
}

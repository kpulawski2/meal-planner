import '../public/barcode-core.js';
const Core=globalThis.BarcodeCore;
function waitForProduct(promise,signal){
 if(!signal)return promise;signal.throwIfAborted();
 return new Promise((resolve,reject)=>{const abort=()=>reject(signal.reason);signal.addEventListener('abort',abort,{once:true});promise.then(resolve,reject).finally(()=>signal.removeEventListener('abort',abort));});
}
export function createBarcodeLookup({fetchImpl=fetch,now=Date.now,cacheLimit=300,ttlMs=6*60*60*1000}={}){
 const cache=new Map(),inflight=new Map();let starts=[];
 return async function lookup(value,{signal}={}){
  signal?.throwIfAborted();const barcode=Core.code(value),at=now(),saved=cache.get(barcode);if(saved&&saved.expires>at)return structuredClone(saved.value);
  if(inflight.has(barcode))return structuredClone(await waitForProduct(inflight.get(barcode),signal));
  starts=starts.filter(time=>at-time<60000);if(starts.length>=40||inflight.size>=2){const error=new Error('Product lookup is busy. Try again shortly or enter the pack label.');error.status=429;throw error;}starts.push(at);
  const promise=(async()=>{
   const url=new URL('https://world.openfoodfacts.org/api/v3/product/'+barcode);url.searchParams.set('fields','code,product_name,product_name_en,brands,nutriments,nutrition_data_per,no_nutrition_data,obsolete,product_type');url.searchParams.set('cc','gb');url.searchParams.set('lc','en');url.searchParams.set('product_type','food');
   const timeout=AbortSignal.timeout(12000);
   const response=await fetchImpl(url,{headers:{'User-Agent':'MealPlanner/2.1.0 (https://github.com/kpulawski2/meal-planner)','Accept':'application/json'},signal:timeout,redirect:'error'});
   let result;if(response.status===404)result={status:'not_found',barcode,product:null};
   else{if(!response.ok)throw new Error('The food database is unavailable. Retry or enter the pack label.');
    if(Number(response.headers?.get('content-length'))>128*1024)throw new Error('The food database response was too large. Enter the pack label.');
    let raw;if(response.body?.getReader){const reader=response.body.getReader(),parts=[];let length=0;try{while(true){const {done,value}=await reader.read();if(done)break;length+=value.byteLength;if(length>128*1024){await reader.cancel();throw new Error('Product response was too large.');}parts.push(value);}}finally{reader.releaseLock();}raw=JSON.parse(Buffer.concat(parts).toString('utf8'));}else{const text=await response.text();if(Buffer.byteLength(text)>128*1024)throw new Error('Product response was too large.');raw=JSON.parse(text);}
    if(!raw.product)result={status:'not_found',barcode,product:null};else{if(raw.product.product_type&&raw.product.product_type!=='food')throw new Error('This barcode is not listed as a food. Check the pack.');result={status:'found',barcode,product:Core.product(raw,barcode)};}
   }
   if(cache.size>=cacheLimit)cache.delete(cache.keys().next().value);cache.set(barcode,{expires:now()+(result.status==='found'?ttlMs:15*60*1000),value:result});return result;
  })();inflight.set(barcode,promise);
  // A disconnected caller must not cancel the shared lookup for another user.
  promise.then(()=>inflight.delete(barcode),()=>inflight.delete(barcode));
  return structuredClone(await waitForProduct(promise,signal));
 };
}

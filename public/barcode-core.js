/* EAN/UPC identifiers and reviewed product labels, without guessing nutrients. */
(function(root){
 'use strict';
 const known=value=>(typeof value==='number'||typeof value==='string'&&/^\d+(?:\.\d+)?$/.test(value.trim()))&&Number.isFinite(Number(value))&&Number(value)>=0;
 function code(value){const barcode=String(value??'').replace(/[\s-]/g,'');if(!/^(?:\d{8}|\d{12}|\d{13}|\d{14})$/.test(barcode))throw new TypeError('Enter an 8, 12, 13 or 14 digit EAN/UPC barcode.');let sum=0;for(let i=barcode.length-2,weight=3;i>=0;i--,weight=weight===3?1:3)sum+=Number(barcode[i])*weight;if((10-sum%10)%10!==Number(barcode.at(-1)))throw new TypeError('The barcode check digit does not match. Check the number on the pack.');return barcode;}
 function same(a,b){try{return code(a).padStart(14,'0')===code(b).padStart(14,'0');}catch{return false;}}
 function product(raw,requested){const barcode=code(requested),p=raw?.product;if(!p||!same(p.code??raw.code,barcode))throw new TypeError('The product returned does not match this barcode.');
  const text=(value,max=160)=>typeof value==='string'?value.trim().slice(0,max):'',n=p.nutriments||{},warnings=[];
  const nutrient=(key,max)=>known(n[key])&&Number(n[key])<=max?Number(n[key]):null;
  let kcal=nutrient('energy-kcal_100g',1200);if(kcal===null){const kj=nutrient('energy-kj_100g',5021)??(n.energy_unit==='kJ'?nutrient('energy_100g',5021):null);if(kj!==null){kcal=Number((kj/4.184).toFixed(2));warnings.push('Calories converted from the database kJ value. Check your pack.');}}
  const nutrition={kcal,p:nutrient('proteins_100g',100),c:nutrient('carbohydrates_100g',100),f:nutrient('fat_100g',100),source:'label'};
  Object.assign(nutrition,root.FoodNutrientsCore?.off(n,p.no_nutrition_data===true||p.no_nutrition_data==='on')||{});
  if(p.no_nutrition_data===true||p.no_nutrition_data==='on'){for(const key of ['kcal','p','c','f'])nutrition[key]=null;}
  if(p.obsolete===1||p.obsolete==='on')warnings.push('This database entry is marked obsolete. Confirm the current pack.');
  if(nutrition.kcal===null)warnings.push('Calories are missing or invalid. Enter the pack value before logging.');
  if(['p','c','f'].some(key=>nutrition[key]===null))warnings.push('Some macros are missing. Leave them unknown or copy them from the pack.');
  warnings.push('Community product data can differ from your pack. Confirm the product, values and g/ml basis.');
  const measuredPack=root.FoodNutrientsCore?.measure(p.product_quantity,p.product_quantity_unit),unit=p.nutrition_data_per==='100ml'||measuredPack?.unit==='ml'?'ml':'g';
  const measuredServing=root.FoodNutrientsCore?.fromText(p.serving_size)||(unit==='g'?root.FoodNutrientsCore?.measure(p.serving_quantity,'g'):null);
  const serving=root.FoodNutrientsCore?.portion({...measuredServing,label:text(p.serving_size,80)||'Serving'},unit),pack=root.FoodNutrientsCore?.portion({...measuredPack,label:'Whole pack'},unit);
  return {barcode,name:text(p.product_name_en)||text(p.product_name)||'',brand:text(p.brands),quantity:100,unit,nutrition,...(serving?{serving}:{}),...(pack?{pack}:{}),
   source:'Open Food Facts',sourceUrl:'https://world.openfoodfacts.org/product/'+barcode,license:'ODbL',warnings};
 }
 function provenance(raw){let barcode;try{barcode=code(raw?.barcode);}catch{return null;}if(raw.source==='Open Food Facts')return {barcode,source:'Open Food Facts',sourceUrl:'https://world.openfoodfacts.org/product/'+barcode,license:'ODbL'};return {barcode,source:'Pack label'};}
 root.BarcodeCore=Object.freeze({code,same,product,provenance});
})(globalThis);

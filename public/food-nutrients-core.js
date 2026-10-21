/* Optional label values. Missing values never become measured zeroes. */
(function(root){
 'use strict';
 const fields=[{key:'fiber',label:'Fibre',unit:'g',off:'fiber',scale:1},{key:'sugar',label:'Sugars',unit:'g',off:'sugars',scale:1},{key:'saturatedFat',label:'Saturates',unit:'g',off:'saturated-fat',scale:1},{key:'salt',label:'Salt',unit:'g',off:'salt',scale:1},{key:'sodium',label:'Sodium',unit:'mg',off:'sodium',scale:1000}];
 const known=value=>(typeof value==='number'||typeof value==='string'&&/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(value.trim()))&&Number.isFinite(Number(value))&&Number(value)>=0;
 function read(raw={},strict=false){const result={};for(const field of fields){if(!Object.hasOwn(raw,field.key))continue;const value=raw[field.key];if(value==null||value===''){result[field.key]=null;continue;}if(!known(value)||Number(value)>100000){if(strict)throw new Error('Enter a valid '+field.label.toLowerCase()+' value, or leave it blank.');result[field.key]=null;}else result[field.key]=Number(value);}return result;}
 function off(raw={},missing=false){return Object.fromEntries(fields.map(field=>{const value=raw[field.off+'_100g'];return [field.key,!missing&&known(value)&&Number(value)<=100?Number(value)*field.scale:null];}));}
 function scale(raw,factor){return Object.fromEntries(Object.entries(read(raw)).map(([key,value])=>[key,value===null?null:value*factor]));}
 function portion(raw,unit){if(!raw||typeof raw!=='object'||!known(raw.quantity)||Number(raw.quantity)<=0||Number(raw.quantity)>100000||raw.unit!==unit)return null;return {quantity:Number(raw.quantity),unit,label:typeof raw.label==='string'?raw.label.trim().slice(0,80):'Serving'};}
 function measure(quantity,unit){if(!known(quantity)||Number(quantity)<=0)return null;const factor={g:1,kg:1000,ml:1,l:1000}[String(unit||'').toLowerCase()];return factor?{quantity:Number(quantity)*factor,unit:['ml','l'].includes(String(unit).toLowerCase())?'ml':'g'}:null;}
 function fromText(value){const match=typeof value==='string'&&value.match(/(?:^|[\s(])([0-9]+(?:[.,][0-9]+)?)\s*(kg|ml|g|l)\b/i);return match?measure(match[1].replace(',','.'),match[2]):null;}
 root.FoodNutrientsCore=Object.freeze({fields,read,off,scale,portion,measure,fromText});
})(globalThis);

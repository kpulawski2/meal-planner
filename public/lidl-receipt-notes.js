/* Sanitised shopper observations. No receipt image, payment or transaction data. */
(function(root){
 'use strict';
 const lines=[
  {productName:'Carrier bag',packs:2,unitPriceGBP:.40,paidGBP:.80,food:false},
  {productName:'Chopped Tomatoes',ingredient:'Chopped tomatoes',packs:2,unitPriceGBP:.43,paidGBP:.86},
  {productName:'Teriyaki Sauce',ingredient:'Teriyaki sauce',packs:1,unitPriceGBP:1.39,paidGBP:1.39},
  {productName:'50% Lighter Mature Cheese',ingredient:'50% lighter mature cheese',packs:1,unitPriceGBP:2.45,paidGBP:2.45},
  {productName:'Lighter Mayonnaise',ingredient:'Lighter mayonnaise',packs:1,unitPriceGBP:.95,paidGBP:.95},
  {productName:'Natural Skyr',ingredient:'Skyr',packs:1,unitPriceGBP:1.49,paidGBP:1.49,packQuantity:450,packUnit:'g',confirmedPack:true,storage:'Fridge'},
  {productName:'Chicken Breast (frozen)',ingredient:'Frozen chicken breast',packs:1,unitPriceGBP:4.25,paidGBP:4.25,packQuantity:1000,packUnit:'g',confirmedPack:true,storage:'Freezer'},
  {productName:'Loose Carrots',ingredient:'Carrot',packs:1,unitPriceGBP:.60,paidGBP:.60,packQuantity:864,packUnit:'g',confirmedPack:true,pricePerKgGBP:.69},
  {productName:'Cucumber',ingredient:'Cucumber',packs:1,unitPriceGBP:.99,paidGBP:.99,packQuantity:1,packUnit:'pieces',confirmedPack:true},
  {productName:'Sweetcorn Supersweet',ingredient:'Sweetcorn',packs:1,unitPriceGBP:1.65,paidGBP:1.65},
  {productName:'HighProtein Chargrilled',packs:1,unitPriceGBP:2.99,paidGBP:2.99,needsIdentity:true},
  {productName:'Deluxe Easy Peelers',ingredient:'Easy peelers',packs:1,unitPriceGBP:1.59,paidGBP:1.59},
  {productName:'Sandwich Gherkins Slices',ingredient:'Sliced gherkins',packs:1,unitPriceGBP:1.79,paidGBP:1.79},
  {productName:'Pickled Gherkins',ingredient:'Pickled gherkins',packs:1,unitPriceGBP:1.19,paidGBP:1.19},
  {productName:'Sesame Oil',ingredient:'Sesame oil',packs:1,unitPriceGBP:1.15,paidGBP:1.15,regularPriceGBP:1.99,discountGBP:.84},
  {productName:'Rice Vinegar',ingredient:'Rice vinegar',packs:1,unitPriceGBP:1.15,paidGBP:1.15,regularPriceGBP:1.99,discountGBP:.84},
  {productName:'Free-range mixed eggs (6)',receiptLabel:'6 Minimum Net Weight',ingredient:'Eggs',packs:2,unitPriceGBP:.99,paidGBP:1.98,packQuantity:6,packUnit:'pieces',confirmedPack:true,storage:'Fridge'},
  {productName:'High Protein BBQ Pizza',packs:1,unitPriceGBP:2.99,paidGBP:2.99},
  {productName:'Bananas Loose',ingredient:'Banana',packs:1,unitPriceGBP:2.22,paidGBP:2.22,packQuantity:2472,packUnit:'g',confirmedPack:true,pricePerKgGBP:.90},
  {productName:'Golden Delicious',ingredient:'Apple',packs:1,unitPriceGBP:1.59,paidGBP:1.59},
  {productName:'Tuna Chunks in Brine',ingredient:'Tuna',packs:24,unitPriceGBP:.59,paidGBP:14.16,packQuantity:100,packUnit:'g',quantityKind:'drained',confirmedPack:true}
 ];
 root.LidlReceiptNotes=Object.freeze({id:'lidl-2026-10-17',date:'2026-10-17',store:'Lidl',location:'Sheffield',source:'Shopper receipt and shopper-confirmed pack sizes',
  receiptTotalGBP:48.33,transcribedTotalGBP:48.23,unreconciledGBP:.10,
  lines:Object.freeze(lines.map((line,i)=>Object.freeze({id:String(i),...line}))) });
})(globalThis);

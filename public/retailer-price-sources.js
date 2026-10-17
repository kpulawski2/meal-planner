(function (root) {
  'use strict';
  const comparison = 'https://digitalcontent.api.tesco.com/v2/media/ghs-mktg/bb2fb14a-260a-418b-b2ac-7e7ce4f63dd5/APM%2BExpress%2Band%2BAPM%2BLarge%2BStore%2BOnline%2BVerification%2BForm%2B09052026.pdf';
  function aldiSource(value) {
    try {
      const url = new URL(value);
      if (url.protocol !== 'https:' || url.username || url.password || url.port || url.search) return false;
      return url.hostname === 'www.aldi.co.uk' && /^\/product\/[a-z0-9-]+-\d+$/.test(url.pathname) && !url.hash ||
        url.href.split('#')[0] === comparison && /^#page=(?:[1-9]|1[0-5])$/.test(url.hash);
    } catch { return false; }
  }
  function aldiProduct(product, store) {
    return ['Aldi', 'Lidl'].includes(store) && product?.sourceStore === 'Aldi' && product.estimatedPrice === true &&
      product.priceBasis === (store === 'Lidl' ? 'aldi_estimate' : 'aldi_reference') && aldiSource(product.url) &&
      product.priceSourceUrl === product.url && /^\d{4}-\d{2}-\d{2}$/.test(product.sourceDate || '');
  }
  function otherStoreProduct(product,store){try{const url=new URL(product.url);return ['Lidl','Aldi'].includes(store)&&product.priceBasis==='other_store'&&product.sourceStore==='Asda'&&product.estimatedPrice===true&&product.priceSourceUrl===product.url&&url.protocol==='https:'&&!url.username&&!url.password&&!url.port&&url.hostname==='www.asda.com'&&/^\/groceries\/product\/family-cereals\/[^/]+\/9184193$/.test(url.pathname)&&product.productName==='FUEL10K Chocolate Multigrain Flakes High Protein Breakfast Cereal'&&product.packQuantity===350&&product.packUnit==='g'&&product.priceGBP===2.5;}catch{return false;}}
  root.RetailerPriceSources = { aldiSource, aldiProduct,otherStoreProduct };
})(typeof window !== 'undefined' ? window : globalThis);

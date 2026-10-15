/* Isolated public-site check: select the supplied branch, then observe the
   website's own category requests. No account, credentials or price writes. */
import { mkdir, writeFile } from 'node:fs/promises';
const { chromium } = await import(process.env.LIDL_PLAYWRIGHT_MODULE);
const folder = 'work/lidl-category-audit';await mkdir(folder,{recursive:true});
const report={checkedAt:new Date().toISOString(),store:'Alison Crescent, Sheffield S2 1AS',selected:false,requests:[],responses:[],prices:{}};
const browser=await chromium.launch({executablePath:process.env.LIDL_CHROME_PATH||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
try {
 const context=await browser.newContext({locale:'en-GB',timezoneId:'Europe/London',viewport:{width:1440,height:1000}}),page=await context.newPage();let phase='before';
 page.on('response',async response=>{try{const url=new URL(response.url());if(url.hostname==='www.lidl.co.uk'&&url.pathname==='/q/api/search'){const at=phase,data=await response.json();report.responses.push({phase:at,total:data.numFound,products:(data.items||[]).map(item=>({id:item.code,price:item.gridbox?.data?.price?.price??null,memberPrices:(item.gridbox?.data?.lidlPlus||[]).map(row=>row.price?.price)}))});}}catch{}});
 page.on('request',request=>{const url=new URL(request.url());if(url.hostname==='www.lidl.co.uk'&&(/\/q\/(?:api|search)/.test(url.pathname))){report.requests.push({phase,path:url.pathname,parameters:Object.fromEntries([...url.searchParams].filter(([key])=>/store|region|assortment|locale|category|pageId|wonCategory/i.test(key)))});}});
 const settle=()=>page.waitForTimeout(2500);
 async function rejectOptionalCookies(){const button=page.locator('#onetrust-reject-all-handler');if(await button.isVisible().catch(()=>false))await button.click();}
 async function snapshot(label){await settle();await page.getByText('Load more products',{exact:true}).first().click({timeout:5000}).catch(()=>{});await settle();report.prices[label]=await page.evaluate(()=>Array.from(document.querySelectorAll('[data-product-id]')).slice(0,50).map(el=>({id:el.getAttribute('data-product-id'),text:el.textContent.replace(/\s+/g,' ').slice(0,350)})));await page.screenshot({path:folder+'/store-'+label+'.png',fullPage:false});}
 await page.goto('https://www.lidl.co.uk/c/food-drink/s10068374',{waitUntil:'domcontentloaded',timeout:60000});await rejectOptionalCookies();await snapshot('before');
 phase='selection';await page.evaluate(()=>scrollTo(0,0));report.selectorHit=await page.evaluate(()=>({tag:document.elementFromPoint(260,42)?.tagName,classes:document.elementFromPoint(260,42)?.className}));await page.mouse.click(260,42);await settle();
 report.selectorFrames=page.frames().map(frame=>frame.url()).filter(url=>url.includes('lidl.co.uk'));
 const selector=page.frames().find(frame=>frame!==page.mainFrame()&&frame.url().includes('/s/'));
 if(!selector)throw new Error('The store selector did not expose a store-finder frame.');
 await selector.goto('https://www.lidl.co.uk/s/en-GB/store-finder/sheffield/alison-crescent/'+new URL(selector.url()).search,{waitUntil:'domcontentloaded',timeout:60000});
 await selector.getByRole('button',{name:'Set as favourite store Alison Crescent, Sheffield S2 1AS',exact:true}).click({timeout:30000});await settle();
 phase='after';await page.goto('https://www.lidl.co.uk/c/food-drink/s10068374',{waitUntil:'domcontentloaded',timeout:60000});await rejectOptionalCookies();await snapshot('after');
 report.selected=await page.locator('header').innerText().then(text=>text.includes('Alison Crescent')).catch(()=>false);
 report.selectedStoreVisible=await page.getByText('Alison Crescent, Sheffield',{exact:false}).count();
 report.storageKeyNames=await page.evaluate(()=>Object.keys(localStorage).filter(key=>/store|region/i.test(key)));
 report.note='Selecting a store and observing offers does not verify every local shelf price or stock quantity.';
} catch(error){report.error=String(error.message).slice(0,1600);}
finally{await writeFile(folder+'/store-browser-audit.json',JSON.stringify(report,null,2)+'\n');await browser.close();}
console.log(JSON.stringify({selected:report.selected,error:report.error,requests:report.requests.length,storageKeyNames:report.storageKeyNames}));

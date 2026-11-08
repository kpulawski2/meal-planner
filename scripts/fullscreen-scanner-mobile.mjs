import assert from 'node:assert/strict';
import path from 'node:path';

export async function fullscreenScannerChecks(page,output){
 const stateBefore=await page.evaluate(()=>JSON.stringify([state.week,state.mealServings,state.foodLog,state.pantry,state.pantryLedger]));
 await page.addScriptTag({url:'/vendor/zxing-browser-0.1.5.min.js'});
 const decoded=await page.evaluate(()=>{
  const code='4006381333931',left=['0001101','0011001','0010011','0111101','0100011','0110001','0101111','0111011','0110111','0001011'],g=['0100111','0110011','0011011','0100001','0011101','0111001','0000101','0010001','0001001','0010111'],right=left.map(bits=>bits.replace(/[01]/g,x=>x==='0'?'1':'0')),parity=['LLLLLL','LLGLGG','LLGGLG','LLGGGL','LGLLGG','LGGLLG','LGGGLL','LGLGLG','LGLGGL','LGGLGL'];let bits='101';for(let i=1;i<=6;i++)bits+=(parity[Number(code[0])][i-1]==='L'?left:g)[Number(code[i])];bits+='01010';for(let i=7;i<=12;i++)bits+=right[Number(code[i])];bits+='101';
  function draw(canvas,x,y,rotation=0){const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.save();ctx.translate(x,y);ctx.rotate(rotation);ctx.fillStyle='#000';[...bits].forEach((bit,i)=>{if(bit==='1')ctx.fillRect(i*2,0,2,76);});ctx.restore();}
  function decode(canvas){const reader=new ZXingBrowser.BrowserMultiFormatReader(BarcodeScanCore.hints());for(let phase=0;phase<BarcodeScanCore.regions.length*2;phase++){const frame=BarcodeScanCore.frame(canvas,Math.floor(phase/2));try{return {code:reader.decodeFromCanvas(phase%2?BarcodeScanCore.rotate(frame):frame).getText(),attempt:phase};}catch{}}return null;}
  const cases=[],canvas=document.createElement('canvas');
  // All nine regions, including near every edge, use the real bundled decoder.
  for(const [width,height] of [[1920,1080],[1080,1920]]){canvas.width=width;canvas.height=height;for(const x of [28,(width-190)/2,width-218])for(const y of [24,(height-76)/2,height-100]){draw(canvas,x,y);cases.push({width,height,x,y,...decode(canvas)});}}
  canvas.width=1080;canvas.height=1920;draw(canvas,1048,24,Math.PI/2);cases.push({vertical:true,...decode(canvas)});
  window.scannerFixture={canvas,draw};return cases;
 });
 assert.equal(decoded.length,19);assert.ok(decoded.every(row=>row.code==='4006381333931'),JSON.stringify(decoded));
 // Hold permission while checking the complete camera layout and cancellation.
 await page.evaluate(()=>{
  window.savedMediaDescriptor=Object.getOwnPropertyDescriptor(navigator,'mediaDevices');window.savedBarcodeDetector=window.BarcodeDetector;
  Object.defineProperty(navigator,'mediaDevices',{configurable:true,value:{getUserMedia:()=>new Promise(resolve=>{window.allowScannerCamera=resolve;}),enumerateDevices:async()=>[]}});
  window.nativeCaptures=[];window.BarcodeDetector=class {static async getSupportedFormats(){return ['ean_13','ean_8','upc_a'];}async detect(source){nativeCaptures.push({width:source.width,height:source.height,tag:source.tagName});return [];}};
  BarcodeUI.open(FoodLogCore.localDate(),'Lunch');
 });
 await page.getByRole('button',{name:'Use camera',exact:true}).click();await page.locator('.modal.barcode-fullscreen').waitFor();
 const layouts=[];
 for(const [width,height] of [[320,700],[390,844],[844,390],[1440,900]]){
  await page.setViewportSize({width,height});const bounds=await page.locator('#barcodeViewfinder').boundingBox(),video=await page.locator('#barcodeVideo').boundingBox();assert.ok(Math.abs(bounds.width-width)<2&&Math.abs(bounds.height-height)<2,JSON.stringify(bounds));assert.ok(Math.abs(video.width-width)<2&&Math.abs(video.height-height)<2);assert.equal(await page.locator('.barcode-frame').count(),0);assert.equal(await page.locator('#barcodeCameraClose').isVisible(),true);assert.equal(await page.locator('.barcode-live-actions').getByRole('button',{name:'Type code',exact:true}).isVisible(),true);assert.equal(await page.locator('#sheet>.close').isVisible(),false);layouts.push({width,height,fullScreen:true});
 }
 await page.setViewportSize({width:390,height:844});
 await page.evaluate(()=>{const canvas=scannerFixture.canvas,ctx=canvas.getContext('2d');ctx.fillStyle='#b4c8d8';ctx.fillRect(0,0,canvas.width,canvas.height);const stream=canvas.captureStream(10);window.lastScannerTrack=stream.getVideoTracks()[0];allowScannerCamera(stream);});
 await page.waitForFunction(()=>document.getElementById('barcodeVideo').readyState>=2&&nativeCaptures.length>0);const capture=await page.evaluate(()=>nativeCaptures.at(-1));assert.equal(capture.tag,'CANVAS');assert.ok(Math.abs(capture.width/capture.height-390/844)<.002);assert.equal(await page.locator('#modal').getAttribute('aria-labelledby'),'barcodeLiveHeading');await page.screenshot({path:path.join(output,'full-screen-camera.png')});
 await page.locator('.barcode-live-actions').getByRole('button',{name:'Type code',exact:true}).click();assert.equal(await page.locator('.modal.barcode-fullscreen').count(),0);assert.equal(await page.evaluate(()=>lastScannerTrack.readyState),'ended');assert.equal(await page.locator('#barcodeNumber').evaluate(el=>el===document.activeElement),true);
 // A permission result arriving after close must not restart the camera.
 await page.getByRole('button',{name:'Use camera',exact:true}).click();await page.getByRole('button',{name:'Close camera',exact:true}).click();await page.evaluate(()=>{const stream=scannerFixture.canvas.captureStream(10);window.lastScannerTrack=stream.getVideoTracks()[0];allowScannerCamera(stream);});await page.waitForFunction(()=>lastScannerTrack.readyState==='ended');assert.equal(await page.locator('#modal').isVisible(),false);
 // Actual live canvas video, a corner barcode and the fallback decoder.
 await page.route('**/api/foods/barcode/4006381333931',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({status:'found',product:{barcode:'4006381333931',name:'Full-screen scan fixture',quantity:100,unit:'g',nutrition:{kcal:100,p:20,c:4,f:1},source:'Pack label'}})}));
 await page.evaluate(()=>{
  window.BarcodeDetector=undefined;const canvas=scannerFixture.canvas;canvas.width=1080;canvas.height=1920;scannerFixture.draw(canvas,124,32);const stream=canvas.captureStream(10);window.lastScannerTrack=stream.getVideoTracks()[0];navigator.mediaDevices.getUserMedia=async()=>stream;BarcodeUI.open(FoodLogCore.localDate(),'Lunch');
 });
 await page.getByRole('button',{name:'Use camera',exact:true}).click();await page.getByRole('heading',{name:'Review scanned food',exact:true}).waitFor();assert.equal(await page.locator('#diaryName').inputValue(),'Full-screen scan fixture');assert.equal(await page.locator('#diaryMeal').inputValue(),'Lunch');assert.equal(await page.locator('.modal.barcode-fullscreen').count(),0);assert.equal(await page.evaluate(()=>lastScannerTrack.readyState),'ended');await page.locator('#sheet .close').click();
 await page.evaluate(()=>{if(savedMediaDescriptor)Object.defineProperty(navigator,'mediaDevices',savedMediaDescriptor);else delete navigator.mediaDevices;window.BarcodeDetector=savedBarcodeDetector;});
 assert.equal(await page.evaluate(()=>JSON.stringify([state.week,state.mealServings,state.foodLog,state.pantry,state.pantryLedger])),stateBefore);
 return {fullScreenLayouts:layouts,decodedLocations:decoded.length,cornerLiveVideo:true,manualExit:true,cameraCleanup:true,noAutomaticLogging:true};
}

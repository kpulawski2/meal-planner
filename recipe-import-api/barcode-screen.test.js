import test from 'node:test';
import assert from 'node:assert/strict';
import '../public/barcode-core.js';
import '../public/barcode-scan-core.js';
const core=globalThis.BarcodeScanCore;
test('the scanned camera frame matches all visible pixels when the preview fills a different screen shape',()=>{
 assert.deepEqual(core.visible({width:1920,height:1080},{width:400,height:800}),{x:690,y:0,width:540,height:1080});
 assert.deepEqual(core.visible({width:1080,height:1920},{width:500,height:500}),{x:0,y:420,width:1080,height:1080});
 assert.deepEqual(core.visible({width:1920,height:1080}),{x:0,y:0,width:1920,height:1080});assert.throws(()=>core.visible({width:0,height:0}),/not ready/);
});
test('every additional camera crop stays within the visible preview and full-frame photo reads keep the entire source',()=>{
 const source={width:1920,height:1080},viewport={width:400,height:800},visible=core.visible(source,viewport),calls=[],canvas={getContext:()=>({drawImage:(...args)=>calls.push(args)})};
 for(let phase=0;phase<core.regions.length;phase++){core.frame(source,phase,canvas,viewport);const [original,x,y,width,height]=calls.at(-1);assert.equal(original,source);assert.ok(x>=visible.x&&y>=visible.y);assert.ok(x+width<=visible.x+visible.width&&y+height<=visible.y+visible.height);assert.ok(canvas.width<=1920&&canvas.height<=1920);}
 core.frame(source,0,canvas);assert.deepEqual(calls.at(-1).slice(1,5),[0,0,1920,1080]);
});

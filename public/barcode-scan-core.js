/* EAN/UPC capture settings for the bundled ZXing 0.1.5 decoder. */
(function(root){
 'use strict';
 // Enum values verified against the locally bundled ZXing source.
 const formats=Object.freeze([7,6,14,15,8]);
 function hints(){return new Map([[2,[...formats]],[3,true]]);}
 function constraints(deviceId){return {audio:false,video:{...(deviceId?{deviceId:{exact:deviceId}}:{facingMode:{ideal:'environment'}}),width:{ideal:1920},height:{ideal:1080},frameRate:{ideal:15,max:30}}};}
 function cameras(devices){return (devices||[]).filter(row=>row.kind==='videoinput').map((row,index)=>({id:row.deviceId,label:row.label||'Camera '+(index+1),score:/front|facetime|selfie/i.test(row.label)?-30:/ultra|0[.,]5|telephoto/i.test(row.label)?-5:/back|rear|environment|wide/i.test(row.label)?10:0})).sort((a,b)=>b.score-a.score);}
 function frame(source,phase=0,canvas){
  const width=Number(source.videoWidth||source.naturalWidth||source.width),height=Number(source.videoHeight||source.naturalHeight||source.height);if(!(width>0&&height>0))throw new Error('Camera image is not ready.');
  const crop=[1,.8,.5][phase%3],w=width*crop,h=height*(crop===1?1:.8),scale=Math.min(2,1920/w,1440/h),target=canvas||document.createElement('canvas');target.width=Math.max(1,Math.round(w*scale));target.height=Math.max(1,Math.round(h*scale));
  const context=target.getContext('2d',{willReadFrequently:true});context.drawImage(source,(width-w)/2,(height-h)/2,w,h,0,0,target.width,target.height);return target;
 }
 function rotate(source,canvas){const target=canvas||document.createElement('canvas');target.width=source.height;target.height=source.width;const ctx=target.getContext('2d',{willReadFrequently:true});ctx.translate(target.width,0);ctx.rotate(Math.PI/2);ctx.drawImage(source,0,0);return target;}
 function zoom(capabilities,settings={}){const range=capabilities?.zoom;if(!range||!Number.isFinite(range.min)||!Number.isFinite(range.max)||range.max<=range.min)return null;const max=Math.min(range.max,Math.max(4,range.min));return {min:range.min,max,step:Math.max(.1,Number(range.step)||.1),value:Math.max(range.min,Math.min(max,Number(settings.zoom)||1))};}
 function value(raw,format){let code=String(raw||'');if(format===15||format==='upc_e'){if(!/^[01]\d{7}$/.test(code))throw new Error('Unsupported UPC-E barcode.');const [ns,a,b,c,d,e,last,check]=code;code=['0','1','2'].includes(last)?ns+a+b+last+'0000'+c+d+e+check:last==='3'?ns+a+b+c+'00000'+d+e+check:last==='4'?ns+a+b+c+d+'00000'+e+check:ns+a+b+c+d+e+'0000'+last+check;}return root.BarcodeCore.code(code);}
 root.BarcodeScanCore=Object.freeze({formats,hints,constraints,cameras,frame,rotate,zoom,value});
})(globalThis);

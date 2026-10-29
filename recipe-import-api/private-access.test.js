import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import {createPrivateAccess} from './private-access.js';
const password='Test fixture password only 2026';
async function fixture(t,options={password}){
 const app=express();app.use(createPrivateAccess(options));app.all('/api/secret',(_q,s)=>s.json({ok:true}));app.get('/',(_q,s)=>s.send('planner'));app.get('/asset.js',(_q,s)=>s.send('code'));
 const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));t.after(()=>{server.closeAllConnections();return new Promise(r=>server.close(r));});
 const origin=`http://127.0.0.1:${server.address().port}`;
 const request=(path,options={})=>fetch(origin+path,{redirect:'manual',...options});
 const login=(value=password,headers={})=>request('/private/login',{method:'POST',headers:{origin,'content-type':'application/x-www-form-urlencoded',...headers},body:new URLSearchParams({password:value})});
 return {request,login,origin};
}
test('public mode remains unchanged until private access is explicitly configured',async t=>{
 const {request}=await fixture(t,{password:''});assert.equal(await(await request('/')).text(),'planner');assert.equal((await request('/api/secret')).status,200);
 assert.throws(()=>createPrivateAccess({password:'weak'}),/16–256/);
});
test('private mode blocks app assets, API and importer-token bypass while retaining minimal health',async t=>{
 const {request}=await fixture(t);for(const path of ['/','/asset.js']){const r=await request(path);assert.equal(r.status,303);assert.equal(r.headers.get('location'),'/private/login');assert.match(r.headers.get('cache-control'),/no-store/);}
 const api=await request('/api/secret',{headers:{'x-import-token':'an-old-importer-token'}});assert.equal(api.status,401);assert.equal((await api.json()).signInUrl,'/private/login');assert.deepEqual(await(await request('/health')).json(),{ok:true,service:'meal-planner'});
});
test('only a correct same-origin password creates a secure persistent session; API and assets accept it',async t=>{
 const {request,login}=await fixture(t);assert.equal((await login('wrong')).status,401);assert.equal((await login(password,{origin:'https://evil.example'})).status,403);
 const r=await login();assert.equal(r.status,303);const header=r.headers.get('set-cookie');assert.match(header,/Secure; HttpOnly; SameSite=Strict/);assert.match(header,/Max-Age=2592000/);const cookie=header.split(';')[0];
 for(const path of ['/','/asset.js','/api/secret'])assert.equal((await request(path,{headers:{cookie}})).status,200,path);
 assert.equal((await request('/api/secret',{headers:{cookie:cookie+'forged'}})).status,401);
 const logout=await request('/private/logout',{method:'POST',headers:{origin: 'https://evil.example',cookie}});assert.equal(logout.status,403);
});
test('sessions expire, password changes invalidate them, and logout removes the host cookie',async t=>{
 let at=1800000000000;const {request,login,origin}=await fixture(t,{password,now:()=>at,sessionMs:1000});const cookie=(await login()).headers.get('set-cookie').split(';')[0];assert.equal((await request('/api/secret',{headers:{cookie}})).status,200);
 at+=1001;assert.equal((await request('/api/secret',{headers:{cookie}})).status,401);
 const other=await fixture(t,{password:password+' changed',now:()=>at-1001});assert.equal((await other.request('/api/secret',{headers:{cookie}})).status,401);
 const out=await request('/private/logout',{method:'POST',headers:{origin,cookie}});assert.match(out.headers.get('set-cookie'),/Max-Age=0/);
});
test('repeated guesses are bounded before expensive password work',async t=>{
 const {login}=await fixture(t);for(let i=0;i<5;i++)assert.equal((await login('wrong')).status,401);const response=await login();assert.equal(response.status,429);assert.equal(response.headers.get('retry-after'),'900');assert.equal(response.headers.get('set-cookie'),null);
});

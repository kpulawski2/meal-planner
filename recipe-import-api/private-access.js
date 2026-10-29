import crypto from 'node:crypto';
import express from 'express';

const COOKIE = '__Host-mealplanner_session';
const equal = (a,b) => a.length === b.length && crypto.timingSafeEqual(a,b);
const digest = value => crypto.scryptSync(value, 'meal-planner-private-access-v1', 32);
const page = failed => `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Private Meal Planner</title><style>body{margin:0;background:#111c2c;color:#edf4ff;font:18px system-ui;display:grid;min-height:100dvh;place-items:center}main{max-width:24rem;padding:2rem}h1{font-size:2rem}label,input,button{display:block;box-sizing:border-box;width:100%}input,button{font:inherit;padding:.8rem;border-radius:.7rem;margin:.7rem 0 1.2rem}button{background:#a9ccf5;border:0;color:#111c2c;font-weight:700}p{line-height:1.5}label{font-weight:600}</style><main><h1>Your private kitchen</h1><p>Sign in to open Meal Planner.</p>${failed?'<p role="alert">Unable to sign in. Check your password or try again later.</p>':''}<form action="/private/login" method="post"><label for="password">Password</label><input id="password" name="password" type="password" autocomplete="current-password" required maxlength="256"><button>Open Meal Planner</button></form></main></html>`;

// Disabled until a password is explicitly configured. No password is shipped
// in the iPhone binary, JavaScript, repository, API responses or logs.
export function createPrivateAccess({password='',now=Date.now,sessionMs=30*86400000}={}) {
  if (!password) return (_req,_res,next)=>next();
  if (password.length < 16 || password.length > 256) throw new Error('PRIVATE_APP_PASSWORD must contain 16–256 characters.');
  const expected=digest(password),key=crypto.createHmac('sha256',expected).update('session-signing-v1').digest(),attempts=new Map();
  const sign=value=>crypto.createHmac('sha256',key).update(value).digest('base64url');
  const cookie=value=>`${COOKIE}=${value}; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=${value?Math.floor(sessionMs/1000):0}`;
  const signedIn=req=>{
    const value=(req.get('cookie')||'').split(';').map(x=>x.trim()).find(x=>x.startsWith(COOKIE+'='))?.slice(COOKIE.length+1);
    if(!value||value.length>256)return false;
    const [expires,nonce,signature,...extra]=value.split('.'),body=expires+'.'+nonce;
    if(extra.length||!/^\d{10,16}$/.test(expires)||!nonce||!signature||Number(expires)<=now()||Number(expires)>now()+sessionMs)return false;
    return equal(Buffer.from(signature),Buffer.from(sign(body)));
  };
  const router=express.Router();
  router.use((_req,res,next)=>{res.set('Cache-Control','no-store');res.set('X-Robots-Tag','noindex, nofollow');res.set('X-Frame-Options','DENY');res.set('X-Content-Type-Options','nosniff');next();});
  router.get('/health',(_req,res)=>res.json({ok:true,service:'meal-planner'}));
  router.get('/private/login',(_req,res)=>res.set('Content-Security-Policy',"default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'").type('html').send(page(false)));
  const sameOrigin=(req,res,next)=>{
    if(req.get('origin')!==`${req.protocol}://${req.get('host')}`)return res.status(403).json({error:'Open Meal Planner to sign in.'});
    next();
  };
  router.post('/private/login',sameOrigin,express.urlencoded({extended:false,limit:'2kb'}),(req,res)=>{
    const at=now(),windowMs=15*60000,id=req.ip||req.socket.remoteAddress||'unknown';
    for(const [ip,hits] of attempts)if(at-hits.at(-1)>=windowMs)attempts.delete(ip);
    const hits=(attempts.get(id)||[]).filter(t=>at-t<windowMs);
    if(hits.length>=5||!attempts.has(id)&&attempts.size>=5000)return res.set('Retry-After','900').status(429).type('html').send(page(true));
    hits.push(at);attempts.set(id,hits);
    const supplied=req.body?.password;
    if(typeof supplied!=='string'||supplied.length>256||!equal(digest(supplied),expected))return res.status(401).type('html').send(page(true));
    attempts.delete(id);
    const body=String(now()+sessionMs)+'.'+crypto.randomBytes(16).toString('base64url');
    return res.set('Set-Cookie',cookie(body+'.'+sign(body))).redirect(303,'/');
  });
  router.post('/private/logout',sameOrigin,(_req,res)=>res.set('Set-Cookie',cookie('')).redirect(303,'/private/login'));
  router.use((req,res,next)=>{
    if(signedIn(req))return next();
    if(req.path.startsWith('/api/'))return res.status(401).json({error:'Sign in to your private Meal Planner.',signInUrl:'/private/login'});
    return res.redirect(303,'/private/login');
  });
  return router;
}

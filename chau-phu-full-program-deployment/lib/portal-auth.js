'use strict';
// Supabase Auth issues and validates all credentials. No service-role key is used.
// The user's access token also identifies every database RPC, so bypassing this
// HTTP layer cannot bypass the database's role and assignment checks.
class PortalError extends Error {
  constructor(code, status=400) { super(code); this.code=code; this.status=status; }
}
function config() {
  const url=process.env.SUPABASE_URL, key=process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;
  if(!url || !key) throw new PortalError('NOT_CONFIGURED',503);
  const parsed=new URL(url);
  if(parsed.protocol!=='https:' && !['localhost','127.0.0.1'].includes(parsed.hostname)) throw new PortalError('NOT_CONFIGURED',503);
  return {url:parsed.origin,key};
}
function enabled() { return !!(process.env.SUPABASE_URL || process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.PORTAL_REQUIRE_AUTH==='1'); }
function secure(req) {return process.env.VERCEL==='1' || req.headers['x-forwarded-proto']==='https';}
function cookieNames(req) {const prefix=secure(req)?'__Host-':'';return {access:prefix+'mekong-access',refresh:prefix+'mekong-refresh'};}
function cookies(req) {
  const result={};
  for(const piece of (req.headers.cookie||'').split(';')) {
    const i=piece.indexOf('=');if(i<0)continue;
    try {result[piece.slice(0,i).trim()]=decodeURIComponent(piece.slice(i+1));} catch {}
  }
  return result;
}
function setSession(req,res,session) {
  const names=cookieNames(req),flags='; Path=/; HttpOnly; SameSite=Lax'+(secure(req)?'; Secure':'');
  res.setHeader('Set-Cookie',[
    `${names.access}=${encodeURIComponent(session?.access_token||'')}; Max-Age=${session?2592000:0}${flags}`,
    `${names.refresh}=${encodeURIComponent(session?.refresh_token||'')}; Max-Age=${session?2592000:0}${flags}`
  ]);
}
function privateHeaders(res) {
  res.setHeader('Cache-Control','private, no-store, max-age=0');
  res.setHeader('CDN-Cache-Control','no-store');
  res.setHeader('Vercel-CDN-Cache-Control','no-store');
  res.setHeader('Vary','Cookie');res.setHeader('X-Content-Type-Options','nosniff');
}
function checkMutation(req) {
  const origin=req.headers.origin,host=req.headers.host;
  // Browsers must supply an exact same-origin Origin and a non-simple header.
  let matches=false;try {matches=new URL(origin).origin===`${secure(req)?'https':'http'}://${host}`;}catch {}
  if(!matches || req.headers['x-mekong-request']!=='1' || !/^application\/json(?:;|$)/i.test(req.headers['content-type']||'')) throw new PortalError('BAD_ORIGIN',403);
}
function body(req) {
  let value=req.body;
  if(typeof value==='string') {try {value=JSON.parse(value);} catch {throw new PortalError('INVALID_INPUT');}}
  if(!value || Array.isArray(value) || typeof value!=='object' || Buffer.byteLength(JSON.stringify(value))>2000000) throw new PortalError('INVALID_INPUT');
  return value;
}
async function upstream(path,{method='GET',data,token,request}={}) {
  const {url,key}=config();
  const headers={apikey:key,'Content-Type':'application/json'};
  if(token)headers.Authorization='Bearer '+token;
  // Supabase's own project-wide Auth rate limits also apply to direct API calls.
  // Do not trust a caller-supplied forwarded IP for rate-limit exemptions.
  let response;
  try {response=await fetch(url+path,{method,headers,body:data===undefined?undefined:JSON.stringify(data),signal:AbortSignal.timeout(8000)});} catch {throw new PortalError('SERVICE_UNAVAILABLE',503);}
  const result=await response.json().catch(()=>({}));
  if(!response.ok) {
    const pg=result.code;
    const message=result.message||result.msg||result.error_description||'';
    const known=['AUTH_REQUIRED','APPROVAL_REQUIRED','FORBIDDEN','VERSION_CONFLICT','LAST_MANAGER','PILOT_FARMS_PROTECTED','DELIVERY_INVALID','TERMINAL_REQUEST','PLAN_CHANGED','VERIFY_BLOCKED','NOT_FOUND'];
    const authCodes={email_not_confirmed:'EMAIL_UNCONFIRMED',email_address_not_authorized:'MAIL_UNAVAILABLE',over_email_send_rate_limit:'EMAIL_RATE_LIMITED',over_request_rate_limit:'RATE_LIMITED',otp_expired:'CONFIRM_LINK_INVALID'};
    // Return only allowlisted categories, never raw SMTP/provider messages.
    const mailAction=/^\/auth\/v1\/(signup|recover|resend)(\?|$)/.test(path);
    const providerCode=path.startsWith('/auth/')?authCodes[pg]:null;
    const code=providerCode || known.find(x=>message===x) || (pg==='23505'?'DUPLICATE_REQUEST':pg==='40001'?'VERSION_CONFLICT':pg==='42501'?'FORBIDDEN':response.status===429?'RATE_LIMITED':response.status>=500?(mailAction?'MAIL_UNAVAILABLE':'SERVICE_UNAVAILABLE'):path.startsWith('/auth/')?'AUTH_FAILED':'INVALID_INPUT');
    const status=code==='MAIL_UNAVAILABLE'||code==='SERVICE_UNAVAILABLE'?503:code==='EMAIL_RATE_LIMITED'||code==='RATE_LIMITED'?429:code==='EMAIL_UNCONFIRMED'?401:pg==='40001'||pg==='23505'||code==='PLAN_CHANGED'?409:pg==='42501'?403:response.status>=500?503:response.status===401?401:400;
    throw new PortalError(code,status);
  }
  return result;
}
async function session(req,res) {
  const values=cookies(req),names=cookieNames(req);let access=values[names.access];
  if(access) {
    try {const user=await upstream('/auth/v1/user',{token:access});return {user,access};}
    catch(e) {if(e.status!==401 && e.code!=='AUTH_FAILED')throw e;}
  }
  if(values[names.refresh]) {
    try {
      const result=await upstream('/auth/v1/token?grant_type=refresh_token',{method:'POST',data:{refresh_token:values[names.refresh]}});
      if(!result.access_token || !result.user?.id)throw new PortalError('AUTH_REQUIRED',401);
      setSession(req,res,result);return {user:result.user,access:result.access_token};
    } catch(e) {if(e.status===503 || e.status===429)throw e;}
  }
  setSession(req,res,null);throw new PortalError('AUTH_REQUIRED',401);
}
function fail(res,error) {res.status(error.status||500).json({error:error.code||'SERVICE_UNAVAILABLE'});}
module.exports={PortalError,config,enabled,secure,cookieNames,cookies,setSession,privateHeaders,checkMutation,body,upstream,session,fail};

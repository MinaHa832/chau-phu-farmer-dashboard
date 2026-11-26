'use strict';
const auth=require('./portal-auth');
const cookieName=req=>(auth.secure(req)?'__Host-':'')+'mekong-demo';
function cookie(req,res,token='') {
  res.setHeader('Set-Cookie',`${cookieName(req)}=${encodeURIComponent(token)}; Max-Age=${token?28800:0}; Path=/; HttpOnly; SameSite=Lax${auth.secure(req)?'; Secure':''}`);
}
function token(req) {return auth.cookies(req)[cookieName(req)]||'';}
async function rpc(name,data) {
  try {return await auth.upstream('/rest/v1/rpc/mekong_demo_'+name,{method:'POST',data});}
  catch(e){if(e.code==='AUTH_REQUIRED')throw new auth.PortalError('AUTH_REQUIRED',401);throw e;}
}
async function enter(req,res,input) {
  const result=await rpc('enter',{role_name:input.role,assigned_farm:input.farmId||null,assigned_rmu:input.rmu||null});
  if(!/^[a-f0-9]{64}$/.test(result.sessionToken||''))throw new auth.PortalError('SERVICE_UNAVAILABLE',503);
  cookie(req,res,result.sessionToken);
  return {ok:true};
}
async function snapshot(req) {return rpc('snapshot',{session_token:token(req)});}
async function command(req,input) {return rpc('command',{session_token:token(req),action:input.action,data:input.data,expected_version:input.expectedVersion});}
async function leave(req,res) {
  if(token(req))await rpc('leave',{session_token:token(req)}).catch(()=>{});
  cookie(req,res);return {ok:true};
}
module.exports={cookieName,cookie,token,enter,snapshot,command,leave};

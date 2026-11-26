'use strict';
const auth=require('../lib/portal-auth');
const demo=require('../lib/demo-session');
module.exports=async(req,res)=>{
  auth.privateHeaders(res);
  const action=new URL(req.url,'https://portal.invalid').searchParams.get('action')||'status';
  try {
    if(req.method==='GET' && action==='status')return res.status(200).json({enabled:auth.enabled(),demoAvailable:auth.enabled(),demoSession:!!demo.token(req)});
    if(req.method!=='POST')throw new auth.PortalError('METHOD_NOT_ALLOWED',405);
    auth.checkMutation(req);const input=auth.body(req);auth.config();
    if(action==='demo')return res.status(200).json(await demo.enter(req,res,input));
    if(action==='demo-logout')return res.status(200).json(await demo.leave(req,res));
    if(action==='logout') {
      // Clear the browser even if the provider is temporarily unavailable.
      const token=auth.cookies(req)[auth.cookieNames(req).access];
      if(token)await auth.upstream('/auth/v1/logout?scope=local',{method:'POST',token}).catch(()=>{});
      auth.setSession(req,res,null);return res.status(200).json({ok:true});
    }
    if(action==='exchange') {
      if(typeof input.access_token!=='string' || typeof input.refresh_token!=='string' || input.access_token.length>10000 || input.refresh_token.length>1000)throw new auth.PortalError('INVALID_INPUT');
      // Confirmation/recovery callbacks are verified by Auth, never decoded/trusted locally.
      const user=await auth.upstream('/auth/v1/user',{token:input.access_token});
      if(!user.email_confirmed_at)throw new auth.PortalError('AUTH_FAILED',401);
      auth.setSession(req,res,input);return res.status(200).json({ok:true});
    }
    if(action==='password') {
      const {access}=await auth.session(req,res);
      if(typeof input.password!=='string' || input.password.length<12 || input.password.length>128)throw new auth.PortalError('PASSWORD_LENGTH');
      await auth.upstream('/auth/v1/user',{method:'PUT',token:access,data:{password:input.password}});
      return res.status(200).json({ok:true});
    }
    if(!['login','signup','recover','resend'].includes(action))throw new auth.PortalError('INVALID_ACTION');
    const email=String(input.email||'').trim();
    if(email.length>254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw new auth.PortalError('INVALID_INPUT');
    if(action==='resend') {
      // Only resend an existing signup confirmation. Never create or approve users.
      await auth.upstream('/auth/v1/resend?redirect_to='+encodeURIComponent(req.headers.origin+'/'),{method:'POST',data:{type:'signup',email}});
      return res.status(200).json({ok:true,checkEmail:true});
    }
    if(action==='recover') {
      await auth.upstream('/auth/v1/recover?redirect_to='+encodeURIComponent(req.headers.origin+'/'),{method:'POST',data:{email}});
      return res.status(200).json({ok:true,checkEmail:true});
    }
    if(typeof input.password!=='string' || input.password.length< (action==='signup'?12:1) || input.password.length>128)throw new auth.PortalError('PASSWORD_LENGTH');
    if(action==='signup') {
      // requested_role is a request for approval, never an authorization claim.
      await auth.upstream('/auth/v1/signup?redirect_to='+encodeURIComponent(req.headers.origin+'/'),{method:'POST',data:{email,password:input.password,data:{display_name:String(input.displayName||'').slice(0,100),requested_role:['farmer','operator','manager'].includes(input.requestedRole)?input.requestedRole:'farmer'}}});
      return res.status(200).json({ok:true,checkEmail:true});
    }
    const result=await auth.upstream('/auth/v1/token?grant_type=password',{method:'POST',data:{email,password:input.password}});
    if(!result.user?.email_confirmed_at)throw new auth.PortalError('AUTH_FAILED',401);
    auth.setSession(req,res,result);return res.status(200).json({ok:true});
  }catch(error){auth.fail(res,error);}
};

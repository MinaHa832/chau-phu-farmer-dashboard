'use strict';
const auth=require('../lib/portal-auth');
module.exports=async(req,res)=>{
  auth.privateHeaders(res);
  try {
    auth.config();
    if(!['GET','POST'].includes(req.method))throw new auth.PortalError('METHOD_NOT_ALLOWED',405);
    if(req.method==='POST')auth.checkMutation(req);
    const {access}=await auth.session(req,res);
    let result;
    if(req.method==='GET')result=await auth.upstream('/rest/v1/rpc/mekong_snapshot',{method:'POST',token:access,data:{}});
    else {
      const input=auth.body(req);
      if(typeof input.action!=='string' || !Number.isSafeInteger(input.expectedVersion) || input.expectedVersion<0)throw new auth.PortalError('INVALID_INPUT');
      result=await auth.upstream('/rest/v1/rpc/mekong_command',{method:'POST',token:access,data:{action:input.action,data:input.data,expected_version:input.expectedVersion}});
    }
    return res.status(200).json(result);
  }catch(error){auth.fail(res,error);}
};

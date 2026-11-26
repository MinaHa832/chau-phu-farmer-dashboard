const {test,before,after}=require('node:test');const assert=require('node:assert/strict');
const {startServer}=require('./helpers/shared-server.cjs');
let fixture;before(async()=>{fixture=await startServer();});after(async()=>{await fixture?.close();});
async function call(endpoint,{cookie='',data,origin}={}){
 const response=await fetch(fixture.url+endpoint,{method:data===undefined?'GET':'POST',headers:{Cookie:cookie,...(data===undefined?{}:{'Content-Type':'application/json','X-Mekong-Request':'1',Origin:origin||fixture.url})},body:data===undefined?undefined:JSON.stringify(data)});
 const body=await response.json();return {response,body,cookie:response.headers.getSetCookie().map(c=>c.split(';')[0]).join('; ')};
}
async function login(who){const result=await call('/api/session?action=login',{data:{email:who+'@example.test',password:'test-password-123'}});assert.equal(result.response.status,200);assert.equal(result.body.access_token,undefined);assert.match(result.response.headers.getSetCookie()[0],/HttpOnly/);return result.cookie;}
test('API denies anonymous requests and cross-origin mutations without exposing credentials',async()=>{
 assert.equal((await call('/api/shared')).response.status,401);
 const a=await call('/api/session?action=login',{origin:'https://other.example',data:{email:'manager@example.test',password:'test-password-123'}});assert.equal(a.response.status,403);
 const b=await call('/api/shared',{cookie:await login('pending')});assert.equal(b.body.profile.role,'pending');assert.equal(b.body.farms,undefined);
 assert.match(b.response.headers.get('cache-control'),/no-store/);
});
test('separate device sessions share farmer request, staff processing and delivered amount',async()=>{
 const farmer=await login('farmer'),operator=await login('operator'),manager=await login('manager'),outside=await login('outside');
 const command=(cookie,action,data,expectedVersion=0)=>call('/api/shared',{cookie,data:{action,data,expectedVersion}});
 let r=await command(farmer,'request.create',{id:'api-request',farmId:'DEMO-RMU-01-A',weekIndex:1,weekStart:'2026-05-01',requestM3:80});assert.equal(r.response.status,200);
 for(const staff of [operator,manager])assert.equal((await call('/api/shared',{cookie:staff})).body.items.find(x=>x.data.id==='api-request').data.requestM3,80);
 assert.equal((await call('/api/shared',{cookie:outside})).body.items.length,0);
 assert.equal((await command(farmer,'member.update',{id:fixture.users.farmer.id,role:'manager',approved:true},1)).response.status,403);
 assert.equal((await command(operator,'request.update',{id:'api-request',status:'processing'},1)).response.status,200);
 assert.equal((await command(manager,'request.update',{id:'api-request',status:'completed',deliveredM3:80},1)).response.status,409);
 assert.equal((await command(operator,'request.update',{id:'api-request',status:'completed',deliveredM3:80},2)).response.status,200);
 r=await call('/api/shared',{cookie:farmer});const request=r.body.items.find(x=>x.data.id==='api-request').data;
 assert.equal(request.status,'completed');assert.equal(request.deliveredM3,80);assert.equal(request.history.length,3);
});
test('logout removes cookies and partial configuration fails closed',async()=>{
 const result=await call('/api/session?action=logout',{cookie:await login('farmer'),data:{}});assert.equal(result.response.status,200);assert.match(result.response.headers.getSetCookie()[0],/Max-Age=0/);
 const value=process.env.SUPABASE_PUBLISHABLE_KEY;delete process.env.SUPABASE_PUBLISHABLE_KEY;
 assert.equal((await call('/api/session?action=status')).body.enabled,true);
 assert.equal((await call('/api/shared')).response.status,503);process.env.SUPABASE_PUBLISHABLE_KEY=value;
});
test('confirmation and recovery callbacks return to the validated requesting site',async()=>{
 for(const action of ['signup','recover','resend']){
  const result=await call('/api/session?action='+action,{data:{email:'pending@example.test',password:'test-password-123'}});
  assert.equal(result.response.status,200);assert.equal(result.body.checkEmail,true);
  assert.equal(fixture.authRequests.at(-1).searchParams.get('redirect_to'),fixture.url+'/');
  if(action==='resend')assert.deepEqual(fixture.authPayloads.at(-1),{type:'signup',email:'pending@example.test'});
 }
 const count=fixture.authRequests.length;
 assert.equal((await call('/api/session?action=recover',{origin:'https://attacker.example',data:{email:'pending@example.test'}})).response.status,403);
 assert.equal(fixture.authRequests.length,count);
});
test('mail and confirmation failures stay distinct without exposing provider diagnostics',async()=>{
 for(const [action,path,code,status,expected] of [
  ['resend','resend','email_address_not_authorized',403,'MAIL_UNAVAILABLE'],
  ['resend','resend','over_email_send_rate_limit',429,'EMAIL_RATE_LIMITED'],
  ['signup','signup','unexpected_failure',500,'MAIL_UNAVAILABLE'],
  ['login','token','email_not_confirmed',400,'EMAIL_UNCONFIRMED'],
  ['login','token','invalid_credentials',400,'AUTH_FAILED']
 ]){
  fixture.authFailures.push({path:'/auth/v1/'+path,status,body:{code,msg:'private SMTP diagnostic'}});
  const result=await call('/api/session?action='+action,{data:{email:'pending@example.test',password:'test-password-123'}});
  assert.equal(result.body.error,expected);assert.equal(JSON.stringify(result.body).includes('private SMTP'),false);
  assert.equal(result.response.headers.getSetCookie().length,0);
 }
});
test('email-free demo sessions share requests across devices and cannot enter the live workspace',async()=>{
 const enter=async(role,rmu='RMU-01',farmId='DEMO-RMU-01-A')=>{
  const result=await call('/api/session?action=demo',{data:{role,rmu,farmId}});
  assert.equal(result.response.status,200);assert.equal(result.body.sessionToken,undefined);
  assert.match(result.response.headers.getSetCookie()[0],/HttpOnly/);return result.cookie;
 };
 const farmer=await enter('farmer'),operator=await enter('operator'),manager=await enter('manager'),outside=await enter('operator','RMU-02');
 assert.equal((await call('/api/shared',{cookie:manager})).response.status,401);
 assert.equal((await call('/api/shared?workspace=demo')).response.status,401);
 let result=await call('/api/shared?workspace=demo',{cookie:manager});
 assert.equal(result.body.profile.demo,true);assert.equal(result.body.farms.length,54);assert.equal(result.body.members,undefined);
 const command=(cookie,action,data,expectedVersion=0)=>call('/api/shared?workspace=demo',{cookie,data:{action,data,expectedVersion}});
 result=await command(farmer,'request.create',{id:'demo-api-request',farmId:'DEMO-RMU-01-A',weekIndex:1,weekStart:'2026-05-01',requestM3:120});
 assert.equal(result.response.status,200);
 for(const cookie of [operator,manager])assert.equal((await call('/api/shared?workspace=demo',{cookie})).body.items.find(x=>x.data.id==='demo-api-request').data.requestM3,120);
 assert.equal((await call('/api/shared?workspace=demo',{cookie:outside})).body.items.length,0);
 assert.equal((await command(manager,'member.update',{id:fixture.users.pending.id,role:'manager',approved:true},1)).response.status,403);
 assert.equal((await command(farmer,'request.update',{id:'demo-api-request',status:'completed',deliveredM3:120},1)).response.status,403);
 assert.equal((await command(operator,'request.update',{id:'demo-api-request',status:'completed',deliveredM3:120,operatorNote:'Demo water delivered'},1)).response.status,200);
 result=await call('/api/shared?workspace=demo',{cookie:farmer});
 assert.equal(result.body.items[0].data.deliveredM3,120);assert.equal(result.body.items[0].data.operatorNote,'Demo water delivered');
 const live=await call('/api/shared',{cookie:await login('manager')});assert.equal(live.body.items.some(x=>x.data.id==='demo-api-request'),false);
 const left=await call('/api/session?action=demo-logout',{cookie:farmer,data:{}});assert.match(left.response.headers.getSetCookie()[0],/Max-Age=0/);
 assert.equal((await call('/api/shared?workspace=demo',{cookie:farmer})).response.status,401);
});

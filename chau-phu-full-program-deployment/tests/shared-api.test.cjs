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
 for(const action of ['signup','recover']){
  const result=await call('/api/session?action='+action,{data:{email:'pending@example.test',password:'test-password-123'}});
  assert.equal(result.response.status,200);assert.equal(result.body.checkEmail,true);
  assert.equal(fixture.authRequests.at(-1).searchParams.get('redirect_to'),fixture.url+'/');
 }
 const count=fixture.authRequests.length;
 assert.equal((await call('/api/session?action=recover',{origin:'https://attacker.example',data:{email:'pending@example.test'}})).response.status,403);
 assert.equal(fixture.authRequests.length,count);
});

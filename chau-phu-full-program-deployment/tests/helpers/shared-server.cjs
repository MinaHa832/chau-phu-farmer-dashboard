// Test fixture only. The database is real PostgreSQL (PGlite); the managed Auth
// provider is simulated. This never provisions or substitutes for production Auth.
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const {PGlite}=require(process.env.MEKONG_PGLITE_MODULE||'@electric-sql/pglite');
const root=path.resolve(__dirname,'../..');
async function startServer(port=0){
 const db=new PGlite();const originalFetch=global.fetch;
 const savedEnv={SUPABASE_URL:process.env.SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY:process.env.SUPABASE_PUBLISHABLE_KEY};
 process.env.SUPABASE_URL='https://test-auth.invalid';process.env.SUPABASE_PUBLISHABLE_KEY='test-public-key';
 await db.exec(`create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb default '{}');
 create function auth.uid() returns uuid language sql as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;`);
 await db.exec(fs.readFileSync(path.join(root,'supabase/migrations/202611260001_shared_portal.sql'),'utf8'));
 await db.exec(fs.readFileSync(path.join(root,'supabase/seed.sql'),'utf8'));
 await db.exec(fs.readFileSync(path.join(root,'supabase/migrations/202611260002_shared_demo.sql'),'utf8'));
 await db.exec(fs.readFileSync(path.join(root,'supabase/demo-seed.sql'),'utf8'));
 await db.exec(fs.readFileSync(path.join(root,'supabase/migrations/202611270001_roles_flow_notices.sql'),'utf8'));
 const authRequests=[],authPayloads=[],authFailures=[];
 const users={};for(const [i,role] of ['manager','farmer','operator','outside','pending'].entries()){
  const id=`00000000-0000-4000-8000-${String(i+1).padStart(12,'0')}`;users[role]={id,email:role+'@example.test',email_confirmed_at:'2026-11-26T00:00:00Z'};
  await db.query('insert into auth.users(id,email) values($1,$2)',[id,users[role].email]);
  if(role==='manager')await db.query("update public.mekong_profiles set role='platform',approved=true where user_id=$1",[id]);
  if(role==='farmer')await db.query("update public.mekong_profiles set role='farmer',approved=true,farm_id='DEMO-RMU-01-A' where user_id=$1",[id]);
  if(['operator','outside'].includes(role))await db.query("update public.mekong_profiles set role='operator',approved=true,rmu=$2 where user_id=$1",[id,role==='operator'?'RMU-01':'RMU-02']);
 }
 global.fetch=async(url,options={})=>{
  if(!String(url).startsWith('https://test-auth.invalid'))return originalFetch(url,options);
  const u=new URL(url),input=JSON.parse(options.body||'{}'),token=options.headers?.Authorization?.replace('Bearer ','');
  const role=token?.replace('test-access-',''),user=users[role];const reply=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json'}});
  if(['/auth/v1/signup','/auth/v1/recover','/auth/v1/resend'].includes(u.pathname)){
   authRequests.push(u);authPayloads.push(input);
   const failure=authFailures[0];if(failure?.path===u.pathname){authFailures.shift();return reply(failure.body,failure.status);}
   return reply({ok:true});
  }
  if(u.pathname==='/auth/v1/token'){
   const failure=authFailures[0];if(failure?.path===u.pathname){authFailures.shift();return reply(failure.body,failure.status);}
   const who=Object.keys(users).find(k=>users[k].email===input.email)||input.refresh_token?.replace('test-refresh-','');
   if(!users[who]||(!input.refresh_token&&input.password!=='test-password-123'))return reply({msg:'Invalid login'},400);
   return reply({user:users[who],access_token:'test-access-'+who,refresh_token:'test-refresh-'+who,expires_in:3600});
  }
  if(u.pathname==='/auth/v1/user')return user?reply(user):reply({msg:'Invalid session'},401);
  if(u.pathname==='/auth/v1/logout')return reply({});
  if(u.pathname.startsWith('/rest/v1/rpc/mekong_demo_')){
   const statements={
    enter:['select public.mekong_demo_enter($1,$2,$3) as result',[input.role_name,input.assigned_farm,input.assigned_rmu]],
    snapshot:['select public.mekong_demo_snapshot($1) as result',[input.session_token]],
    command:['select public.mekong_demo_command($1,$2,$3::jsonb,$4) as result',[input.session_token,input.action,JSON.stringify(input.data),input.expected_version]],
    leave:['select public.mekong_demo_leave($1) as result',[input.session_token]]
   };
   try{
    const [sql,args]=statements[u.pathname.split('mekong_demo_')[1]];
    const result=await db.transaction(async tx=>{await tx.exec('set local role anon');return (await tx.query(sql,args)).rows[0].result;});
    return reply(result);
   }catch(e){return reply({code:e.code,message:e.message},e.code==='42501'?403:e.code==='40001'||e.code==='23505'?409:400);}
  }
  if(!user)return reply({msg:'Invalid session'},401);
  try{
   const result=await db.transaction(async tx=>{
    await tx.query("select set_config('request.jwt.claim.sub',$1,true)",[user.id]);
    const sql=u.pathname.endsWith('mekong_snapshot')?'select public.mekong_snapshot() as result':'select public.mekong_command($1,$2::jsonb,$3) as result';
    return (await tx.query(sql,u.pathname.endsWith('mekong_snapshot')?[]:[input.action,JSON.stringify(input.data),input.expected_version])).rows[0].result;
   });return reply(result);
  }catch(e){return reply({code:e.code,message:e.message},e.code==='42501'?403:e.code==='40001'||e.code==='23505'?409:400);}
 };
 const server=http.createServer(async(req,res)=>{
  res.status=n=>(res.statusCode=n,res);res.json=value=>{res.setHeader('Content-Type','application/json');res.end(JSON.stringify(value));};
  const u=new URL(req.url,'http://localhost');
  if(u.pathname==='/api/session'||u.pathname==='/api/shared'){
   let raw='';for await(const chunk of req)raw+=chunk;req.body=raw;
   return require(path.join(root,u.pathname+'.js'))(req,res);
  }
  if(u.pathname.startsWith('/api/'))return res.status(503).json({error:'External observations are disabled in this test fixture'});
  const relative=u.pathname==='/'?'index.html':decodeURIComponent(u.pathname.slice(1));
  const file=path.resolve(root,relative);
  if(!file.startsWith(root+path.sep))return res.status(403).end();
  const type={'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.geojson':'application/json','.csv':'text/csv','.png':'image/png','.jpg':'image/jpeg'}[path.extname(file)]||'application/octet-stream';
  try{res.setHeader('Content-Type',type);res.end(fs.readFileSync(file));}catch{res.status(404).end();}
 });
 await new Promise(resolve=>server.listen(port,'127.0.0.1',resolve));
 return {url:'http://127.0.0.1:'+server.address().port,db,users,authRequests,authPayloads,authFailures,async close(){await new Promise(resolve=>server.close(resolve));global.fetch=originalFetch;for(const [k,v]of Object.entries(savedEnv)){if(v===undefined)delete process.env[k];else process.env[k]=v;}await db.close();}};
}
module.exports={startServer};
if(require.main===module)startServer(Number(process.env.PORT)||4173).then(({url})=>console.log('TEST FIXTURE ONLY: '+url));

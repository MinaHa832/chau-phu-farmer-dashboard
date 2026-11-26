const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');
const {PGlite}=require(process.env.MEKONG_PGLITE_MODULE||'@electric-sql/pglite');
let db;const root=path.resolve(__dirname,'..');
before(async()=>{
 db=new PGlite();
 await db.exec("create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb default '{}');create function auth.uid() returns uuid language sql as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;");
 for(const name of ['migrations/202611260001_shared_portal.sql','seed.sql'])await db.exec(fs.readFileSync(path.join(root,'supabase',name),'utf8'));
 await db.query('update public.mekong_farms set payload=payload||\'{"name":"PRIVATE LIVE NAME","privateField":"must not leak"}\' where id=\'DEMO-RMU-01-A\'');
 for(const name of ['migrations/202611260002_shared_demo.sql','demo-seed.sql'])await db.exec(fs.readFileSync(path.join(root,'supabase',name),'utf8'));
});
after(async()=>db?.close());
const anon=async(sql,args=[])=>db.transaction(async tx=>{await tx.exec('set local role anon');return tx.query(sql,args);});
test('public demonstration has only canonical 54 synthetic farms and no real identities',async()=>{
 const token=(await anon("select public.mekong_demo_enter('manager') as result")).rows[0].result.sessionToken;
 const data=(await anon('select public.mekong_demo_snapshot($1) as result',[token])).rows[0].result;
 assert.equal(data.farms.length,54);assert.equal(new Set(data.farms.map(x=>x.rmu)).size,18);assert.equal(data.profile.demo,true);
 assert.equal(JSON.stringify(data).includes('PRIVATE LIVE NAME'),false);assert.equal(JSON.stringify(data).includes('privateField'),false);
 assert.equal((await db.query('select count(*)::int n from auth.users')).rows[0].n,0);
 assert.equal((await db.query('select count(*)::int n from mekong_demo.mekong_profiles')).rows[0].n,73);
 await assert.rejects(anon('select * from public.mekong_farms'),e=>e.code==='42501');
 await assert.rejects(anon('select * from mekong_demo.mekong_farms'),e=>e.code==='42501');
 await assert.rejects(anon('select public.mekong_snapshot()'),e=>e.code==='42501');
});
test('demo sessions reject invented/expired tokens and cannot approve real accounts',async()=>{
 await assert.rejects(anon('select public.mekong_demo_snapshot($1)',['a'.repeat(64)]),/AUTH_REQUIRED/);
 const token=(await anon("select public.mekong_demo_enter('manager') as result")).rows[0].result.sessionToken;
 await assert.rejects(anon("select public.mekong_demo_command($1,'member.update','{}',1)",[token]),/FORBIDDEN/);
 await db.query('update mekong_demo.sessions set expires_at=now()-interval \'1 minute\' where token_hash=encode(sha256(convert_to($1,\'UTF8\')),\'hex\')',[token]);
 await assert.rejects(anon('select public.mekong_demo_snapshot($1)',[token]),/AUTH_REQUIRED/);
 assert.equal((await db.query("select payload->>'name' name from public.mekong_farms where id='DEMO-RMU-01-A'")).rows[0].name,'PRIVATE LIVE NAME');
});

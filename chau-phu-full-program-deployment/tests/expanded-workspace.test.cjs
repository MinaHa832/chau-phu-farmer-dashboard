const {test,before,after}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs'),path=require('node:path');
const {PGlite}=require(process.env.MEKONG_PGLITE_MODULE||'@electric-sql/pglite');
const flow=require('../water-flow');let db;const root=path.resolve(__dirname,'..'),tokens={};
const anon=async(sql,args=[])=>db.transaction(async tx=>{await tx.exec('set local role anon');return (await tx.query(sql,args)).rows[0]?.data;});
const snap=r=>anon('select public.mekong_demo_snapshot($1) data',[tokens[r]]);
const cmd=(r,a,d,v=0)=>anon('select public.mekong_demo_command($1,$2,$3::jsonb,$4) data',[tokens[r],a,JSON.stringify(d),v]);
before(async()=>{
 db=new PGlite();await db.exec("create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb default '{}');create function auth.uid() returns uuid language sql as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;");
 for(const file of ['migrations/202611260001_shared_portal.sql','seed.sql','migrations/202611260002_shared_demo.sql','demo-seed.sql','migrations/202611270001_roles_flow_notices.sql'])await db.exec(fs.readFileSync(path.join(root,'supabase',file),'utf8'));
 for(const r of ['farmer','operator','cooperative','platform','manager'])tokens[r]=(await anon('select public.mekong_demo_enter($1,$2,$3) data',[r,'DEMO-RMU-01-A','RMU-01'])).sessionToken;
 for(const [i,r] of ['platform','cooperative','manager'].entries()){const id='50000000-0000-0000-0000-'+String(i+1).padStart(12,'0');await db.query('insert into auth.users(id,email) values($1,$2)',[id,r+'@test.invalid']);await db.query("update public.mekong_profiles set role=$1,approved=true,rmu=case when $1='cooperative' then 'RMU-01' end where user_id=$2",[r,id]);}
 tokens.outside=(await anon("select public.mekong_demo_enter('cooperative',null,'RMU-02') data")).sessionToken;
});after(async()=>db?.close());
test('five roles preserve 54 farms and independently scoped shared plans',async()=>{
 assert.equal((await snap('platform')).farms.length,54);assert.equal((await snap('manager')).farms.length,54);assert.equal((await snap('cooperative')).farms.length,3);assert.equal((await snap('farmer')).farms.length,1);
 assert.equal((await db.query('select count(*)::int n from mekong_demo.mekong_profiles')).rows[0].n,92);
 const plan={weeks:[{index:1,startDate:'2026-05-01',rows:[{farmId:'DEMO-RMU-01-A',rmu:'RMU-01',requestM3:100,plannedM3:75},{farmId:'DEMO-RMU-02-A',rmu:'RMU-02',requestM3:200,plannedM3:90}]}]};
 await assert.rejects(cmd('manager','planning.publish',{plan}),/FORBIDDEN/);
 await cmd('platform','planning.publish',{plan});assert.equal((await snap('farmer')).planning.plan.weeks[0].rows.length,1);assert.equal((await snap('manager')).planning.plan.weeks[0].rows.length,2);
});
test('cooperative triages but cannot impersonate a pump; independent manager cannot edit delivery',async()=>{
 await cmd('farmer','request.create',{id:'expanded-request',farmId:'DEMO-RMU-01-A',weekIndex:1,weekStart:'2026-05-01',requestM3:100});
 await cmd('cooperative','request.update',{id:'expanded-request',status:'processing',operatorNote:'received'},1);
 await assert.rejects(cmd('cooperative','request.update',{id:'expanded-request',status:'completed',deliveredM3:100},2),/FORBIDDEN/);
 await assert.rejects(cmd('manager','request.update',{id:'expanded-request',status:'completed',deliveredM3:100},2),/FORBIDDEN/);
 await assert.rejects(cmd('outside','request.update',{id:'expanded-request',status:'processing'},2),/FORBIDDEN/);
 await cmd('operator','request.update',{id:'expanded-request',status:'completed',deliveredM3:100},2);
 assert.equal((await snap('farmer')).items.find(x=>x.kind==='requests').data.deliveredM3,100);
});
test('paper preference, canonical notice, handover and farmer acknowledgement share across devices',async()=>{
 const farmId='DEMO-RMU-01-A';await cmd('farmer','notice.preference',{farmId,channel:'paper'});
 await assert.rejects(cmd('operator','notice.preference',{farmId,channel:'app'},1),/FORBIDDEN/);
 await assert.rejects(cmd('outside','notice.preference',{farmId,channel:'app'},1),/FORBIDDEN/);
 await cmd('cooperative','notice.issue',{id:'notice-1',farmId,weekStart:'2026-05-01',channel:'paper',plannedM3:999999});
 let item=(await snap('farmer')).items.find(x=>x.kind==='notices').data;assert.equal(item.plannedM3,75);assert.equal(item.channel,'paper');
 await assert.rejects(cmd('operator','notice.deliver',{id:'notice-1',note:'delivered'},1),/FORBIDDEN/);
 await cmd('cooperative','notice.deliver',{id:'notice-1',note:'paper handover'},1);
 await assert.rejects(cmd('manager','notice.ack',{id:'notice-1'},2),/FORBIDDEN/);
 await cmd('farmer','notice.ack',{id:'notice-1'},2);item=(await snap('manager')).items.find(x=>x.kind==='notices').data;
 assert.equal(item.status,'acknowledged');assert.ok(item.deliveredAt);assert.ok(item.acknowledgedAt);assert.equal(item.history.length,3);
 await assert.rejects(cmd('farmer','notice.preference',{farmId,channel:'app'},0),/VERSION_CONFLICT/);
});
test('intake and stored-water paths persist only for the signed-in farm',async()=>{
 await cmd('farmer','check.create',{id:'check-1',farmId:'DEMO-RMU-01-A',path:'stored',note:'tank checked'});
 assert.equal((await snap('operator')).items.find(x=>x.kind==='checks').data.note,'tank checked');
 await assert.rejects(cmd('farmer','check.create',{id:'check-2',farmId:'DEMO-RMU-02-A',path:'intake',note:'spoof'}),/FORBIDDEN/);
});
const live=async(r,a,d,v=0)=>{const i=['platform','cooperative','manager'].indexOf(r);await db.query("select set_config('request.jwt.claim.sub',$1,false)",['50000000-0000-0000-0000-'+String(i+1).padStart(12,'0')]);return (await db.query('select public.mekong_command($1,$2::jsonb,$3) data',[a,JSON.stringify(d),v])).rows[0].data;};
const liveSnap=async()=> (await db.query('select public.mekong_snapshot() data')).rows[0].data;
test('field models reset verification on edit; only independent reviewers can approve real calibrations',async()=>{
 const m={...flow.scenarioModels(1.5)[0],demo:false};
 await live('cooperative','water.model.upsert',{...m,verified:true});let saved=(await liveSnap()).waterModels[0];assert.equal(saved.verified,false);
 await assert.rejects(live('platform','water.model.review',{rmu:m.rmu,evidence:'review evidence'},1),/FORBIDDEN/);
 await live('manager','water.model.review',{rmu:m.rmu,evidence:'independent paired readings and datum checked'},1);
 assert.equal((await liveSnap()).waterModels[0].verified,true);
 await live('cooperative','water.model.upsert',{...m,runtimeHours:12,verified:true},2);assert.equal((await liveSnap()).waterModels[0].verified,false);
 await assert.rejects(cmd('outside','water.model.upsert',{...m}),/FORBIDDEN/);
 const second={...m,rmu:'RMU-02',sourceSharePct:99};await assert.rejects(live('platform','water.model.upsert',second),/FLOW_SHARES/);
 await live('platform','water.model.upsert',{...m,demo:true},3);await assert.rejects(live('manager','water.model.review',{rmu:m.rmu,evidence:'fake demonstration'},4),/VERIFY_BLOCKED/);
});
test('report details stay independent of all three operational roles',async()=>{
 await cmd('farmer','incident.create',{id:'private-incident',farmId:'DEMO-RMU-01-A',details:'private concern',typeKey:'issueOther'});
 for(const r of ['operator','cooperative','platform']){const x=(await snap(r)).items.find(x=>x.data.id==='private-incident').data;assert.equal(x.details,undefined);await assert.rejects(cmd(r,'incident.update',{id:x.id,status:'closed'},1),/FORBIDDEN/);}
 await cmd('manager','incident.update',{id:'private-incident',status:'investigating',note:'independent review'},1);
 assert.equal((await snap('farmer')).items.find(x=>x.data.id==='private-incident').data.status,'investigating');
});

test('public demo cannot forge a reviewed real calibration',async()=>{const m={...flow.scenarioModels()[1],demo:false,verified:true};await cmd('platform','water.model.upsert',m);const x=(await snap('manager')).waterModels.find(x=>x.rmu==='RMU-02');assert.equal(x.demo,true);assert.equal(x.verified,false);await assert.rejects(cmd('manager','water.model.review',{rmu:m.rmu,evidence:'forged real review'},1),/FORBIDDEN/);});

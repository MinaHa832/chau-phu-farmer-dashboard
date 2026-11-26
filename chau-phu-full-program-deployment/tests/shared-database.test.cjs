const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {PGlite}=require(process.env.MEKONG_PGLITE_MODULE||'@electric-sql/pglite');
let db;const root=path.join(__dirname,'..');
const ids={manager:'00000000-0000-4000-8000-000000000001',farmer:'00000000-0000-4000-8000-000000000002',operator:'00000000-0000-4000-8000-000000000003',outside:'00000000-0000-4000-8000-000000000004',pending:'00000000-0000-4000-8000-000000000005'};
async function as(role){await db.query("select set_config('request.jwt.claim.sub',$1,false)",[role?ids[role]:'']);}
async function snapshot(role){await as(role);return (await db.query('select public.mekong_snapshot() as data')).rows[0].data;}
async function command(role,action,data,version=0){await as(role);return (await db.query('select public.mekong_command($1,$2::jsonb,$3) as data',[action,JSON.stringify(data),version])).rows[0].data;}
before(async()=>{
 db=new PGlite();
 // Only Auth's identity surface is stubbed. All tables, triggers, transactions,
 // grants and application security functions run in the actual PostgreSQL engine.
 await db.exec(`create role anon;create role authenticated;create schema auth;
 create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb default '{}');
 create function auth.uid() returns uuid language sql as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;`);
 await db.exec(fs.readFileSync(path.join(root,'supabase/migrations/202611260001_shared_portal.sql'),'utf8'));
 await db.exec(fs.readFileSync(path.join(root,'supabase/seed.sql'),'utf8'));
 for(const [name,id] of Object.entries(ids))await db.query('insert into auth.users(id,email,raw_user_meta_data) values($1,$2,$3)',[id,name+'@example.test',JSON.stringify({role:'manager',requested_role:'manager'})]);
 await db.query("update public.mekong_profiles set role='manager',approved=true where user_id=$1",[ids.manager]);
 await db.query("update public.mekong_profiles set role='farmer',approved=true,farm_id='DEMO-RMU-01-A' where user_id=$1",[ids.farmer]);
 await db.query("update public.mekong_profiles set role='operator',approved=true,rmu='RMU-01' where user_id=$1",[ids.operator]);
 await db.query("update public.mekong_profiles set role='operator',approved=true,rmu='RMU-02' where user_id=$1",[ids.outside]);
});
after(async()=>{await db?.close();});
test('seed preserves 54 existing farms in 18 RMUs; repeated seeding is safe',async()=>{
 const a=await snapshot('manager');assert.equal(a.farms.length,54);assert.equal(new Set(a.farms.map(f=>f.rmu)).size,18);
 await db.exec(fs.readFileSync(path.join(root,'supabase/seed.sql'),'utf8'));assert.equal((await snapshot('manager')).farms.length,54);
 await assert.rejects(command('manager','farm.delete',{id:'DEMO-RMU-01-A'},1),/PILOT_FARMS_PROTECTED/);
});
test('anonymous, unapproved, and forged role metadata never grant access',async()=>{
 await assert.rejects(snapshot(null),/AUTH_REQUIRED/);
 const p=await snapshot('pending');assert.equal(p.profile.role,'pending');assert.equal(p.profile.approved,false);assert.equal(p.farms,undefined);
 await assert.rejects(command('pending','request.create',{id:'blocked'}),/APPROVAL_REQUIRED/);
 await assert.rejects(command('farmer','member.update',{id:ids.farmer,role:'manager',approved:true},1),/FORBIDDEN/);
 await db.exec('set role authenticated');
 await assert.rejects(db.query('select * from public.mekong_farms'),/permission denied/);
 await assert.rejects(db.query("update public.mekong_profiles set role='manager'"),/permission denied/);
 await db.exec('reset role');
});
test('database enforces assignments even when requests bypass the web UI',async()=>{
 assert.equal((await snapshot('farmer')).farms.length,1);assert.equal((await snapshot('operator')).farms.length,3);
 await assert.rejects(command('farmer','request.create',{id:'spoof',farmId:'DEMO-RMU-02-A',requestM3:100,weekIndex:1,weekStart:'2026-05-01'}),/FORBIDDEN/);
 const own=(await snapshot('farmer')).farms[0];
 await assert.rejects(command('farmer','farm.upsert',{...own,rmu:'RMU-02'},own._version),/FORBIDDEN/);
});
test('original farm fields save to the shared record without changing the 54 farm identities',async()=>{
 const original=(await snapshot('farmer')).farms[0];
 const result=await command('farmer','farm.upsert',{...original,area:1.25,allocationRisk:{growth:3,soil:1},allocationRiskSource:'USER_ASSESSED'},original._version);
 assert.equal(result.farms[0].area,1.25);assert.equal(result.farms[0].id,original.id);assert.equal(result.farms[0].allocationRisk.growth,3);assert.equal(result.farms[0]._version,2);
 assert.equal((await snapshot('manager')).farms.length,54);
 await assert.rejects(command('farmer','farm.upsert',{...result.farms[0],area:1.5},1),/VERSION_CONFLICT/);
});
test('water requests reach both staff roles, deliveries return to farmer, and stale writes fail',async()=>{
 let a=await command('farmer','request.create',{id:'request-1',farmId:'DEMO-RMU-01-A',requestM3:100,weekIndex:1,weekStart:'2026-05-01',reason:'irrigation'});
 assert.equal(a.items.find(x=>x.data.id==='request-1').data.status,'pending');
 assert.equal((await snapshot('operator')).items.filter(x=>x.kind==='requests').length,1);
 assert.equal((await snapshot('manager')).items.filter(x=>x.kind==='requests').length,1);
 assert.equal((await snapshot('outside')).items.filter(x=>x.kind==='requests').length,0);
 await assert.rejects(command('outside','request.update',{id:'request-1',status:'completed',deliveredM3:100},1),/FORBIDDEN/);
 await assert.rejects(command('farmer','request.update',{id:'request-1',status:'completed',deliveredM3:100},1),/FORBIDDEN/);
 await command('operator','request.update',{id:'request-1',status:'processing'},1);
 await assert.rejects(command('manager','request.update',{id:'request-1',status:'completed',deliveredM3:100},1),/VERSION_CONFLICT/);
 await assert.rejects(command('operator','request.update',{id:'request-1',status:'completed',deliveredM3:60},2),/DELIVERY_INVALID/);
 await command('operator','request.update',{id:'request-1',status:'partial',deliveredM3:60,operatorNote:'remaining 40'},2);
 const request=(await snapshot('farmer')).items.find(x=>x.data.id==='request-1').data;
 assert.equal(request.status,'partial');assert.equal(request.deliveredM3,60);assert.equal(request.history.length,3);assert.equal(request._version,3);
 await assert.rejects(command('operator','request.update',{id:'request-1',status:'completed',deliveredM3:100},3),/TERMINAL_REQUEST/);
 const audit=await db.query("select count(*)::int as n from public.mekong_audit where record_id='request-1'");assert.equal(audit.rows[0].n,3);
});
test('duplicates and invalid quantities do not create extra requests',async()=>{
 const input={id:'request-2',farmId:'DEMO-RMU-01-A',requestM3:100,weekIndex:2,weekStart:'2026-05-08'};
 await command('farmer','request.create',input);await command('farmer','request.create',input);
 assert.equal((await snapshot('farmer')).items.find(x=>x.data.id==='request-2').data._version,1);
 await assert.rejects(command('farmer','request.create',{id:'request-3',farmId:'DEMO-RMU-01-A',requestM3:100,weekIndex:2,weekStart:'2026-05-08'}),/unique constraint/);
 await assert.rejects(command('farmer','request.create',{id:'negative',farmId:'DEMO-RMU-01-A',requestM3:-5,weekIndex:3,weekStart:'2026-05-15'}),/INVALID_INPUT/);
});
test('benefit review requires real comparison inputs and the actual assigned farmer',async()=>{
 const data={id:'benefit-1',rmu:'RMU-01',baselineStart:'2026-04-01',baselineEnd:'2026-04-30',currentStart:'2026-05-01',currentEnd:'2026-05-30',baselineWaterM3:1000,actualWaterM3:900,measureBasis:'meter',deliveryQuality:'adequate',baselineEvidence:'meter-a',actualEvidence:'meter-b',checkScope:true,checkCrop:true,checkWeather:true,demo:false};
 await assert.rejects(command('operator','benefit.create',{...data,id:'empty-benefit',baselineStart:null}),/INVALID_INPUT/);
 await command('operator','benefit.create',data);
 const outside=(await snapshot('manager')).members.find(x=>x.id===ids.outside);
 await command('manager','member.update',{id:ids.outside,role:'farmer',farmId:'DEMO-RMU-02-A',approved:true},outside._version);
 await assert.rejects(command('outside','benefit.confirm',{id:'benefit-1',farmId:'DEMO-RMU-01-A',status:'farmer_confirmed'},1),/FORBIDDEN/);
 await command('farmer','benefit.confirm',{id:'benefit-1',status:'farmer_confirmed'},1);
 await command('manager','benefit.review',{id:'benefit-1',status:'verified'},2);
 assert.equal((await snapshot('farmer')).items.find(x=>x.data.id==='benefit-1').data.status,'verified');
 await command('manager','benefit.create',{...data,id:'benefit-self'});
 await command('farmer','benefit.confirm',{id:'benefit-self',status:'farmer_confirmed'},1);
 await assert.rejects(command('manager','benefit.review',{id:'benefit-self',status:'verified'},2),/VERIFY_BLOCKED/);
 await assert.rejects(command('manager','request.update',{id:'request-2',status:'processing'},null),/INVALID_INPUT/);
});
test('report details stay private from pump operators; only managers handle reviews',async()=>{
 await command('farmer','incident.create',{id:'report-1',farmId:'DEMO-RMU-01-A',details:'private report',typeKey:'issueOrder'});
 const item=(await snapshot('operator')).items.find(x=>x.data.id==='report-1').data;
 assert.equal(item.details,undefined);assert.equal(item.reporterFarmId,undefined);assert.equal(item.history,undefined);
 assert.equal((await snapshot('manager')).items.find(x=>x.data.id==='report-1').data.details,'private report');
 await assert.rejects(command('operator','incident.update',{id:'report-1',status:'closed'},1),/FORBIDDEN/);
 await command('manager','incident.update',{id:'report-1',status:'investigating'},1);
 assert.equal((await snapshot('farmer')).items.find(x=>x.data.id==='report-1').data.status,'investigating');
});
test('shared allocation rows are scoped and server-side permissions revoke immediately',async()=>{
 const plan={weeks:[{index:1,startDate:'2026-05-01',rows:[{farmId:'DEMO-RMU-01-A',rmu:'RMU-01',plannedM3:100,requestM3:120},{farmId:'DEMO-RMU-02-A',rmu:'RMU-02',plannedM3:99,requestM3:120}],supplyByRmu:[{rmu:'RMU-01',available:100},{rmu:'RMU-02',available:99}]}]};
 await command('manager','planning.publish',{calendarStart:'2026-05-01',climateMode:'csv',plan});
 assert.equal((await snapshot('farmer')).planning.plan.weeks[0].rows.length,1);
 assert.equal((await snapshot('operator')).planning.plan.weeks[0].rows.length,1);
 const supplies=(await snapshot('farmer')).planning.plan.weeks[0].supplyByRmu;
 assert.equal(supplies.length,1);assert.equal(supplies[0].rmu,'RMU-01');assert.equal(supplies[0].available,100);
 await assert.rejects(command('operator','planning.publish',{plan}),/FORBIDDEN/);
 const member=(await snapshot('manager')).members.find(m=>m.id===ids.operator);
 await command('manager','member.update',{id:ids.operator,role:'operator',rmu:'RMU-01',approved:false},member._version);
 assert.equal((await snapshot('operator')).items,undefined);
 await assert.rejects(command('operator','request.update',{id:'request-2',status:'processing'},1),/APPROVAL_REQUIRED/);
 await assert.rejects(command('manager','member.update',{id:ids.manager,role:'pending',approved:false},1),/LAST_MANAGER/);
});

begin;

create table public.mekong_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null, display_name text not null default '',
  role text not null default 'pending' check (role in ('pending','farmer','operator','manager')),
  approved boolean not null default false,
  farm_id text, rmu text check (rmu ~ '^RMU-(0[1-9]|1[0-8])$'),
  version integer not null default 1,
  check (not approved or (role='manager') or (role='farmer' and farm_id is not null) or (role='operator' and rmu is not null))
);
create table public.mekong_farms (
  id text primary key, rmu text not null check (rmu ~ '^RMU-(0[1-9]|1[0-8])$'),
  payload jsonb not null, version integer not null default 1
);
alter table public.mekong_profiles add foreign key (farm_id) references public.mekong_farms(id);
create table public.mekong_items (
  id text primary key, kind text not null check (kind in ('requests','operations','incidents','records')),
  farm_id text references public.mekong_farms(id), rmu text not null check (rmu ~ '^RMU-(0[1-9]|1[0-8])$'),
  payload jsonb not null, version integer not null default 1,
  created_by uuid not null references auth.users(id), updated_by uuid not null references auth.users(id)
);
create index mekong_items_scope on public.mekong_items(kind,rmu,farm_id);
create unique index mekong_one_open_request on public.mekong_items(farm_id,(payload->>'weekStart'))
  where kind='requests' and payload->>'status' in ('pending','processing');
create table public.mekong_settings (id text primary key, payload jsonb not null, version integer not null default 1);
create table public.mekong_audit (
  id bigint generated always as identity primary key, actor_id uuid not null references auth.users(id),
  action text not null, record_id text not null, at timestamptz not null default now(),
  before_data jsonb, after_data jsonb
);
-- All browser/table access is denied. Only the narrowly scoped RPC functions below
-- are exposed; both reads and writes derive identity from the verified Auth JWT.
alter table public.mekong_profiles enable row level security;
alter table public.mekong_farms enable row level security;
alter table public.mekong_items enable row level security;
alter table public.mekong_settings enable row level security;
alter table public.mekong_audit enable row level security;
revoke all on public.mekong_profiles, public.mekong_farms, public.mekong_items, public.mekong_settings, public.mekong_audit from anon, authenticated;

create function public.mekong_new_user() returns trigger language plpgsql security definer set search_path='' as $$
begin
  insert into public.mekong_profiles(user_id,email,display_name)
  values(new.id,new.email,left(coalesce(new.raw_user_meta_data->>'display_name',''),100));
  return new;
end $$;
revoke all on function public.mekong_new_user() from public,anon,authenticated;
create trigger mekong_new_user after insert on auth.users for each row execute function public.mekong_new_user();
insert into public.mekong_profiles(user_id,email,display_name)
select id,email,left(coalesce(raw_user_meta_data->>'display_name',''),100) from auth.users where email is not null on conflict do nothing;

create function public.mekong_snapshot() returns jsonb language plpgsql security definer set search_path='' as $$
declare
  p public.mekong_profiles; f jsonb; items jsonb; plan jsonb; w jsonb; rows jsonb; weeks jsonb='[]';
  result jsonb; assigned_rmu text; supplies jsonb;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED' using errcode='42501'; end if;
  select * into p from public.mekong_profiles where user_id=auth.uid();
  if not found then raise exception 'PROFILE_MISSING' using errcode='42501'; end if;
  result=jsonb_build_object('profile',jsonb_build_object('id',p.user_id,'email',p.email,'displayName',p.display_name,'role',p.role,'approved',p.approved,'farmId',p.farm_id,'rmu',p.rmu,'_version',p.version));
  if not p.approved or p.role='pending' then return result; end if;
  select rmu into assigned_rmu from public.mekong_farms where id=p.farm_id;
  assigned_rmu=case when p.role='operator' then p.rmu else assigned_rmu end;
  select coalesce(jsonb_agg(payload||jsonb_build_object('_version',version) order by id),'[]') into f from public.mekong_farms
  where p.role='manager' or (p.role='farmer' and id=p.farm_id) or (p.role='operator' and rmu=p.rmu);
  select coalesce(jsonb_agg(jsonb_build_object('kind',kind,'data',
    (case when kind='incidents' and p.role='operator' then payload - array['details','reporterFarmId','reporterRole','reviewNote','history'] else payload end)
    ||jsonb_build_object('_version',version)) order by payload->>'createdAt' desc),'[]') into items
  from public.mekong_items where p.role='manager'
    or (p.role='operator' and rmu=p.rmu)
    or (p.role='farmer' and ((kind in ('requests','operations') and farm_id=p.farm_id) or (kind='incidents' and created_by=p.user_id) or (kind='records' and rmu=assigned_rmu)));
  select payload||jsonb_build_object('_version',version) into plan from public.mekong_settings where id='planning';
  if p.role<>'manager' and plan is not null then
    for w in select value from jsonb_array_elements(coalesce(plan->'plan'->'weeks','[]')) loop
      select coalesce(jsonb_agg(value),'[]') into rows from jsonb_array_elements(coalesce(w->'rows','[]'))
      where (p.role='farmer' and value->>'farmId'=p.farm_id) or (p.role='operator' and value->>'rmu'=p.rmu);
      -- Only the assigned RMU's supply/uncertainty metadata is shared.
      if jsonb_typeof(w->'supplyByRmu')='array' then
        select coalesce(jsonb_agg(value),'[]') into supplies from jsonb_array_elements(w->'supplyByRmu') where value->>'rmu'=assigned_rmu;
      else supplies=jsonb_build_array(w->'supplyByRmu'->assigned_rmu); end if;
      w=(w - array['supplyByRmu','unknownRmus','incompleteRmus','unknownDemandM3','incompleteDemandCells','availableM3'])
        ||jsonb_build_object('rows',rows,'availableM3',coalesce(supplies->0->'available',supplies->0->'availableM3'),'supplyByRmu',supplies);
      weeks=weeks||jsonb_build_array(w);
    end loop;
    plan=jsonb_set(plan,'{plan,weeks}',weeks);
    if plan ? 'supplyRecords' then
      plan=jsonb_set(plan,'{supplyRecords}',(select coalesce(jsonb_agg(value),'[]') from jsonb_array_elements(plan->'supplyRecords') where value->>'rmu'=assigned_rmu));
    end if;
  end if;
  result=result||jsonb_build_object('farms',f,'items',items,'planning',plan,'serverTime',now());
  if p.role='manager' then
    result=result||jsonb_build_object('members',(select coalesce(jsonb_agg(jsonb_build_object('id',user_id,'email',email,'displayName',display_name,'role',role,'approved',approved,'farmId',farm_id,'rmu',rmu,'_version',version) order by email),'[]') from public.mekong_profiles));
  end if;
  return result;
end $$;

create function public.mekong_command(action text, data jsonb, expected_version integer default 0) returns jsonb language plpgsql security definer set search_path='' as $$
declare
  p public.mekong_profiles; target public.mekong_profiles; farm public.mekong_farms; old public.mekong_items;
  item_id text=data->>'id'; kind text; body jsonb; before_data jsonb; actual numeric; amount numeric;
  s text=data->>'status'; at_time text=to_char(clock_timestamp() at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
  note text=left(coalesce(data->>'note',data->>'operatorNote',''),600); n integer; plan_row jsonb; plan_week jsonb; old_plan public.mekong_settings;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED' using errcode='42501'; end if;
  select * into p from public.mekong_profiles where user_id=auth.uid();
  if not found or not p.approved or p.role='pending' then raise exception 'APPROVAL_REQUIRED' using errcode='42501'; end if;
  if action is null or data is null or expected_version is null or expected_version<0 or jsonb_typeof(data)<>'object' or octet_length(data::text)>2000000 then raise exception 'INVALID_INPUT'; end if;
  if action='member.update' then
    if p.role<>'manager' then raise exception 'FORBIDDEN' using errcode='42501'; end if;
    perform pg_advisory_xact_lock(731826);
    select * into target from public.mekong_profiles where user_id=item_id::uuid for update;
    if not found then raise exception 'NOT_FOUND' using errcode='P0002'; end if;
    if target.version<>expected_version then raise exception 'VERSION_CONFLICT' using errcode='40001'; end if;
    if data->>'role' not in ('pending','farmer','operator','manager') or jsonb_typeof(data->'approved')<>'boolean' then raise exception 'INVALID_INPUT'; end if;
    if target.role='manager' and target.approved and (data->>'role'<>'manager' or not (data->>'approved')::boolean)
       and (select count(*) from public.mekong_profiles where role='manager' and approved)<2 then raise exception 'LAST_MANAGER'; end if;
    before_data=to_jsonb(target);
    update public.mekong_profiles set role=data->>'role',approved=(data->>'approved')::boolean,
      farm_id=case when data->>'role'='farmer' then nullif(data->>'farmId','') end,
      rmu=case when data->>'role'='operator' then nullif(data->>'rmu','') end,version=version+1 where user_id=target.user_id;
  elsif action in ('farm.upsert','farm.delete') then
    select * into farm from public.mekong_farms where id=item_id for update;
    if p.role<>'manager' and not (action='farm.upsert' and p.role='farmer' and farm.id=p.farm_id) then raise exception 'FORBIDDEN' using errcode='42501'; end if;
    if coalesce(farm.version,0)<>expected_version then raise exception 'VERSION_CONFLICT' using errcode='40001'; end if;
    before_data=farm.payload;
    if action='farm.delete' then
      if item_id like 'DEMO-RMU-%' then raise exception 'PILOT_FARMS_PROTECTED'; end if;
      delete from public.mekong_farms where id=item_id;
    else
      if item_id is null or length(item_id)>100 or length(coalesce(data->>'name','')) not between 1 and 120 or data->>'crop' not in ('rice','durian','mango','jackfruit')
        or (data->>'area')::numeric not between 0.001 and 10000 or not (data->>'start' ~ '^\d{4}-\d{2}-\d{2}$') then raise exception 'INVALID_INPUT'; end if;
      perform (data->>'start')::date;
      if p.role='farmer' and (data->>'rmu' is distinct from farm.rmu) then raise exception 'FORBIDDEN' using errcode='42501'; end if;
      if not (data ?& array['crop','area','start','variety','irrigation']) or data->>'irrigation' not in ('surface','drip','unknown') then raise exception 'INVALID_INPUT'; end if;
      if ((data->>'lat') is null) is distinct from ((data->>'lon') is null) or
        ((data->>'lat') is not null and ((data->>'lat')::numeric not between 10.43 and 10.59 or (data->>'lon')::numeric not between 105.12 and 105.28)) then raise exception 'INVALID_INPUT'; end if;
      body=data - array['_version','allocationRisk','allocationRiskSource','allocationWaitDays','origin','assignmentStatus'];
      if farm.id is not null then
        body=farm.payload||body;
        if p.role='manager' then body=body||(data - '_version'); end if;
      elsif p.role='manager' then body=data-'_version'; end if;
      if p.role='farmer' and data ? 'allocationRisk' then
        if jsonb_typeof(data->'allocationRisk')<>'object' or exists(
          select 1 from jsonb_each(data->'allocationRisk') e where e.key not in ('growth','soil','damage','alternative')
          or jsonb_typeof(e.value)<>'number' or e.value::text::numeric not between 0 and 4 or trunc(e.value::text::numeric)<>e.value::text::numeric
        ) then raise exception 'INVALID_INPUT'; end if;
        body=body||jsonb_build_object('allocationRisk',data->'allocationRisk','allocationRiskSource',case when data->'allocationRisk'='{}'::jsonb then 'UNASSESSED' else 'USER_ASSESSED' end);
      end if;
      insert into public.mekong_farms values(item_id,data->>'rmu',body,1)
      on conflict(id) do update set payload=excluded.payload,rmu=excluded.rmu,version=public.mekong_farms.version+1;
    end if;
    update public.mekong_settings set payload=payload||'{"stale":true}'::jsonb,version=version+1 where id='planning';
  elsif action='planning.publish' then
    if p.role<>'manager' then raise exception 'FORBIDDEN' using errcode='42501'; end if;
    perform pg_advisory_xact_lock(731827);
    select * into old_plan from public.mekong_settings where id='planning' for update;
    if coalesce(old_plan.version,0)<>expected_version then raise exception 'VERSION_CONFLICT' using errcode='40001'; end if;
    if jsonb_typeof(data->'plan'->'weeks')<>'array' or jsonb_array_length(data->'plan'->'weeks') not between 1 and 104 then raise exception 'INVALID_INPUT'; end if;
    for plan_week in select value from jsonb_array_elements(data->'plan'->'weeks') loop
      perform (plan_week->>'startDate')::date;
      for plan_row in select value from jsonb_array_elements(plan_week->'rows') loop
        select * into farm from public.mekong_farms where id=plan_row->>'farmId';
        if not found or farm.rmu is distinct from plan_row->>'rmu' or (plan_row->>'plannedM3')::numeric<0 or (plan_row->>'requestM3')::numeric<0 then raise exception 'INVALID_INPUT'; end if;
      end loop;
    end loop;
    before_data=old_plan.payload;
    insert into public.mekong_settings values('planning',(data-'_version')||jsonb_build_object('publishedAt',at_time,'stale',false),1)
      on conflict(id) do update set payload=excluded.payload,version=public.mekong_settings.version+1;
    item_id='planning';
  else
    kind=case split_part(action,'.',1) when 'request' then 'requests' when 'operation' then 'operations' when 'incident' then 'incidents' when 'benefit' then 'records' end;
    if kind is null then raise exception 'INVALID_ACTION'; end if;
    if item_id is null or length(item_id)>150 then raise exception 'INVALID_INPUT'; end if;
    perform pg_advisory_xact_lock(hashtextextended(item_id,0));
    select * into old from public.mekong_items where id=item_id for update;
    if old.id is not null and old.kind<>kind then raise exception 'FORBIDDEN' using errcode='42501'; end if;
    -- Retrying the same request after a lost response must not submit twice.
    if action='request.create' and old.id is not null and old.created_by=p.user_id and p.role='farmer' and old.farm_id=p.farm_id
      and old.payload->>'farmId'=data->>'farmId' and old.payload->>'weekStart'=data->>'weekStart'
      and (old.payload->>'weekIndex')::integer=(data->>'weekIndex')::integer
      and (old.payload->>'requestM3')::numeric=(data->>'requestM3')::numeric
      and old.payload->>'reason'=left(coalesce(data->>'reason',''),400) then return public.mekong_snapshot(); end if;
    if coalesce(old.version,0)<>expected_version then raise exception 'VERSION_CONFLICT' using errcode='40001'; end if;
    before_data=old.payload;
    select * into farm from public.mekong_farms where id=coalesce(old.farm_id,data->>'farmId',p.farm_id);
    if action='request.create' then
      if p.role<>'farmer' or farm.id is distinct from p.farm_id or old.id is not null then raise exception 'FORBIDDEN' using errcode='42501'; end if;
      amount=(data->>'requestM3')::numeric;
      if amount is null or amount<=0 or amount>1000000000 or data->>'weekIndex' is null or (data->>'weekIndex')::integer not between 1 and 104 or data->>'weekStart' is null then raise exception 'INVALID_INPUT'; end if;
      perform (data->>'weekStart')::date;
      if exists(select 1 from public.mekong_settings where id='planning') and not exists(
        select 1 from public.mekong_settings,jsonb_array_elements(payload->'plan'->'weeks') w where id='planning' and w->>'startDate'=data->>'weekStart' and (w->>'index')::integer=(data->>'weekIndex')::integer
      ) then raise exception 'PLAN_CHANGED'; end if;
      body=jsonb_build_object('id',item_id,'farmId',farm.id,'farmName',farm.payload->>'name','rmu',farm.rmu,'weekStart',data->>'weekStart','weekIndex',(data->>'weekIndex')::integer,
        'requestM3',amount,'reason',left(coalesce(data->>'reason',''),400),'status','pending','deliveredM3',null,'operatorNote','');
    elsif action='request.update' then
      if old.id is null then raise exception 'NOT_FOUND' using errcode='P0002'; end if;
      if p.role not in ('operator','manager') or (p.role='operator' and old.rmu<>p.rmu) then raise exception 'FORBIDDEN' using errcode='42501'; end if;
      actual=nullif(data->>'deliveredM3','')::numeric; amount=(old.payload->>'requestM3')::numeric;
      if s not in ('pending','processing','completed','partial','declined') or s is null then raise exception 'INVALID_INPUT'; end if;
      if old.payload->>'status' in ('completed','partial','declined') and (p.role<>'manager' or note='') then raise exception 'TERMINAL_REQUEST'; end if;
      if s in ('pending','processing') then actual=null;
      elsif s='declined' then
        if coalesce(actual,0)<>0 or note='' then raise exception 'DELIVERY_INVALID'; end if; actual=0;
      elsif actual is null or actual<=0 or actual>1000000000 or (s='partial' and actual>=amount) or (s='completed' and actual<amount) then raise exception 'DELIVERY_INVALID';
      end if;
      if actual>amount and note='' then raise exception 'DELIVERY_INVALID'; end if;
      body=old.payload||jsonb_build_object('status',s,'deliveredM3',actual,'operatorNote',left(note,300));
    elsif action='operation.upsert' then
      if farm.id is null or p.role not in ('manager','operator') or (p.role='operator' and farm.rmu<>p.rmu) then raise exception 'FORBIDDEN' using errcode='42501'; end if;
      perform (data->>'weekStart')::date;
      if item_id is distinct from (data->>'weekStart')||'|'||farm.id then raise exception 'INVALID_INPUT'; end if;
      actual=nullif(data->>'actualM3','')::numeric;
      if s in ('pending','in_progress') then actual=null;
      elsif s in ('complete','partial') then if actual is null or actual<=0 or actual>1000000000 then raise exception 'DELIVERY_INVALID'; end if;
      elsif s='not_delivered' then if coalesce(actual,0)<>0 or note='' then raise exception 'DELIVERY_INVALID'; end if; actual=0;
      else raise exception 'INVALID_INPUT'; end if;
      body=(coalesce(old.payload,'{}')||data)-array['_version','history','createdAt','updatedAt'];
      body=body||jsonb_build_object('farmId',farm.id,'farmName',farm.payload->>'name','rmu',farm.rmu,'actualM3',actual,'note',left(note,240));
    elsif action='incident.create' then
      if p.role<>'farmer' or farm.id is distinct from p.farm_id or old.id is not null then raise exception 'FORBIDDEN' using errcode='42501'; end if;
      if length(trim(coalesce(data->>'details','')))=0 or data->>'typeKey' not in ('issueBypass','issueOrder','issueMismatch','issueShortage','issueOther') then raise exception 'INVALID_INPUT'; end if;
      body=jsonb_build_object('id',item_id,'rmu',farm.rmu,'typeKey',data->>'typeKey','reporterFarmId',farm.id,'reporterRole','farmer','details',left(data->>'details',1500),'reviewNote','','status','open');
    elsif action='incident.update' then
      if p.role<>'manager' then raise exception 'FORBIDDEN' using errcode='42501'; end if;
      if old.id is null then raise exception 'NOT_FOUND' using errcode='P0002'; end if;
      if s not in ('investigating','closed') or s is null then raise exception 'INVALID_INPUT'; end if;
      body=old.payload||jsonb_build_object('status',s,'reviewNote',note);
    elsif action='benefit.create' then
      if p.role not in ('manager','operator') or (p.role='operator' and data->>'rmu' is distinct from p.rmu) or old.id is not null then raise exception 'FORBIDDEN' using errcode='42501'; end if;
      if not (data ?& array['baselineStart','baselineEnd','currentStart','currentEnd','baselineWaterM3','actualWaterM3'])
        or exists(select 1 from unnest(array['baselineStart','baselineEnd','currentStart','currentEnd']) k where jsonb_typeof(data->k) is distinct from 'string')
        or jsonb_typeof(data->'baselineWaterM3') is distinct from 'number' or jsonb_typeof(data->'actualWaterM3') is distinct from 'number'
        or data->>'measureBasis' not in ('meter','ledger','estimate') then raise exception 'INVALID_INPUT'; end if;
      if (data->>'baselineEnd')::date < (data->>'baselineStart')::date or (data->>'currentEnd')::date < (data->>'currentStart')::date
        or (data->>'baselineWaterM3')::numeric<0 or (data->>'actualWaterM3')::numeric<0 then raise exception 'INVALID_INPUT'; end if;
      body=(data-array['_version','history','createdAt','updatedAt','confirmations','farmId','reporterFarmId'])||jsonb_build_object('status','awaiting_farmer');
    elsif action='benefit.confirm' then
      select * into farm from public.mekong_farms where id=p.farm_id;
      if p.role<>'farmer' or old.id is null or old.rmu is distinct from farm.rmu then raise exception 'FORBIDDEN' using errcode='42501'; end if;
      if old.payload->>'status'='verified' or s not in ('farmer_confirmed','disputed') or s is null then raise exception 'INVALID_INPUT'; end if;
      body=old.payload||jsonb_build_object('status',s,'confirmations',coalesce(old.payload->'confirmations','{}')||jsonb_build_object(p.farm_id,jsonb_build_object('status',s,'at',at_time)));
    elsif action='benefit.review' then
      if p.role<>'manager' then raise exception 'FORBIDDEN' using errcode='42501'; end if;
      if old.id is null then raise exception 'NOT_FOUND' using errcode='P0002'; end if;
      body=old.payload;
      if s='verified' then
        if old.created_by=p.user_id or coalesce((body->>'demo')::boolean,false) or body->>'status'<>'farmer_confirmed'
          or not coalesce((body->>'checkScope')::boolean and (body->>'checkCrop')::boolean and (body->>'checkWeather')::boolean,false)
          or body->>'measureBasis' not in ('meter','ledger') or body->>'deliveryQuality'<>'adequate'
          or coalesce(trim(body->>'baselineEvidence'),'')='' or coalesce(trim(body->>'actualEvidence'),'')=''
          or not coalesce(((body->>'baselineEnd')::date-(body->>'baselineStart')::date)=((body->>'currentEnd')::date-(body->>'currentStart')::date),false)
          then raise exception 'VERIFY_BLOCKED'; end if;
      elsif s<>'revision' or s is null then raise exception 'INVALID_INPUT'; end if;
      body=body||jsonb_build_object('status',s);
    else raise exception 'INVALID_ACTION'; end if;
    body=body||jsonb_build_object('id',item_id,'createdAt',coalesce(old.payload->>'createdAt',at_time),'updatedAt',at_time,
      'history',coalesce(old.payload->'history','[]')||jsonb_build_array(jsonb_build_object('at',at_time,'role',p.role,'action',action,'status',body->>'status','deliveredM3',body->'deliveredM3','note',note)));
    insert into public.mekong_items values(item_id,kind,
      case when kind in ('requests','operations') then farm.id else null end,body->>'rmu',body,1,p.user_id,p.user_id)
    on conflict(id) do update set payload=excluded.payload,version=public.mekong_items.version+1,updated_by=p.user_id;
  end if;
  insert into public.mekong_audit(actor_id,action,record_id,before_data,after_data) values(p.user_id,action,item_id,before_data,data-array['password','access_token','refresh_token']);
  return public.mekong_snapshot();
end $$;
revoke all on function public.mekong_snapshot() from public,anon;
revoke all on function public.mekong_command(text,jsonb,integer) from public,anon;
grant execute on function public.mekong_snapshot() to authenticated;
grant execute on function public.mekong_command(text,jsonb,integer) to authenticated;
commit;

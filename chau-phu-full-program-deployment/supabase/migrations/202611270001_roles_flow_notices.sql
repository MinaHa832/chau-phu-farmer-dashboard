-- Expand five roles and add reviewed flow models and app/paper notices.
-- Existing farms, requests, delivery records and published plans are preserved.
begin;
do $$
declare s text; c record;
begin
 foreach s in array array['public','mekong_demo'] loop
  for c in select conname from pg_constraint where conrelid=(s||'.mekong_profiles')::regclass and contype='c' and (pg_get_constraintdef(oid) like '%role%' or pg_get_constraintdef(oid) like '%approved%') loop
   execute format('alter table %I.mekong_profiles drop constraint %I',s,c.conname);
  end loop;
  execute format('alter table %I.mekong_profiles add constraint mekong_roles check (role in (''pending'',''farmer'',''operator'',''cooperative'',''platform'',''manager''))',s);
  execute format('alter table %I.mekong_profiles add constraint mekong_assignment check (not approved or role in (''platform'',''manager'') or (role=''farmer'' and farm_id is not null) or (role in (''operator'',''cooperative'') and rmu is not null))',s);
  for c in select conname from pg_constraint where conrelid=(s||'.mekong_items')::regclass and contype='c' and pg_get_constraintdef(oid) like '%kind%' loop
   execute format('alter table %I.mekong_items drop constraint %I',s,c.conname);
  end loop;
  execute format('alter table %I.mekong_items add constraint mekong_item_kinds check (kind in (''requests'',''operations'',''incidents'',''records'',''notices'',''checks''))',s);
 end loop;
end $$;
-- Preserve privileges of a previously approved real administrator. A manager
-- selected in the public demo remains the separate independent reviewer.
update public.mekong_profiles set role='platform',version=version+1 where role='manager' and approved;
create or replace function public.mekong_snapshot() returns jsonb language plpgsql security definer set search_path='' as $$
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
  assigned_rmu=case when p.role in ('operator','cooperative') then p.rmu else assigned_rmu end;
  select coalesce(jsonb_agg(payload||jsonb_build_object('_version',version) order by id),'[]') into f from public.mekong_farms
  where p.role in ('manager','platform') or (p.role='farmer' and id=p.farm_id) or (p.role in ('operator','cooperative') and rmu=p.rmu);
  select coalesce(jsonb_agg(jsonb_build_object('kind',kind,'data',
    (case when kind='incidents' and p.role<>'manager' and created_by<>p.user_id then payload - array['details','reporterFarmId','reporterRole','reviewNote','history'] else payload end)
    ||jsonb_build_object('_version',version)) order by payload->>'createdAt' desc),'[]') into items
  from public.mekong_items where p.role in ('manager','platform')
    or (p.role in ('operator','cooperative') and rmu=p.rmu)
    or (p.role='farmer' and ((kind in ('requests','operations','notices','checks') and farm_id=p.farm_id) or (kind='incidents' and created_by=p.user_id) or (kind='records' and rmu=assigned_rmu)));
  select payload||jsonb_build_object('_version',version) into plan from public.mekong_settings where id='planning';
  if p.role not in ('manager','platform') and plan is not null then
    for w in select value from jsonb_array_elements(coalesce(plan->'plan'->'weeks','[]')) loop
      select coalesce(jsonb_agg(value),'[]') into rows from jsonb_array_elements(coalesce(w->'rows','[]'))
      where (p.role='farmer' and value->>'farmId'=p.farm_id) or (p.role in ('operator','cooperative') and value->>'rmu'=p.rmu);
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
  result=result||jsonb_build_object('waterModels',(select coalesce(jsonb_agg(payload||jsonb_build_object('_version',version)),'[]') from public.mekong_settings where id like 'water-model:%' and (p.role in ('manager','platform') or payload->>'rmu'=assigned_rmu)), 'deliveryPreferences',(select coalesce(jsonb_agg(payload||jsonb_build_object('_version',version)),'[]') from public.mekong_settings where id like 'notice-pref:%' and (p.role in ('manager','platform') or (p.role in ('operator','cooperative') and payload->>'rmu'=p.rmu) or (p.role='farmer' and payload->>'farmId'=p.farm_id))));
  if p.role='platform' then
    result=result||jsonb_build_object('members',(select coalesce(jsonb_agg(jsonb_build_object('id',user_id,'email',email,'displayName',display_name,'role',role,'approved',approved,'farmId',farm_id,'rmu',rmu,'_version',version) order by email),'[]') from public.mekong_profiles));
  end if;
  return result;
end $$;

create or replace function public.mekong_command(action text, data jsonb, expected_version integer default 0) returns jsonb language plpgsql security definer set search_path='' as $$
declare
  p public.mekong_profiles; target public.mekong_profiles; farm public.mekong_farms; old public.mekong_items;
  item_id text=data->>'id'; kind text; body jsonb; before_data jsonb; actual numeric; amount numeric;
  s text=data->>'status'; at_time text=to_char(clock_timestamp() at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
  note text=left(coalesce(data->>'note',data->>'operatorNote',''),600); n integer; new_settings jsonb; setting_id text; selected_channel text; shares numeric; plan_row jsonb; plan_week jsonb; old_plan public.mekong_settings;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED' using errcode='42501'; end if;
  select * into p from public.mekong_profiles where user_id=auth.uid();
  if not found or not p.approved or p.role='pending' then raise exception 'APPROVAL_REQUIRED' using errcode='42501'; end if;
  if action is null or data is null or expected_version is null or expected_version<0 or jsonb_typeof(data)<>'object' or octet_length(data::text)>2000000 then raise exception 'INVALID_INPUT'; end if;
  if action in ('water.model.upsert','water.model.review','notice.preference') then
    setting_id=case when action='notice.preference' then 'notice-pref:'||(data->>'farmId') else 'water-model:'||(data->>'rmu') end;
    if setting_id is null then raise exception 'INVALID_INPUT'; end if;
    perform pg_advisory_xact_lock(hashtextextended('settings:'||setting_id,0));
    select * into old_plan from public.mekong_settings where id=setting_id for update;
    if coalesce(old_plan.version,0)<>expected_version then raise exception 'VERSION_CONFLICT' using errcode='40001'; end if;
    before_data=old_plan.payload; item_id=setting_id;
    if action='notice.preference' then
      select * into farm from public.mekong_farms where id=data->>'farmId';
      if not found or not (p.role='platform' or (p.role='cooperative' and farm.rmu=p.rmu) or (p.role='farmer' and farm.id=p.farm_id)) then raise exception 'FORBIDDEN' using errcode='42501'; end if;
      if data->>'channel' is null or data->>'channel' not in ('app','paper') then raise exception 'INVALID_INPUT'; end if;
      new_settings=jsonb_build_object('id',setting_id,'farmId',farm.id,'rmu',farm.rmu,'channel',data->>'channel','updatedAt',at_time);
    elsif action='water.model.upsert' then
      if p.role<>'platform' and not (p.role='cooperative' and data->>'rmu'=p.rmu) then raise exception 'FORBIDDEN' using errcode='42501'; end if;
      if not (data ?& array['rmu','stationId','siteName','datum','samples','sourceId','sourceCapacityM3h','sourceSharePct','pumpCapacityM3h','runtimeHours','lossPct','uncertaintyPct','zeroStageM','flowCondition','evidence','demo'])
        or jsonb_typeof(data->'demo') is distinct from 'boolean'
        or length(trim(coalesce(data->>'siteName','')))=0 or length(trim(coalesce(data->>'datum','')))=0
        or data->>'stationId' not in ('039801','019803','980601')
        or not coalesce(data->>'rmu' ~ '^RMU-(0[1-9]|1[0-8])$',false) or jsonb_typeof(data->'samples') is distinct from 'array'
        or jsonb_array_length(data->'samples') not between 3 and 200 or data->>'flowCondition'<>'free_flow'
        or length(trim(coalesce(data->>'sourceId','')))=0 or length(trim(coalesce(data->>'evidence','')))=0
        or (data->>'runtimeHours')::numeric not between 0 and 168 or (data->>'lossPct')::numeric not between 0 and 80 or (data->>'uncertaintyPct')::numeric not between 0 and 80 or (data->>'pumpCapacityM3h')::numeric not between 0 and 10000000
        or (data->>'sourceSharePct')::numeric not between 0 and 100 or (data->>'sourceCapacityM3h')::numeric<0 then raise exception 'INVALID_INPUT'; end if;
      -- A common-source lock prevents two simultaneous RMU edits exceeding 100%.
      perform pg_advisory_xact_lock(731828);
      select coalesce(sum((payload->>'sourceSharePct')::numeric),0) into shares from public.mekong_settings where id like 'water-model:%' and id<>setting_id and payload->>'sourceId'=data->>'sourceId';
      if shares+(data->>'sourceSharePct')::numeric>100.00000001 then raise exception 'FLOW_SHARES'; end if;
      if exists(select 1 from public.mekong_settings where id like 'water-model:%' and id<>setting_id and payload->>'sourceId'=data->>'sourceId'
        and (payload->>'stationId' is distinct from data->>'stationId' or (payload->>'sourceCapacityM3h')::numeric is distinct from (data->>'sourceCapacityM3h')::numeric)) then raise exception 'FLOW_SOURCE_MISMATCH'; end if;
      new_settings=(data-array['_version','reviewedBy','reviewedAt','reviewEvidence','createdBy'])||jsonb_build_object('id',setting_id,'verified',false,'createdBy',p.user_id,'updatedAt',at_time);
    else
      if p.role<>'manager' or old_plan.id is null or old_plan.payload->>'createdBy'=p.user_id::text then raise exception 'FORBIDDEN' using errcode='42501'; end if;
      if coalesce((old_plan.payload->>'demo')::boolean,false) or length(trim(coalesce(data->>'evidence','')))<5 then raise exception 'VERIFY_BLOCKED'; end if;
      new_settings=old_plan.payload||jsonb_build_object('verified',true,'reviewedBy',p.user_id,'reviewedAt',at_time,'reviewEvidence',left(data->>'evidence',1000));
    end if;
    insert into public.mekong_settings values(setting_id,new_settings,1) on conflict(id) do update set payload=excluded.payload,version=public.mekong_settings.version+1;
  elsif action='member.update' then
    if p.role<>'platform' then raise exception 'FORBIDDEN' using errcode='42501'; end if;
    perform pg_advisory_xact_lock(731826);
    select * into target from public.mekong_profiles where user_id=item_id::uuid for update;
    if not found then raise exception 'NOT_FOUND' using errcode='P0002'; end if;
    if target.version<>expected_version then raise exception 'VERSION_CONFLICT' using errcode='40001'; end if;
    if data->>'role' not in ('pending','farmer','operator','manager','cooperative','platform') or jsonb_typeof(data->'approved')<>'boolean' then raise exception 'INVALID_INPUT'; end if;
    if target.role='platform' and target.approved and (data->>'role'<>'platform' or not (data->>'approved')::boolean)
       and (select count(*) from public.mekong_profiles where role='platform' and approved)<2 then raise exception 'LAST_MANAGER'; end if;
    before_data=to_jsonb(target);
    update public.mekong_profiles set role=data->>'role',approved=(data->>'approved')::boolean,
      farm_id=case when data->>'role'='farmer' then nullif(data->>'farmId','') end,
      rmu=case when data->>'role' in ('operator','cooperative') then nullif(data->>'rmu','') end,version=version+1 where user_id=target.user_id;
  elsif action in ('farm.upsert','farm.delete') then
    select * into farm from public.mekong_farms where id=item_id for update;
    if p.role<>'platform' and not (action='farm.upsert' and p.role='cooperative' and farm.rmu=p.rmu and data->>'rmu'=p.rmu) and not (action='farm.upsert' and p.role='farmer' and farm.id=p.farm_id) then raise exception 'FORBIDDEN' using errcode='42501'; end if;
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
        if p.role='platform' then body=body||(data - '_version'); end if;
      elsif p.role='platform' then body=data-'_version'; end if;
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
    if p.role<>'platform' then raise exception 'FORBIDDEN' using errcode='42501'; end if;
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
    kind=case split_part(action,'.',1) when 'request' then 'requests' when 'operation' then 'operations' when 'incident' then 'incidents' when 'benefit' then 'records' when 'notice' then 'notices' when 'check' then 'checks' end;
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
    if action='notice.issue' then
      if old.id is not null or farm.id is null or not (p.role='platform' or (p.role='cooperative' and farm.rmu=p.rmu)) then raise exception 'FORBIDDEN' using errcode='42501'; end if;
      select w into plan_week from public.mekong_settings,jsonb_array_elements(payload->'plan'->'weeks') w where id='planning' and w->>'startDate'=data->>'weekStart';
      select x into plan_row from jsonb_array_elements(plan_week->'rows') x where x->>'farmId'=farm.id;
      if plan_row is null or plan_row->'plannedM3'='null'::jsonb then raise exception 'PLAN_CHANGED'; end if;
      select payload->>'channel' into selected_channel from public.mekong_settings where id='notice-pref:'||farm.id;
      if data->>'channel' is distinct from coalesce(selected_channel,'app') then raise exception 'PLAN_CHANGED'; end if;
      body=jsonb_build_object('id',item_id,'farmId',farm.id,'farmName',farm.payload->>'name','rmu',farm.rmu,'channel',coalesce(selected_channel,'app'),
        'weekStart',data->>'weekStart','plannedM3',plan_row->'plannedM3','requestM3',plan_row->'requestM3','status','issued','issuedBy',p.role);
    elsif action in ('notice.deliver','notice.ack') then
      if old.id is null then raise exception 'NOT_FOUND'; end if;
      if action='notice.ack' then
        if p.role<>'farmer' or old.farm_id is distinct from p.farm_id then raise exception 'FORBIDDEN' using errcode='42501'; end if;
        body=old.payload||jsonb_build_object('acknowledgedAt',at_time,'status','acknowledged');
      else
        if not (p.role='platform' or (p.role='cooperative' and old.rmu=p.rmu)) or old.payload->>'channel'<>'paper' then raise exception 'FORBIDDEN' using errcode='42501'; end if;
        if length(trim(note))=0 then raise exception 'INVALID_INPUT'; end if;
        body=old.payload||jsonb_build_object('deliveredAt',at_time,'deliveryNote',note,'status',case when old.payload->>'status'='acknowledged' then 'acknowledged' else 'delivered' end);
      end if;
    elsif action='check.create' then
      if p.role<>'farmer' or farm.id is distinct from p.farm_id or old.id is not null then raise exception 'FORBIDDEN' using errcode='42501'; end if;
      if data->>'path' is null or data->>'path' not in ('intake','stored') or length(trim(coalesce(data->>'note','')))=0 then raise exception 'INVALID_INPUT'; end if;
      body=jsonb_build_object('id',item_id,'farmId',farm.id,'rmu',farm.rmu,'path',data->>'path','note',note,'status','recorded');
    elsif action='request.create' then
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
      if p.role not in ('operator','cooperative','platform') or (p.role in ('operator','cooperative') and old.rmu<>p.rmu) then raise exception 'FORBIDDEN' using errcode='42501'; end if;
      if p.role='cooperative' and (s not in ('pending','processing','declined') or old.payload->>'status' in ('completed','partial')) then raise exception 'FORBIDDEN' using errcode='42501'; end if;
      actual=nullif(data->>'deliveredM3','')::numeric; amount=(old.payload->>'requestM3')::numeric;
      if s not in ('pending','processing','completed','partial','declined') or s is null then raise exception 'INVALID_INPUT'; end if;
      if old.payload->>'status' in ('completed','partial','declined') and (p.role<>'platform' or note='') then raise exception 'TERMINAL_REQUEST'; end if;
      if s in ('pending','processing') then actual=null;
      elsif s='declined' then
        if coalesce(actual,0)<>0 or note='' then raise exception 'DELIVERY_INVALID'; end if; actual=0;
      elsif actual is null or actual<=0 or actual>1000000000 or (s='partial' and actual>=amount) or (s='completed' and actual<amount) then raise exception 'DELIVERY_INVALID';
      end if;
      if actual>amount and note='' then raise exception 'DELIVERY_INVALID'; end if;
      body=old.payload||jsonb_build_object('status',s,'deliveredM3',actual,'operatorNote',left(note,300));
    elsif action='operation.upsert' then
      if farm.id is null or p.role not in ('platform','operator') or (p.role='operator' and farm.rmu<>p.rmu) then raise exception 'FORBIDDEN' using errcode='42501'; end if;
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
      if p.role not in ('platform','operator') or (p.role='operator' and data->>'rmu' is distinct from p.rmu) or old.id is not null then raise exception 'FORBIDDEN' using errcode='42501'; end if;
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
      case when kind in ('requests','operations','notices','checks') then farm.id else null end,body->>'rmu',body,1,p.user_id,p.user_id)
    on conflict(id) do update set payload=excluded.payload,version=public.mekong_items.version+1,updated_by=p.user_id;
  end if;
  insert into public.mekong_audit(actor_id,action,record_id,before_data,after_data) values(p.user_id,action,item_id,before_data,data-array['password','access_token','refresh_token']);
  return public.mekong_snapshot();
end $$;

do $$
declare definition text; signature text;
begin
 foreach signature in array array['public.mekong_snapshot()','public.mekong_command(text,jsonb,integer)'] loop
  definition=pg_get_functiondef(signature::regprocedure);
  definition=replace(definition,'public.mekong_','mekong_demo.mekong_');
  definition=replace(definition,'auth.uid()','mekong_demo.actor()');
  definition=replace(definition,'731826','831826'); definition=replace(definition,'731827','831827'); definition=replace(definition,'731828','831828');
  definition=replace(definition,'hashtextextended(item_id,0)','hashtextextended(''demo:''||item_id,0)');
  execute definition;
 end loop;
end $$;
insert into mekong_demo.mekong_profiles(user_id,email,display_name,role,approved,rmu)
select ('30000000-0000-0000-0000-'||lpad(n::text,12,'0'))::uuid,'demo-cooperative-'||n||'@example.invalid','DEMO cooperative RMU-'||lpad(n::text,2,'0'),'cooperative',true,'RMU-'||lpad(n::text,2,'0') from generate_series(1,18) n on conflict do nothing;
insert into mekong_demo.mekong_profiles(user_id,email,display_name,role,approved)
values('40000000-0000-0000-0000-000000000001','demo-platform@example.invalid','DEMO platform','platform',true) on conflict do nothing;
create or replace function public.mekong_demo_enter(role_name text, assigned_farm text default null, assigned_rmu text default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare actor_id uuid; session_token text;
begin
 if role_name is null or role_name not in ('farmer','operator','cooperative','platform','manager') then raise exception 'INVALID_INPUT'; end if;
 select p.user_id into actor_id from mekong_demo.mekong_profiles p where p.role=role_name and p.approved
  and (role_name<>'farmer' or p.farm_id=assigned_farm) and (role_name not in ('operator','cooperative') or p.rmu=assigned_rmu) order by p.user_id limit 1;
 if actor_id is null then raise exception 'INVALID_INPUT'; end if;
 delete from mekong_demo.sessions where expires_at<now();
 if (select count(*) from mekong_demo.sessions)>5000 then raise exception 'RATE_LIMITED'; end if;
 session_token=replace(gen_random_uuid()::text,'-','')||replace(gen_random_uuid()::text,'-','');
 insert into mekong_demo.sessions(token_hash,actor_id) values(encode(sha256(convert_to(session_token,'UTF8')),'hex'),actor_id);
 return jsonb_build_object('sessionToken',session_token);
end $$;
-- Even a crafted public-demo call cannot label synthetic calibration as real.
create or replace function public.mekong_demo_command(session_token text, action text, data jsonb, expected_version integer default 0)
returns jsonb language plpgsql security definer set search_path='' as $$
begin
 perform mekong_demo.select_session(session_token);
 if action='member.update' or action='water.model.review' then raise exception 'FORBIDDEN' using errcode='42501'; end if;
 if action='farm.upsert' and not exists(select 1 from mekong_demo.mekong_farms where id=data->>'id') then raise exception 'PILOT_FARMS_PROTECTED'; end if;
 if action='water.model.upsert' then data=data||'{"demo":true}'::jsonb; end if;
 perform mekong_demo.mekong_command(action,data,expected_version);
 return mekong_demo.snapshot();
end $$;
revoke all on all functions in schema mekong_demo from public,anon,authenticated;
commit;

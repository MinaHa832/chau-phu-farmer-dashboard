-- Public, synthetic demonstration workspace. Real Auth and real records stay private.
-- Apply after 202611260001_shared_portal.sql, then apply demo-seed.sql.
begin;
create schema mekong_demo;
revoke all on schema mekong_demo from public,anon,authenticated;

-- LIKE copies constraints/indexes, but deliberately does not copy Auth foreign keys.
create table mekong_demo.mekong_profiles (like public.mekong_profiles including all);
create table mekong_demo.mekong_farms (like public.mekong_farms including all);
create table mekong_demo.mekong_items (like public.mekong_items including all);
create table mekong_demo.mekong_settings (like public.mekong_settings including all);
create table mekong_demo.mekong_audit (like public.mekong_audit including all);
alter table mekong_demo.mekong_profiles add foreign key (farm_id) references mekong_demo.mekong_farms(id);
alter table mekong_demo.mekong_items add foreign key (farm_id) references mekong_demo.mekong_farms(id);
alter table mekong_demo.mekong_items add foreign key (created_by) references mekong_demo.mekong_profiles(user_id);
alter table mekong_demo.mekong_items add foreign key (updated_by) references mekong_demo.mekong_profiles(user_id);
alter table mekong_demo.mekong_audit add foreign key (actor_id) references mekong_demo.mekong_profiles(user_id);

create table mekong_demo.sessions (
  token_hash text primary key, actor_id uuid not null references mekong_demo.mekong_profiles(user_id),
  expires_at timestamptz not null default now()+interval '8 hours'
);
alter table mekong_demo.sessions enable row level security;
alter table mekong_demo.mekong_profiles enable row level security;
alter table mekong_demo.mekong_farms enable row level security;
alter table mekong_demo.mekong_items enable row level security;
alter table mekong_demo.mekong_settings enable row level security;
alter table mekong_demo.mekong_audit enable row level security;
revoke all on all tables in schema mekong_demo from public,anon,authenticated;

create function mekong_demo.actor() returns uuid language sql stable set search_path='' as $$
  select nullif(current_setting('mekong_demo.actor',true),'')::uuid
$$;

-- Reuse the reviewed business rules in a private schema, with no reference back
-- to real data or Auth identities. Future rule changes need a corresponding migration.
do $$
declare definition text; signature text;
begin
  foreach signature in array array['public.mekong_snapshot()','public.mekong_command(text,jsonb,integer)'] loop
    definition=pg_get_functiondef(signature::regprocedure);
    definition=replace(definition,'public.mekong_','mekong_demo.mekong_');
    definition=replace(definition,'auth.uid()','mekong_demo.actor()');
    definition=replace(definition,'731826','831826');
    definition=replace(definition,'731827','831827');
    definition=replace(definition,'hashtextextended(item_id,0)','hashtextextended(''demo:''||item_id,0)');
    execute definition;
  end loop;
end $$;

create function mekong_demo.select_session(session_token text) returns void language plpgsql security definer set search_path='' as $$
declare actor_id uuid;
begin
  if length(coalesce(session_token,''))<>64 then raise exception 'AUTH_REQUIRED' using errcode='42501'; end if;
  select s.actor_id into actor_id from mekong_demo.sessions s
    where s.token_hash=encode(sha256(convert_to(session_token,'UTF8')),'hex') and s.expires_at>now();
  if actor_id is null then raise exception 'AUTH_REQUIRED' using errcode='42501'; end if;
  perform set_config('mekong_demo.actor',actor_id::text,true);
end $$;

create function mekong_demo.snapshot() returns jsonb language sql security definer set search_path='' as $$
  select jsonb_set(mekong_demo.mekong_snapshot()-'members','{profile,demo}','true'::jsonb)
    ||jsonb_build_object('workspace','demo')
$$;

create function public.mekong_demo_enter(role_name text, assigned_farm text default null, assigned_rmu text default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare actor_id uuid; session_token text;
begin
  -- Everyone may select a fictional persona. This grants no real-account access.
  if role_name not in ('farmer','operator','manager') or role_name is null then raise exception 'INVALID_INPUT'; end if;
  select p.user_id into actor_id from mekong_demo.mekong_profiles p where p.role=role_name and p.approved
    and (role_name<>'farmer' or p.farm_id=assigned_farm)
    and (role_name<>'operator' or p.rmu=assigned_rmu) order by p.user_id limit 1;
  if actor_id is null then raise exception 'INVALID_INPUT'; end if;
  delete from mekong_demo.sessions where expires_at<now();
  if (select count(*) from mekong_demo.sessions)>5000 then raise exception 'RATE_LIMITED'; end if;
  session_token=replace(gen_random_uuid()::text,'-','')||replace(gen_random_uuid()::text,'-','');
  insert into mekong_demo.sessions(token_hash,actor_id) values(encode(sha256(convert_to(session_token,'UTF8')),'hex'),actor_id);
  return jsonb_build_object('sessionToken',session_token);
end $$;

create function public.mekong_demo_snapshot(session_token text) returns jsonb language plpgsql security definer set search_path='' as $$
begin
  perform mekong_demo.select_session(session_token);
  return mekong_demo.snapshot();
end $$;

create function public.mekong_demo_command(session_token text, action text, data jsonb, expected_version integer default 0)
returns jsonb language plpgsql security definer set search_path='' as $$
begin
  perform mekong_demo.select_session(session_token);
  if action='member.update' then raise exception 'FORBIDDEN' using errcode='42501'; end if;
  if action='farm.upsert' and not exists(select 1 from mekong_demo.mekong_farms where id=data->>'id') then
    raise exception 'PILOT_FARMS_PROTECTED';
  end if;
  perform mekong_demo.mekong_command(action,data,expected_version);
  return mekong_demo.snapshot();
end $$;

create function public.mekong_demo_leave(session_token text) returns void language sql security definer set search_path='' as $$
  delete from mekong_demo.sessions where token_hash=encode(sha256(convert_to(session_token,'UTF8')),'hex')
$$;

revoke all on all functions in schema mekong_demo from public,anon,authenticated;
revoke all on function public.mekong_demo_enter(text,text,text),public.mekong_demo_snapshot(text),public.mekong_demo_command(text,text,jsonb,integer),public.mekong_demo_leave(text) from public;
grant execute on function public.mekong_demo_enter(text,text,text),public.mekong_demo_snapshot(text),public.mekong_demo_command(text,text,jsonb,integer),public.mekong_demo_leave(text) to anon,authenticated;
commit;

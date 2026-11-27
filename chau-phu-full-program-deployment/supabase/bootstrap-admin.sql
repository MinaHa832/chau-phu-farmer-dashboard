-- Run AFTER the intended administrator signs up and confirms their email.
-- Replace the value locally; do not commit a private email address or password.
begin;
do $$
declare admin_email text='REPLACE_WITH_VERIFIED_ADMIN_EMAIL'; admin_id uuid;
begin
  perform pg_advisory_xact_lock(731826);
  if admin_email='REPLACE_WITH_VERIFIED_ADMIN_EMAIL' then raise exception 'Set the administrator email first'; end if;
  if exists(select 1 from public.mekong_profiles where role='platform' and approved) then
    raise exception 'An administrator already exists. Use Accounts and sharing to approve additional managers.';
  end if;
  select id into admin_id from auth.users where lower(email)=lower(admin_email) and email_confirmed_at is not null;
  if admin_id is null then raise exception 'This email must sign up and confirm its email first'; end if;
  update public.mekong_profiles set role='platform',approved=true,display_name='mekongsuksuk',version=version+1 where user_id=admin_id;
  if not found then raise exception 'Profile not found; apply the migration first'; end if;
end $$;
commit;

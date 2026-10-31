-- Run once in Supabase SQL Editor before deploying the SMS hook.
begin;
create schema if not exists ekvivalent_private;
revoke all on schema ekvivalent_private from public,anon,authenticated;
create table if not exists ekvivalent_private.sms_budget (
 singleton boolean primary key default true check(singleton),
 daily_limit integer not null default 10 check(daily_limit between 1 and 1000),
 per_phone_limit integer not null default 3 check(per_phone_limit between 1 and 20)
);
insert into ekvivalent_private.sms_budget(singleton) values(true) on conflict do nothing;
create table if not exists ekvivalent_private.sms_requests (
 event_id text primary key,
 phone_hash text not null,
 state text not null check(state in ('pending','sent','failed')),
 attempts integer not null default 1,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
alter table ekvivalent_private.sms_budget enable row level security;
alter table ekvivalent_private.sms_requests enable row level security;
revoke all on all tables in schema ekvivalent_private from public,anon,authenticated;
create or replace function public.ekvivalent_sms_claim(p_event_id text,p_phone text)
returns jsonb language plpgsql security definer set search_path=pg_catalog,ekvivalent_private as $$
declare v_row ekvivalent_private.sms_requests%rowtype;v_budget ekvivalent_private.sms_budget%rowtype;v_hash text;v_today timestamptz;
begin
 if auth.role() is distinct from 'service_role' then raise exception 'Not allowed' using errcode='42501';end if;
 if p_event_id is null or length(p_event_id) not between 1 and 128 or p_phone is null or p_phone !~ '^\+79[0-9]{9}$' then raise exception 'Invalid request';end if;
 perform pg_advisory_xact_lock(hashtextextended('ekvivalent_sms_budget',0));
 v_hash:=encode(sha256(convert_to(p_phone,'UTF8')),'hex');v_today:=date_trunc('day',now());
 select * into v_row from ekvivalent_private.sms_requests where event_id=p_event_id;
 if found then
  if v_row.phone_hash<>v_hash then return jsonb_build_object('status','invalid');end if;
  if v_row.state='sent' then return jsonb_build_object('status','sent');end if;
  if v_row.state='pending' and v_row.updated_at>now()-interval '30 seconds' then return jsonb_build_object('status','pending');end if;
 end if;
 select * into strict v_budget from ekvivalent_private.sms_budget where singleton;
 if (select coalesce(sum(attempts),0) from ekvivalent_private.sms_requests where created_at>=v_today)>=v_budget.daily_limit or
    (select coalesce(sum(attempts),0) from ekvivalent_private.sms_requests where phone_hash=v_hash and created_at>=v_today)>=v_budget.per_phone_limit then
  return jsonb_build_object('status','limited');
 end if;
 delete from ekvivalent_private.sms_requests where created_at<now()-interval '2 days';
 insert into ekvivalent_private.sms_requests(event_id,phone_hash,state) values(p_event_id,v_hash,'pending')
 on conflict(event_id) do update set state='pending',attempts=sms_requests.attempts+1,updated_at=now();
 return jsonb_build_object('status','claimed');
end $$;
create or replace function public.ekvivalent_sms_finish(p_event_id text,p_sent boolean)
returns void language plpgsql security definer set search_path=pg_catalog,ekvivalent_private as $$
begin
 if auth.role() is distinct from 'service_role' then raise exception 'Not allowed' using errcode='42501';end if;
 update ekvivalent_private.sms_requests set state=case when p_sent then 'sent' else 'failed' end,updated_at=now() where event_id=p_event_id and state='pending';
end $$;
revoke all on function public.ekvivalent_sms_claim(text,text) from public,anon,authenticated;
revoke all on function public.ekvivalent_sms_finish(text,boolean) from public,anon,authenticated;
grant execute on function public.ekvivalent_sms_claim(text,text) to service_role;
grant execute on function public.ekvivalent_sms_finish(text,boolean) to service_role;
commit;

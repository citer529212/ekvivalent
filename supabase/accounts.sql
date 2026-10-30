-- Apply once in the Supabase SQL Editor. Idempotent schema and policy definitions.
begin;
create table if not exists public.ekvivalent_progress (
 user_id uuid primary key references auth.users(id) on delete cascade,
 payload jsonb not null,
 revision bigint not null default 1,
 updated_at timestamptz not null default now(),
 constraint ekvivalent_payload_size check (octet_length(payload::text)<=5242880),
 constraint ekvivalent_payload_version check (payload->>'version'='1'),
 constraint ekvivalent_revision_positive check (revision>0)
);
alter table public.ekvivalent_progress enable row level security;
revoke all on table public.ekvivalent_progress from anon, authenticated;
grant select, insert, update on table public.ekvivalent_progress to authenticated;
drop policy if exists ekvivalent_read_own on public.ekvivalent_progress;
create policy ekvivalent_read_own on public.ekvivalent_progress for select to authenticated using ((select auth.uid())=user_id);
drop policy if exists ekvivalent_insert_own on public.ekvivalent_progress;
create policy ekvivalent_insert_own on public.ekvivalent_progress for insert to authenticated with check ((select auth.uid())=user_id);
drop policy if exists ekvivalent_update_own on public.ekvivalent_progress;
create policy ekvivalent_update_own on public.ekvivalent_progress for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
-- Compare-and-swap prevents an older tab/device overwriting newer progress.
create or replace function public.ekvivalent_save_progress(p_payload jsonb,p_revision bigint)
returns table(accepted boolean,revision bigint,payload jsonb,updated_at timestamptz)
language plpgsql security invoker set search_path=public as $$
declare v_row public.ekvivalent_progress%rowtype;
begin
 if auth.uid() is null then raise exception 'Authentication required' using errcode='28000'; end if;
 if p_payload->>'version' is distinct from '1' or octet_length(p_payload::text)>5242880 or p_revision<0 then raise exception 'Invalid progress'; end if;
 if p_revision=0 then
  insert into public.ekvivalent_progress(user_id,payload) values(auth.uid(),p_payload) on conflict do nothing returning * into v_row;
 else
  update public.ekvivalent_progress p set payload=p_payload,revision=p.revision+1,updated_at=now() where p.user_id=auth.uid() and p.revision=p_revision returning p.* into v_row;
 end if;
 if found then return query select true,v_row.revision,v_row.payload,v_row.updated_at;
 else return query select false,p.revision,p.payload,p.updated_at from public.ekvivalent_progress p where p.user_id=auth.uid();end if;
end $$;
revoke all on function public.ekvivalent_save_progress(jsonb,bigint) from public,anon;
grant execute on function public.ekvivalent_save_progress(jsonb,bigint) to authenticated;
commit;

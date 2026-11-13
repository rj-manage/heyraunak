-- ============================================================
-- RJ Studio - Phase 1 policy hardening
-- ------------------------------------------------------------
-- Three problems in 0002_rls.sql:
--  1. conversation/messages policies queried their own tables inside
--     subqueries, which Postgres rejects as infinite recursion.
--  2. proposals_customer_respond let a customer write ANY column of their own
--     proposal (including totals).
--  3. project_assignments_freelancer_update / project_tasks_freelancer_update
--     let a freelancer write ANY column of their own rows (including
--     compensation and deadlines).
-- Fixed with SECURITY DEFINER helpers (no recursion) and narrow RPCs that
-- touch only the columns they should.
-- ============================================================

-- ------------------------------------------------------------
-- 1. recursion-free conversation helpers
-- ------------------------------------------------------------
create or replace function public.is_conversation_participant(cid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.conversation_participants cp
    where cp.conversation_id = cid and cp.user_id = auth.uid()
  )
$$;

create or replace function public.conversation_scope_of(cid uuid)
returns conversation_scope language sql stable security definer set search_path = public as $$
  select c.scope from public.conversations c where c.id = cid
$$;

drop policy if exists conversations_read on public.conversations;
create policy conversations_read on public.conversations
  for select using (public.is_staff() or public.is_conversation_participant(id));

drop policy if exists conversation_participants_read on public.conversation_participants;
create policy conversation_participants_read on public.conversation_participants
  for select using (
    user_id = auth.uid() or public.is_staff() or public.is_conversation_participant(conversation_id)
  );

-- customers must never see 'internal' (freelancer/staff-only) threads
drop policy if exists messages_read on public.messages;
create policy messages_read on public.messages
  for select using (
    public.is_staff()
    or (
      public.conversation_scope_of(conversation_id) = 'customer'
      and public.is_conversation_participant(conversation_id)
    )
  );

drop policy if exists messages_insert on public.messages;
create policy messages_insert on public.messages
  for insert with check (
    sender_id = auth.uid()
    and (
      public.is_staff()
      or (
        public.conversation_scope_of(conversation_id) = 'customer'
        and public.is_conversation_participant(conversation_id)
      )
    )
  );

-- ------------------------------------------------------------
-- 2. proposals: customers respond through a narrow RPC, not a blanket UPDATE
-- ------------------------------------------------------------
drop policy if exists proposals_customer_respond on public.proposals;

create or replace function public.respond_to_proposal(p_proposal_id uuid, p_response text)
returns proposal_status language plpgsql security definer set search_path = public as $$
declare
  v_status proposal_status;
begin
  if p_response not in ('accepted','declined','changes_requested') then
    raise exception 'invalid_response' using errcode = '22023';
  end if;

  select status into v_status
  from public.proposals
  where id = p_proposal_id and user_id = auth.uid();

  if not found then
    raise exception 'not_found' using errcode = 'P0002';
  end if;

  if v_status not in ('sent','viewed') then
    raise exception 'not_actionable' using errcode = 'P0001';
  end if;

  update public.proposals
     set status = p_response::proposal_status,
         accepted_at = case when p_response = 'accepted' then now() else accepted_at end,
         declined_at = case when p_response = 'declined' then now() else declined_at end
   where id = p_proposal_id and user_id = auth.uid();

  return p_response::proposal_status;
end $$;

revoke all on function public.respond_to_proposal(uuid, text) from public;
grant execute on function public.respond_to_proposal(uuid, text) to authenticated;

-- ------------------------------------------------------------
-- 3. freelancers: narrow RPCs instead of blanket UPDATE
-- ------------------------------------------------------------
drop policy if exists project_tasks_freelancer_update on public.project_tasks;

create or replace function public.set_task_status(p_task_id uuid, p_status task_status)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists (
    select 1
    from public.project_tasks t
    join public.project_assignments a on a.project_id = t.project_id
    where t.id = p_task_id
      and a.freelancer_id = auth.uid()
      and a.status in ('accepted','active')
  ) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  update public.project_tasks set status = p_status where id = p_task_id;
end $$;

revoke all on function public.set_task_status(uuid, task_status) from public;
grant execute on function public.set_task_status(uuid, task_status) to authenticated;

drop policy if exists project_assignments_freelancer_update on public.project_assignments;

create or replace function public.submit_deliverable(p_assignment_id uuid, p_url text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_url is null or length(p_url) > 1000 then
    raise exception 'invalid_url' using errcode = '22023';
  end if;

  if not exists (
    select 1 from public.project_assignments
    where id = p_assignment_id and freelancer_id = auth.uid()
  ) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  update public.project_assignments
     set deliverable_status = 'submitted',
         deliverable_url = p_url,
         submitted_at = now()
   where id = p_assignment_id and freelancer_id = auth.uid();
end $$;

revoke all on function public.submit_deliverable(uuid, text) from public;
grant execute on function public.submit_deliverable(uuid, text) to authenticated;

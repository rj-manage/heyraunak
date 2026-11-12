-- ============================================================
-- RJ Studio - Phase 1 RLS: access policies
-- Every table is protected. Helpers are SECURITY DEFINER so policies can read
-- role/assignment data without recursing through RLS.
-- ============================================================

-- ------------------------------------------------------------
-- helpers
-- ------------------------------------------------------------
create or replace function public.has_role(uid uuid, roles user_role[])
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.user_roles ur
    where ur.user_id = uid and ur.role = any(roles)
  )
$$;

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select public.has_role(auth.uid(), array['owner','admin','project_manager','finance']::user_role[])
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select public.has_role(auth.uid(), array['owner','admin']::user_role[])
$$;

-- is the caller the customer this project belongs to, or an assigned freelancer?
create or replace function public.can_access_project(pid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.projects p where p.id = pid and p.user_id = auth.uid()
  ) or exists (
    select 1 from public.project_assignments a
    where a.project_id = pid
      and a.freelancer_id = auth.uid()
      and a.status in ('accepted','active','completed')
  )
$$;

-- ------------------------------------------------------------
-- enable RLS everywhere
-- ------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'users','profiles','roles','user_roles','addresses','currencies','exchange_rates',
    'service_categories','services','service_faqs','service_options','service_addons',
    'saved_services','project_briefs','enquiries','enquiry_attachments',
    'proposals','proposal_items','proposal_revisions','orders','order_items',
    'payments','payment_events','refunds','invoices',
    'projects','project_milestones','project_tasks','freelancer_profiles',
    'freelancer_documents','project_assignments','project_files',
    'conversations','conversation_participants','messages',
    'notifications','reviews','activity_logs'
  ] loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- ------------------------------------------------------------
-- identity
-- ------------------------------------------------------------
create policy users_select_self on public.users
  for select using (id = auth.uid() or public.is_staff());
create policy users_update_self on public.users
  for update using (id = auth.uid()) with check (id = auth.uid());

create policy profiles_select on public.profiles
  for select using (user_id = auth.uid() or public.is_staff());
create policy profiles_write_self on public.profiles
  for insert with check (user_id = auth.uid());
create policy profiles_update_self on public.profiles
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy roles_read on public.roles for select using (true);

create policy user_roles_select_self on public.user_roles
  for select using (user_id = auth.uid() or public.is_staff());
create policy user_roles_admin_write on public.user_roles
  for all using (public.is_admin()) with check (public.is_admin());

create policy addresses_owner on public.addresses
  for all using (user_id = auth.uid() or public.is_staff())
  with check (user_id = auth.uid() or public.is_staff());

-- ------------------------------------------------------------
-- reference data (public read; written by the server)
-- ------------------------------------------------------------
create policy currencies_read on public.currencies for select using (true);
create policy exchange_rates_read on public.exchange_rates for select using (true);

-- ------------------------------------------------------------
-- catalogue (public read of live items; staff manage)
-- ------------------------------------------------------------
create policy service_categories_read on public.service_categories
  for select using (availability <> 'archived' or public.is_staff());
create policy service_categories_write on public.service_categories
  for all using (public.is_staff()) with check (public.is_staff());

create policy services_read on public.services
  for select using (availability <> 'archived' or public.is_staff());
create policy services_write on public.services
  for all using (public.is_staff()) with check (public.is_staff());

create policy service_faqs_read on public.service_faqs for select using (true);
create policy service_faqs_write on public.service_faqs
  for all using (public.is_staff()) with check (public.is_staff());

create policy service_options_read on public.service_options for select using (true);
create policy service_options_write on public.service_options
  for all using (public.is_staff()) with check (public.is_staff());

create policy service_addons_read on public.service_addons
  for select using (availability <> 'archived' or public.is_staff());
create policy service_addons_write on public.service_addons
  for all using (public.is_staff()) with check (public.is_staff());

create policy saved_services_owner on public.saved_services
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ------------------------------------------------------------
-- briefs & enquiries
-- ------------------------------------------------------------
create policy project_briefs_owner on public.project_briefs
  for all using (user_id = auth.uid() or public.is_staff())
  with check (user_id = auth.uid() or public.is_staff());

create policy enquiries_owner_read on public.enquiries
  for select using (user_id = auth.uid() or public.is_staff());
create policy enquiries_owner_insert on public.enquiries
  for insert with check (user_id = auth.uid());
create policy enquiries_staff_update on public.enquiries
  for update using (public.is_staff()) with check (public.is_staff());

create policy enquiry_attachments_read on public.enquiry_attachments
  for select using (
    exists (
      select 1 from public.enquiries e
      where e.id = enquiry_id and (e.user_id = auth.uid() or public.is_staff())
    )
  );
create policy enquiry_attachments_insert on public.enquiry_attachments
  for insert with check (
    exists (select 1 from public.enquiries e where e.id = enquiry_id and e.user_id = auth.uid())
    or public.is_staff()
  );

-- ------------------------------------------------------------
-- proposals (staff author; customer reads own and responds)
-- ------------------------------------------------------------
create policy proposals_read on public.proposals
  for select using (user_id = auth.uid() or public.is_staff());
create policy proposals_staff_write on public.proposals
  for insert with check (public.is_staff());
create policy proposals_staff_update on public.proposals
  for update using (public.is_staff()) with check (public.is_staff());
-- a customer may only move their own proposal to accepted/declined/changes_requested
create policy proposals_customer_respond on public.proposals
  for update using (user_id = auth.uid())
  with check (user_id = auth.uid() and status in ('accepted','declined','changes_requested'));

create policy proposal_items_read on public.proposal_items
  for select using (
    exists (
      select 1 from public.proposals p
      where p.id = proposal_id and (p.user_id = auth.uid() or public.is_staff())
    )
  );
create policy proposal_items_staff_write on public.proposal_items
  for all using (public.is_staff()) with check (public.is_staff());

create policy proposal_revisions_read on public.proposal_revisions
  for select using (
    exists (
      select 1 from public.proposals p
      where p.id = proposal_id and (p.user_id = auth.uid() or public.is_staff())
    )
  );
create policy proposal_revisions_staff_write on public.proposal_revisions
  for insert with check (public.is_staff());

-- ------------------------------------------------------------
-- orders / money (customers read their own; staff manage; writes via server)
-- ------------------------------------------------------------
create policy orders_read on public.orders
  for select using (user_id = auth.uid() or public.is_staff());
create policy orders_staff_write on public.orders
  for all using (public.is_staff()) with check (public.is_staff());

create policy order_items_read on public.order_items
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_id and (o.user_id = auth.uid() or public.is_staff())
    )
  );
create policy order_items_staff_write on public.order_items
  for all using (public.is_staff()) with check (public.is_staff());

create policy payments_read on public.payments
  for select using (user_id = auth.uid() or public.is_staff());
create policy payments_staff_write on public.payments
  for all using (public.is_staff()) with check (public.is_staff());

create policy payment_events_staff on public.payment_events
  for all using (public.is_staff()) with check (public.is_staff());

create policy refunds_read on public.refunds
  for select using (
    exists (
      select 1 from public.payments p
      where p.id = payment_id and (p.user_id = auth.uid() or public.is_staff())
    )
  );
create policy refunds_staff_write on public.refunds
  for all using (public.is_staff()) with check (public.is_staff());

create policy invoices_read on public.invoices
  for select using (user_id = auth.uid() or public.is_staff());
create policy invoices_staff_write on public.invoices
  for all using (public.is_staff()) with check (public.is_staff());

-- ------------------------------------------------------------
-- delivery
-- ------------------------------------------------------------
create policy projects_read on public.projects
  for select using (public.can_access_project(id) or public.is_staff());
create policy projects_staff_write on public.projects
  for all using (public.is_staff()) with check (public.is_staff());

create policy project_milestones_read on public.project_milestones
  for select using (public.can_access_project(project_id) or public.is_staff());
create policy project_milestones_staff_write on public.project_milestones
  for all using (public.is_staff()) with check (public.is_staff());

create policy project_tasks_read on public.project_tasks
  for select using (public.can_access_project(project_id) or public.is_staff());
create policy project_tasks_staff_write on public.project_tasks
  for all using (public.is_staff()) with check (public.is_staff());
-- a freelancer may update the status of their own assigned task
create policy project_tasks_freelancer_update on public.project_tasks
  for update using (
    exists (
      select 1 from public.project_assignments a
      where a.project_id = project_tasks.project_id
        and a.freelancer_id = auth.uid()
        and a.status in ('accepted','active')
    )
  );

create policy freelancer_profiles_self on public.freelancer_profiles
  for select using (user_id = auth.uid() or public.is_staff());
create policy freelancer_profiles_self_write on public.freelancer_profiles
  for insert with check (user_id = auth.uid());
create policy freelancer_profiles_self_update on public.freelancer_profiles
  for update using (user_id = auth.uid() or public.is_staff())
  with check (user_id = auth.uid() or public.is_staff());

create policy freelancer_documents_read on public.freelancer_documents
  for select using (freelancer_id = auth.uid() or public.is_staff());
create policy freelancer_documents_self_insert on public.freelancer_documents
  for insert with check (freelancer_id = auth.uid());
create policy freelancer_documents_staff_update on public.freelancer_documents
  for update using (public.is_staff()) with check (public.is_staff());

create policy project_assignments_read on public.project_assignments
  for select using (
    freelancer_id = auth.uid()
    or public.is_staff()
    or exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid())
  );
create policy project_assignments_staff_write on public.project_assignments
  for all using (public.is_staff()) with check (public.is_staff());
-- a freelancer may submit their own deliverable / update their own status
create policy project_assignments_freelancer_update on public.project_assignments
  for update using (freelancer_id = auth.uid()) with check (freelancer_id = auth.uid());

create policy project_files_read on public.project_files
  for select using (
    public.is_staff()
    or exists (
      select 1 from public.projects p
      where p.id = project_id and p.user_id = auth.uid() and visible_to_customer
    )
    or exists (
      select 1 from public.project_assignments a
      where a.project_id = project_files.project_id
        and a.freelancer_id = auth.uid()
        and a.status in ('accepted','active','completed')
    )
  );
create policy project_files_insert on public.project_files
  for insert with check (public.is_staff() or public.can_access_project(project_id));

-- ------------------------------------------------------------
-- comms
-- ------------------------------------------------------------
create policy conversations_read on public.conversations
  for select using (
    public.is_staff()
    or exists (
      select 1 from public.conversation_participants cp
      where cp.conversation_id = conversations.id and cp.user_id = auth.uid()
    )
  );
create policy conversations_staff_write on public.conversations
  for all using (public.is_staff()) with check (public.is_staff());

create policy conversation_participants_read on public.conversation_participants
  for select using (
    user_id = auth.uid()
    or public.is_staff()
    or exists (
      select 1 from public.conversation_participants cp
      where cp.conversation_id = conversation_participants.conversation_id and cp.user_id = auth.uid()
    )
  );
create policy conversation_participants_staff_write on public.conversation_participants
  for all using (public.is_staff()) with check (public.is_staff());

-- customers must never see 'internal' (freelancer/staff-only) threads
create policy messages_read on public.messages
  for select using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (
          public.is_staff()
          or (
            c.scope = 'customer'
            and exists (
              select 1 from public.conversation_participants cp
              where cp.conversation_id = c.id and cp.user_id = auth.uid()
            )
          )
        )
    )
  );
create policy messages_insert on public.messages
  for insert with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (
          public.is_staff()
          or (
            c.scope = 'customer'
            and exists (
              select 1 from public.conversation_participants cp
              where cp.conversation_id = c.id and cp.user_id = auth.uid()
            )
          )
        )
    )
  );

create policy notifications_owner on public.notifications
  for select using (user_id = auth.uid());
create policy notifications_owner_update on public.notifications
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy reviews_public_read on public.reviews
  for select using (published or user_id = auth.uid() or public.is_staff());
create policy reviews_owner_insert on public.reviews
  for insert with check (user_id = auth.uid());
create policy reviews_staff_write on public.reviews
  for update using (public.is_staff()) with check (public.is_staff());

create policy activity_logs_staff_read on public.activity_logs
  for select using (public.is_staff());
create policy activity_logs_staff_insert on public.activity_logs
  for insert with check (public.is_staff());

-- ============================================================
-- RJ Studio - Phase 1 initial schema
-- PostgreSQL (Supabase). UUID keys, timestamps, FKs, constraints, indexes.
-- Historical transaction rows are snapshots and are never rewritten when the
-- catalogue changes.
-- ============================================================

create extension if not exists pgcrypto;
create extension if not exists citext;

-- ------------------------------------------------------------
-- enums
-- ------------------------------------------------------------
create type user_role as enum ('owner','admin','project_manager','finance','freelancer','customer');
create type pricing_model as enum ('fixed','custom_quote','both');
create type service_availability as enum ('active','coming_soon','archived');
create type enquiry_status as enum (
  'draft','submitted','under_review','more_info_required','qualified','not_qualified',
  'proposal_preparation','proposal_sent','closed','cancelled');
create type proposal_status as enum (
  'draft','sent','viewed','changes_requested','accepted','declined','expired','cancelled');
create type order_status as enum (
  'draft','pending_deposit','deposit_paid','in_progress','pending_balance','completed','cancelled','refunded');
create type payment_status as enum (
  'created','pending','authorised','captured','failed','refunded','partially_refunded','cancelled');
create type payment_kind as enum ('deposit','balance','milestone','full');
create type refund_status as enum ('requested','approved','rejected','processed','failed');
create type invoice_status as enum ('draft','issued','paid','void','overdue');
create type project_status as enum ('planning','in_progress','in_review','revisions','on_hold','completed','cancelled');
create type milestone_status as enum ('pending','in_progress','in_review','revisions','approved','paid');
create type task_status as enum ('todo','in_progress','blocked','in_review','done');
create type assignment_status as enum ('invited','accepted','declined','active','completed','terminated');
create type deliverable_status as enum ('draft','submitted','changes_requested','approved');
create type notification_status as enum ('pending','sent','failed');
create type conversation_scope as enum ('customer','internal');
create type file_category as enum ('brief','requirement','deliverable','contract','invoice','other');

-- ------------------------------------------------------------
-- updated_at trigger
-- ------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ------------------------------------------------------------
-- identity & permissions
-- ------------------------------------------------------------
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email citext,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_seen_at timestamptz
);
create index users_email_idx on public.users (email);

create table public.profiles (
  user_id uuid primary key references public.users(id) on delete cascade,
  full_name text,
  company_name text,
  avatar_url text,
  country text,
  billing_country text,
  country_code text,
  timezone text,
  locale text,
  currency text default 'INR',
  marketing_opt_in boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.roles (
  code user_role primary key,
  label text not null,
  description text
);

insert into public.roles (code, label, description) values
  ('owner','Owner','Full platform control'),
  ('admin','Admin','Operations and catalogue management'),
  ('project_manager','Project Manager','Delivery and assignments'),
  ('finance','Finance','Payments and invoicing'),
  ('freelancer','Freelancer','Assigned delivery work only'),
  ('customer','Customer','Own records only')
on conflict (code) do nothing;

create table public.user_roles (
  user_id uuid not null references public.users(id) on delete cascade,
  role user_role not null references public.roles(code),
  granted_at timestamptz not null default now(),
  granted_by uuid references public.users(id),
  primary key (user_id, role)
);
create index user_roles_role_idx on public.user_roles (role);

create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  label text,
  line1 text not null,
  line2 text,
  city text,
  state text,
  postal_code text,
  country text not null,
  country_code text,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index addresses_user_idx on public.addresses (user_id);

-- ------------------------------------------------------------
-- money reference data
-- ------------------------------------------------------------
create table public.currencies (
  code text primary key,
  label text not null,
  symbol text,
  minor_units int not null default 2
);

create table public.exchange_rates (
  id uuid primary key default gen_random_uuid(),
  base_code text not null references public.currencies(code),
  quote_code text not null references public.currencies(code),
  rate numeric(20,10) not null check (rate > 0),
  as_of date not null,
  source text,
  created_at timestamptz not null default now(),
  unique (base_code, quote_code, as_of)
);

insert into public.currencies (code, label, symbol) values
  ('INR','Indian Rupee','₹'),
  ('USD','US Dollar','$'),
  ('EUR','Euro','€'),
  ('GBP','British Pound','£'),
  ('AED','UAE Dirham','د.إ')
on conflict (code) do nothing;

-- ------------------------------------------------------------
-- catalogue
-- ------------------------------------------------------------
create table public.service_categories (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,          -- web | software | marketing | social
  name text not null,
  slug text not null unique,
  description text,
  sort_order int not null default 0,
  availability service_availability not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.services (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.service_categories(id) on delete restrict,
  legacy_id text unique,              -- original id, e.g. sw-crm
  name text not null,
  slug text not null unique,
  short_description text,
  full_description text,
  deliverables text[] not null default '{}',
  features text[] not null default '{}',
  portfolio_refs text[] not null default '{}',
  pricing_model pricing_model not null default 'custom_quote',
  currency text not null default 'USD' references public.currencies(code),
  starting_price numeric(14,2) check (starting_price is null or starting_price >= 0),
  deposit_type text check (deposit_type in ('percentage','fixed')),
  deposit_value numeric(14,2) check (deposit_value is null or deposit_value >= 0),
  estimated_duration text,
  availability service_availability not null default 'active',
  seo_title text,
  seo_description text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index services_category_idx on public.services (category_id);
create index services_availability_idx on public.services (availability);

create table public.service_faqs (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.services(id) on delete cascade,
  question text not null,
  answer text not null,
  sort_order int not null default 0
);
create index service_faqs_service_idx on public.service_faqs (service_id);

create table public.service_options (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.services(id) on delete cascade,
  key text not null,
  label text not null,
  kind text not null check (kind in ('text','textarea','number','url','email','tel','select','multi')),
  required boolean not null default false,
  options text[] not null default '{}',
  placeholder text,
  help text,
  step int not null default 1 check (step between 1 and 5),
  sort_order int not null default 0,
  unique (service_id, key)
);
create index service_options_service_idx on public.service_options (service_id);

create table public.service_addons (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.services(id) on delete cascade,
  name text not null,
  description text,
  price numeric(14,2) check (price is null or price >= 0),
  currency text references public.currencies(code),
  duration_days int check (duration_days is null or duration_days >= 0),
  availability service_availability not null default 'active',
  sort_order int not null default 0
);
create index service_addons_service_idx on public.service_addons (service_id);

create table public.saved_services (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, service_id)
);
create index saved_services_user_idx on public.saved_services (user_id);

-- ------------------------------------------------------------
-- demand: briefs, enquiries, proposals
-- ------------------------------------------------------------
create table public.project_briefs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  service_id uuid references public.services(id) on delete set null,
  status enquiry_status not null default 'draft',
  answers jsonb not null default '{}'::jsonb,
  description text,
  budget_usd numeric(14,2) check (budget_usd is null or budget_usd >= 0),
  advertising_spend_usd numeric(14,2) check (advertising_spend_usd is null or advertising_spend_usd >= 0),
  timeline text,
  currency text references public.currencies(code),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index project_briefs_user_idx on public.project_briefs (user_id);
create index project_briefs_service_idx on public.project_briefs (service_id);

create table public.enquiries (
  id uuid primary key default gen_random_uuid(),
  enquiry_ref text not null unique,      -- RJ-YYYYMMDD-XXXXXXXX (was the sheet id)
  idempotency_key text not null unique,
  user_id uuid references public.users(id) on delete set null,
  brief_id uuid references public.project_briefs(id) on delete set null,
  category_id uuid references public.service_categories(id) on delete set null,
  service_id uuid references public.services(id) on delete set null,
  status enquiry_status not null default 'submitted',
  -- immutable snapshot of what was requested
  category_name text not null,
  service_name text not null,
  service_legacy_id text,
  project_details jsonb not null default '{}'::jsonb,
  platforms text[] not null default '{}',
  budget_usd numeric(14,2) check (budget_usd is null or budget_usd >= 0),
  advertising_spend_usd numeric(14,2) check (advertising_spend_usd is null or advertising_spend_usd >= 0),
  timeline text,
  contact jsonb not null default '{}'::jsonb,
  source text default 'website',
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index enquiries_user_idx on public.enquiries (user_id);
create index enquiries_status_idx on public.enquiries (status);
create index enquiries_service_idx on public.enquiries (service_id);
create index enquiries_submitted_idx on public.enquiries (submitted_at desc);

create table public.enquiry_attachments (
  id uuid primary key default gen_random_uuid(),
  enquiry_id uuid not null references public.enquiries(id) on delete cascade,
  storage_path text not null,
  file_name text not null,
  mime_type text,
  size_bytes bigint check (size_bytes is null or size_bytes >= 0),
  uploaded_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index enquiry_attachments_enquiry_idx on public.enquiry_attachments (enquiry_id);

create table public.proposals (
  id uuid primary key default gen_random_uuid(),
  proposal_ref text not null unique,
  enquiry_id uuid references public.enquiries(id) on delete set null,
  user_id uuid not null references public.users(id) on delete restrict,
  status proposal_status not null default 'draft',
  currency text not null default 'USD' references public.currencies(code),
  subtotal numeric(14,2) not null default 0 check (subtotal >= 0),
  total numeric(14,2) not null default 0 check (total >= 0),
  deposit_type text check (deposit_type in ('percentage','fixed')),
  deposit_value numeric(14,2) check (deposit_value is null or deposit_value >= 0),
  deposit_amount numeric(14,2) check (deposit_amount is null or deposit_amount >= 0),
  balance_amount numeric(14,2) check (balance_amount is null or balance_amount >= 0),
  delivery_estimate text,
  terms text,
  expires_at timestamptz,
  sent_at timestamptz,
  accepted_at timestamptz,
  declined_at timestamptz,
  created_by uuid references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index proposals_user_idx on public.proposals (user_id);
create index proposals_enquiry_idx on public.proposals (enquiry_id);
create index proposals_status_idx on public.proposals (status);

create table public.proposal_items (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.proposals(id) on delete cascade,
  service_id uuid references public.services(id) on delete set null,
  service_name text not null,          -- snapshot
  description text,
  quantity numeric(12,2) not null default 1 check (quantity > 0),
  unit_price numeric(14,2) not null default 0 check (unit_price >= 0),
  amount numeric(14,2) not null default 0 check (amount >= 0),
  is_optional boolean not null default false,
  sort_order int not null default 0
);
create index proposal_items_proposal_idx on public.proposal_items (proposal_id);

create table public.proposal_revisions (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.proposals(id) on delete cascade,
  version int not null check (version > 0),
  snapshot jsonb not null,
  note text,
  created_by uuid references public.users(id),
  created_at timestamptz not null default now(),
  unique (proposal_id, version)
);

-- ------------------------------------------------------------
-- orders, payments, invoices
-- ------------------------------------------------------------
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_ref text not null unique,
  user_id uuid not null references public.users(id) on delete restrict,
  proposal_id uuid references public.proposals(id) on delete set null,
  status order_status not null default 'pending_deposit',
  currency text not null references public.currencies(code),
  subtotal numeric(14,2) not null default 0 check (subtotal >= 0),
  total numeric(14,2) not null default 0 check (total >= 0),
  deposit_amount numeric(14,2) not null default 0 check (deposit_amount >= 0),
  balance_amount numeric(14,2) not null default 0 check (balance_amount >= 0),
  amount_paid numeric(14,2) not null default 0 check (amount_paid >= 0),
  base_currency text not null default 'INR' references public.currencies(code),
  exchange_rate numeric(20,10) check (exchange_rate is null or exchange_rate > 0),
  placed_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint orders_paid_within_total check (amount_paid <= total + 0.01)
);
create index orders_user_idx on public.orders (user_id);
create index orders_status_idx on public.orders (status);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  service_id uuid references public.services(id) on delete set null,
  service_name text not null,          -- snapshot
  description text,
  quantity numeric(12,2) not null default 1 check (quantity > 0),
  unit_price numeric(14,2) not null default 0 check (unit_price >= 0),
  amount numeric(14,2) not null default 0 check (amount >= 0),
  sort_order int not null default 0
);
create index order_items_order_idx on public.order_items (order_id);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete restrict,
  user_id uuid references public.users(id) on delete set null,
  idempotency_key text not null unique,
  provider text not null check (provider in ('razorpay','stripe')),
  provider_payment_id text,
  provider_order_id text,
  kind payment_kind not null default 'deposit',
  status payment_status not null default 'created',
  currency text not null references public.currencies(code),
  amount numeric(14,2) not null check (amount >= 0),
  base_currency text not null default 'INR' references public.currencies(code),
  exchange_rate numeric(20,10) check (exchange_rate is null or exchange_rate > 0),
  amount_base numeric(14,2) check (amount_base is null or amount_base >= 0),
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_payment_id)
);
create index payments_order_idx on public.payments (order_id);
create index payments_status_idx on public.payments (status);

create table public.payment_events (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid references public.payments(id) on delete set null,
  provider text not null check (provider in ('razorpay','stripe')),
  provider_event_id text not null unique,
  event_type text not null,
  payload jsonb not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz
);
create index payment_events_payment_idx on public.payment_events (payment_id);

create table public.refunds (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references public.payments(id) on delete restrict,
  status refund_status not null default 'requested',
  amount numeric(14,2) not null check (amount > 0),
  currency text not null references public.currencies(code),
  provider_refund_id text,
  reason text,
  requested_by uuid references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index refunds_payment_idx on public.refunds (payment_id);

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text not null unique,
  order_id uuid references public.orders(id) on delete set null,
  user_id uuid not null references public.users(id) on delete restrict,
  status invoice_status not null default 'draft',
  currency text not null references public.currencies(code),
  subtotal numeric(14,2) not null default 0 check (subtotal >= 0),
  tax_amount numeric(14,2) not null default 0 check (tax_amount >= 0),
  total numeric(14,2) not null default 0 check (total >= 0),
  billing_name text,
  billing_address jsonb not null default '{}'::jsonb,
  billing_country text,
  issued_at timestamptz,
  due_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index invoices_order_idx on public.invoices (order_id);
create index invoices_user_idx on public.invoices (user_id);

-- ------------------------------------------------------------
-- delivery: projects, milestones, tasks, assignments, freelancers, files
-- ------------------------------------------------------------
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete set null,
  user_id uuid not null references public.users(id) on delete restrict,
  service_id uuid references public.services(id) on delete set null,
  name text not null,
  slug text not null unique,
  scope text,
  status project_status not null default 'planning',
  milestone_template text,
  start_date date,
  due_date date,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index projects_user_idx on public.projects (user_id);
create index projects_order_idx on public.projects (order_id);
create index projects_status_idx on public.projects (status);

create table public.project_milestones (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  description text,
  status milestone_status not null default 'pending',
  due_date date,
  amount numeric(14,2) check (amount is null or amount >= 0),
  currency text references public.currencies(code),
  sort_order int not null default 0,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index project_milestones_project_idx on public.project_milestones (project_id);

create table public.project_tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  milestone_id uuid references public.project_milestones(id) on delete set null,
  title text not null,
  description text,
  status task_status not null default 'todo',
  due_date date,
  assignee_id uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index project_tasks_project_idx on public.project_tasks (project_id);
create index project_tasks_assignee_idx on public.project_tasks (assignee_id);
create index project_tasks_milestone_idx on public.project_tasks (milestone_id);

create table public.freelancer_profiles (
  user_id uuid primary key references public.users(id) on delete cascade,
  display_name text,
  headline text,
  skills text[] not null default '{}',
  availability text check (availability in ('available','limited','unavailable')),
  hourly_rate numeric(14,2) check (hourly_rate is null or hourly_rate >= 0),
  currency text references public.currencies(code),
  timezone text,
  country text,
  verified boolean not null default false,
  agreement_signed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.freelancer_documents (
  id uuid primary key default gen_random_uuid(),
  freelancer_id uuid not null references public.freelancer_profiles(user_id) on delete cascade,
  kind text not null,
  storage_path text not null,
  status text not null default 'pending' check (status in ('pending','verified','rejected')),
  reviewed_by uuid references public.users(id),
  created_at timestamptz not null default now()
);
create index freelancer_documents_freelancer_idx on public.freelancer_documents (freelancer_id);

create table public.project_assignments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  freelancer_id uuid not null references public.freelancer_profiles(user_id) on delete restrict,
  task_id uuid references public.project_tasks(id) on delete set null,
  status assignment_status not null default 'invited',
  compensation_type text check (compensation_type in ('fixed','hourly','milestone')),
  compensation_amount numeric(14,2) check (compensation_amount is null or compensation_amount >= 0),
  currency text references public.currencies(code),
  deadline date,
  deliverable_status deliverable_status not null default 'draft',
  deliverable_url text,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid references public.users(id),
  revision_note text,
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid','pending','paid')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index project_assignments_project_idx on public.project_assignments (project_id);
create index project_assignments_freelancer_idx on public.project_assignments (freelancer_id);
create index project_assignments_status_idx on public.project_assignments (status);

create table public.project_files (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  uploaded_by uuid references public.users(id) on delete set null,
  category file_category not null default 'other',
  storage_path text not null,
  file_name text not null,
  mime_type text,
  size_bytes bigint check (size_bytes is null or size_bytes >= 0),
  version int not null default 1,
  visible_to_customer boolean not null default true,
  created_at timestamptz not null default now()
);
create index project_files_project_idx on public.project_files (project_id);

-- ------------------------------------------------------------
-- comms & ops
-- ------------------------------------------------------------
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  enquiry_id uuid references public.enquiries(id) on delete cascade,
  scope conversation_scope not null default 'customer',
  subject text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index conversations_project_idx on public.conversations (project_id);
create index conversations_scope_idx on public.conversations (scope);

create table public.conversation_participants (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role user_role,
  joined_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);
create index conversation_participants_user_idx on public.conversation_participants (user_id);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid references public.users(id) on delete set null,
  body text not null,
  attachment_path text,
  created_at timestamptz not null default now()
);
create index messages_conversation_idx on public.messages (conversation_id, created_at desc);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  kind text not null,
  title text not null,
  body text,
  link text,
  status notification_status not null default 'pending',
  channel text not null default 'email' check (channel in ('email','in_app','both')),
  attempts int not null default 0,
  last_error text,
  read_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications (user_id, created_at desc);
create index notifications_status_idx on public.notifications (status);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete set null,
  order_id uuid references public.orders(id) on delete set null,
  user_id uuid references public.users(id) on delete set null,
  service_id uuid references public.services(id) on delete set null,
  rating int not null check (rating between 1 and 5),
  title text,
  body text,
  published boolean not null default false,
  created_at timestamptz not null default now()
);
create index reviews_service_idx on public.reviews (service_id);

create table public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.users(id) on delete set null,
  actor_role user_role,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  ip text,
  created_at timestamptz not null default now()
);
create index activity_logs_entity_idx on public.activity_logs (entity_type, entity_id);
create index activity_logs_actor_idx on public.activity_logs (actor_id, created_at desc);

-- ------------------------------------------------------------
-- updated_at triggers
-- ------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'users','profiles','addresses','service_categories','services','project_briefs',
    'enquiries','proposals','orders','payments','refunds','invoices','projects',
    'project_milestones','project_tasks','freelancer_profiles','project_assignments',
    'conversations'
  ] loop
    execute format(
      'create trigger %1$s_set_updated_at before update on public.%1$s
       for each row execute function public.set_updated_at()', t);
  end loop;
end $$;

-- ------------------------------------------------------------
-- bootstrap a user + profile + default role when Supabase creates an auth user
-- ------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, email, phone)
  values (new.id, new.email, new.phone)
  on conflict (id) do nothing;

  insert into public.profiles (user_id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (user_id) do nothing;

  insert into public.user_roles (user_id, role) values (new.id, 'customer')
  on conflict (user_id, role) do nothing;

  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

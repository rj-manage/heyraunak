-- ============================================================
-- RJ Studio - Project Vault (Phase B)
-- Secure client project handover: handovers, files, sessions, OTPs, events.
-- Additive only - existing tables/migrations are untouched.
-- ============================================================

create type handover_status as enum (
  'draft','preparing','ready','accessed','completed','expired','revoked');

create type handover_file_category as enum ('main','documentation','assets','additional');

-- ------------------------------------------------------------
-- handovers
-- ------------------------------------------------------------
create table public.project_handovers (
  id uuid primary key default gen_random_uuid(),
  -- optional links into existing records; legacy handovers may have neither
  project_id uuid references public.projects(id) on delete set null,
  customer_id uuid references public.users(id) on delete set null,
  client_name text not null,
  client_email citext not null,
  project_name text not null,
  project_reference text,
  service_category text,
  description text,
  handover_message text,
  delivery_date date,
  expires_at timestamptz,
  status handover_status not null default 'draft',
  -- only the HMAC of the access code is ever stored
  access_code_hash text unique,
  access_code_created_at timestamptz,
  failed_attempts int not null default 0,
  locked_until timestamptz,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint handovers_client_email_shape check (position('@' in client_email) > 1)
);
create index project_handovers_status_idx on public.project_handovers (status);
create index project_handovers_expires_idx on public.project_handovers (expires_at);
create index project_handovers_email_idx on public.project_handovers (client_email);
create index project_handovers_ref_idx on public.project_handovers (project_reference);
create index project_handovers_customer_idx on public.project_handovers (customer_id);
create index project_handovers_project_idx on public.project_handovers (project_id);

-- ------------------------------------------------------------
-- files
-- ------------------------------------------------------------
create table public.project_handover_files (
  id uuid primary key default gen_random_uuid(),
  handover_id uuid not null references public.project_handovers(id) on delete cascade,
  storage_bucket text not null default 'project-vault',
  storage_path text not null unique,
  original_filename text not null,
  display_name text,
  description text,
  category handover_file_category not null default 'main',
  mime_type text,
  file_size bigint check (file_size is null or file_size >= 0),
  is_visible boolean not null default true,
  is_downloadable boolean not null default true,
  sort_order int not null default 0,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index project_handover_files_handover_idx
  on public.project_handover_files (handover_id, category, sort_order);

-- ------------------------------------------------------------
-- sessions (client access after OTP verification)
-- ------------------------------------------------------------
create table public.project_handover_sessions (
  id uuid primary key default gen_random_uuid(),
  handover_id uuid not null references public.project_handovers(id) on delete cascade,
  session_token_hash text not null unique,
  expires_at timestamptz not null,
  last_activity_at timestamptz not null default now(),
  revoked_at timestamptz,
  ip text,
  user_agent text,
  created_at timestamptz not null default now()
);
create index project_handover_sessions_handover_idx on public.project_handover_sessions (handover_id);
create index project_handover_sessions_expires_idx on public.project_handover_sessions (expires_at);

-- ------------------------------------------------------------
-- email OTPs (only the hash is stored)
-- ------------------------------------------------------------
create table public.project_handover_otps (
  id uuid primary key default gen_random_uuid(),
  handover_id uuid not null references public.project_handovers(id) on delete cascade,
  -- opaque handle handed to the browser after a valid code, so the client never
  -- sees (or can tamper with) an internal handover id
  issue_token_hash text not null unique,
  otp_hash text not null,
  expires_at timestamptz not null,
  attempts int not null default 0,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);
create index project_handover_otps_handover_idx
  on public.project_handover_otps (handover_id, created_at desc);

-- ------------------------------------------------------------
-- audit events
-- ------------------------------------------------------------
create table public.project_handover_events (
  id uuid primary key default gen_random_uuid(),
  handover_id uuid not null references public.project_handovers(id) on delete cascade,
  file_id uuid references public.project_handover_files(id) on delete set null,
  event_type text not null,
  event_metadata jsonb not null default '{}'::jsonb,
  ip text,
  created_at timestamptz not null default now()
);
create index project_handover_events_handover_idx
  on public.project_handover_events (handover_id, created_at desc);
create index project_handover_events_type_idx on public.project_handover_events (event_type, created_at desc);

-- ------------------------------------------------------------
-- updated_at triggers
-- ------------------------------------------------------------
create trigger project_handovers_set_updated_at before update on public.project_handovers
  for each row execute function public.set_updated_at();
create trigger project_handover_files_set_updated_at before update on public.project_handover_files
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- RLS: closed by default. Every client and admin read happens through server
-- code using the service role AFTER an explicit check, so no policy is granted
-- to anon/authenticated for sessions or OTPs. Staff get read-only access to
-- handovers/files/events as defence in depth.
-- ------------------------------------------------------------
alter table public.project_handovers enable row level security;
alter table public.project_handover_files enable row level security;
alter table public.project_handover_sessions enable row level security;
alter table public.project_handover_otps enable row level security;
alter table public.project_handover_events enable row level security;

create policy project_handovers_staff_read on public.project_handovers
  for select using (public.is_staff());
create policy project_handovers_staff_write on public.project_handovers
  for all using (public.is_staff()) with check (public.is_staff());

create policy project_handover_files_staff_read on public.project_handover_files
  for select using (public.is_staff());
create policy project_handover_files_staff_write on public.project_handover_files
  for all using (public.is_staff()) with check (public.is_staff());

create policy project_handover_events_staff_read on public.project_handover_events
  for select using (public.is_staff());
create policy project_handover_events_staff_insert on public.project_handover_events
  for insert with check (public.is_staff());

-- sessions and OTPs: deliberately no policies at all (service role only)

-- ------------------------------------------------------------
-- private storage bucket (objects inherit the same name)
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('project-vault', 'project-vault', false)
on conflict (id) do nothing;

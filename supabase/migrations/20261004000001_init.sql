-- =========================================================
-- PlanForge — Skema database (Supabase / Postgres)
-- Jalankan di Supabase SQL Editor.
-- =========================================================

-- Extensi
create extension if not exists "pgcrypto";

-- ---------- profiles ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  ai_model text,
  created_at timestamptz not null default now()
);

-- ---------- projects ----------
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null default 'Proyek tanpa judul',
  raw_idea text,
  status text not null default 'draft'
    check (status in ('draft', 'clarifying', 'prd_ready', 'tasks_ready')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists projects_user_id_idx on public.projects (user_id);

-- ---------- clarify_messages ----------
create table if not exists public.clarify_messages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  role text not null check (role in ('assistant', 'user')),
  content text not null,
  created_at timestamptz not null default now()
);
create index if not exists clarify_messages_project_id_idx
  on public.clarify_messages (project_id);

-- ---------- prds ----------
create table if not exists public.prds (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  title text,
  one_liner text,
  problem text,
  goals jsonb not null default '[]'::jsonb,
  personas jsonb not null default '[]'::jsonb,
  features jsonb not null default '[]'::jsonb,
  tech_stack jsonb not null default '{}'::jsonb,
  non_goals jsonb not null default '[]'::jsonb,
  raw_markdown text,
  created_at timestamptz not null default now()
);
create index if not exists prds_project_id_idx on public.prds (project_id);

-- ---------- phases ----------
create table if not exists public.phases (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  order_index integer not null default 0,
  title text not null,
  description text,
  created_at timestamptz not null default now()
);
create index if not exists phases_project_id_idx on public.phases (project_id);

-- ---------- tasks ----------
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  phase_id uuid not null references public.phases (id) on delete cascade,
  order_index integer not null default 0,
  title text not null,
  detail text,
  is_done boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists tasks_phase_id_idx on public.tasks (phase_id);

-- =========================================================
-- updated_at otomatis
-- =========================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

-- =========================================================
-- Auto-buat profile saat user baru daftar
-- =========================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =========================================================
-- Row Level Security
-- =========================================================
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.clarify_messages enable row level security;
alter table public.prds enable row level security;
alter table public.phases enable row level security;
alter table public.tasks enable row level security;

-- profiles
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- projects
drop policy if exists "projects_all_own" on public.projects;
create policy "projects_all_own" on public.projects
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- helper: cek kepemilikan lewat project
create or replace function public.owns_project(p_project_id uuid)
returns boolean language sql security definer set search_path = public stable as $$
  select exists (
    select 1 from public.projects
    where id = p_project_id and user_id = auth.uid()
  );
$$;

-- clarify_messages
drop policy if exists "clarify_all_own" on public.clarify_messages;
create policy "clarify_all_own" on public.clarify_messages
  for all using (public.owns_project(project_id))
  with check (public.owns_project(project_id));

-- prds
drop policy if exists "prds_all_own" on public.prds;
create policy "prds_all_own" on public.prds
  for all using (public.owns_project(project_id))
  with check (public.owns_project(project_id));

-- phases
drop policy if exists "phases_all_own" on public.phases;
create policy "phases_all_own" on public.phases
  for all using (public.owns_project(project_id))
  with check (public.owns_project(project_id));

-- tasks (kepemilikan lewat phase -> project)
create or replace function public.owns_phase(p_phase_id uuid)
returns boolean language sql security definer set search_path = public stable as $$
  select exists (
    select 1 from public.phases
    where id = p_phase_id and public.owns_project(project_id)
  );
$$;

drop policy if exists "tasks_all_own" on public.tasks;
create policy "tasks_all_own" on public.tasks
  for all using (public.owns_phase(phase_id))
  with check (public.owns_phase(phase_id));

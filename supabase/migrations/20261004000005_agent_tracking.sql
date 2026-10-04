-- =========================================================
-- Pelacakan task dari AI coding agent
-- ---------------------------------------------------------
-- Menambah:
--   * tasks.short_id      -> kode human-readable (mis. T-3-2)
--   * tasks.completed_at  -> waktu task ditandai selesai (biner)
--   * projects.agent_token_hash -> hash token agent per proyek
--   * Realtime untuk tabel tasks
-- =========================================================

-- ---------- tasks ----------
alter table public.tasks
  add column if not exists short_id text,
  add column if not exists completed_at timestamptz;

-- short_id unik per fase (kode fase.task), mis. T-1-2.
create unique index if not exists tasks_phase_short_id_key
  on public.tasks (phase_id, short_id)
  where short_id is not null;

-- Backfill short_id untuk task yang sudah ada: T-<fase+1>-<task+1>.
with numbered as (
  select
    t.id,
    'T-' || (p.order_rank + 1) || '-' || (t.task_rank + 1) as short_id
  from (
    select
      id,
      phase_id,
      row_number() over (partition by phase_id order by order_index, created_at) as task_rank
    from public.tasks
  ) t
  join (
    select
      id,
      row_number() over (partition by project_id order by order_index, created_at) as order_rank
    from public.phases
  ) p on p.id = t.phase_id
  where t.id in (select id from public.tasks where short_id is null)
)
update public.tasks
set short_id = numbered.short_id
from numbered
where public.tasks.id = numbered.id;

-- ---------- projects ----------
alter table public.projects
  add column if not exists agent_token_hash text;

-- ---------- Realtime ----------
-- Siarkan perubahan tabel tasks agar checkbox di UI ikut ter-update.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'tasks'
  ) then
    alter publication supabase_realtime add table public.tasks;
  end if;
end;
$$;

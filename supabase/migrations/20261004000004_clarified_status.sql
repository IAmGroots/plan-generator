-- Status klarifikasi selesai: menandai clear bahwa user perlu menyusun PRD
-- berikutnya. Sebelumnya hanya ada draft -> clarifying -> prd_ready, sehingga
-- tahap "PRD belum dibuat" tidak terwakili.
alter table public.projects
  drop constraint if exists projects_status_check;

alter table public.projects
  add constraint projects_status_check
  check (
    status in ('draft', 'clarifying', 'clarified', 'prd_ready', 'tasks_ready')
  );

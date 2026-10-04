-- Kolom one_liner dipakai PRD (satu kalimat ringkas), belum ada di migrasi awal.
alter table public.prds
  add column if not exists one_liner text;

-- =========================================================
-- Satu proyek = satu token agent tetap
-- ---------------------------------------------------------
-- Sebelumnya token disimpan sebagai hash dan bisa dibuat ulang, sehingga
-- token lama mati sewaktu-waktu. Sekarang token disimpan apa adanya
-- (plaintext) dan dibuat otomatis sekali saat user membuka halaman export,
-- lalu tetap dipakai seterusnya.
-- =========================================================

alter table public.projects
  add column if not exists agent_token text;

-- Pindahkan nilai lama (bila ada) ke kolom baru tidak mungkin karena hash
-- bukan plaintext. Token akan di-generate ulang otomatis saat buka export.
alter table public.projects
  drop column if exists agent_token_hash;

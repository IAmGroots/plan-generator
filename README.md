# PlanForge

Ubah ide mentah menjadi **PRD + rencana kerja berjenjang (fase dan sub-task)** dengan bantuan AI, lalu salin semuanya sebagai satu blok Markdown yang siap ditempel ke AI coding agent (Cursor, Claude Code, dan sejenisnya).

Alurnya lima langkah: tulis ide, jawab pertanyaan klarifikasi AI, susun PRD, pecah jadi fase dan task, lalu salin ke agent.

## Fitur utama

- **Autentikasi** — masuk dengan email/password atau Google OAuth (Supabase Auth), dengan guard rute di `proxy.ts`.
- **Dashboard proyek** — daftar semua proyek user, buat proyek baru, dan hapus proyek. Tiap kartu menampilkan status *next action*-nya (mis. "Buat PRD", "Susun task").
- **Langkah 1 — Ide** (`/projects/[id]/idea`) — tulis judul dan ide mentah bebas.
- **Langkah 2 — Klarifikasi** (`/projects/[id]/clarify`) — AI mengajukan pertanyaan bertahap dalam dua putaran: 1 pertanyaan *user story* (textarea), lalu 5 pertanyaan pendukung (pilih satu / pilih banyak, user boleh menambah opsi sendiri). Tersedia tombol "Tanya lagi" untuk 3 pertanyaan lanjutan. Setelah dua putaran, klarifikasi dianggap cukup.
- **Langkah 3 — PRD** (`/projects/[id]/prd`) — AI menyusun PRD terstruktur (ringkasan, masalah, tujuan, persona, fitur dengan prioritas MoSCoW, tech stack, non-goal) yang bisa dilihat dan diedit.
- **Langkah 4 — Fase dan task** (`/projects/[id]/tasks`) — AI memecah PRD menjadi minimal 3 fase, tiap fase berisi task spesifik yang bisa dicentang.
- **Langkah 5 — Salin ke agent** (`/projects/[id]/export`) — satu blok Markdown (konteks proyek + PRD + seluruh fase dan task dengan penanda centang) siap ditempel; juga tersedia ekspor per fase.
- **Pelacakan task dari agent** — tiap task punya *short-id* (mis. `T-3-2`). Blok export memuat instruksi agar AI coding agent memanggil endpoint `/api/agent/tasks/<shortId>/complete` (dengan token proyek) begitu menyelesaikan task. Status task di website ikut tercentang otomatis via Supabase Realtime.
- **Pengaturan model AI** (`/settings`) — pilih model AI dari daftar model yang tersedia di 9Router, dikelompokkan per provider, dan disimpan per user. Bila belum dipilih, dipakai `AI_MODEL` dari environment.
- **Rate limit** — endpoint AI dibatasi 30 permintaan per menit per user.

## Tech stack

| Lapisan | Teknologi |
| --- | --- |
| Framework | Next.js 16 (App Router) |
| UI | React 19, TypeScript, Tailwind CSS 3 |
| Database & Auth | Supabase (Postgres + Auth + Row Level Security) via `@supabase/ssr` & `@supabase/supabase-js` |
| Validasi | Zod |
| Utilitas | clsx, tailwind-merge, class-variance-authority |
| AI | 9Router (endpoint OpenAI-compatible `/chat/completions` dengan mode JSON) |

## Struktur project

```
app/                       halaman App Router + API route
  api/ai/clarify/          POST: hasilkan pertanyaan klarifikasi
  api/ai/prd/              POST: hasilkan & simpan PRD
  api/ai/tasks/            POST: hasilkan fase & task
  api/ai/models/           GET: daftar model dari 9Router
  api/agent/tasks/[shortId]/complete/  POST: laporan task selesai dari agent
  auth/callback/           handler callback OAuth Google
  dashboard/               daftar & buat proyek
  login/                   halaman masuk + server actions
  settings/                pemilihan model AI per user
  projects/[id]/           langkah 1-5 (idea, clarify, prd, tasks, export)
components/                UI dasar (ui/) + header, stepper, model-select, dll
lib/
  ai/                      klien 9Router, skema Zod, prompt, daftar model
  agents/token.ts          generate/hash/verifikasi token agent per proyek
  db/                      query database (queries.ts)
  supabase/                klien Supabase (browser, server, service role, middleware)
  export.ts                penyusun Markdown untuk export
  clarify.ts               logika klarifikasi (user story, putaran)
  short-id.ts              kode task human-readable (T-fase-task)
  rate-limit.ts            pembatas permintaan AI per user
  env.ts, types.ts, utils.ts
scripts/                   skrip verifikasi + helper migrasi database
supabase/
  migrations/              skema database (SQL)
  config.toml              konfigurasi Supabase CLI
proxy.ts                   guard autentikasi (middleware) & refresh sesi
```

## Prasyarat

- **Node.js 20 atau lebih baru** (skrip memakai `node --env-file` dan Next.js 16).
- **npm** (contoh perintah memakai npm; pnpm/yarn juga bisa).
- Project **Supabase** (untuk database dan autentikasi).
- Akses ke **9Router** (atau gateway OpenAI-compatible lain) beserta API key-nya.

## Instalasi & menjalankan

```bash
npm install

# Salin template env, lalu isi nilainya (lihat bagian Environment di bawah)
copy .env.example .env.local      # Windows
# cp .env.example .env.local      # macOS/Linux

npm run db:push                   # terapkan migrasi database ke Supabase
npm run dev                       # jalankan di http://localhost:3001
```

Catatan: `NEXT_PUBLIC_SITE_URL` default di `.env.example` adalah `http://localhost:3001`, dan skrip pengujian juga mengharapkan app berjalan di port tersebut.

## Environment variables

Isi variabel berikut di `.env.local` (nilai diambil dari `.env.example`, tanpa nilai rahasia asli):

| Variabel | Keterangan |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL project Supabase. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key Supabase (aman di browser). |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key Supabase (server-only, dipakai skrip pengujian). |
| `NEXT_PUBLIC_SITE_URL` | Base URL aplikasi, dipakai untuk redirect OAuth. |
| `SUPABASE_DB_URL` | Connection string database (Session pooler) untuk `supabase db push`/`repair`. Ambil dari Supabase Dashboard > Connect > Session pooler > URI. |
| `AI_BASE_URL` | Base URL 9Router, mis. `http://127.0.0.1:20128/v1`. |
| `AI_API_KEY` | API key 9Router. |
| `AI_MODEL` | Model AI default, mis. `groq/openai/gpt-oss-120b`. |

Catatan: nama model 9Router memakai prefix provider (`groq/...`, `bns/...`, `xk/...`). Pilih model yang mendukung mode JSON. API key hanya dipakai di server dan tidak pernah dikirim ke browser.

## Skema database (Supabase)

Skema ada di `supabase/migrations/` dan dijalankan lewat Supabase CLI memakai `SUPABASE_DB_URL` dari `.env.local` (tanpa proses `supabase link`).

Tabel utama:

| Tabel | Isi |
| --- | --- |
| `profiles` | Data user (email, nama, avatar) + `ai_model` pilihan user. Dibuat otomatis saat user baru mendaftar. |
| `projects` | Proyek milik user; menyimpan judul, `raw_idea`, dan `status` (`draft`, `clarifying`, `clarified`, `prd_ready`, `tasks_ready`). |
| `clarify_messages` | Riwayat tanya-jawab klarifikasi (`assistant`/`user`). |
| `prds` | PRD terstruktur per proyek (goals, personas, features, tech_stack, non_goals, `raw_markdown`). |
| `phases` | Fase pengerjaan per proyek (berurutan via `order_index`). |
| `tasks` | Task di dalam fase (berurutan, punya `is_done` untuk centang, `short_id` untuk short-id agent, dan `completed_at` untuk waktu selesai). |

Proyek menyimpan `agent_token` (token agent tetap, dibuat otomatis saat membuka halaman export) untuk autentikasi laporan dari agent.

Setiap tabel dilindungi **Row Level Security**: user hanya bisa mengakses barisnya sendiri, memakai fungsi bantu `owns_project()` dan `owns_phase()`. Terdapat pula trigger `set_updated_at` (auto `updated_at`) dan `handle_new_user` (auto-buat profile).

Perintah migrasi:

```bash
npm run db:dry     # pratinjau migrasi yang akan dijalankan
npm run db:push    # terapkan migrasi baru
npm run db:list    # bandingkan migrasi lokal vs remote
```

Migrasi baru: `npx supabase migration new <nama>`, tulis SQL-nya di `supabase/migrations/`, lalu `npm run db:push`.

## Skrip yang tersedia

| Skrip | Perintah | Keterangan |
| --- | --- | --- |
| `dev` | `next dev` | Jalankan server pengembangan. |
| `build` | `next build` | Build produksi. |
| `start` | `next start` | Jalankan hasil build produksi. |
| `typecheck` | `tsc --noEmit` | Cek tipe TypeScript. |
| `test:ai` | `node --env-file=.env.local scripts/test-ai.mjs` | Uji koneksi ke 9Router. |
| `test:db` | `node --env-file=.env.local scripts/test-db.mjs` | Uji koneksi Supabase + keberadaan tabel. |
| `test:e2e` | `node --env-file=.env.local scripts/test-e2e-full.mjs` | Uji alur penuh ide -> PRD -> task -> Markdown. |
| `test:pages` | `node --env-file=.env.local scripts/test-pages.mjs` | Pastikan semua halaman render (HTTP 200). |
| `db:list` | `node scripts/db.mjs list` | Bandingkan migrasi lokal vs remote. |
| `db:dry` | `node scripts/db.mjs dry` | Pratinjau migrasi. |
| `db:push` | `node scripts/db.mjs push` | Terapkan migrasi. |
| `db:repair` | `node scripts/db.mjs repair` | Perbaiki riwayat migrasi di remote. |

Di `scripts/` juga terdapat skrip pengujian tambahan yang dipanggil langsung dengan Node (mis. `test-clarify-route.mjs`, `test-prd-route.mjs`, `test-tasks-route.mjs`, `test-agent-complete.mjs`, `test-models.mjs`, `test-export.mjs`, `test-projects.mjs`, `test-ratelimit.mjs`, `test-settings.mjs`).

## Pelacakan task dari AI coding agent

PlanForge bisa menandai task selesai secara otomatis saat AI coding agent mengerjakannya.

**Cara pakai:**

1. Buka **Langkah 5 — Salin ke agent**. Token agent **dibuat otomatis sekali** saat pertama kali halaman ini dibuka (satu proyek = satu token tetap).
2. Salin blok Markdown export. Tiap task punya short-id (mis. `T-3-2`) dan blok instruksi berisi token + perintah `curl` — jadi agent langsung bisa melapor.
3. Saat agent menyelesaikan sebuah task, ia menjalankan:
   ```bash
   curl -X POST "https://<domain>/api/agent/tasks/T-3-2/complete" \
     -H "Authorization: Bearer <AGENT_TOKEN>" \
     -H "X-Project-Id: <PROJECT_ID>"
   ```
4. Checkbox task di halaman **Langkah 4** langsung tercentang (via Supabase Realtime), tanpa refresh manual.

**Sifat token:**

- **Satu proyek = satu token tetap.** Token tidak berubah-ubah — membuka ulang atau me-refresh halaman export selalu memakai token yang sama, sehingga agent yang sedang berjalan tidak kehilangan akses.
- Ada tombol **Reset token (darurat)** di halaman export, hanya untuk keadaan token bocor. Reset akan membuat agent yang sedang berjalan kehilangan akses.

**Keamanan & perilaku:**

- Endpoint bersifat idempotent: memanggil ulang task yang sudah selesai tetap `200 OK`.
- Respons: `401` tanpa token, `403` token salah, `404` short-id tidak ditemukan, `200` berhasil.
- Endpoint `/api/agent/*` tidak memakai sesi cookie; autentikasi murni lewat token proyek.
- Token disimpan di kolom `projects.agent_token` dan dilindungi Row Level Security (hanya pemilik proyek yang bisa membacanya).

**Aktivasi Realtime:** tabel `tasks` sudah ditambahkan ke publication `supabase_realtime` lewat migrasi `20261004000005_agent_tracking.sql`. Bila checkbox tidak ikut berubah, pastikan Realtime aktif di dashboard Supabase (Database → Replication) untuk tabel `tasks`.

## Deployment

Aplikasi ini adalah project Next.js standar dan bisa di-deploy di platform seperti **Vercel** (atau platform Node.js lain yang mendukung Next.js):

- Set semua environment variable di atas pada dashboard platform (jangan commit `.env.local`).
- Terapkan migrasi database ke project Supabase produksi (`npm run db:push`) dan pastikan Google OAuth redirect URL di Supabase diarahkan ke domain produksi (memakai `NEXT_PUBLIC_SITE_URL`).
- Perhatikan bahwa `AI_BASE_URL` pada `.env.example` mengarah ke `127.0.0.1`, yang hanya jalan di mesin lokal. Untuk produksi, arahkan ke provider AI yang dapat dijangkau publik (cloud) atau gateway yang di-tunnel.
- Rate limit bersifat in-memory per instance; untuk produksi skala besar pertimbangkan penyimpanan terdistribusi.

## Catatan

- Endpoint AI (`/api/ai/*`) memerlukan login; permintaan tanpa sesi dibalas `401`.
- PRD disimpan satu per proyek dan fase lama diganti saat generate task ulang.
- Desain UI memakai tema gelap dengan satu aksen *Signal Teal* (lihat `DESIGN.md` dan `tailwind.config.ts`).

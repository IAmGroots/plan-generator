-- Model AI pilihan user (global per user). Null berarti pakai default AI_MODEL.
alter table public.profiles
  add column if not exists ai_model text;

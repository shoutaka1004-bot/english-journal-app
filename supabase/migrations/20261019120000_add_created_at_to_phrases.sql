-- 復習セット(30個ずつ)を作られた順に区切るため、フレーズの作成日時を持たせる
alter table public.phrases
  add column created_at timestamptz not null default now();

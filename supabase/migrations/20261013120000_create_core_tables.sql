-- ジャーナル(1ユーザー1日1件)
create table public.journals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  journal_date date not null,
  original_text text not null,
  corrected_text text, -- 添削前は NULL
  unique (user_id, journal_date)
);

-- ジャーナルから抽出した覚えるべきフレーズ
create table public.phrases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  journal_id uuid not null references public.journals (id),
  phrase text not null,
  meaning text not null
);

-- 復習の履歴(1回の復習につき1行)
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  phrase_id uuid not null references public.phrases (id),
  reviewed_at timestamptz not null default now(),
  is_correct boolean not null
);

-- 添削前の意図確認チャット
create table public.journal_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  journal_id uuid not null references public.journals (id),
  speaker text not null check (speaker in ('user', 'ai')),
  content text not null,
  created_at timestamptz not null default now()
);

-- RLS を有効化(ポリシー未定義の間は全アクセス拒否になる)
alter table public.journals enable row level security;
alter table public.phrases enable row level security;
alter table public.reviews enable row level security;
alter table public.journal_messages enable row level security;

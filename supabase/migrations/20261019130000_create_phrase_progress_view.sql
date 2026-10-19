-- フレーズごとの復習状況(直近2回の結果から「クリア済みか」を判定する)
-- security_invoker = true: 呼び出したユーザーの権限で実行されるため、
-- 元テーブル(phrases / reviews)の RLS がそのまま効く
create view public.phrase_progress
with (security_invoker = true) as
select
  p.id,
  p.user_id,
  p.phrase,
  p.meaning,
  p.created_at,
  recent.last_reviewed_at,
  -- 直近2回がどちらも正解ならクリア(復習が2回未満なら未クリア)
  coalesce(recent.review_count = 2 and recent.all_correct, false) as is_cleared
from public.phrases p
left join lateral (
  select
    count(*) as review_count,
    bool_and(is_correct) as all_correct,
    max(reviewed_at) as last_reviewed_at
  from (
    select r.is_correct, r.reviewed_at
    from public.reviews r
    where r.phrase_id = p.id
    order by r.reviewed_at desc
    limit 2
  ) last_two
) recent on true;

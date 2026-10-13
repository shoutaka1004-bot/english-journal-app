-- journals: 本人のみ 読む/追加/編集(削除は不可)
create policy "journals_select_own" on public.journals
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy "journals_insert_own" on public.journals
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "journals_update_own" on public.journals
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- phrases: 本人のみ 読む/追加(編集・削除は不可)
create policy "phrases_select_own" on public.phrases
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy "phrases_insert_own" on public.phrases
  for insert to authenticated
  with check (user_id = (select auth.uid()));

-- reviews: 本人のみ 読む/追加(編集・削除は不可)
create policy "reviews_select_own" on public.reviews
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy "reviews_insert_own" on public.reviews
  for insert to authenticated
  with check (user_id = (select auth.uid()));

-- journal_messages: 本人のみ 読む/追加(編集・削除は不可)
create policy "journal_messages_select_own" on public.journal_messages
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy "journal_messages_insert_own" on public.journal_messages
  for insert to authenticated
  with check (user_id = (select auth.uid()));

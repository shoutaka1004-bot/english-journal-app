-- 添削後の文の保存とフレーズの保存を、1つのトランザクションで行う関数。
-- 途中で失敗すると全部が取り消され、corrected_text は null のまま残る(やり直せる)。
--
-- security invoker: 呼んだ本人の権限で動くため、既存のRLSがそのまま効く。
-- user_id は引数で受け取らず、auth.uid() から取る(他人のIDを渡せない)。
create function public.save_correction(
  p_journal_id uuid,
  p_corrected_text text,
  p_phrases jsonb -- [{"phrase": "...", "meaning": "..."}, ...]
) returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  -- 添削済みの場合、または他人のジャーナルの場合(RLSで見えない)は0件になる
  update public.journals
     set corrected_text = p_corrected_text
   where id = p_journal_id
     and corrected_text is null;

  if not found then
    raise exception 'journal not found or already corrected';
  end if;

  insert into public.phrases (user_id, journal_id, phrase, meaning)
  select (select auth.uid()), p_journal_id, x.phrase, x.meaning
    from jsonb_to_recordset(p_phrases) as x(phrase text, meaning text);
end;
$$;

-- 関数は初期状態で誰でも実行できるため、ログイン済みユーザーだけに絞る
revoke execute on function public.save_correction(uuid, text, jsonb) from public, anon;
grant execute on function public.save_correction(uuid, text, jsonb) to authenticated;

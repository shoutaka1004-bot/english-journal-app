-- 意図確認チャットは「AIの質問1件 + ユーザーの回答1件」の1往復まで。
-- 連打や同時送信で二重に保存されないよう、DBの制約で保証する。
alter table public.journal_messages
  add constraint journal_messages_journal_speaker_key unique (journal_id, speaker);

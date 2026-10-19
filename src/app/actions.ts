"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { todayInTokyo } from "@/lib/date";
import { correctJournal } from "@/lib/ai/correct-journal";

// Postgres の一意制約違反(user_id + journal_date の重複)
const UNIQUE_VIOLATION = "23505";

function redirectWithError(message: string): never {
  redirect(`/?error=${encodeURIComponent(message)}`);
}

export async function createJournal(formData: FormData) {
  const originalText = String(formData.get("original_text") ?? "").trim();
  if (!originalText) redirectWithError("本文を入力してください");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // user_id と日付はクライアントから受け取らず、サーバー側で決める
  const { error } = await supabase.from("journals").insert({
    user_id: user.id,
    journal_date: todayInTokyo(),
    original_text: originalText,
  });

  if (error) {
    redirectWithError(
      error.code === UNIQUE_VIOLATION
        ? "今日の分はすでに書いています"
        : "保存に失敗しました"
    );
  }

  redirect("/");
}

export async function requestCorrection(formData: FormData) {
  const journalId = String(formData.get("journal_id") ?? "");
  if (!journalId) redirectWithError("対象のジャーナルが指定されていません");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // RLS により、自分のジャーナルしか取得できない
  const { data: journal } = await supabase
    .from("journals")
    .select("id, original_text, corrected_text")
    .eq("id", journalId)
    .maybeSingle();

  if (!journal) redirectWithError("ジャーナルが見つかりません");
  // API料金を守るため、添削済みなら再実行しない
  if (journal.corrected_text !== null) {
    redirectWithError("このジャーナルはすでに添削済みです");
  }

  let correction;
  try {
    correction = await correctJournal(journal.original_text);
  } catch (e) {
    console.error("correctJournal failed:", e);
    redirectWithError("添削に失敗しました。もう一度お試しください");
  }

  // corrected_text が NULL の行だけ更新する(連打しても1回しか通らない)
  const { data: updated, error: updateError } = await supabase
    .from("journals")
    .update({ corrected_text: correction.corrected_text })
    .eq("id", journal.id)
    .is("corrected_text", null)
    .select("id");

  if (updateError || !updated || updated.length === 0) {
    redirectWithError("添削結果の保存に失敗しました");
  }

  if (correction.phrases.length > 0) {
    const { error: phrasesError } = await supabase.from("phrases").insert(
      correction.phrases.map((p) => ({
        user_id: user.id,
        journal_id: journal.id,
        phrase: p.phrase,
        meaning: p.meaning,
      }))
    );
    if (phrasesError) redirectWithError("フレーズの保存に失敗しました");
  }

  redirect("/");
}

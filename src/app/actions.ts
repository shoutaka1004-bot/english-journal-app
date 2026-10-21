"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { todayInTokyo } from "@/lib/date";
import {
  askQuestions,
  correctJournal,
  type Clarification,
} from "@/lib/ai/correct-journal";

// Postgres の一意制約違反(user_id + journal_date の重複)
const UNIQUE_VIOLATION = "23505";

const ANSWER_MAX_LENGTH = 2000;

type Supabase = Awaited<ReturnType<typeof createClient>>;

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

// 認証と、対象ジャーナル・これまでのやり取りの取得をまとめた共通処理
// (RLS により、自分のものしか取得できない)
async function loadOwnJournal(journalId: string) {
  if (!journalId) redirectWithError("対象のジャーナルが指定されていません");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

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

  const { data: messages } = await supabase
    .from("journal_messages")
    .select("speaker, content")
    .eq("journal_id", journal.id);

  return {
    supabase,
    user,
    journal,
    question: messages?.find((m) => m.speaker === "ai"),
    answer: messages?.find((m) => m.speaker === "user"),
  };
}

// 添削をAIに依頼し、結果(添削後の文とフレーズ)を保存してホームへ戻る
async function runCorrection(
  supabase: Supabase,
  userId: string,
  journal: { id: string; original_text: string },
  clarification?: Clarification
): Promise<never> {
  let correction;
  try {
    correction = await correctJournal(journal.original_text, clarification);
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
        user_id: userId,
        journal_id: journal.id,
        phrase: p.phrase,
        meaning: p.meaning,
      }))
    );
    if (phrasesError) redirectWithError("フレーズの保存に失敗しました");
  }

  redirect("/");
}

// 「添削する」ボタン。質問がまだなら先にAIが意図を確認し、
// 質問が不要、または回答済みなら添削まで進める
export async function requestCorrection(formData: FormData) {
  const { supabase, user, journal, question, answer } = await loadOwnJournal(
    String(formData.get("journal_id") ?? "")
  );

  if (question && !answer) {
    redirectWithError("AIからの質問に回答してください");
  }

  if (question && answer) {
    // 回答の保存後に添削が失敗していた場合の再実行
    await runCorrection(supabase, user.id, journal, {
      questions: question.content,
      answer: answer.content,
    });
  }

  let questions: string[];
  try {
    questions = await askQuestions(journal.original_text);
  } catch (e) {
    console.error("askQuestions failed:", e);
    redirectWithError("AIへの確認に失敗しました。もう一度お試しください");
  }

  // 質問が不要なら、そのまま添削する
  if (questions.length === 0) {
    await runCorrection(supabase, user.id, journal);
  }

  // (journal_id, speaker) の一意制約により、質問は1件しか保存できない
  const { error } = await supabase.from("journal_messages").insert({
    user_id: user.id,
    journal_id: journal.id,
    speaker: "ai",
    content: questions.map((q, i) => `${i + 1}. ${q}`).join("\n"),
  });
  if (error) redirectWithError("質問の保存に失敗しました");

  redirect("/");
}

// 質問への回答。回答は1回だけ送信でき、保存後にそのまま最終の添削を行う
export async function submitAnswer(formData: FormData) {
  const answerText = String(formData.get("answer") ?? "").trim();
  if (!answerText) redirectWithError("回答を入力してください");
  if (answerText.length > ANSWER_MAX_LENGTH) {
    redirectWithError(`回答は${ANSWER_MAX_LENGTH}文字以内にしてください`);
  }

  const { supabase, user, journal, question, answer } = await loadOwnJournal(
    String(formData.get("journal_id") ?? "")
  );

  if (!question) redirectWithError("AIからの質問がありません");
  if (answer) redirectWithError("すでに回答を送信済みです");

  // user_id と journal_id はサーバー側で決める(一意制約で二重送信も防ぐ)
  const { error } = await supabase.from("journal_messages").insert({
    user_id: user.id,
    journal_id: journal.id,
    speaker: "user",
    content: answerText,
  });
  if (error) redirectWithError("回答の保存に失敗しました");

  await runCorrection(supabase, user.id, journal, {
    questions: question.content,
    answer: answerText,
  });
}

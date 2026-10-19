"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { advance, parseSessionState, toQuery } from "@/lib/review/session";

function field(formData: FormData, name: string): string | undefined {
  const value = formData.get(name);
  return typeof value === "string" ? value : undefined;
}

export async function submitReview(formData: FormData) {
  const phraseId = field(formData, "phrase_id") ?? "";
  const result = field(formData, "result");
  if (!phraseId || (result !== "correct" && result !== "wrong")) {
    redirect("/review");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // RLS により、自分のフレーズしか取得できない。他人のフレーズIDへの記録を防ぐ
  const { data: phrase } = await supabase
    .from("phrases")
    .select("id")
    .eq("id", phraseId)
    .maybeSingle();
  if (!phrase) redirect("/review");

  const isCorrect = result === "correct";
  const { error } = await supabase.from("reviews").insert({
    user_id: user.id,
    phrase_id: phraseId,
    is_correct: isCorrect,
  });
  if (error) {
    redirect(`/review?error=${encodeURIComponent("結果の保存に失敗しました")}`);
  }

  // テストの進行状態(何問目か・正解数・間違えたフレーズ)を次の画面へ引き継ぐ
  const state = parseSessionState({
    q: field(formData, "q"),
    ok: field(formData, "ok"),
    ng: field(formData, "ng"),
  });
  if (!state) redirect("/review");

  const next = advance(state, phraseId, isCorrect);
  if (next.done) {
    redirect(`/review/result?${toQuery({ ok: next.ok, ng: next.ng })}`);
  }
  redirect(`/review?${toQuery(next.state)}`);
}

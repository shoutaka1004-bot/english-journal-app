"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { todayInTokyo } from "@/lib/date";

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

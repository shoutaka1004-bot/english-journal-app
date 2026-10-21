"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { submitAnswer } from "./actions";

function SendButton() {
  const { pending } = useFormStatus();

  return (
    <button disabled={pending} className="btn-primary">
      {pending ? "送信・添削中…(10〜30秒ほどかかります)" : "送信する"}
    </button>
  );
}

export function AnswerForm({ journalId }: { journalId: string }) {
  const [answer, setAnswer] = useState("");
  // 入力中 → 最終確認 の2段階。確認画面を挟んで、うっかり送信を防ぐ
  const [confirming, setConfirming] = useState(false);

  return (
    <form action={submitAnswer} className="flex flex-col gap-3">
      <input type="hidden" name="journal_id" value={journalId} />
      <textarea
        name="answer"
        required
        rows={4}
        maxLength={2000}
        value={answer}
        readOnly={confirming}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="日本語でも英語でも大丈夫です"
        className="field"
      />

      {confirming ? (
        <div className="flex flex-col gap-3 rounded-lg bg-sunken p-4">
          <p className="text-sm font-medium">
            回答を送信できるのは1回だけです。送信後は修正できません。
          </p>
          <p className="text-sm text-muted">
            送信すると、この回答をもとにAIが添削します。この内容で送信しますか?
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="btn-secondary"
            >
              戻って直す
            </button>
            <SendButton />
          </div>
        </div>
      ) : (
        <button
          type="button"
          disabled={answer.trim() === ""}
          onClick={() => setConfirming(true)}
          className="btn-primary self-start"
        >
          内容を確認する
        </button>
      )}
    </form>
  );
}

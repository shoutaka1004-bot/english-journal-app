"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { submitReview } from "./actions";

function ResultButtons() {
  const { pending } = useFormStatus();

  return (
    <div className="flex gap-3">
      <button
        name="result"
        value="correct"
        disabled={pending}
        className="flex-1 rounded bg-foreground px-4 py-2 text-background disabled:opacity-50"
      >
        合っていた
      </button>
      <button
        name="result"
        value="wrong"
        disabled={pending}
        className="flex-1 rounded border border-zinc-300 px-4 py-2 disabled:opacity-50"
      >
        違った
      </button>
    </div>
  );
}

export function ReviewCard({
  phraseId,
  meaning,
  phrase,
  session,
}: {
  phraseId: string;
  meaning: string;
  phrase: string;
  session: { q: number; ok: number; ng: string[] };
}) {
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="flex flex-col gap-4 rounded border border-zinc-200 p-6">
      <div>
        <p className="mb-1 text-sm text-zinc-500">この意味の英語フレーズは？</p>
        <p className="text-xl">{meaning}</p>
      </div>

      {revealed ? (
        <form action={submitReview} className="flex flex-col gap-4">
          <input type="hidden" name="phrase_id" value={phraseId} />
          <input type="hidden" name="q" value={session.q} />
          <input type="hidden" name="ok" value={session.ok} />
          <input type="hidden" name="ng" value={session.ng.join(",")} />
          <p className="rounded bg-zinc-100 px-3 py-3 text-xl font-medium dark:bg-zinc-800">
            {phrase}
          </p>
          <ResultButtons />
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setRevealed(true)}
          className="self-start rounded border border-zinc-300 px-4 py-2"
        >
          答えを見る
        </button>
      )}
    </div>
  );
}

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
        className="btn-primary flex-1"
      >
        合っていた
      </button>
      <button
        name="result"
        value="wrong"
        disabled={pending}
        className="btn-secondary flex-1"
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
    <div className="card flex flex-col gap-4">
      <div>
        <p className="mb-1 text-sm text-muted">この意味の英語フレーズは？</p>
        <p className="text-xl">{meaning}</p>
      </div>

      {revealed ? (
        <form action={submitReview} className="flex flex-col gap-4">
          <input type="hidden" name="phrase_id" value={phraseId} />
          <input type="hidden" name="q" value={session.q} />
          <input type="hidden" name="ok" value={session.ok} />
          <input type="hidden" name="ng" value={session.ng.join(",")} />
          <p className="rounded-lg bg-sunken px-4 py-3 font-serif text-2xl font-medium">
            {phrase}
          </p>
          <ResultButtons />
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setRevealed(true)}
          className="btn-secondary self-start"
        >
          答えを見る
        </button>
      )}
    </div>
  );
}

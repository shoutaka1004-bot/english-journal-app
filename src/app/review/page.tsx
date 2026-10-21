import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { pickNextPhrase, type PhraseProgress } from "@/lib/review/select-next";
import {
  SESSION_LENGTH,
  parseSessionState,
  toQuery,
} from "@/lib/review/session";
import { ReviewCard } from "./review-card";

const KIND_LABEL = {
  active: "",
  "mix-in": "(復習: クリア済みセットから)",
  practice: "(全セットクリア済み: 自由練習)",
} as const;

export default async function ReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; q?: string; ok?: string; ng?: string }>;
}) {
  const params = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // RLS(view は security_invoker)により、自分のフレーズだけが返る
  const { data: rows } = await supabase
    .from("phrase_progress")
    .select("id, phrase, meaning, created_at, last_reviewed_at, is_cleared");

  // view の列は型の上ですべて null になりうるため、必須の値がある行だけを使う
  const phrases: PhraseProgress[] = (rows ?? []).flatMap((r) =>
    r.id && r.phrase && r.meaning && r.created_at
      ? [
          {
            id: r.id,
            phrase: r.phrase,
            meaning: r.meaning,
            createdAt: r.created_at,
            lastReviewedAt: r.last_reviewed_at,
            isCleared: r.is_cleared ?? false,
          },
        ]
      : []
  );

  const pick = pickNextPhrase(phrases);
  const session = parseSessionState(params);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-12">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">フレーズテスト</h1>
        <Link href="/" className="text-sm text-muted underline">
          ジャーナルへ戻る
        </Link>
      </header>

      {params.error && (
        <p role="alert" className="alert-error">
          {params.error}
        </p>
      )}

      {!pick ? (
        <p className="notice">
          テストするフレーズがまだありません。ジャーナルを書いて添削すると、フレーズが増えます。
        </p>
      ) : !session ? (
        <section className="card flex flex-col gap-4">
          <p>
            全 {SESSION_LENGTH} 問。意味を見て、英語のフレーズを思い出してください。
          </p>
          <p className="text-sm text-muted">
            今のセット {pick.setNumber}: クリア {pick.setProgress.cleared} /{" "}
            {pick.setProgress.total}
          </p>
          <Link
            href={`/review?${toQuery({ q: 1, ok: 0, ng: [] })}`}
            className="btn-primary self-start"
          >
            テストを始める
          </Link>
        </section>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">
                第 {session.q} 問 / {SESSION_LENGTH}
              </span>
              <Link href="/review" className="text-muted underline">
                中断する
              </Link>
            </div>
            <div
              className="h-2 w-full overflow-hidden rounded-full bg-sunken"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={SESSION_LENGTH}
              aria-valuenow={session.q - 1}
            >
              <div
                className="h-full rounded-full bg-accent transition-all"
                style={{ width: `${((session.q - 1) / SESSION_LENGTH) * 100}%` }}
              />
            </div>
            <p className="text-xs text-muted">
              セット {pick.setNumber}: クリア {pick.setProgress.cleared} /{" "}
              {pick.setProgress.total} {KIND_LABEL[pick.kind]}
            </p>
          </div>

          {/* 問題が変わるたびに「答えを見る」の状態をリセットするため key を変える */}
          <ReviewCard
            key={`${session.q}:${pick.phrase.id}:${pick.phrase.lastReviewedAt}`}
            phraseId={pick.phrase.id}
            meaning={pick.phrase.meaning}
            phrase={pick.phrase.phrase}
            session={session}
          />
        </>
      )}
    </main>
  );
}

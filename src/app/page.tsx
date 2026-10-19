import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { todayInTokyo } from "@/lib/date";
import { signOut } from "./login/actions";
import { createJournal, requestCorrection } from "./actions";
import { CorrectButton } from "./correct-button";

// AI添削はServer Actionの中で数十秒かかることがあるため、ページ単位で制限時間を延ばす
export const maxDuration = 60;

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // RLS により、取得できるのは自分のジャーナルだけ
  const { data: journals } = await supabase
    .from("journals")
    .select(
      "id, journal_date, original_text, corrected_text, phrases(id, phrase, meaning)"
    )
    .order("journal_date", { ascending: false });

  const today = todayInTokyo();
  const hasWrittenToday = journals?.some((j) => j.journal_date === today);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-12">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">English Journal</h1>
          <p className="text-sm text-zinc-600">ログイン中: {user.email}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/review"
            className="rounded bg-foreground px-3 py-1.5 text-sm text-background"
          >
            フレーズテスト
          </Link>
          <form action={signOut}>
            <button className="rounded border border-zinc-300 px-3 py-1.5 text-sm">
              ログアウト
            </button>
          </form>
        </div>
      </header>

      {error && (
        <p role="alert" className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">今日のジャーナル ({today})</h2>
        {hasWrittenToday ? (
          <p className="rounded bg-zinc-100 px-3 py-4 text-sm text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
            今日は書きました。また明日。
          </p>
        ) : (
          <form action={createJournal} className="flex flex-col gap-3">
            <textarea
              name="original_text"
              required
              rows={8}
              placeholder="Write about your day in English..."
              className="rounded border border-zinc-300 px-3 py-2 text-base"
            />
            <button className="self-start rounded bg-foreground px-4 py-2 text-background">
              保存する
            </button>
          </form>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">これまでのジャーナル</h2>
        {journals && journals.length > 0 ? (
          <ul className="flex flex-col gap-4">
            {journals.map((j) => (
              <li key={j.id} className="rounded border border-zinc-200 p-4">
                <p className="mb-2 text-sm text-zinc-500">{j.journal_date}</p>
                <p className="whitespace-pre-wrap">{j.original_text}</p>

                {j.corrected_text === null ? (
                  <form action={requestCorrection} className="mt-3 flex flex-col">
                    <input type="hidden" name="journal_id" value={j.id} />
                    <CorrectButton />
                  </form>
                ) : (
                  <div className="mt-4 flex flex-col gap-3 border-t border-zinc-200 pt-3">
                    <div>
                      <p className="mb-1 text-sm font-medium text-zinc-500">
                        添削後
                      </p>
                      <p className="whitespace-pre-wrap">{j.corrected_text}</p>
                    </div>
                    {j.phrases.length > 0 && (
                      <div>
                        <p className="mb-1 text-sm font-medium text-zinc-500">
                          覚えるフレーズ
                        </p>
                        <ul className="flex flex-col gap-1 text-sm">
                          {j.phrases.map((p) => (
                            <li key={p.id}>
                              <span className="font-medium">{p.phrase}</span>
                              <span className="text-zinc-600"> — {p.meaning}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-zinc-500">まだありません。</p>
        )}
      </section>
    </main>
  );
}

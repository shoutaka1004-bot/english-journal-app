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
          <p className="text-sm text-muted">ログイン中: {user.email}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/review"
            className="btn-primary"
          >
            フレーズテスト
          </Link>
          <form action={signOut}>
            <button className="btn-secondary">
              ログアウト
            </button>
          </form>
        </div>
      </header>

      {error && (
        <p role="alert" className="alert-error">
          {error}
        </p>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">今日のジャーナル ({today})</h2>
        {hasWrittenToday ? (
          <p className="notice">
            今日は書きました。また明日。
          </p>
        ) : (
          <form action={createJournal} className="flex flex-col gap-3">
            <textarea
              name="original_text"
              required
              rows={8}
              placeholder="Write about your day in English..."
              className="field english"
            />
            <button className="btn-primary self-start">
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
              <li key={j.id} className="card">
                <p className="mb-2 text-sm text-muted">{j.journal_date}</p>
                <p className="english">{j.original_text}</p>

                {j.corrected_text === null ? (
                  <form action={requestCorrection} className="mt-3 flex flex-col">
                    <input type="hidden" name="journal_id" value={j.id} />
                    <CorrectButton />
                  </form>
                ) : (
                  <div className="mt-4 flex flex-col gap-3 border-t border-border pt-3">
                    <div>
                      <p className="mb-1 text-sm font-medium text-accent">
                        添削後
                      </p>
                      <p className="english">{j.corrected_text}</p>
                    </div>
                    {j.phrases.length > 0 && (
                      <div>
                        <p className="mb-1 text-sm font-medium text-accent">
                          覚えるフレーズ
                        </p>
                        <ul className="flex flex-col gap-1 text-sm">
                          {j.phrases.map((p) => (
                            <li key={p.id}>
                              <span className="font-serif text-base font-medium">{p.phrase}</span>
                              <span className="text-muted"> — {p.meaning}</span>
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
          <p className="notice">まだありません。</p>
        )}
      </section>
    </main>
  );
}

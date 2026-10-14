import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { todayInTokyo } from "@/lib/date";
import { signOut } from "./login/actions";
import { createJournal } from "./actions";

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
    .select("id, journal_date, original_text")
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
        <form action={signOut}>
          <button className="rounded border border-zinc-300 px-3 py-1.5 text-sm">
            ログアウト
          </button>
        </form>
      </header>

      {error && (
        <p role="alert" className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">今日のジャーナル ({today})</h2>
        {hasWrittenToday ? (
          <p className="rounded bg-zinc-100 px-3 py-4 text-sm text-zinc-700">
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

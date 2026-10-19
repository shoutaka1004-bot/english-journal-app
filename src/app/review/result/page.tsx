import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SESSION_LENGTH, parseResult } from "@/lib/review/session";

export default async function ReviewResultPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; ng?: string }>;
}) {
  const { ok, ng } = parseResult(await searchParams);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // RLS により、自分のフレーズだけが返る(URL のIDを書き換えても他人のものは見えない)
  const { data: wrongPhrases } =
    ng.length > 0
      ? await supabase.from("phrases").select("id, phrase, meaning").in("id", ng)
      : { data: [] };

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-12">
      <h1 className="text-2xl font-semibold">テスト結果</h1>

      <section className="rounded border border-zinc-200 p-6 text-center">
        <p className="text-sm text-zinc-600">正解数</p>
        <p className="text-5xl font-semibold">
          {ok} <span className="text-2xl text-zinc-500">/ {SESSION_LENGTH}</span>
        </p>
      </section>

      {wrongPhrases && wrongPhrases.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">間違えたフレーズ</h2>
          <ul className="flex flex-col gap-2">
            {wrongPhrases.map((p) => (
              <li key={p.id} className="rounded border border-zinc-200 p-4">
                <p className="font-medium">{p.phrase}</p>
                <p className="text-sm text-zinc-600">{p.meaning}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <p className="text-sm text-zinc-600">間違えたフレーズはありません。</p>
      )}

      <div className="flex gap-3">
        <Link
          href="/review"
          className="rounded bg-foreground px-5 py-2 text-background"
        >
          もう一度テストする
        </Link>
        <Link href="/" className="rounded border border-zinc-300 px-5 py-2">
          ホームへ
        </Link>
      </div>
    </main>
  );
}

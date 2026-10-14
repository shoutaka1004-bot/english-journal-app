import { signIn, signUp } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-6 py-16">
      <h1 className="text-2xl font-semibold">ログイン / 新規登録</h1>

      {error && (
        <p role="alert" className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <form className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          メールアドレス
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className="rounded border border-zinc-300 px-3 py-2 text-base"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          パスワード
          <input
            name="password"
            type="password"
            required
            minLength={6}
            autoComplete="current-password"
            className="rounded border border-zinc-300 px-3 py-2 text-base"
          />
        </label>
        <div className="flex gap-3">
          <button
            formAction={signIn}
            className="flex-1 rounded bg-foreground px-4 py-2 text-background"
          >
            ログイン
          </button>
          <button
            formAction={signUp}
            className="flex-1 rounded border border-zinc-300 px-4 py-2"
          >
            新規登録
          </button>
        </div>
      </form>
    </main>
  );
}

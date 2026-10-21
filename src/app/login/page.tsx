import { signIn } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-6 py-16">
      <div>
        <h1 className="text-2xl font-semibold">English Journal</h1>
        <p className="text-sm text-muted">英語で書いて、AIに添削してもらう</p>
      </div>

      {error && (
        <p role="alert" className="alert-error">
          {error}
        </p>
      )}

      <form className="card flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          メールアドレス
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className="field"
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
            className="field"
          />
        </label>
        <button
          formAction={signIn}
          className="btn-primary"
        >
          ログイン
        </button>
      </form>
    </main>
  );
}

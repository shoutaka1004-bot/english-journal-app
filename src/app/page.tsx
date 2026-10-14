import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "./login/actions";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-6 px-6 py-16">
      <h1 className="text-2xl font-semibold">English Journal</h1>
      <p className="text-zinc-600">ログイン中: {user.email}</p>
      <form action={signOut}>
        <button className="rounded border border-zinc-300 px-4 py-2">
          ログアウト
        </button>
      </form>
    </main>
  );
}

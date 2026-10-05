import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies(); // ヒント: cookies() を await する

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!, // URL環境変数
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, // ANON KEY環境変数
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );
}

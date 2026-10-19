"use client";

import { useFormStatus } from "react-dom";

export function CorrectButton() {
  const { pending } = useFormStatus();

  return (
    <button
      disabled={pending}
      className="self-start rounded bg-foreground px-4 py-2 text-sm text-background disabled:opacity-50"
    >
      {pending ? "添削中…(10〜30秒ほどかかります)" : "添削する"}
    </button>
  );
}

"use client";

import { useFormStatus } from "react-dom";

export function CorrectButton() {
  const { pending } = useFormStatus();

  return (
    <button
      disabled={pending}
      className="btn-primary self-start"
    >
      {pending ? "添削中…(10〜30秒ほどかかります)" : "添削する"}
    </button>
  );
}

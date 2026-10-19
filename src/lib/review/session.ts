// 1回のテストの問題数
export const SESSION_LENGTH = 10;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type SessionState = {
  // 今から出す問題が何問目か(1始まり)
  q: number;
  // ここまでの正解数
  ok: number;
  // ここまでに間違えたフレーズのID
  ng: string[];
};

export type NextStep =
  | { done: false; state: SessionState }
  | { done: true; ok: number; ng: string[] };

function toInt(value: string | undefined, fallback: number): number {
  const n = Number.parseInt(value ?? "", 10);
  return Number.isFinite(n) ? n : fallback;
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(Math.max(n, min), max);
}

// URL は利用者が書き換えられるため、受け取った値は必ず範囲と形式を確かめる
function parseNg(value: string | undefined): string[] {
  const ids = (value ?? "").split(",").filter((id) => UUID_RE.test(id));
  return Array.from(new Set(ids)).slice(0, SESSION_LENGTH);
}

// q が無ければテスト中ではない(スタート画面)
export function parseSessionState(params: {
  q?: string;
  ok?: string;
  ng?: string;
}): SessionState | null {
  if (params.q === undefined) return null;
  const q = clamp(toInt(params.q, 1), 1, SESSION_LENGTH);
  return {
    q,
    // 回答済みは q-1 問なので、正解数はそれを超えない
    ok: clamp(toInt(params.ok, 0), 0, q - 1),
    ng: parseNg(params.ng),
  };
}

export function parseResult(params: { ok?: string; ng?: string }) {
  return {
    ok: clamp(toInt(params.ok, 0), 0, SESSION_LENGTH),
    ng: parseNg(params.ng),
  };
}

export function toQuery(state: { q?: number; ok: number; ng: string[] }): string {
  const p = new URLSearchParams();
  if (state.q !== undefined) p.set("q", String(state.q));
  p.set("ok", String(state.ok));
  if (state.ng.length > 0) p.set("ng", state.ng.join(","));
  return p.toString();
}

// 1問答えたあとの状態を返す
export function advance(
  state: SessionState,
  phraseId: string,
  isCorrect: boolean
): NextStep {
  const ok = state.ok + (isCorrect ? 1 : 0);
  const ng =
    isCorrect || state.ng.includes(phraseId) ? state.ng : [...state.ng, phraseId];

  if (state.q >= SESSION_LENGTH) return { done: true, ok, ng };
  return { done: false, state: { q: state.q + 1, ok, ng } };
}

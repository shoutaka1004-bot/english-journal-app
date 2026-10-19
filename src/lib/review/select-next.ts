// 1セットのフレーズ数
export const SET_SIZE = 30;
// クリア済みセットから混ぜて出す確率
export const MIX_IN_PROBABILITY = 0.2;

export type PhraseProgress = {
  id: string;
  phrase: string;
  meaning: string;
  createdAt: string;
  lastReviewedAt: string | null;
  // 直近2回の復習がどちらも正解
  isCleared: boolean;
};

export type ReviewPick = {
  phrase: PhraseProgress;
  // 1始まりのセット番号
  setNumber: number;
  // active: 今やるセット / mix-in: クリア済みセットから混ぜた問題 / practice: 全部クリア後の自由練習
  kind: "active" | "mix-in" | "practice";
  // 出題されたフレーズが属するセットの進み具合
  setProgress: { cleared: number; total: number };
};

type IndexedPhrase = PhraseProgress & { setIndex: number };

function compareCreated(a: PhraseProgress, b: PhraseProgress): number {
  if (a.createdAt !== b.createdAt) return a.createdAt < b.createdAt ? -1 : 1;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

// 最後に復習したのが古い順。一度も復習していないものが先頭
function compareLeastRecentlyReviewed(a: PhraseProgress, b: PhraseProgress): number {
  if (a.lastReviewedAt === b.lastReviewedAt) return compareCreated(a, b);
  if (a.lastReviewedAt === null) return -1;
  if (b.lastReviewedAt === null) return 1;
  return a.lastReviewedAt < b.lastReviewedAt ? -1 : 1;
}

export function pickNextPhrase(
  phrases: PhraseProgress[],
  random: () => number = Math.random
): ReviewPick | null {
  if (phrases.length === 0) return null;

  // 作られた順に並べ、SET_SIZE 個ずつセットに区切る
  const indexed: IndexedPhrase[] = [...phrases]
    .sort(compareCreated)
    .map((p, i) => ({ ...p, setIndex: Math.floor(i / SET_SIZE) }));

  const setCount = indexed[indexed.length - 1].setIndex + 1;
  const uncleared = new Set<number>();
  const progressBySet = Array.from({ length: setCount }, () => ({
    cleared: 0,
    total: 0,
  }));
  for (const p of indexed) {
    progressBySet[p.setIndex].total += 1;
    if (p.isCleared) progressBySet[p.setIndex].cleared += 1;
    else uncleared.add(p.setIndex);
  }

  // 今やるセット = クリアしていないセットのうち一番若いもの
  const activeSetIndex = Array.from({ length: setCount }, (_, i) => i).find((i) =>
    uncleared.has(i)
  );

  // 全セットクリア済み: 自由練習としてランダムに出す
  if (activeSetIndex === undefined) {
    const picked = indexed[Math.floor(random() * indexed.length)];
    return {
      phrase: picked,
      setNumber: picked.setIndex + 1,
      kind: "practice",
      setProgress: progressBySet[picked.setIndex],
    };
  }

  // たまに、クリア済みの(今やるセットより前の)セットから混ぜる
  const mixInCandidates = indexed.filter((p) => p.setIndex < activeSetIndex);
  if (mixInCandidates.length > 0 && random() < MIX_IN_PROBABILITY) {
    const picked = mixInCandidates[Math.floor(random() * mixInCandidates.length)];
    return {
      phrase: picked,
      setNumber: picked.setIndex + 1,
      kind: "mix-in",
      setProgress: progressBySet[picked.setIndex],
    };
  }

  const candidates = indexed
    .filter((p) => p.setIndex === activeSetIndex && !p.isCleared)
    .sort(compareLeastRecentlyReviewed);

  return {
    phrase: candidates[0],
    setNumber: activeSetIndex + 1,
    kind: "active",
    setProgress: progressBySet[activeSetIndex],
  };
}

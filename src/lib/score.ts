import type { Strictness } from "../store/useStore";

/** Minuscule, apostrophes unifiées, ponctuation retirée. */
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[’‘`´]/g, "'")
    .replace(/[¿¡!?.,;:«»"“”()\-–—…]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function stripAccents(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

export function words(s: string): string[] {
  return normalize(s).split(" ").filter(Boolean);
}

export function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (!m) return n;
  if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[n];
}

export type WordStatus = "ok" | "close" | "wrong" | "missed";

export interface WordVerdict {
  word: string; // mot attendu (forme d'origine)
  status: WordStatus;
  heard?: string;
}

export interface PronResult {
  score: number;
  verdicts: WordVerdict[];
  extra: string[]; // mots entendus en trop
  passed: boolean;
}

function wordSim(a: string, b: string): "ok" | "close" | "wrong" {
  if (a === b) return "ok";
  const sa = stripAccents(a);
  const sb = stripAccents(b);
  if (sa === sb) return "close";
  const d = levenshtein(sa, sb);
  if (Math.max(sa.length, sb.length) >= 5 && d <= 1) return "close";
  return "wrong";
}

/**
 * Compare la phrase attendue avec ce que la reconnaissance vocale a entendu.
 * Alignement mot à mot (Levenshtein sur les mots) puis score pondéré.
 */
export function scorePronunciation(target: string, heard: string, confidence: number, strictness: Strictness): PronResult {
  const origWords = target.split(/\s+/).filter((w) => normalize(w));
  const t = origWords.map((w) => normalize(w).replace(/\s/g, ""));
  const h = words(heard);
  const m = t.length;
  const n = h.length;

  // Matrice de coût d'alignement
  const cost = (i: number, j: number) => {
    const s = wordSim(t[i], h[j]);
    return s === "ok" ? 0 : s === "close" ? 0.5 : 1;
  };
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost(i - 1, j - 1));

  // Remontée
  const verdicts: WordVerdict[] = [];
  const extra: string[] = [];
  let i = m;
  let j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && dp[i][j] === dp[i - 1][j - 1] + cost(i - 1, j - 1)) {
      const s = wordSim(t[i - 1], h[j - 1]);
      verdicts.unshift({ word: origWords[i - 1], status: s, heard: s === "ok" ? undefined : h[j - 1] });
      i--;
      j--;
    } else if (i > 0 && dp[i][j] === dp[i - 1][j] + 1) {
      verdicts.unshift({ word: origWords[i - 1], status: "missed" });
      i--;
    } else {
      extra.unshift(h[j - 1]);
      j--;
    }
  }

  const closeCredit = strictness === 3 ? 0.25 : strictness === 2 ? 0.5 : 0.75;
  const got = verdicts.reduce((acc, v) => acc + (v.status === "ok" ? 1 : v.status === "close" ? closeCredit : 0), 0);
  let score = m ? (got / m) * 100 : 0;
  score -= extra.length * (strictness === 1 ? 3 : 6);
  // La confiance du moteur reflète la clarté de l'articulation : on la pondère selon la sévérité.
  if (confidence > 0) {
    const weight = strictness === 3 ? 0.35 : strictness === 2 ? 0.25 : 0.15;
    score *= 1 - weight + weight * confidence;
  }
  score = Math.max(0, Math.min(100, Math.round(score)));
  const threshold = strictness === 3 ? 92 : strictness === 2 ? 85 : 75;
  return { score, verdicts, extra, passed: score >= threshold };
}

export type AnswerVerdict = "correct" | "accents" | "close" | "wrong";

/** Vérifie une réponse tapée (exercices / révisions). */
export function checkAnswer(given: string, expected: string[], strictness: Strictness): AnswerVerdict {
  const g = normalize(given);
  if (!g) return "wrong";
  let best: AnswerVerdict = "wrong";
  for (const e of expected) {
    const x = normalize(e);
    if (g === x) return "correct";
    if (stripAccents(g) === stripAccents(x)) best = "accents";
    else if (best === "wrong" && strictness < 3 && levenshtein(g, x) <= Math.max(1, Math.floor(x.length / 12)))
      best = "close";
  }
  return best;
}

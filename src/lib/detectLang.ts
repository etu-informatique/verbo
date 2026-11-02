import type { LangCode } from "./languages";

// Détection de langue très simple par mots-outils (suffisant pour fr / en / es / it).
const STOPWORDS: Record<LangCode, string[]> = {
  en: ["the", "and", "you", "is", "are", "what", "to", "of", "it", "in", "that", "do", "have", "with", "your", "for", "was", "how", "i"],
  fr: ["le", "la", "les", "et", "est", "tu", "vous", "de", "des", "que", "qui", "un", "une", "pour", "pas", "ce", "je", "ton", "avec"],
  es: ["el", "la", "los", "las", "y", "es", "tu", "que", "de", "un", "una", "para", "con", "qué", "cómo", "por", "lo", "yo", "muy"],
  it: ["il", "lo", "la", "gli", "e", "è", "tu", "che", "di", "un", "una", "per", "con", "non", "come", "sei", "del", "io", "molto"],
};

export function detectLang(text: string): LangCode | null {
  const words = text.toLowerCase().match(/[\p{L}']+/gu) ?? [];
  if (words.length < 3) return null;
  let best: LangCode | null = null;
  let bestScore = 0;
  for (const lang of Object.keys(STOPWORDS) as LangCode[]) {
    const set = new Set(STOPWORDS[lang]);
    const score = words.filter((w) => set.has(w)).length;
    if (score > bestScore) {
      best = lang;
      bestScore = score;
    }
  }
  return bestScore >= 2 ? best : null;
}

/** Si le modèle a inversé la réponse et sa traduction, on les remet dans le bon ordre. */
export function fixReplyLanguage<T extends { reply: string; replyTranslation: string }>(res: T, target: LangCode, native: LangCode): T {
  const r = detectLang(res.reply);
  const t = detectLang(res.replyTranslation);
  if (r === native && t === target) return { ...res, reply: res.replyTranslation, replyTranslation: res.reply };
  return res;
}

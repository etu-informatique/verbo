export type LangCode = "fr" | "en" | "it" | "es";

export interface LangInfo {
  code: LangCode;
  name: string; // nom en français
  native: string; // nom dans la langue
  flag: string;
  speech: string; // code BCP-47 pour la synthèse / reconnaissance vocale
  accent: string; // couleur d'accent
}

export const LANGS: Record<LangCode, LangInfo> = {
  en: { code: "en", name: "Anglais", native: "English", flag: "🇬🇧", speech: "en-US", accent: "#60a5fa" },
  es: { code: "es", name: "Espagnol", native: "Español", flag: "🇪🇸", speech: "es-ES", accent: "#f59e0b" },
  it: { code: "it", name: "Italien", native: "Italiano", flag: "🇮🇹", speech: "it-IT", accent: "#34d399" },
  fr: { code: "fr", name: "Français", native: "Français", flag: "🇫🇷", speech: "fr-FR", accent: "#a78bfa" },
};

export const LANG_LIST = Object.values(LANGS);

export const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;
export type Level = (typeof LEVELS)[number];

export const LEVEL_LABELS: Record<Level, string> = {
  A1: "Débutant",
  A2: "Élémentaire",
  B1: "Intermédiaire",
  B2: "Intermédiaire avancé",
  C1: "Avancé",
  C2: "Maîtrise",
};

/** Nom anglais de la langue, utilisé dans les prompts envoyés au modèle. */
export const LANG_EN_NAME: Record<LangCode, string> = {
  en: "English",
  es: "Spanish",
  it: "Italian",
  fr: "French",
};

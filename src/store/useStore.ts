import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { LangCode, Level } from "../lib/languages";
import type { Engine } from "../lib/ai";
import { newSrs, schedule, type Grade, type SrsState } from "../lib/srs";

export type Strictness = 1 | 2 | 3;

export interface Settings {
  engine: Engine;
  localModel: string;
  localDownloaded: string[]; // modèles locaux déjà téléchargés sur cet appareil
  puterConnected: boolean;
  theme: "auto" | "light" | "dark";
  target: LangCode;
  native: LangCode;
  level: Level;
  strictness: Strictness;
  dailyGoal: number;
  speechRate: number;
  voices: Partial<Record<LangCode, string>>; // voiceURI choisie par langue
  autoSpeak: boolean;
  onboarded: boolean;
}

export type CardSource = "traduction" | "coach" | "argot" | "exercice" | "manuel" | "prononciation";

export interface Card extends SrsState {
  id: string;
  lang: LangCode;
  front: string; // côté langue cible
  back: string; // traduction / correction
  note?: string;
  source: CardSource;
  created: number;
}

export interface ErrorItem {
  wrong: string;
  right: string;
  type: string; // grammaire, vocabulaire, orthographe...
  explanation: string;
}

export interface Correction {
  isCorrect: boolean;
  score: number; // 0-100
  corrected: string;
  natural: string; // version naturelle / native
  errors: ErrorItem[];
  tip: string;
}

export interface ChatMsg {
  id: string;
  role: "user" | "assistant";
  text: string;
  translation?: string;
  correction?: Correction;
  at: number;
}

export type ChatMode = "libre" | "debat" | "role" | "examen" | "prof";

export interface Conversation {
  id: string;
  lang: LangCode;
  mode: ChatMode;
  topic: string;
  title: string;
  messages: ChatMsg[];
  created: number;
}

export interface Mistake extends ErrorItem {
  id: string;
  lang: LangCode;
  sentence: string;
  at: number;
}

export interface Progress {
  xp: number;
  xpByDay: Record<string, number>;
  streak: number;
  bestStreak: number;
  lastActiveDay: string | null;
  stats: { messages: number; translations: number; pronunciations: number; reviews: number; exercises: number };
  pronBest: Record<string, number>; // phrase -> meilleur score
  knownSlang: string[];
}

export type StatKey = keyof Progress["stats"];

interface State {
  settings: Settings;
  progress: Progress;
  cards: Card[];
  mistakes: Mistake[];
  chats: Conversation[];

  updateSettings: (p: Partial<Settings>) => void;
  addXp: (amount: number, stat?: StatKey) => void;
  addCard: (c: Omit<Card, keyof SrsState | "id" | "created" | "lang"> & { lang?: LangCode }) => boolean;
  reviewCard: (id: string, grade: Grade) => void;
  deleteCard: (id: string) => void;
  addMistakes: (sentence: string, errors: ErrorItem[]) => void;
  deleteMistake: (id: string) => void;
  upsertChat: (c: Conversation) => void;
  deleteChat: (id: string) => void;
  setPronScore: (phrase: string, score: number) => void;
  toggleSlang: (id: string) => void;
  importData: (json: string) => void;
  resetAll: () => void;
}

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

export function dayKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function yesterdayKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return dayKey(d);
}

const defaultSettings: Settings = {
  engine: "auto",
  localModel: "Qwen3-1.7B-q4f16_1-MLC",
  localDownloaded: [],
  puterConnected: false,
  theme: "auto",
  target: "en",
  native: "fr",
  level: "B1",
  strictness: 2,
  dailyGoal: 50,
  speechRate: 1,
  voices: {},
  autoSpeak: false,
  onboarded: false,
};

const defaultProgress: Progress = {
  xp: 0,
  xpByDay: {},
  streak: 0,
  bestStreak: 0,
  lastActiveDay: null,
  stats: { messages: 0, translations: 0, pronunciations: 0, reviews: 0, exercises: 0 },
  pronBest: {},
  knownSlang: [],
};

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      settings: defaultSettings,
      progress: defaultProgress,
      cards: [],
      mistakes: [],
      chats: [],

      updateSettings: (p) => set((s) => ({ settings: { ...s.settings, ...p } })),

      addXp: (amount, stat) =>
        set((s) => {
          const today = dayKey();
          const p = s.progress;
          let streak = p.streak;
          if (p.lastActiveDay !== today) streak = p.lastActiveDay === yesterdayKey() ? streak + 1 : 1;
          const stats = stat ? { ...p.stats, [stat]: p.stats[stat] + 1 } : p.stats;
          return {
            progress: {
              ...p,
              xp: p.xp + amount,
              xpByDay: { ...p.xpByDay, [today]: (p.xpByDay[today] ?? 0) + amount },
              streak,
              bestStreak: Math.max(p.bestStreak, streak),
              lastActiveDay: today,
              stats,
            },
          };
        }),

      addCard: (c) => {
        const lang = c.lang ?? get().settings.target;
        const exists = get().cards.some(
          (x) => x.lang === lang && x.front.trim().toLowerCase() === c.front.trim().toLowerCase()
        );
        if (exists) return false;
        const card: Card = { ...newSrs(), ...c, lang, id: uid(), created: Date.now() };
        set((s) => ({ cards: [card, ...s.cards] }));
        return true;
      },

      reviewCard: (id, grade) =>
        set((s) => ({
          cards: s.cards.map((c) => (c.id === id ? { ...c, ...schedule(c, grade) } : c)),
        })),

      deleteCard: (id) => set((s) => ({ cards: s.cards.filter((c) => c.id !== id) })),

      addMistakes: (sentence, errors) =>
        set((s) => ({
          mistakes: [
            ...errors.map((e) => ({ ...e, id: uid(), lang: s.settings.target, sentence, at: Date.now() })),
            ...s.mistakes,
          ].slice(0, 500),
        })),

      deleteMistake: (id) => set((s) => ({ mistakes: s.mistakes.filter((m) => m.id !== id) })),

      upsertChat: (c) =>
        set((s) => {
          const i = s.chats.findIndex((x) => x.id === c.id);
          if (i === -1) return { chats: [c, ...s.chats].slice(0, 60) };
          const chats = [...s.chats];
          chats[i] = c;
          return { chats };
        }),

      deleteChat: (id) => set((s) => ({ chats: s.chats.filter((c) => c.id !== id) })),

      setPronScore: (phrase, score) =>
        set((s) => ({
          progress: {
            ...s.progress,
            pronBest: { ...s.progress.pronBest, [phrase]: Math.max(score, s.progress.pronBest[phrase] ?? 0) },
          },
        })),

      toggleSlang: (id) =>
        set((s) => {
          const known = s.progress.knownSlang.includes(id)
            ? s.progress.knownSlang.filter((x) => x !== id)
            : [...s.progress.knownSlang, id];
          return { progress: { ...s.progress, knownSlang: known } };
        }),

      importData: (json) => {
        const data = JSON.parse(json);
        if (!data || typeof data !== "object" || !data.settings) throw new Error("Fichier invalide");
        set({
          settings: { ...defaultSettings, ...data.settings, onboarded: true },
          progress: { ...defaultProgress, ...data.progress },
          cards: data.cards ?? [],
          mistakes: data.mistakes ?? [],
          chats: data.chats ?? [],
        });
      },

      resetAll: () =>
        set(() => ({
          settings: { ...defaultSettings, onboarded: true },
          progress: defaultProgress,
          cards: [],
          mistakes: [],
          chats: [],
        })),
    }),
    {
      name: "verbo-store",
      version: 3,
      // v1 → v3 : plus de clé API, moteur d'IA gratuit « auto » par défaut
      migrate: (persisted) => {
        const st = persisted as { settings?: Record<string, unknown> };
        if (st?.settings) {
          delete st.settings.apiKey;
          delete st.settings.model;
          if (!["auto", "cloud", "local", "puter"].includes(String(st.settings.engine))) st.settings.engine = "auto";
        }
        return st as unknown as State;
      },
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<State>;
        return { ...current, ...p, settings: { ...current.settings, ...p.settings }, progress: { ...current.progress, ...p.progress } };
      },
    }
  )
);

/** Série affichée : retombe à 0 si on a sauté un jour. */
export function currentStreak(p: Progress): number {
  if (!p.lastActiveDay) return 0;
  if (p.lastActiveDay === dayKey() || p.lastActiveDay === yesterdayKey()) return p.streak;
  return 0;
}

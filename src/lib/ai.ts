// Moteurs d'IA 100 % gratuits, sans clé API :
// - « cloud » : API publique LLM7.io, sans compte (petit quota quotidien par appareil).
// - « local » : modèle qui tourne dans le navigateur (WebLLM) — illimité, privé, téléchargé une fois.
// - « puter » : Puter.js, gratuit avec un compte Puter (connexion en un clic).
// - « auto »  : local si déjà téléchargé, sinon cloud, puis Puter si le quota cloud est épuisé.
import { useStore } from "../store/useStore";

export type Effort = "low" | "medium" | "high";
export type Engine = "auto" | "cloud" | "local" | "puter";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface AskOptions {
  system: string;
  messages: ChatMessage[];
  schema: Record<string, unknown>;
  effort?: Effort;
  signal?: AbortSignal;
}

export class AiError extends Error {}
/** Le quota gratuit du cloud est épuisé : l'interface propose l'IA locale ou Puter. */
export class QuotaError extends AiError {}

const CLOUD_URL = "https://api.llm7.io/v1/chat/completions";
const CLOUD_MODELS = ["DeepSeek-V4-Flash-0731", "default"];
const PUTER_SCRIPT = "https://js.puter.com/v2/";
const PUTER_MODEL = "gpt-5.4-nano";
const TIMEOUT_MS = 90_000;

function jsonInstructions(schema: Record<string, unknown>): string {
  return `\n\nOUTPUT FORMAT: reply with ONE valid JSON object and nothing else (no markdown, no code fence). It must match this JSON Schema exactly, with every field present:\n${JSON.stringify(schema)}`;
}

/** Extrait l'objet JSON d'une réponse de modèle (tolère les ``` et le texte autour). */
function extractJson(text: string): unknown {
  const cleaned = text.replace(/<think>[\s\S]*?<\/think>/g, "").replace(/```(?:json)?/gi, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start !== -1 && end > start) return JSON.parse(cleaned.slice(start, end + 1));
    throw new AiError("Réponse illisible de l'IA. Réessaie.");
  }
}

/** Complète les champs manquants pour respecter le schéma (les petits modèles en oublient parfois). */
function coerce(schema: Record<string, unknown>, value: unknown): unknown {
  switch (schema.type) {
    case "object": {
      const props = (schema.properties ?? {}) as Record<string, Record<string, unknown>>;
      const src = value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
      return Object.fromEntries(Object.entries(props).map(([k, s]) => [k, coerce(s, src[k])]));
    }
    case "array":
      return Array.isArray(value) ? value.map((v) => coerce(schema.items as Record<string, unknown>, v)) : [];
    case "string": {
      const enumValues = schema.enum as string[] | undefined;
      const s = typeof value === "string" ? value : value == null ? "" : String(value);
      return enumValues && !enumValues.includes(s) ? enumValues[0] : s;
    }
    case "integer":
    case "number": {
      const n = typeof value === "number" ? value : Number(value);
      return Number.isFinite(n) ? Math.round(n) : 0;
    }
    case "boolean":
      return value === true || value === "true";
    default:
      return value;
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ───────────── Cloud gratuit (LLM7.io, sans compte) ─────────────

async function askCloud(system: string, messages: ChatMessage[], schema: Record<string, unknown>, signal?: AbortSignal): Promise<string> {
  let lastError: unknown;
  for (const model of CLOUD_MODELS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
      const onAbort = () => ctrl.abort();
      signal?.addEventListener("abort", onAbort);
      try {
        const res = await fetch(CLOUD_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: ctrl.signal,
          body: JSON.stringify({
            model,
            messages: [{ role: "system", content: system }, ...messages.slice(-20)],
            response_format: { type: "json_schema", json_schema: { name: "answer", strict: true, schema } },
          }),
        });
        if (res.ok) {
          const data = await res.json();
          const content = data?.choices?.[0]?.message?.content;
          if (typeof content === "string" && content.trim()) return content;
          lastError = new AiError("Réponse vide de l'IA.");
          continue;
        }
        const body = await res.json().catch(() => ({}));
        const code: string = body?.error?.code ?? "";
        if (code === "quota_exceeded" || code === "insufficient_quota")
          throw new QuotaError("Le quota gratuit du jour (IA en ligne sans compte) est atteint.");
        if (res.status === 401 || res.status === 404) break; // modèle indisponible sans compte → modèle suivant
        lastError = new AiError(res.status === 429 ? "Le service gratuit est saturé. Réessaie dans quelques secondes." : `Le service d'IA a répondu ${res.status}.`);
        await sleep(2000 * (attempt + 1));
      } catch (e) {
        if (e instanceof QuotaError || signal?.aborted) throw e;
        lastError = ctrl.signal.aborted ? new AiError("L'IA met trop de temps à répondre. Réessaie.") : e;
      } finally {
        clearTimeout(timer);
        signal?.removeEventListener("abort", onAbort);
      }
    }
  }
  throw lastError instanceof Error ? lastError : new AiError("Service d'IA injoignable.");
}

// ───────────── Puter.js (chargé à la demande) ─────────────

interface PuterGlobal {
  ai: { chat: (messages: unknown, options: Record<string, unknown>) => Promise<unknown> };
}

let puterLoading: Promise<PuterGlobal> | null = null;

function loadPuter(): Promise<PuterGlobal> {
  const w = window as unknown as { puter?: PuterGlobal };
  if (w.puter) return Promise.resolve(w.puter);
  puterLoading ??= new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = PUTER_SCRIPT;
    s.onload = () => (w.puter ? resolve(w.puter) : reject(new AiError("Puter n'a pas pu se charger.")));
    s.onerror = () => {
      puterLoading = null;
      reject(new AiError("Impossible de charger Puter. Vérifie ta connexion."));
    };
    document.head.appendChild(s);
  });
  return puterLoading;
}

function puterText(res: unknown): string {
  if (typeof res === "string") return res;
  const msg = (res as { message?: { content?: unknown } })?.message?.content;
  if (typeof msg === "string") return msg;
  if (Array.isArray(msg)) return msg.map((p) => (typeof p === "string" ? p : ((p as { text?: string }).text ?? ""))).join("");
  const text = (res as { text?: string })?.text;
  return typeof text === "string" ? text : String(res ?? "");
}

async function askPuter(system: string, messages: ChatMessage[], schema: Record<string, unknown>): Promise<string> {
  const puter = await loadPuter();
  const res = await puter.ai.chat([{ role: "system", content: system }, ...messages], {
    model: PUTER_MODEL,
    outputFormat: { type: "json_schema", name: "answer", strict: true, schema },
  });
  useStore.getState().updateSettings({ puterConnected: true });
  return puterText(res);
}

// ───────────── Point d'entrée ─────────────

async function askLocalEngine(system: string, messages: ChatMessage[], schema: Record<string, unknown>): Promise<string> {
  const { askLocal } = await import("./localAi");
  return askLocal(useStore.getState().settings.localModel, system, messages, schema);
}

function pickAuto(): "local" | "cloud" {
  const { localModel, localDownloaded } = useStore.getState().settings;
  return localDownloaded.includes(localModel) ? "local" : "cloud";
}

/** Appel IA qui renvoie un objet JSON conforme au schéma. */
export async function askJson<T>({ system, messages, schema, signal }: AskOptions): Promise<T> {
  const { engine, puterConnected } = useStore.getState().settings;
  const sys = system + jsonInstructions(schema);
  let text: string;

  if (engine === "local") text = await askLocalEngine(sys, messages, schema);
  else if (engine === "puter") text = await askPuter(sys, messages, schema);
  else if (engine === "cloud") text = await askCloud(sys, messages, schema, signal);
  else {
    // Auto
    if (pickAuto() === "local") text = await askLocalEngine(sys, messages, schema);
    else {
      try {
        text = await askCloud(sys, messages, schema, signal);
      } catch (e) {
        if (!puterConnected) throw e;
        text = await askPuter(sys, messages, schema);
      }
    }
  }
  return coerce(schema, extractJson(text)) as T;
}

/** Message d'erreur lisible (en français). */
export function friendlyError(e: unknown): string {
  if (e instanceof QuotaError)
    return "Le quota gratuit du jour de l'IA en ligne est atteint. Continue gratuitement et sans limite :";
  if (e instanceof DOMException && e.name === "AbortError") return "Requête annulée.";
  if (e instanceof TypeError) return "Impossible de joindre le service d'IA. Vérifie ta connexion internet.";
  if (e instanceof SyntaxError) return "Réponse illisible de l'IA. Réessaie.";
  if (e instanceof Error) return e.message;
  if (e && typeof e === "object" && "error" in e) {
    const msg = (e as { error?: { message?: string } }).error?.message;
    if (msg && /cancel/i.test(msg)) return "Connexion à Puter annulée. Connecte-toi (compte gratuit) pour utiliser ce moteur, ou choisis-en un autre dans Réglages.";
    if (msg) return `Puter : ${msg}`;
  }
  return "Erreur inconnue. Réessaie.";
}

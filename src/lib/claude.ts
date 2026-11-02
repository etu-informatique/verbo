import Anthropic from "@anthropic-ai/sdk";
import type { BetaMessageParam } from "@anthropic-ai/sdk/resources/beta/messages/messages";
import { useStore } from "../store/useStore";

export type Effort = "low" | "medium" | "high";

export class NoKeyError extends Error {
  constructor() {
    super("Ajoute ta clé API Claude dans Réglages pour utiliser les fonctions IA.");
  }
}

let cached: { key: string; client: Anthropic } | null = null;

function getClient(): Anthropic {
  const key = useStore.getState().settings.apiKey.trim();
  if (!key) throw new NoKeyError();
  if (!cached || cached.key !== key) {
    // L'app tourne 100 % dans le navigateur : la clé reste dans le localStorage de l'utilisateur
    // et n'est envoyée qu'à api.anthropic.com.
    cached = { key, client: new Anthropic({ apiKey: key, dangerouslyAllowBrowser: true }) };
  }
  return cached.client;
}

export { obj, str, num, bool, arr } from "./schema";

interface AskOptions {
  system: string;
  messages: BetaMessageParam[];
  schema: Record<string, unknown>;
  effort?: Effort;
  signal?: AbortSignal;
}

/** Appel Claude qui renvoie un objet JSON conforme au schéma (structured outputs). */
export async function askJson<T>({ system, messages, schema, effort = "low", signal }: AskOptions): Promise<T> {
  const client = getClient();
  const model = useStore.getState().settings.model;
  // Repli automatique côté serveur si le modèle décline une requête (non disponible sur Haiku).
  const fallback =
    model === "claude-haiku-5-5"
      ? {}
      : { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const };

  const res = await client.beta.messages.create(
    {
      model,
      max_tokens: 16000,
      system,
      messages,
      output_config: { effort, format: { type: "json_schema", schema } },
      ...fallback,
    },
    { signal }
  );

  if (res.stop_reason === "refusal") throw new Error("Le modèle a refusé de répondre à cette demande.");
  if (res.stop_reason === "max_tokens") throw new Error("Réponse trop longue, coupée. Réessaie avec un texte plus court.");

  const text = res.content
    .filter((b): b is Extract<typeof b, { type: "text" }> => b.type === "text")
    .map((b) => b.text)
    .join("");
  return JSON.parse(text) as T;
}

/** Transforme une erreur API en message lisible (en français). */
export function friendlyError(e: unknown): string {
  if (e instanceof NoKeyError) return e.message;
  if (e instanceof Anthropic.AuthenticationError) return "Clé API invalide. Vérifie-la dans Réglages.";
  if (e instanceof Anthropic.PermissionDeniedError) return "Cette clé n'a pas accès à ce modèle. Change de modèle dans Réglages.";
  if (e instanceof Anthropic.RateLimitError) return "Trop de requêtes d'un coup. Attends quelques secondes et réessaie.";
  if (e instanceof Anthropic.BadRequestError) {
    if (/credit|billing/i.test(e.message)) return "Crédit API épuisé sur ton compte Anthropic.";
    return "Requête refusée par l'API : " + e.message;
  }
  if (e instanceof Anthropic.InternalServerError) return "L'API Claude est surchargée. Réessaie dans un instant.";
  if (e instanceof Anthropic.APIConnectionError) return "Impossible de joindre l'API. Vérifie ta connexion internet.";
  if (e instanceof Anthropic.APIUserAbortError) return "Requête annulée.";
  if (e instanceof SyntaxError) return "Réponse illisible du modèle. Réessaie.";
  if (e instanceof Error) return e.message;
  return "Erreur inconnue.";
}

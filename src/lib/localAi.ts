// IA locale : un modèle tourne directement dans le navigateur (WebGPU).
// Gratuit, illimité, sans compte, et rien ne sort de l'appareil.
import { create } from "zustand";
import type { WebWorkerMLCEngine } from "@mlc-ai/web-llm";
import type { ChatMessage } from "./ai";
import { useStore } from "../store/useStore";

export interface LocalModel {
  id: string;
  name: string;
  size: string;
  desc: string;
}

export const LOCAL_MODELS: LocalModel[] = [
  { id: "Qwen3-1.7B-q4f16_1-MLC", name: "Léger", size: "≈ 1 Go", desc: "Pour téléphone ou petit PC. Corrections basiques, réponse en 20 à 40 s." },
  { id: "Qwen3-4B-q4f16_1-MLC", name: "Précis", size: "≈ 2,3 Go", desc: "Pour PC avec une carte graphique. Corrections bien plus fiables." },
];

export const webgpuSupported = typeof navigator !== "undefined" && "gpu" in navigator;

type Status = "idle" | "loading" | "ready" | "error";

interface LocalState {
  status: Status;
  progress: number; // 0..1
  text: string;
  model: string | null;
  error: string | null;
}

export const useLocalAi = create<LocalState>(() => ({ status: "idle", progress: 0, text: "", model: null, error: null }));

let engine: WebWorkerMLCEngine | null = null;
let loading: Promise<WebWorkerMLCEngine> | null = null;

function markDownloaded(modelId: string, on: boolean) {
  const { settings, updateSettings } = useStore.getState();
  const list = settings.localDownloaded.filter((id) => id !== modelId);
  updateSettings({ localDownloaded: on ? [...list, modelId] : list });
}

export async function deleteModel(modelId: string) {
  const { deleteModelAllInfoInCache } = await import("@mlc-ai/web-llm");
  if (useLocalAi.getState().model === modelId) {
    await engine?.unload();
    engine = null;
    useLocalAi.setState({ status: "idle", model: null, progress: 0 });
  }
  await deleteModelAllInfoInCache(modelId);
  markDownloaded(modelId, false);
}

/** Télécharge (la 1re fois) puis charge le modèle en mémoire. */
export function loadModel(modelId: string): Promise<WebWorkerMLCEngine> {
  const st = useLocalAi.getState();
  if (engine && st.model === modelId && st.status === "ready") return Promise.resolve(engine);
  if (loading && st.model === modelId) return loading;
  if (!webgpuSupported) return Promise.reject(new Error("Ton navigateur ne gère pas WebGPU : l'IA locale est impossible ici. Utilise Chrome ou Edge récent."));

  useLocalAi.setState({ status: "loading", progress: 0, text: "Préparation…", model: modelId, error: null });
  loading = (async () => {
    try {
      const { CreateWebWorkerMLCEngine } = await import("@mlc-ai/web-llm");
      await engine?.unload().catch(() => {});
      const worker = new Worker(new URL("./local.worker.ts", import.meta.url), { type: "module" });
      const workerFailed = new Promise<never>((_, reject) =>
        worker.addEventListener("error", () => reject(new Error("le module d'IA n'a pas pu démarrer")), { once: true })
      );
      engine = await Promise.race([
        CreateWebWorkerMLCEngine(worker, modelId, {
          initProgressCallback: (r) => useLocalAi.setState({ progress: r.progress, text: r.text }),
        }),
        workerFailed,
      ]);
      useLocalAi.setState({ status: "ready", progress: 1, text: "Prêt" });
      markDownloaded(modelId, true);
      return engine;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      useLocalAi.setState({ status: "error", error: msg });
      engine = null;
      throw new Error(`Impossible de charger l'IA locale : ${msg}`);
    } finally {
      loading = null;
    }
  })();
  return loading;
}

export async function askLocal(modelId: string, system: string, messages: ChatMessage[], schema: Record<string, unknown>): Promise<string> {
  const eng = await loadModel(modelId);
  const res = await eng.chat.completions.create({
    // Les petits modèles ont une mémoire courte : on garde la fin de la conversation.
    messages: [{ role: "system", content: system }, ...messages.slice(-10)],
    temperature: 0.4,
    max_tokens: 1500,
    response_format: { type: "json_object", schema: JSON.stringify(schema) },
    extra_body: { enable_thinking: false },
  });
  return res.choices[0]?.message?.content ?? "";
}

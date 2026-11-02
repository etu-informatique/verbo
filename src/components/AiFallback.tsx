import { Cloud, HardDriveDownload } from "lucide-react";
import { loadModel, LOCAL_MODELS, useLocalAi, webgpuSupported } from "../lib/localAi";
import { useStore } from "../store/useStore";
import { Button, toast } from "./ui";

/** Proposé quand le quota de l'IA en ligne est épuisé : passer à l'IA locale ou à Puter, puis relancer. */
export function AiFallback({ onRetry }: { onRetry?: () => void }) {
  const { settings, updateSettings } = useStore();
  const local = useLocalAi();
  const model = LOCAL_MODELS.find((m) => m.id === settings.localModel) ?? LOCAL_MODELS[0];
  const loading = local.status === "loading";

  const enableLocal = async () => {
    try {
      await loadModel(model.id);
      updateSettings({ engine: "auto" });
      toast("IA locale prête : gratuite et illimitée");
      onRetry?.();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Échec du téléchargement", "bad");
    }
  };

  return (
    <div className="mt-3 space-y-2">
      {webgpuSupported && (
        <div className="rounded-lg border border-line bg-panel p-3">
          <div className="flex flex-wrap items-center gap-3">
            <HardDriveDownload className="size-5 shrink-0 text-brand" aria-hidden />
            <p className="min-w-40 flex-1 text-sm">
              <span className="font-semibold">IA sur ton appareil</span> — illimitée, sans compte. Téléchargement unique {model.size}.
            </p>
            <Button size="sm" variant="primary" loading={loading} onClick={enableLocal}>
              Activer
            </Button>
          </div>
          {loading && (
            <div className="mt-2">
              <div className="h-2 overflow-hidden rounded-full bg-sunk" role="progressbar" aria-valuenow={Math.round(local.progress * 100)} aria-valuemin={0} aria-valuemax={100}>
                <div className="h-full rounded-full bg-brand transition-[width] duration-300" style={{ width: `${local.progress * 100}%` }} />
              </div>
              <p className="mt-1 text-xs text-faint">{Math.round(local.progress * 100)} % — garde cette page ouverte.</p>
            </div>
          )}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-line bg-panel p-3">
        <Cloud className="size-5 shrink-0 text-brand" aria-hidden />
        <p className="min-w-40 flex-1 text-sm">
          <span className="font-semibold">Puter</span> — gratuit avec un compte Puter, rapide sur tous les téléphones.
        </p>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            updateSettings({ engine: "puter" });
            onRetry?.();
          }}
        >
          Se connecter
        </Button>
      </div>
    </div>
  );
}

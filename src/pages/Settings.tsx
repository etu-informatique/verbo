import { useRef, useState } from "react";
import clsx from "clsx";
import { AlertTriangle, Check, Cpu, Download, Flame, Gauge, HardDriveDownload, Monitor, Moon, ShieldAlert, ShieldCheck, Sun, Trash2, Upload } from "lucide-react";
import { askJson, friendlyError, type Engine } from "../lib/ai";
import { obj, str } from "../lib/schema";
import { STRICTNESS_LABELS } from "../lib/prompts";
import { LANG_LIST, LANGS, LEVEL_LABELS, LEVELS, type LangCode, type Level } from "../lib/languages";
import { speak, useVoices } from "../lib/speech";
import { useStore, type Settings, type Strictness } from "../store/useStore";
import { Button, Card, PageHeader, toast } from "../components/ui";
import { deleteModel, loadModel, LOCAL_MODELS, useLocalAi, webgpuSupported } from "../lib/localAi";

const ENGINES: { id: Engine; name: string; desc: string }[] = [
  { id: "auto", name: "Automatique (recommandé)", desc: "IA locale si elle est téléchargée, sinon IA en ligne sans compte, puis Puter si tu l'as connecté." },
  { id: "cloud", name: "En ligne, sans compte", desc: "Rien à installer. Quota gratuit limité chaque jour." },
  { id: "local", name: "Sur l'appareil", desc: "Illimité et privé. Téléchargement unique du modèle (WebGPU requis)." },
  { id: "puter", name: "Puter", desc: "Compte Puter gratuit (connexion au premier message). Rapide sur tous les téléphones." },
];

function LocalAiPanel() {
  const { settings, updateSettings } = useStore();
  const local = useLocalAi();
  const cached = Object.fromEntries(settings.localDownloaded.map((id) => [id, true]));

  if (!webgpuSupported)
    return (
      <p className="flex gap-2 rounded-xl bg-warn/10 p-3 text-sm">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warn" aria-hidden />
        Ce navigateur ne gère pas WebGPU : l'IA locale n'est pas disponible ici. Utilise Chrome ou Edge récent (PC ou Android).
      </p>
    );

  const loadingThis = (id: string) => local.status === "loading" && local.model === id;

  return (
    <div className="space-y-2">
      {LOCAL_MODELS.map((m) => {
        const active = settings.localModel === m.id;
        const ready = local.status === "ready" && local.model === m.id;
        return (
          <div key={m.id} className={clsx("rounded-xl border-2 p-3", active ? "border-brand bg-brand-soft" : "border-line")}>
            <div className="flex flex-wrap items-center gap-3">
              <Cpu className="size-5 shrink-0 text-brand" aria-hidden />
              <div className="min-w-48 flex-1">
                <p className="text-sm font-semibold">
                  {m.name} <span className="font-normal text-faint">· {m.size}</span>
                </p>
                <p className="text-sm text-muted">{m.desc}</p>
              </div>
              {cached[m.id] || ready ? (
                <div className="flex items-center gap-1">
                  {!active && (
                    <Button size="sm" variant="outline" onClick={() => updateSettings({ localModel: m.id })}>
                      Utiliser
                    </Button>
                  )}
                  {active && <span className="text-sm font-semibold text-ok">{ready ? "Chargé" : "Téléchargé"}</span>}
                  <button
                    onClick={async () => {
                      await deleteModel(m.id);
                      toast("Modèle supprimé de l'appareil");
                    }}
                    aria-label={`Supprimer le modèle ${m.name}`}
                    className="flex size-9 items-center justify-center rounded-lg text-faint hover:bg-sunk hover:text-bad"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="primary"
                  loading={loadingThis(m.id)}
                  disabled={local.status === "loading"}
                  onClick={() => {
                    updateSettings({ localModel: m.id });
                    loadModel(m.id)
                      .then(() => toast("IA locale prête : gratuite et illimitée"))
                      .catch((e) => toast(e instanceof Error ? e.message : "Échec du téléchargement", "bad"));
                  }}
                >
                  <HardDriveDownload className="size-4" aria-hidden /> Télécharger
                </Button>
              )}
            </div>
            {loadingThis(m.id) && (
              <div className="mt-3 min-w-0">
                <div className="h-2 overflow-hidden rounded-full bg-sunk" role="progressbar" aria-valuenow={Math.round(local.progress * 100)} aria-valuemin={0} aria-valuemax={100}>
                  <div className="h-full rounded-full bg-brand transition-[width] duration-300" style={{ width: `${local.progress * 100}%` }} />
                </div>
                <p className="mt-1 truncate text-xs text-faint">{Math.round(local.progress * 100)} % · {local.text}</p>
              </div>
            )}
          </div>
        );
      })}
      {local.status === "error" && local.error && <p className="text-sm text-bad">{local.error}</p>}
      <p className="text-xs text-faint">Le modèle est stocké dans ton navigateur : télécharge-le de préférence en Wi-Fi.</p>
    </div>
  );
}

const THEMES: { id: Settings["theme"]; name: string; icon: typeof Sun }[] = [
  { id: "auto", name: "Auto", icon: Monitor },
  { id: "light", name: "Clair", icon: Sun },
  { id: "dark", name: "Sombre", icon: Moon },
];

const STRICT_ICONS = { 1: Gauge, 2: ShieldAlert, 3: Flame } as const;

function Row({ label, hint, htmlFor, children }: { label: string; hint?: string; htmlFor?: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-3 py-4 xl:grid-cols-[200px_1fr] xl:gap-6">
      <div>
        <label htmlFor={htmlFor} className="text-sm font-semibold">
          {label}
        </label>
        {hint && <p className="mt-0.5 text-sm text-faint">{hint}</p>}
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function Option({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={clsx(
        "flex min-h-11 items-start gap-3 rounded-xl border-2 p-3 text-left transition-colors duration-150",
        active ? "border-brand bg-brand-soft" : "border-line bg-panel hover:border-line2"
      )}
    >
      {children}
    </button>
  );
}

export default function SettingsPage() {
  const store = useStore();
  const { settings, updateSettings } = store;
  const [testing, setTesting] = useState(false);
  const voices = useVoices(settings.target);
  const fileRef = useRef<HTMLInputElement>(null);

  const testEngine = async () => {
    setTesting(true);
    try {
      const r = await askJson<{ greeting: string }>({
        system: "You are a friendly assistant.",
        messages: [{ role: "user", content: "Say hello in French in 3 words. Put it in the field greeting." }],
        schema: obj({ greeting: str() }),
      });
      toast(`Ça marche : « ${r.greeting} »`);
    } catch (e) {
      toast(friendlyError(e), "bad");
    } finally {
      setTesting(false);
    }
  };

  const exportData = () => {
    const { settings: s, progress, cards, mistakes, chats } = useStore.getState();
    const data = { settings: s, progress, cards, mistakes, chats, exportedAt: new Date().toISOString() };
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `verbo-sauvegarde-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = async (f: File) => {
    try {
      store.importData(await f.text());
      toast("Sauvegarde importée");
    } catch {
      toast("Fichier de sauvegarde invalide", "bad");
    }
  };

  const setLang = (key: "native" | "target", code: LangCode) => {
    const other = key === "native" ? "target" : "native";
    updateSettings(code === settings[other] ? { [key]: code, [other]: settings[key] } : { [key]: code });
  };

  return (
    <div>
      <PageHeader title="Réglages" subtitle="Ton coach, à ta façon." />

      <Card className="mb-5 py-1">
        <Row label="Moteur d'IA" hint="100 % gratuit, aucune clé API.">
          <div className="grid gap-2">
            {ENGINES.map((e) => (
              <Option key={e.id} active={settings.engine === e.id} onClick={() => updateSettings({ engine: e.id })}>
                <span className="flex-1">
                  <span className="block text-sm font-semibold">{e.name}</span>
                  <span className="block text-sm text-muted">{e.desc}</span>
                </span>
                {settings.engine === e.id && <Check className="size-5 shrink-0 text-brand" aria-hidden />}
              </Option>
            ))}
            <Button variant="outline" className="w-fit" onClick={testEngine} loading={testing}>
              Tester l'IA
            </Button>
          </div>
        </Row>
        <div className="h-px bg-line" />
        <Row label="IA sur l'appareil" hint="Gratuite, illimitée, fonctionne même hors connexion une fois téléchargée.">
          <LocalAiPanel />
        </Row>
        <div className="h-px bg-line" />
        <Row label="Thème">
          <div className="grid grid-cols-3 gap-2 sm:max-w-md">
            {THEMES.map((t) => (
              <Option key={t.id} active={settings.theme === t.id} onClick={() => updateSettings({ theme: t.id })}>
                <t.icon className="size-5 text-brand" aria-hidden />
                <span className="text-sm font-semibold">{t.name}</span>
              </Option>
            ))}
          </div>
        </Row>
      </Card>

      <Card className="mb-5 py-1">
        <Row label="Langue maternelle" hint="Langue des explications." htmlFor="native">
          <select id="native" className="field" value={settings.native} onChange={(e) => setLang("native", e.target.value as LangCode)}>
            {LANG_LIST.map((l) => (
              <option key={l.code} value={l.code}>
                {l.name}
              </option>
            ))}
          </select>
        </Row>
        <div className="h-px bg-line" />
        <Row label="Langue apprise" htmlFor="target">
          <select id="target" className="field" value={settings.target} onChange={(e) => setLang("target", e.target.value as LangCode)}>
            {LANG_LIST.map((l) => (
              <option key={l.code} value={l.code}>
                {l.name}
              </option>
            ))}
          </select>
        </Row>
        <div className="h-px bg-line" />
        <Row label="Niveau (CECR)">
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {LEVELS.map((l) => (
              <button
                key={l}
                title={LEVEL_LABELS[l]}
                aria-pressed={settings.level === l}
                onClick={() => updateSettings({ level: l as Level })}
                className={clsx(
                  "min-h-11 rounded-xl border-2 text-sm font-bold transition-colors",
                  settings.level === l ? "border-brand bg-brand-soft text-brand" : "border-line text-muted hover:border-line2"
                )}
              >
                {l}
              </button>
            ))}
          </div>
        </Row>
        <div className="h-px bg-line" />
        <Row label="Sévérité du coach">
          <div className="grid gap-2 sm:grid-cols-3">
            {([1, 2, 3] as Strictness[]).map((n) => {
              const Icon = STRICT_ICONS[n];
              return (
                <Option key={n} active={settings.strictness === n} onClick={() => updateSettings({ strictness: n })}>
                  <Icon className={clsx("mt-0.5 size-5 shrink-0", n === 3 ? "text-brand2" : "text-brand")} aria-hidden />
                  <span>
                    <span className="block text-sm font-semibold">{STRICTNESS_LABELS[n].name}</span>
                    <span className="block text-sm text-muted">{STRICTNESS_LABELS[n].desc}</span>
                  </span>
                </Option>
              );
            })}
          </div>
        </Row>
        <div className="h-px bg-line" />
        <Row label="Objectif quotidien" hint={`${settings.dailyGoal} XP par jour`} htmlFor="goal">
          <input id="goal" type="range" min={20} max={300} step={10} value={settings.dailyGoal} onChange={(e) => updateSettings({ dailyGoal: Number(e.target.value) })} className="h-11 w-full accent-[var(--brand)]" />
        </Row>
      </Card>

      <Card className="mb-5 py-1">
        <Row label={`Voix (${LANGS[settings.target].name})`} hint="Les voix « Natural » ou « Google » sonnent le mieux." htmlFor="voice">
          <div className="flex gap-2">
            <select
              id="voice"
              className="field"
              value={settings.voices[settings.target] ?? ""}
              onChange={(e) => updateSettings({ voices: { ...settings.voices, [settings.target]: e.target.value || undefined } })}
            >
              <option value="">Automatique (la meilleure disponible)</option>
              {voices.map((v) => (
                <option key={v.voiceURI} value={v.voiceURI}>
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
            <Button variant="outline" onClick={() => speak(LANG_SAMPLE[settings.target], settings.target)}>
              Écouter
            </Button>
          </div>
        </Row>
        <div className="h-px bg-line" />
        <Row label="Vitesse de lecture" hint={`× ${settings.speechRate.toFixed(1)}`} htmlFor="rate">
          <input id="rate" type="range" min={0.5} max={1.5} step={0.1} value={settings.speechRate} onChange={(e) => updateSettings({ speechRate: Number(e.target.value) })} className="h-11 w-full accent-[var(--brand)]" />
        </Row>
        <div className="h-px bg-line" />
        <Row label="Lecture auto du coach" hint="Le coach lit ses réponses à voix haute.">
          <button
            role="switch"
            aria-checked={settings.autoSpeak}
            aria-label="Lecture automatique"
            onClick={() => updateSettings({ autoSpeak: !settings.autoSpeak })}
            className={clsx("relative h-8 w-14 rounded-full transition-colors", settings.autoSpeak ? "bg-brand" : "bg-line2")}
          >
            <span className={clsx("absolute top-1 size-6 rounded-full bg-white transition-[left] duration-150", settings.autoSpeak ? "left-7" : "left-1")} />
          </button>
        </Row>
      </Card>

      <Card className="py-1">
        <Row label="Sauvegarde" hint="Tes données restent sur cet appareil. Exporte-les pour les transférer.">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={exportData}>
              <Download className="size-4" aria-hidden /> Exporter
            </Button>
            <Button variant="outline" onClick={() => fileRef.current?.click()}>
              <Upload className="size-4" aria-hidden /> Importer
            </Button>
            <input ref={fileRef} type="file" accept="application/json" hidden onChange={(e) => e.target.files?.[0] && importData(e.target.files[0])} />
          </div>
        </Row>
        <div className="h-px bg-line" />
        <Row label="Réinitialiser" hint="Efface progression, cartes, erreurs et conversations.">
          <Button
            variant="danger"
            onClick={() => {
              if (confirm("Tout effacer ? Cette action est irréversible.")) {
                store.resetAll();
                toast("Données réinitialisées");
              }
            }}
          >
            Tout effacer
          </Button>
        </Row>
      </Card>

      <p className="mt-6 flex items-center justify-center gap-2 text-center text-sm text-faint">
        <ShieldCheck className="size-4 shrink-0" aria-hidden /> Pas de compte, pas de pistage. Tes messages au coach passent par le service d'IA choisi ci-dessus.
      </p>
    </div>
  );
}

const LANG_SAMPLE: Record<LangCode, string> = {
  en: "Hey! It's up to you, I'm down for anything.",
  es: "¡Hola! Me da igual, lo que tú quieras.",
  it: "Ciao! Per me va bene, decidi tu.",
  fr: "Salut ! Ça marche, c'est toi qui vois.",
};

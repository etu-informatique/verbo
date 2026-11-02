import { useRef, useState } from "react";
import clsx from "clsx";
import { Download, Eye, EyeOff, KeyRound, ShieldCheck, Upload } from "lucide-react";
import { askJson, friendlyError, obj, str } from "../lib/claude";
import { STRICTNESS_LABELS } from "../lib/prompts";
import { LANG_LIST, LANGS, LEVEL_LABELS, LEVELS, type LangCode, type Level } from "../lib/languages";
import { speak, useVoices } from "../lib/speech";
import { useStore, type ModelId, type Strictness } from "../store/useStore";
import { Button, Card, PageHeader, toast } from "../components/ui";

const MODELS: { id: ModelId; name: string; desc: string }[] = [
  { id: "claude-opus-5-5", name: "Claude Opus 5.5", desc: "Le plus fin et le plus exigeant. Recommandé." },
  { id: "claude-sonnet-5-5", name: "Claude Sonnet 5.5", desc: "Plus rapide, excellent pour la conversation." },
  { id: "claude-haiku-5-5", name: "Claude Haiku 5.5", desc: "Ultra rapide et très économique." },
];

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-2 py-4 md:grid-cols-[220px_1fr] md:gap-6">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {hint && <p className="mt-0.5 text-xs text-faint">{hint}</p>}
      </div>
      <div>{children}</div>
    </div>
  );
}

export default function SettingsPage() {
  const store = useStore();
  const { settings, updateSettings } = store;
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const voices = useVoices(settings.target);
  const fileRef = useRef<HTMLInputElement>(null);

  const testKey = async () => {
    setTesting(true);
    try {
      const r = await askJson<{ ok: string }>({
        system: "Reply with ok = a two-word greeting in French.",
        messages: [{ role: "user", content: "ping" }],
        schema: obj({ ok: str() }),
      });
      toast(`Connexion réussie : ${r.ok}`);
    } catch (e) {
      toast(friendlyError(e), "bad");
    } finally {
      setTesting(false);
    }
  };

  const exportData = () => {
    const { settings: s, progress, cards, mistakes, chats } = useStore.getState();
    const data = { settings: { ...s, apiKey: "" }, progress, cards, mistakes, chats, exportedAt: new Date().toISOString() };
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `verbo-sauvegarde-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = async (f: File) => {
    try {
      const apiKey = settings.apiKey;
      store.importData(await f.text());
      if (!useStore.getState().settings.apiKey) updateSettings({ apiKey });
      toast("Sauvegarde importée");
    } catch {
      toast("Fichier de sauvegarde invalide", "bad");
    }
  };

  return (
    <div>
      <PageHeader title="Réglages" subtitle="Ton coach, à ta façon." />

      <Card className="mb-5 py-1">
        <Row label="Clé API Claude" hint="Stockée uniquement dans ce navigateur, envoyée seulement à api.anthropic.com.">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <KeyRound className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint" />
              <input
                className="field pl-9 pr-10"
                type={showKey ? "text" : "password"}
                value={settings.apiKey}
                onChange={(e) => updateSettings({ apiKey: e.target.value.trim() })}
                placeholder="sk-ant-…"
                autoComplete="off"
              />
              <button onClick={() => setShowKey(!showKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-faint hover:text-ink" aria-label="Afficher la clé">
                {showKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            <Button onClick={testKey} loading={testing} disabled={!settings.apiKey}>
              Tester
            </Button>
          </div>
          <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs text-violet-300 hover:underline">
            Obtenir une clé sur console.anthropic.com →
          </a>
        </Row>
        <div className="h-px bg-line" />
        <Row label="Modèle IA">
          <div className="grid gap-2">
            {MODELS.map((m) => (
              <button
                key={m.id}
                onClick={() => updateSettings({ model: m.id })}
                className={clsx("rounded-xl border p-3 text-left transition", settings.model === m.id ? "border-brand/60 bg-brand/10" : "border-line hover:bg-white/[0.04]")}
              >
                <p className="text-sm font-medium">{m.name}</p>
                <p className="text-xs text-muted">{m.desc}</p>
              </button>
            ))}
          </div>
        </Row>
      </Card>

      <Card className="mb-5 py-1">
        <Row label="Langue maternelle" hint="Langue des explications.">
          <select
            className="field"
            value={settings.native}
            onChange={(e) => {
              const native = e.target.value as LangCode;
              updateSettings(native === settings.target ? { native, target: settings.native } : { native });
            }}
          >
            {LANG_LIST.map((l) => (
              <option key={l.code} value={l.code}>
                {l.flag} {l.name}
              </option>
            ))}
          </select>
        </Row>
        <div className="h-px bg-line" />
        <Row label="Langue apprise">
          <select
            className="field"
            value={settings.target}
            onChange={(e) => {
              const target = e.target.value as LangCode;
              updateSettings(target === settings.native ? { target, native: settings.target } : { target });
            }}
          >
            {LANG_LIST.map((l) => (
              <option key={l.code} value={l.code}>
                {l.flag} {l.name}
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
                onClick={() => updateSettings({ level: l as Level })}
                className={clsx("rounded-xl border py-2 text-sm font-semibold transition", settings.level === l ? "border-brand/60 bg-brand/15" : "border-line text-muted hover:text-ink")}
              >
                {l}
              </button>
            ))}
          </div>
        </Row>
        <div className="h-px bg-line" />
        <Row label="Sévérité du coach">
          <div className="grid gap-2 sm:grid-cols-3">
            {([1, 2, 3] as Strictness[]).map((n) => (
              <button
                key={n}
                onClick={() => updateSettings({ strictness: n })}
                className={clsx("rounded-xl border p-3 text-left transition", settings.strictness === n ? "border-brand/60 bg-brand/10" : "border-line hover:bg-white/[0.04]")}
              >
                <p className="text-sm font-medium">
                  {n === 1 ? "🙂" : n === 2 ? "😤" : "🔥"} {STRICTNESS_LABELS[n].name}
                </p>
                <p className="mt-0.5 text-xs text-muted">{STRICTNESS_LABELS[n].desc}</p>
              </button>
            ))}
          </div>
        </Row>
        <div className="h-px bg-line" />
        <Row label="Objectif quotidien" hint={`${settings.dailyGoal} XP par jour`}>
          <input type="range" min={20} max={300} step={10} value={settings.dailyGoal} onChange={(e) => updateSettings({ dailyGoal: Number(e.target.value) })} className="w-full accent-violet-500" />
        </Row>
      </Card>

      <Card className="mb-5 py-1">
        <Row label={`Voix (${LANGS[settings.target].name})`} hint="Les voix « Natural » / « Google » sonnent le mieux.">
          <div className="flex gap-2">
            <select className="field" value={settings.voices[settings.target] ?? ""} onChange={(e) => updateSettings({ voices: { ...settings.voices, [settings.target]: e.target.value || undefined } })}>
              <option value="">Automatique (la meilleure disponible)</option>
              {voices.map((v) => (
                <option key={v.voiceURI} value={v.voiceURI}>
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
            <Button onClick={() => speak(LANG_SAMPLE[settings.target], settings.target)}>Tester</Button>
          </div>
        </Row>
        <div className="h-px bg-line" />
        <Row label="Vitesse de lecture" hint={`× ${settings.speechRate.toFixed(1)}`}>
          <input type="range" min={0.5} max={1.5} step={0.1} value={settings.speechRate} onChange={(e) => updateSettings({ speechRate: Number(e.target.value) })} className="w-full accent-violet-500" />
        </Row>
        <div className="h-px bg-line" />
        <Row label="Lecture auto du coach" hint="Le coach lit ses réponses à voix haute.">
          <button
            role="switch"
            aria-checked={settings.autoSpeak}
            onClick={() => updateSettings({ autoSpeak: !settings.autoSpeak })}
            className={clsx("relative h-7 w-12 rounded-full transition", settings.autoSpeak ? "bg-brand-gradient" : "bg-white/[0.12]")}
          >
            <span className={clsx("absolute top-1 size-5 rounded-full bg-white shadow transition-all", settings.autoSpeak ? "left-6" : "left-1")} />
          </button>
        </Row>
      </Card>

      <Card className="py-1">
        <Row label="Sauvegarde" hint="Tes données restent sur cet appareil. Exporte-les pour les transférer.">
          <div className="flex flex-wrap gap-2">
            <Button onClick={exportData}>
              <Download className="size-4" /> Exporter
            </Button>
            <Button onClick={() => fileRef.current?.click()}>
              <Upload className="size-4" /> Importer
            </Button>
            <input ref={fileRef} type="file" accept="application/json" hidden onChange={(e) => e.target.files?.[0] && importData(e.target.files[0])} />
          </div>
        </Row>
        <div className="h-px bg-line" />
        <Row label="Réinitialiser" hint="Efface progression, cartes, erreurs et conversations (garde la clé API).">
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

      <p className="mt-6 flex items-center justify-center gap-2 text-center text-xs text-faint">
        <ShieldCheck className="size-4" /> Aucune donnée n'est envoyée ailleurs qu'à l'API Claude. Pas de compte, pas de pistage.
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

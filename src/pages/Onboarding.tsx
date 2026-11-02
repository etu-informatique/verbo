import { useState } from "react";
import clsx from "clsx";
import { ArrowLeft, ArrowRight, KeyRound } from "lucide-react";
import { LANG_LIST, LEVEL_LABELS, LEVELS, type LangCode, type Level } from "../lib/languages";
import { STRICTNESS_LABELS } from "../lib/prompts";
import { useStore, type Strictness } from "../store/useStore";
import { Logo } from "../components/Layout";
import { Button } from "../components/ui";

function Choice({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition active:scale-[0.98]",
        active ? "border-brand/70 bg-brand/10 shadow-lg shadow-violet-500/10" : "border-line bg-white/[0.03] hover:bg-white/[0.06]"
      )}
    >
      {children}
    </button>
  );
}

export default function Onboarding() {
  const s = useStore((st) => st.settings);
  const update = useStore((st) => st.updateSettings);
  const [step, setStep] = useState(0);
  const [native, setNative] = useState<LangCode>(s.native);
  const [target, setTarget] = useState<LangCode>(s.target === s.native ? "en" : s.target);
  const [level, setLevel] = useState<Level>(s.level);
  const [strict, setStrict] = useState<Strictness>(s.strictness);
  const [key, setKey] = useState(s.apiKey);

  const finish = () =>
    update({ native, target: target === native ? LANG_LIST.find((l) => l.code !== native)!.code : target, level, strictness: strict, apiKey: key.trim(), onboarded: true });

  const steps = [
    {
      title: "Parle comme un natif.",
      body: (
        <div className="space-y-3 text-muted">
          <p>Verbo, c'est un coach de langues exigeant : il discute, débat et joue des rôles avec toi — et ne laisse passer aucune faute.</p>
          <ul className="grid gap-2 text-sm">
            {[
              "💬 Coach IA strict : conversation, débat, jeux de rôle",
              "🔁 Traduction naturelle + mot à mot + correcteur",
              "🎙️ Prononciation notée mot par mot",
              "⚡ Argot et expressions de tous les jours",
              "🧠 Révisions espacées (comme Anki) et exercices",
            ].map((t) => (
              <li key={t} className="rounded-xl border border-line bg-white/[0.03] px-3 py-2 text-ink">
                {t}
              </li>
            ))}
          </ul>
        </div>
      ),
    },
    {
      title: "Ta langue maternelle ?",
      body: (
        <div className="grid gap-2">
          {LANG_LIST.map((l) => (
            <Choice key={l.code} active={native === l.code} onClick={() => setNative(l.code)}>
              <span className="text-2xl">{l.flag}</span>
              <span className="font-medium">{l.name}</span>
            </Choice>
          ))}
          <p className="text-xs text-faint">Les explications et corrections seront données dans cette langue.</p>
        </div>
      ),
    },
    {
      title: "Tu veux apprendre…",
      body: (
        <div className="grid gap-2">
          {LANG_LIST.filter((l) => l.code !== native).map((l) => (
            <Choice key={l.code} active={target === l.code} onClick={() => setTarget(l.code)}>
              <span className="text-2xl">{l.flag}</span>
              <span className="flex-1 font-medium">{l.name}</span>
              <span className="text-sm text-faint">{l.native}</span>
            </Choice>
          ))}
          <p className="text-xs text-faint">Tu pourras changer à tout moment.</p>
        </div>
      ),
    },
    {
      title: "Ton niveau actuel ?",
      body: (
        <div className="grid grid-cols-2 gap-2">
          {LEVELS.map((l) => (
            <Choice key={l} active={level === l} onClick={() => setLevel(l)}>
              <span className="text-lg font-bold text-gradient">{l}</span>
              <span className="text-sm">{LEVEL_LABELS[l]}</span>
            </Choice>
          ))}
          <p className="col-span-2 text-xs text-faint">Pas sûr ? Choisis B1 puis fais le « Test de niveau » dans le Coach IA.</p>
        </div>
      ),
    },
    {
      title: "Quelle sévérité ?",
      body: (
        <div className="grid gap-2">
          {([1, 2, 3] as Strictness[]).map((n) => (
            <Choice key={n} active={strict === n} onClick={() => setStrict(n)}>
              <span className="text-xl">{n === 1 ? "🙂" : n === 2 ? "😤" : "🔥"}</span>
              <span>
                <span className="block font-medium">{STRICTNESS_LABELS[n].name}</span>
                <span className="block text-sm text-muted">{STRICTNESS_LABELS[n].desc}</span>
              </span>
            </Choice>
          ))}
        </div>
      ),
    },
    {
      title: "Connecte l'IA",
      body: (
        <div className="space-y-3 text-sm text-muted">
          <p>
            Le coach, la traduction et les exercices utilisent Claude. Colle ta clé API Anthropic (créée sur{" "}
            <a className="text-violet-300 underline" href="https://console.anthropic.com/settings/keys" target="_blank" rel="noreferrer">
              console.anthropic.com
            </a>
            ). Elle reste uniquement sur cet appareil.
          </p>
          <div className="relative">
            <KeyRound className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint" />
            <input className="field pl-9" type="password" placeholder="sk-ant-…" value={key} onChange={(e) => setKey(e.target.value)} autoComplete="off" />
          </div>
          <p className="text-xs text-faint">Sans clé, tu as quand même la prononciation, l'argot et les révisions.</p>
        </div>
      ),
    },
  ];

  const last = step === steps.length - 1;

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-bg">
      <div className="mx-auto flex min-h-dvh max-w-md flex-col px-5 py-8">
        <div className="flex items-center justify-between">
          <Logo />
          <span className="text-xs text-faint">
            {step + 1}/{steps.length}
          </span>
        </div>
        <div className="mt-4 h-1 overflow-hidden rounded-full bg-white/[0.06]">
          <div className="h-full bg-brand-gradient transition-all duration-500" style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
        </div>

        <div key={step} className="flex-1 py-8 animate-fade-up">
          <h1 className="mb-6 font-display text-5xl leading-[1.05] tracking-tight">
            {step === 0 ? (
              <>
                Parle comme <span className="italic text-gradient">un natif.</span>
              </>
            ) : (
              steps[step].title
            )}
          </h1>
          {steps[step].body}
        </div>

        <div className="flex gap-2">
          {step > 0 && (
            <Button variant="soft" size="lg" onClick={() => setStep(step - 1)} aria-label="Retour">
              <ArrowLeft className="size-4" />
            </Button>
          )}
          <Button variant="primary" size="lg" className="flex-1" onClick={() => (last ? finish() : setStep(step + 1))}>
            {last ? (key.trim() ? "C'est parti" : "Continuer sans clé") : "Continuer"}
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

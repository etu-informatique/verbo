import { useState } from "react";
import clsx from "clsx";
import { ArrowLeft, ArrowRight, Check, Flame, Gauge, Languages, Layers, MessageCircle, Mic, ShieldAlert, Zap } from "lucide-react";
import { LANG_LIST, LEVEL_LABELS, LEVELS, type LangCode, type Level } from "../lib/languages";
import { STRICTNESS_LABELS } from "../lib/prompts";
import { useStore, type Strictness } from "../store/useStore";
import { Logo } from "../components/Layout";
import { Button } from "../components/ui";
import { Flag } from "../components/Flag";

const FEATURES = [
  { icon: MessageCircle, text: "Coach IA exigeant : conversation, débat, jeux de rôle" },
  { icon: Languages, text: "Traduction naturelle, mot à mot et correcteur" },
  { icon: Mic, text: "Prononciation notée mot par mot" },
  { icon: Zap, text: "Argot et expressions de tous les jours" },
  { icon: Layers, text: "Révisions espacées et exercices" },
];

const STRICT_ICONS = { 1: Gauge, 2: ShieldAlert, 3: Flame } as const;

function Choice({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={clsx(
        "flex min-h-14 w-full items-center gap-3 rounded-xl border-2 p-3 text-left transition-colors duration-150",
        active ? "border-brand bg-brand-soft" : "border-line bg-panel hover:border-line2"
      )}
    >
      {children}
      {active && <Check className="ml-auto size-5 shrink-0 text-brand" aria-hidden />}
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

  const finish = () =>
    update({ native, target: target === native ? LANG_LIST.find((l) => l.code !== native)!.code : target, level, strictness: strict, onboarded: true });

  const steps = [
    {
      title: "Parle comme un natif.",
      body: (
        <div className="space-y-4">
          <p className="text-muted">Un coach de langues gratuit et exigeant. Pas de compte, pas de clé, pas d'abonnement.</p>
          <ul className="space-y-2">
            {FEATURES.map((f) => (
              <li key={f.text} className="flex items-center gap-3 rounded-xl border border-line bg-panel p-3 text-sm font-medium">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand">
                  <f.icon className="size-[18px]" aria-hidden />
                </span>
                {f.text}
              </li>
            ))}
          </ul>
        </div>
      ),
    },
    {
      title: "Ta langue maternelle",
      body: (
        <div className="grid gap-2">
          {LANG_LIST.map((l) => (
            <Choice key={l.code} active={native === l.code} onClick={() => setNative(l.code)}>
              <Flag code={l.code} className="text-xl" />
              <span className="font-semibold">{l.name}</span>
            </Choice>
          ))}
          <p className="text-sm text-faint">Les explications et corrections seront données dans cette langue.</p>
        </div>
      ),
    },
    {
      title: "Tu veux apprendre",
      body: (
        <div className="grid gap-2">
          {LANG_LIST.filter((l) => l.code !== native).map((l) => (
            <Choice key={l.code} active={target === l.code} onClick={() => setTarget(l.code)}>
              <Flag code={l.code} className="text-xl" />
              <span className="font-semibold">{l.name}</span>
              <span className="text-sm text-faint">{l.native}</span>
            </Choice>
          ))}
          <p className="text-sm text-faint">Tu pourras changer à tout moment.</p>
        </div>
      ),
    },
    {
      title: "Ton niveau actuel",
      body: (
        <div className="grid grid-cols-2 gap-2">
          {LEVELS.map((l) => (
            <Choice key={l} active={level === l} onClick={() => setLevel(l)}>
              <span className="text-lg font-extrabold text-brand">{l}</span>
              <span className="text-sm">{LEVEL_LABELS[l]}</span>
            </Choice>
          ))}
          <p className="col-span-2 text-sm text-faint">Pas sûr ? Choisis B1 puis fais le test de niveau dans le Coach IA.</p>
        </div>
      ),
    },
    {
      title: "Quelle sévérité ?",
      body: (
        <div className="grid gap-2">
          {([1, 2, 3] as Strictness[]).map((n) => {
            const Icon = STRICT_ICONS[n];
            return (
              <Choice key={n} active={strict === n} onClick={() => setStrict(n)}>
                <Icon className={clsx("size-5 shrink-0", n === 3 ? "text-brand2" : "text-brand")} aria-hidden />
                <span>
                  <span className="block font-semibold">{STRICTNESS_LABELS[n].name}</span>
                  <span className="block text-sm text-muted">{STRICTNESS_LABELS[n].desc}</span>
                </span>
              </Choice>
            );
          })}
        </div>
      ),
    },
  ];

  const last = step === steps.length - 1;

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-bg">
      <div className="mx-auto flex min-h-dvh max-w-md flex-col px-5 py-6">
        <div className="flex items-center justify-between">
          <Logo />
          <span className="text-sm font-medium text-faint">
            Étape {step + 1} sur {steps.length}
          </span>
        </div>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-sunk" role="progressbar" aria-valuenow={step + 1} aria-valuemin={1} aria-valuemax={steps.length}>
          <div className="h-full rounded-full bg-brand transition-[width] duration-300" style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
        </div>

        <div key={step} className="flex-1 py-8 animate-fade-up">
          <h1 className="mb-6 text-3xl font-extrabold tracking-tight text-balance">{steps[step].title}</h1>
          {steps[step].body}
        </div>

        <div className="flex gap-2">
          {step > 0 && (
            <Button variant="outline" size="lg" onClick={() => setStep(step - 1)} aria-label="Étape précédente">
              <ArrowLeft className="size-5" />
            </Button>
          )}
          <Button variant="primary" size="lg" className="flex-1" onClick={() => (last ? finish() : setStep(step + 1))}>
            {last ? "C'est parti" : "Continuer"}
            <ArrowRight className="size-5" aria-hidden />
          </Button>
        </div>
      </div>
    </div>
  );
}

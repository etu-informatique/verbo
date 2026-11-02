import { useMemo, useState } from "react";
import clsx from "clsx";
import { AlertTriangle, ChevronLeft, ChevronRight, Ear, Mic, Sparkles, Square, Wand2 } from "lucide-react";
import { askJson, friendlyError } from "../lib/claude";
import { pronSchema, pronSystem } from "../lib/prompts";
import { LANGS, LEVELS, type Level } from "../lib/languages";
import { scorePronunciation, type PronResult } from "../lib/score";
import { speak, useSpeechRecognition } from "../lib/speech";
import { PHRASES } from "../data/phrases";
import { useStore } from "../store/useStore";
import { Badge, Button, Card, ErrorBox, PageHeader, ProgressRing, Segmented, SpeakButton, Spinner, toast } from "../components/ui";

interface PronFeedback {
  verdict: string;
  tips: { sound: string; problem: string; howTo: string }[];
  stress: string;
  drills: string[];
}

const VERDICTS = {
  pass: ["Propre. Suivante.", "Correct. Ne t'endors pas.", "Ça passe. Vise le 100."],
  fail: ["Non. Recommence.", "Pas encore. Écoute et réessaie.", "Insuffisant. Encore une fois."],
};

export default function Pronounce() {
  const { settings, progress, addXp, setPronScore, addCard } = useStore();
  const lang = settings.target;
  const phrases = PHRASES[lang];

  const [level, setLevel] = useState<Level | "all">("all");
  const [mode, setMode] = useState<"liste" | "libre">("liste");
  const [idx, setIdx] = useState(0);
  const [custom, setCustom] = useState("");
  const [shadow, setShadow] = useState(false);
  const [result, setResult] = useState<(PronResult & { heard: string }) | null>(null);
  const [feedback, setFeedback] = useState<PronFeedback | null>(null);
  const [fbLoading, setFbLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const stt = useSpeechRecognition(lang, false);

  const list = useMemo(() => (level === "all" ? phrases : phrases.filter((p) => p.level === level)), [phrases, level]);
  const phrase = list[Math.min(idx, list.length - 1)];
  const target = mode === "libre" ? custom.trim() : phrase?.text ?? "";

  const reset = () => {
    setResult(null);
    setFeedback(null);
    setError(null);
    setAttempts(0);
  };

  const go = (d: number) => {
    setIdx((i) => (i + d + list.length) % list.length);
    reset();
  };

  const record = async () => {
    if (stt.listening) return stt.stop();
    if (!target) return;
    setFeedback(null);
    if (shadow) {
      // Shadowing : on écoute le modèle, puis on répète immédiatement
      await new Promise<void>((resolve) => speak(target, lang, { onEnd: () => resolve() }));
    }
    const r = await stt.start();
    if (!r.transcript) return;
    const res = scorePronunciation(target, r.transcript, r.confidence, settings.strictness);
    setResult({ ...res, heard: r.transcript });
    setAttempts((a) => a + 1);
    setPronScore(target, res.score);
    addXp(res.passed ? 5 : 2, "pronunciations");
  };

  const analyze = async () => {
    if (!result) return;
    setFbLoading(true);
    setError(null);
    try {
      const fb = await askJson<PronFeedback>({
        system: pronSystem(lang, settings.native, settings.strictness),
        messages: [{ role: "user", content: `Target sentence: "${target}"\nRecognizer heard: "${result.heard}"\nWord score: ${result.score}/100` }],
        schema: pronSchema,
      });
      setFeedback(fb);
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setFbLoading(false);
    }
  };

  const verdict = result ? VERDICTS[result.passed ? "pass" : "fail"][attempts % 3] : "";

  return (
    <div>
      <PageHeader
        title="Prononciation"
        subtitle="Écoute, répète, et vois exactement quels mots n'étaient pas clairs."
        right={
          <Segmented
            value={mode}
            onChange={(m) => {
              setMode(m);
              reset();
            }}
            options={[
              { value: "liste", label: "Phrases" },
              { value: "libre", label: "Ma phrase" },
            ]}
          />
        }
      />

      {!stt.supported && (
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-warn/30 bg-warn/[0.08] p-4 text-sm">
          <AlertTriangle className="size-5 shrink-0 text-warn" />
          <p>
            La reconnaissance vocale n'est pas disponible sur ce navigateur. Utilise <b>Chrome</b>, <b>Edge</b> ou <b>Safari</b> (ordinateur, Android ou iPhone).
          </p>
        </div>
      )}

      {mode === "liste" && (
        <Segmented
          className="mb-5"
          value={level}
          onChange={(l) => {
            setLevel(l);
            setIdx(0);
            reset();
          }}
          options={[{ value: "all" as const, label: "Tous" }, ...LEVELS.filter((l) => phrases.some((p) => p.level === l)).map((l) => ({ value: l, label: l }))]}
        />
      )}

      <div className="grid gap-5 lg:grid-cols-5">
        <div className="space-y-5 lg:col-span-3">
          {/* ── Phrase à prononcer ── */}
          <Card className="relative overflow-hidden p-6 md:p-8">
            <div className="pointer-events-none absolute -left-16 -top-16 size-56 rounded-full bg-rose-500/15 blur-3xl" />
            {mode === "liste" && phrase ? (
              <div key={phrase.text} className="relative animate-fade-up">
                <div className="flex items-center gap-2">
                  <Badge tone="brand">{phrase.level}</Badge>
                  <Badge>🎯 {phrase.focus}</Badge>
                  {progress.pronBest[phrase.text] !== undefined && <Badge tone={progress.pronBest[phrase.text] >= 85 ? "ok" : "warn"}>record {progress.pronBest[phrase.text]}</Badge>}
                </div>
                <p className="mt-5 font-display text-3xl leading-snug md:text-4xl">{phrase.text}</p>
                <p className="mt-2 text-sm text-muted">{phrase.tr}</p>
              </div>
            ) : (
              <div className="relative">
                <textarea
                  className="field resize-none text-lg"
                  rows={3}
                  placeholder={`Écris la phrase en ${LANGS[lang].name.toLowerCase()} que tu veux travailler…`}
                  value={custom}
                  onChange={(e) => {
                    setCustom(e.target.value);
                    setResult(null);
                  }}
                />
              </div>
            )}

            <div className="relative mt-6 flex flex-wrap items-center gap-3">
              <SpeakButton text={target} lang={lang} />
              <SpeakButton text={target} lang={lang} rate={0.6} />
              <label className="ml-1 flex cursor-pointer items-center gap-2 text-sm text-muted">
                <input type="checkbox" checked={shadow} onChange={(e) => setShadow(e.target.checked)} className="accent-violet-500" />
                <Ear className="size-4" /> Shadowing
              </label>
              {mode === "liste" && (
                <div className="ml-auto flex items-center gap-1">
                  <Button size="sm" variant="ghost" onClick={() => go(-1)} aria-label="Précédente">
                    <ChevronLeft className="size-4" />
                  </Button>
                  <span className="text-xs text-faint">
                    {Math.min(idx, list.length - 1) + 1}/{list.length}
                  </span>
                  <Button size="sm" variant="ghost" onClick={() => go(1)} aria-label="Suivante">
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              )}
            </div>
          </Card>

          {/* ── Micro ── */}
          <div className="flex flex-col items-center gap-3 py-2">
            <button
              onClick={record}
              disabled={!target || !stt.supported}
              aria-label={stt.listening ? "Arrêter" : "Enregistrer"}
              className={clsx(
                "flex size-24 items-center justify-center rounded-full text-white shadow-2xl transition active:scale-95 disabled:opacity-40",
                stt.listening ? "animate-pulse-ring bg-brand2" : "bg-brand-gradient shadow-fuchsia-500/30 hover:scale-105"
              )}
            >
              {stt.listening ? <Square className="size-8 fill-white" /> : <Mic className="size-10" />}
            </button>
            <p className="h-5 text-sm text-muted">
              {stt.listening ? stt.interim || "Je t'écoute…" : shadow ? "Écoute puis répète aussitôt" : "Appuie et lis la phrase"}
            </p>
            {stt.error && <p className="text-sm text-bad">{stt.error}</p>}
          </div>

          {/* ── Résultat ── */}
          {result && (
            <Card className="animate-fade-up">
              <div className="flex items-center gap-4">
                <ProgressRing value={result.score / 100} size={84} stroke={7}>
                  <span className={clsx("text-2xl font-bold", result.passed ? "text-ok" : result.score >= 60 ? "text-warn" : "text-bad")}>{result.score}</span>
                </ProgressRing>
                <div className="flex-1">
                  <p className={clsx("text-lg font-semibold", result.passed ? "text-ok" : "text-bad")}>{verdict}</p>
                  <p className="text-sm text-muted">
                    Entendu : <span className="italic text-ink">« {result.heard} »</span>
                  </p>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap gap-1.5">
                {result.verdicts.map((v, i) => (
                  <span
                    key={i}
                    title={v.heard ? `entendu : ${v.heard}` : undefined}
                    className={clsx(
                      "rounded-lg px-2 py-1 text-[15px]",
                      v.status === "ok" && "bg-ok/12 text-ok",
                      v.status === "close" && "bg-warn/12 text-warn",
                      v.status === "wrong" && "bg-bad/12 text-bad",
                      v.status === "missed" && "bg-bad/10 text-bad line-through opacity-70"
                    )}
                  >
                    {v.word}
                    {v.heard && <span className="ml-1 text-[11px] opacity-70">({v.heard})</span>}
                  </span>
                ))}
                {result.extra.map((w, i) => (
                  <span key={"x" + i} className="rounded-lg border border-dashed border-bad/40 px-2 py-1 text-[15px] text-bad/80">
                    +{w}
                  </span>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-2 text-[11px] text-faint">
                <span className="text-ok">■ correct</span>
                <span className="text-warn">■ approximatif</span>
                <span className="text-bad">■ mal compris / oublié</span>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <Button variant="primary" onClick={analyze} loading={fbLoading}>
                  <Wand2 className="size-4" /> Analyse détaillée
                </Button>
                {mode === "liste" && result.passed && (
                  <Button variant="soft" onClick={() => go(1)}>
                    Phrase suivante <ChevronRight className="size-4" />
                  </Button>
                )}
                {!result.passed && (
                  <Button
                    variant="ghost"
                    onClick={() => {
                      const ok = addCard({ front: target, back: phrase && mode === "liste" ? phrase.tr : "Phrase à prononcer", note: "À travailler à l'oral", source: "prononciation" });
                      toast(ok ? "Ajoutée aux révisions" : "Déjà dans tes révisions", ok ? "ok" : "info");
                    }}
                  >
                    Garder pour réviser
                  </Button>
                )}
              </div>
            </Card>
          )}

          {fbLoading && !feedback && (
            <Card>
              <Spinner label="Le coach analyse ta prononciation…" />
            </Card>
          )}
          {error && <ErrorBox message={error} onRetry={analyze} />}

          {feedback && (
            <Card className="space-y-4 animate-fade-up">
              <p className="flex gap-2 font-medium">
                <Sparkles className="mt-0.5 size-4 shrink-0 text-violet-300" />
                {feedback.verdict}
              </p>
              {feedback.stress && (
                <div className="rounded-xl bg-black/25 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-faint">Accentuation & liaisons</p>
                  <p className="mt-1 font-mono text-sm tracking-wide">{feedback.stress}</p>
                </div>
              )}
              <ul className="space-y-3">
                {feedback.tips.map((t, i) => (
                  <li key={i} className="rounded-xl border border-line p-3">
                    <p className="font-semibold text-violet-300">{t.sound}</p>
                    <p className="mt-1 text-sm text-muted">{t.problem}</p>
                    <p className="mt-1 text-sm">👉 {t.howTo}</p>
                  </li>
                ))}
              </ul>
              {feedback.drills.length > 0 && (
                <div>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-faint">Exercices ciblés</p>
                  <div className="flex flex-wrap gap-2">
                    {feedback.drills.map((d) => (
                      <button
                        key={d}
                        onClick={() => {
                          setMode("libre");
                          setCustom(d);
                          reset();
                        }}
                        className="rounded-full border border-line bg-white/[0.04] px-3 py-1.5 text-sm transition hover:border-brand/50"
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          )}
        </div>

        {/* ── Liste ── */}
        {mode === "liste" && (
          <Card className="h-fit p-3 lg:col-span-2">
            <p className="px-2 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-wider text-faint">Bibliothèque</p>
            <ul className="max-h-[60vh] space-y-1 overflow-y-auto">
              {list.map((p, i) => {
                const best = progress.pronBest[p.text];
                return (
                  <li key={p.text}>
                    <button
                      onClick={() => {
                        setIdx(i);
                        reset();
                      }}
                      className={clsx("flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition", i === idx ? "bg-white/[0.08]" : "hover:bg-white/[0.04]")}
                    >
                      <span className="w-7 text-[11px] font-bold text-faint">{p.level}</span>
                      <span className="flex-1 truncate text-sm">{p.text}</span>
                      {best !== undefined && <span className={clsx("text-xs font-semibold", best >= 85 ? "text-ok" : best >= 60 ? "text-warn" : "text-bad")}>{best}</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          </Card>
        )}
      </div>
    </div>
  );
}

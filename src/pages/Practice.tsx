import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import clsx from "clsx";
import { BookmarkPlus, CheckCircle2, Gavel, RotateCcw, Trophy, XCircle } from "lucide-react";
import { askJson, friendlyError } from "../lib/claude";
import { EXERCISE_INFO, exercisesSchema, exercisesSystem, judgeSchema, type ExerciseKind } from "../lib/prompts";
import { LANG_EN_NAME, LANGS } from "../lib/languages";
import { checkAnswer, type AnswerVerdict } from "../lib/score";
import { speak } from "../lib/speech";
import { useStore } from "../store/useStore";
import { Button, Card, ErrorBox, PageHeader, SpeakButton, Spinner, toast } from "../components/ui";

interface Exercise {
  kind: ExerciseKind;
  instruction: string;
  question: string;
  options: string[];
  answer: string;
  accepted: string[];
  translation: string;
  explanation: string;
}

function shuffleWords(sentence: string): string[] {
  const w = sentence.split(/\s+/).filter(Boolean);
  for (let k = 0; k < 6; k++) {
    for (let i = w.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [w[i], w[j]] = [w[j], w[i]];
    }
    if (w.join(" ") !== sentence.trim()) break;
  }
  return w;
}

const VERDICT_TEXT: Record<AnswerVerdict, string> = {
  correct: "Correct.",
  accents: "Presque — attention aux accents.",
  close: "Presque — une faute de frappe ou d'orthographe.",
  wrong: "Faux.",
};

function ExerciseView({ ex, onDone }: { ex: Exercise; onDone: (ok: boolean) => void }) {
  const { settings, addCard, addMistakes } = useStore();
  const lang = settings.target;
  const [answer, setAnswer] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const pool = useMemo(() => (ex.kind === "ordre" ? shuffleWords(ex.answer) : []), [ex]);
  const [verdict, setVerdict] = useState<AnswerVerdict | null>(null);
  const [judging, setJudging] = useState(false);
  const [judgeNote, setJudgeNote] = useState<string | null>(null);

  useEffect(() => {
    if (ex.kind === "dictee") speak(ex.answer, lang);
  }, [ex, lang]);

  const given = ex.kind === "ordre" ? picked.map((i) => pool[Number(i)]).join(" ") : answer;
  const ok = verdict === "correct" || verdict === "accents" || verdict === "close";

  const check = (value = given) => {
    if (!value.trim() || verdict) return;
    const v = checkAnswer(value, [ex.answer, ...ex.accepted], settings.strictness);
    setVerdict(v);
    if (v === "wrong") addMistakes(value, [{ wrong: value, right: ex.answer, type: EXERCISE_INFO[ex.kind].name, explanation: ex.explanation }]);
  };

  // Contester : l'IA juge si une traduction différente est quand même correcte
  const contest = async () => {
    setJudging(true);
    try {
      const r = await askJson<{ correct: boolean; explanation: string }>({
        system: `You are a strict but fair ${LANG_EN_NAME[lang]} examiner. Decide if the learner's answer is fully correct and natural for the exercise (several answers can be valid). Explain in ${LANG_EN_NAME[settings.native]} in 1-2 sentences.`,
        messages: [{ role: "user", content: `Exercise: ${ex.instruction}\n${ex.question}\nReference answer: ${ex.answer}\nLearner answer: ${given}` }],
        schema: judgeSchema,
      });
      setJudgeNote(r.explanation);
      if (r.correct) setVerdict("correct");
    } catch (e) {
      setJudgeNote(friendlyError(e));
    } finally {
      setJudging(false);
    }
  };

  return (
    <Card className="animate-fade-up">
      <p className="text-xs font-semibold uppercase tracking-wider text-violet-300">
        {EXERCISE_INFO[ex.kind].emoji} {EXERCISE_INFO[ex.kind].name}
      </p>
      <p className="mt-1 text-sm text-muted">{ex.instruction}</p>

      {ex.kind !== "ordre" && ex.kind !== "dictee" && <p className="mt-4 font-display text-2xl leading-snug md:text-3xl">{ex.question}</p>}

      {ex.kind === "dictee" && (
        <div className="mt-4 flex items-center gap-3">
          <SpeakButton text={ex.answer} lang={lang} />
          <SpeakButton text={ex.answer} lang={lang} rate={0.6} />
          <span className="text-sm text-muted">Écoute autant de fois que nécessaire.</span>
        </div>
      )}

      {/* Zone de réponse */}
      <div className="mt-5">
        {ex.kind === "qcm" && (
          <div className="grid gap-2 sm:grid-cols-2">
            {ex.options.map((o) => (
              <button
                key={o}
                disabled={!!verdict}
                onClick={() => {
                  setAnswer(o);
                  check(o);
                }}
                className={clsx(
                  "rounded-xl border px-4 py-3 text-left transition",
                  !verdict && "border-line bg-white/[0.03] hover:bg-white/[0.07]",
                  verdict && o === ex.answer && "border-ok/60 bg-ok/15 text-ok",
                  verdict && o === answer && o !== ex.answer && "border-bad/60 bg-bad/15 text-bad",
                  verdict && o !== ex.answer && o !== answer && "border-line opacity-40"
                )}
              >
                {o}
              </button>
            ))}
          </div>
        )}

        {ex.kind === "ordre" && (
          <>
            <div className="flex min-h-14 flex-wrap gap-2 rounded-2xl border border-dashed border-line2 p-3">
              {picked.map((i) => (
                <button key={i} disabled={!!verdict} onClick={() => setPicked(picked.filter((x) => x !== i))} className="rounded-lg bg-brand/20 px-3 py-1.5 text-[15px] animate-pop">
                  {pool[Number(i)]}
                </button>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {pool.map((w, i) => (
                <button
                  key={i}
                  disabled={picked.includes(String(i)) || !!verdict}
                  onClick={() => setPicked([...picked, String(i)])}
                  className="rounded-lg border border-line bg-white/[0.05] px-3 py-1.5 text-[15px] transition hover:bg-white/[0.1] disabled:opacity-20"
                >
                  {w}
                </button>
              ))}
            </div>
          </>
        )}

        {(ex.kind === "trou" || ex.kind === "traduire" || ex.kind === "dictee") && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              check();
            }}
          >
            <input
              className={clsx("field text-lg", verdict && (ok ? "!border-ok/60" : "!border-bad/60"))}
              placeholder={ex.kind === "trou" ? "Le mot manquant…" : `Ta réponse en ${LANGS[lang].name.toLowerCase()}…`}
              value={answer}
              disabled={!!verdict}
              onChange={(e) => setAnswer(e.target.value)}
              autoFocus
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
            />
          </form>
        )}
      </div>

      {!verdict && ex.kind !== "qcm" && (
        <Button variant="primary" className="mt-4 w-full" onClick={() => check()} disabled={!given.trim()}>
          Vérifier
        </Button>
      )}

      {/* Correction */}
      {verdict && (
        <div className={clsx("mt-5 rounded-2xl border p-4 animate-fade-up", ok ? "border-ok/30 bg-ok/[0.07]" : "border-bad/30 bg-bad/[0.07]")}>
          <p className={clsx("flex items-center gap-2 font-semibold", ok ? "text-ok" : "text-bad")}>
            {ok ? <CheckCircle2 className="size-5" /> : <XCircle className="size-5" />}
            {VERDICT_TEXT[verdict]}
          </p>
          {verdict !== "correct" && (
            <div className="mt-2 flex items-center gap-2">
              <p className="text-sm">
                Réponse attendue : <span className="font-semibold">{ex.answer}</span>
              </p>
              <SpeakButton text={ex.kind === "trou" ? ex.question.replace("___", ex.answer) : ex.answer} lang={lang} size="sm" />
            </div>
          )}
          {ex.translation && <p className="mt-1 text-xs text-faint">{ex.translation}</p>}
          <p className="mt-2 text-sm text-muted">{ex.explanation}</p>
          {judgeNote && <p className="mt-2 rounded-lg bg-black/20 p-2 text-sm">⚖️ {judgeNote}</p>}
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="primary" onClick={() => onDone(ok)}>
              Continuer
            </Button>
            {verdict === "wrong" && (ex.kind === "traduire" || ex.kind === "trou") && !judgeNote && (
              <Button variant="soft" onClick={contest} loading={judging}>
                <Gavel className="size-4" /> Contester
              </Button>
            )}
            {!ok && (
              <Button
                variant="ghost"
                onClick={() => {
                  const front = ex.kind === "trou" ? ex.question.replace("___", ex.answer) : ex.answer;
                  const added = addCard({ front, back: ex.translation || ex.question, note: ex.explanation, source: "exercice" });
                  toast(added ? "Ajouté aux révisions" : "Déjà dans tes révisions", added ? "ok" : "info");
                }}
              >
                <BookmarkPlus className="size-4" /> Réviser
              </Button>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}

export default function Practice() {
  const { settings, addXp } = useStore();
  const [kinds, setKinds] = useState<ExerciseKind[]>(["qcm", "trou", "traduire", "ordre", "dictee"]);
  const [count, setCount] = useState(10);
  const location = useLocation();
  const [theme, setTheme] = useState<string>((location.state as { theme?: string } | null)?.theme ?? "");
  const [items, setItems] = useState<Exercise[] | null>(null);
  const [i, setI] = useState(0);
  const [good, setGood] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await askJson<{ exercises: Exercise[] }>({
        system: exercisesSystem(settings.target, settings.native, settings.level),
        messages: [
          {
            role: "user",
            content: `Create ${count} exercises, mixing these kinds evenly: ${kinds.join(", ")}.${theme.trim() ? ` Theme / grammar focus: ${theme.trim()}.` : " Mixed everyday topics."}`,
          },
        ],
        schema: exercisesSchema,
        effort: "medium",
      });
      const valid = r.exercises.filter((e) => kinds.includes(e.kind) && e.answer && (e.kind !== "qcm" || e.options.includes(e.answer)));
      setItems(valid);
      setI(0);
      setGood(0);
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setLoading(false);
    }
  };

  const done = (ok: boolean) => {
    if (ok) setGood((g) => g + 1);
    addXp(ok ? 4 : 1, "exercises");
    setI((x) => x + 1);
  };

  // ── Session en cours ──
  if (items && i < items.length) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="mb-5 flex items-center gap-3">
          <button onClick={() => setItems(null)} className="text-sm text-muted hover:text-ink">
            Quitter
          </button>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
            <div className="h-full bg-brand-gradient transition-all" style={{ width: `${(i / items.length) * 100}%` }} />
          </div>
          <span className="text-sm text-faint">
            {i + 1}/{items.length}
          </span>
        </div>
        <ExerciseView key={i} ex={items[i]} onDone={done} />
      </div>
    );
  }

  // ── Fin de session ──
  if (items && items.length) {
    const pct = Math.round((good / items.length) * 100);
    return (
      <div className="mx-auto max-w-md">
        <Card className="flex flex-col items-center gap-3 py-10 text-center animate-pop">
          <Trophy className="size-12 text-warn" />
          <p className="font-display text-6xl">{pct}%</p>
          <p className="text-muted">
            {good} bonnes réponses sur {items.length}. {pct >= 90 ? "Solide." : pct >= 60 ? "Correct, mais tu peux mieux faire." : "Il faut retravailler ça. Tes erreurs sont dans le carnet."}
          </p>
          <div className="mt-2 flex gap-2">
            <Button variant="primary" onClick={generate} loading={loading}>
              <RotateCcw className="size-4" /> Nouvelle série
            </Button>
            <Button variant="soft" onClick={() => setItems(null)}>
              Réglages
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // ── Configuration ──
  return (
    <div>
      <PageHeader title="Exercices" subtitle="Des séries générées pour ton niveau, corrigées instantanément." />
      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h2 className="mb-3 text-sm font-semibold">Types d'exercices</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {(Object.keys(EXERCISE_INFO) as ExerciseKind[]).map((k) => {
              const on = kinds.includes(k);
              return (
                <button
                  key={k}
                  onClick={() => setKinds(on ? kinds.filter((x) => x !== k) : [...kinds, k])}
                  className={clsx("rounded-2xl border p-3 text-left transition", on ? "border-brand/60 bg-brand/10" : "border-line bg-white/[0.02] opacity-60 hover:opacity-100")}
                >
                  <span className="text-xl">{EXERCISE_INFO[k].emoji}</span>
                  <p className="mt-1 text-sm font-semibold">{EXERCISE_INFO[k].name}</p>
                  <p className="text-xs text-muted">{EXERCISE_INFO[k].desc}</p>
                </button>
              );
            })}
          </div>

          <h2 className="mb-3 mt-6 text-sm font-semibold">Thème ou point de grammaire (optionnel)</h2>
          <input className="field" placeholder="ex. le subjonctif, les phrasal verbs, le voyage, le travail…" value={theme} onChange={(e) => setTheme(e.target.value)} />

          <h2 className="mb-3 mt-6 text-sm font-semibold">Nombre de questions</h2>
          <div className="flex gap-2">
            {[5, 10, 15].map((n) => (
              <button key={n} onClick={() => setCount(n)} className={clsx("rounded-xl border px-5 py-2 text-sm font-medium transition", count === n ? "border-brand/60 bg-brand/15" : "border-line text-muted")}>
                {n}
              </button>
            ))}
          </div>

          <Button variant="primary" size="lg" className="mt-6 w-full" onClick={generate} loading={loading} disabled={!kinds.length}>
            Générer la série
          </Button>
          {loading && (
            <div className="mt-4">
              <Spinner label="Préparation des exercices…" />
            </div>
          )}
          {error && (
            <div className="mt-4">
              <ErrorBox message={error} onRetry={generate} />
            </div>
          )}
          {items && !items.length && <p className="mt-4 text-sm text-bad">La série générée était invalide, relance.</p>}
        </Card>

        <Card className="h-fit">
          <h2 className="text-sm font-semibold">Comment ça marche</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li>🎯 Adapté à ton niveau ({settings.level}) en {LANGS[settings.target].name.toLowerCase()}.</li>
            <li>🧠 Chaque faute part dans ton carnet d'erreurs.</li>
            <li>⚖️ Une traduction différente mais juste ? Conteste, l'IA arbitre.</li>
            <li>📌 Ajoute ce que tu rates à tes révisions espacées.</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}

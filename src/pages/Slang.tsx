import { useMemo, useState } from "react";
import clsx from "clsx";
import { BookmarkPlus, Check, RotateCcw, Search, Sparkles, Trophy, Wand2 } from "lucide-react";
import { askJson, friendlyError } from "../lib/claude";
import { slangSchema, slangSystem } from "../lib/prompts";
import { LANGS } from "../lib/languages";
import { SLANG, SLANG_CATEGORIES, type Register, type Slang } from "../data/slang";
import { useStore } from "../store/useStore";
import { Badge, Button, Card, ErrorBox, PageHeader, Segmented, SpeakButton, Spinner, toast } from "../components/ui";

const REG_TONE: Record<string, "neutral" | "warn" | "bad" | "brand"> = { courant: "neutral", familier: "warn", argot: "brand", vulgaire: "bad" };

function shuffle<T>(a: T[]): T[] {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

function SlangCard({ s, known, onToggle }: { s: Slang; known?: boolean; onToggle?: () => void }) {
  const addCard = useStore((st) => st.addCard);
  return (
    <Card className={clsx("flex flex-col p-4 transition", known && "opacity-60")}>
      <div className="flex items-start gap-2">
        <h3 className="flex-1 text-lg font-semibold leading-snug">{s.expr}</h3>
        <SpeakButton text={s.expr} lang={s.lang} size="sm" />
      </div>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        <Badge tone={REG_TONE[s.register] ?? "neutral"}>{s.register}</Badge>
        {s.region && s.region !== "Partout" && <Badge>📍 {s.region}</Badge>}
      </div>
      <p className="mt-3 text-sm text-ink">{s.meaning}</p>
      {s.literal && <p className="mt-1 text-xs text-faint">Mot à mot : « {s.literal} »</p>}
      <div className="mt-3 flex-1 rounded-xl bg-black/20 p-3 text-sm">
        <div className="flex items-start gap-2">
          <p className="flex-1 italic">{s.example}</p>
          <SpeakButton text={s.example} lang={s.lang} size="sm" />
        </div>
        <p className="mt-1 text-xs text-faint">{s.exampleTr}</p>
      </div>
      <div className="mt-3 flex items-center gap-1">
        {onToggle && (
          <button onClick={onToggle} className={clsx("flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition", known ? "bg-ok/15 text-ok" : "text-muted hover:bg-white/[0.06]")}>
            <Check className="size-3.5" /> {known ? "Je connais" : "Marquer comme connue"}
          </button>
        )}
        <button
          onClick={() => {
            const ok = addCard({ front: s.expr, back: s.meaning, note: `${s.example}\n${s.exampleTr}`, source: "argot", lang: s.lang });
            toast(ok ? "Ajoutée aux révisions" : "Déjà dans tes révisions", ok ? "ok" : "info");
          }}
          className="ml-auto flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium text-violet-300 hover:bg-white/[0.06]"
        >
          <BookmarkPlus className="size-3.5" /> Réviser
        </button>
      </div>
    </Card>
  );
}

// ───────────────────────────── Quiz ─────────────────────────────

interface Q {
  s: Slang;
  reverse: boolean;
  options: string[];
  answer: string;
}

function makeQuiz(list: Slang[]): Q[] {
  return shuffle(list)
    .slice(0, 10)
    .map((s, i) => {
      const reverse = i % 2 === 1;
      const others = shuffle(list.filter((x) => x.id !== s.id)).slice(0, 3);
      const answer = reverse ? s.expr : s.meaning;
      return { s, reverse, answer, options: shuffle([answer, ...others.map((o) => (reverse ? o.expr : o.meaning))]) };
    });
}

function Quiz({ list }: { list: Slang[] }) {
  const addXp = useStore((s) => s.addXp);
  const [quiz, setQuiz] = useState(() => makeQuiz(list));
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [good, setGood] = useState(0);

  const q = quiz[i];
  const done = i >= quiz.length;

  const pick = (o: string) => {
    if (picked) return;
    setPicked(o);
    if (o === q.answer) {
      setGood((g) => g + 1);
      addXp(2, "exercises");
    }
  };

  if (done) {
    const pct = Math.round((good / quiz.length) * 100);
    return (
      <Card className="flex flex-col items-center gap-3 py-10 text-center animate-pop">
        <Trophy className="size-10 text-warn" />
        <p className="font-display text-5xl">
          {good}/{quiz.length}
        </p>
        <p className="text-muted">{pct === 100 ? "Parfait. Tu parles comme un local." : pct >= 70 ? "Pas mal, mais il reste des trous." : "Insuffisant. Retourne réviser les fiches."}</p>
        <Button
          variant="primary"
          onClick={() => {
            setQuiz(makeQuiz(list));
            setI(0);
            setGood(0);
            setPicked(null);
          }}
        >
          <RotateCcw className="size-4" /> Rejouer
        </Button>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
        <div className="h-full bg-brand-gradient transition-all" style={{ width: `${(i / quiz.length) * 100}%` }} />
      </div>
      <Card key={i} className="animate-fade-up">
        <p className="text-xs text-faint">{q.reverse ? "Quelle expression veut dire…" : "Que veut dire…"}</p>
        <div className="mt-2 flex items-start gap-2">
          <p className="flex-1 font-display text-3xl leading-tight">{q.reverse ? q.s.meaning : q.s.expr}</p>
          {!q.reverse && <SpeakButton text={q.s.expr} lang={q.s.lang} />}
        </div>
        <div className="mt-5 grid gap-2">
          {q.options.map((o) => (
            <button
              key={o}
              onClick={() => pick(o)}
              className={clsx(
                "rounded-xl border px-4 py-3 text-left text-sm transition",
                !picked && "border-line bg-white/[0.03] hover:bg-white/[0.07]",
                picked && o === q.answer && "border-ok/60 bg-ok/15 text-ok",
                picked && o === picked && o !== q.answer && "border-bad/60 bg-bad/15 text-bad",
                picked && o !== q.answer && o !== picked && "border-line opacity-50"
              )}
            >
              {o}
            </button>
          ))}
        </div>
        {picked && (
          <div className="mt-4 animate-fade-up">
            <p className="rounded-xl bg-black/20 p-3 text-sm italic">
              {q.s.example} <span className="mt-1 block text-xs not-italic text-faint">{q.s.exampleTr}</span>
            </p>
            <Button
              variant="primary"
              className="mt-4 w-full"
              onClick={() => {
                setI(i + 1);
                setPicked(null);
              }}
            >
              Continuer
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}

// ───────────────────────────── Génération IA ─────────────────────────────

const THEMES = ["Au travail", "En soirée", "Sur les réseaux", "Pour râler", "Pour draguer", "Avec des animaux", "Au téléphone", "Pour encourager", "Argent", "Nourriture"];

function Generator({ existing }: { existing: Slang[] }) {
  const settings = useStore((s) => s.settings);
  const [theme, setTheme] = useState("");
  const [items, setItems] = useState<Slang[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (t: string) => {
    setTheme(t);
    setLoading(true);
    setError(null);
    try {
      const exclude = [...existing, ...items].map((s) => s.expr).join(" | ");
      const r = await askJson<{ items: Omit<Slang, "id" | "lang" | "category">[] }>({
        system: slangSystem(settings.target, settings.native, settings.level),
        messages: [{ role: "user", content: `Theme: ${t}\nExcluded: ${exclude}` }],
        schema: slangSchema,
      });
      const fresh = r.items.map((x, i) => ({ ...x, register: x.register as Register, id: `ai-${Date.now()}-${i}`, lang: settings.target, category: t }));
      setItems((prev) => [...fresh, ...prev]);
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <Card>
        <p className="text-sm text-muted">Choisis un thème : l'IA te sort des expressions que les natifs utilisent vraiment, avec la région où elles se disent.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {THEMES.map((t) => (
            <button key={t} onClick={() => run(t)} disabled={loading} className="rounded-full border border-line bg-white/[0.04] px-3 py-1.5 text-sm transition hover:border-brand/50 hover:bg-brand/10 disabled:opacity-50">
              {t}
            </button>
          ))}
        </div>
        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (theme.trim()) run(theme.trim());
          }}
        >
          <input className="field" placeholder="Ou un thème perso : le foot, les jeux vidéo…" value={theme} onChange={(e) => setTheme(e.target.value)} />
          <Button variant="primary" type="submit" loading={loading} disabled={!theme.trim()}>
            <Wand2 className="size-4" />
          </Button>
        </form>
      </Card>
      {loading && (
        <Card>
          <Spinner label="Recherche d'expressions authentiques…" />
        </Card>
      )}
      {error && <ErrorBox message={error} />}
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {items.map((s) => (
          <SlangCard key={s.id} s={s} />
        ))}
      </div>
    </div>
  );
}

// ───────────────────────────── Page ─────────────────────────────

export default function SlangPage() {
  const { settings, progress, toggleSlang } = useStore();
  const all = SLANG[settings.target];
  const [tab, setTab] = useState<"fiches" | "quiz" | "ia">("fiches");
  const [cat, setCat] = useState<string>("Toutes");
  const [q, setQ] = useState("");
  const [hideKnown, setHideKnown] = useState(false);

  const known = progress.knownSlang;
  const filtered = useMemo(
    () =>
      all.filter(
        (s) =>
          (cat === "Toutes" || s.category === cat) &&
          (!hideKnown || !known.includes(s.id)) &&
          (!q || (s.expr + " " + s.meaning).toLowerCase().includes(q.toLowerCase()))
      ),
    [all, cat, q, hideKnown, known]
  );
  const knownCount = all.filter((s) => known.includes(s.id)).length;

  return (
    <div>
      <PageHeader
        title="Argot & expressions"
        subtitle={`Le ${LANGS[settings.target].name.toLowerCase()} qu'on parle vraiment — pas celui des manuels.`}
        right={
          <div className="text-right">
            <p className="text-2xl font-bold">
              {knownCount}
              <span className="text-base text-faint">/{all.length}</span>
            </p>
            <p className="text-xs text-muted">expressions connues</p>
          </div>
        }
      />

      <Segmented
        className="mb-5 w-fit"
        value={tab}
        onChange={setTab}
        options={[
          { value: "fiches", label: "Fiches" },
          { value: "quiz", label: "Quiz" },
          { value: "ia", label: <><Sparkles className="size-4" /> Plus avec l'IA</> },
        ]}
      />

      {tab === "fiches" && (
        <>
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative md:w-72">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint" />
              <input className="field pl-9" placeholder="Chercher…" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <label className="flex items-center gap-2 text-sm text-muted">
              <input type="checkbox" className="accent-violet-500" checked={hideKnown} onChange={(e) => setHideKnown(e.target.checked)} />
              Masquer celles que je connais
            </label>
          </div>
          <div className="no-scrollbar -mx-4 mb-5 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0">
            {["Toutes", ...SLANG_CATEGORIES.filter((c) => all.some((s) => s.category === c))].map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={clsx("shrink-0 rounded-full border px-3 py-1.5 text-sm transition", cat === c ? "border-brand/60 bg-brand/15 text-ink" : "border-line text-muted hover:text-ink")}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((s) => (
              <SlangCard key={s.id} s={s} known={known.includes(s.id)} onToggle={() => toggleSlang(s.id)} />
            ))}
          </div>
          {!filtered.length && <p className="py-10 text-center text-sm text-muted">Rien ici.</p>}
        </>
      )}
      {tab === "quiz" && <Quiz key={settings.target} list={all} />}
      {tab === "ia" && <Generator key={settings.target} existing={all} />}
    </div>
  );
}

import { useState } from "react";
import clsx from "clsx";
import { ArrowLeftRight, BookmarkPlus, Copy, FileCheck2, Languages, Mic, MicOff, Sparkles } from "lucide-react";
import { askJson, friendlyError } from "../lib/claude";
import { correctorSchema, correctorSystem, translateSchema, translateSystem } from "../lib/prompts";
import { LANG_LIST, LANGS, type LangCode } from "../lib/languages";
import { useSpeechRecognition } from "../lib/speech";
import { useStore, type Correction } from "../store/useStore";
import { Badge, Button, Card, ErrorBox, PageHeader, Segmented, SpeakButton, Spinner, toast } from "../components/ui";
import { CorrectionView } from "../components/Correction";

interface TranslateResult {
  detected: string;
  translation: string;
  literal: string;
  alignment: { source: string; target: string; note: string }[];
  alternatives: { text: string; register: string; note: string }[];
  vocabulary: { term: string; translation: string; kind: string; example: string }[];
  notes: string[];
  examples: { source: string; target: string }[];
}

interface CorrectorResult {
  correction: Correction;
  cefr: string;
  feedback: string;
}

const REGISTER_TONE: Record<string, "neutral" | "brand" | "warn" | "bad"> = {
  formel: "brand",
  courant: "neutral",
  familier: "warn",
  argot: "bad",
};

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-faint">{children}</h3>;
}

// ───────────────────────────── Traduction ─────────────────────────────

function Translator() {
  const { settings, addXp, addCard } = useStore();
  const [from, setFrom] = useState<LangCode | "auto">(settings.native);
  const [to, setTo] = useState<LangCode>(settings.target);
  const [text, setText] = useState("");
  const [res, setRes] = useState<TranslateResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const stt = useSpeechRecognition(from === "auto" ? settings.native : from, true);

  const run = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    setSelected(null);
    try {
      const r = await askJson<TranslateResult>({
        system: translateSystem(from, to, settings.native, settings.level),
        messages: [{ role: "user", content: text.trim() }],
        schema: translateSchema,
      });
      setRes(r);
      addXp(3, "translations");
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setLoading(false);
    }
  };

  const swap = () => {
    if (from === "auto") return;
    setFrom(to);
    setTo(from);
    if (res) setText(res.translation);
    setRes(null);
  };

  const save = (front: string, back: string, note?: string) => {
    const lang = to;
    const ok = addCard({ front, back, note, source: "traduction", lang });
    toast(ok ? "Ajouté aux révisions" : "Déjà dans tes révisions", ok ? "ok" : "info");
  };

  const dictate = async () => {
    if (stt.listening) return stt.stop();
    const r = await stt.start();
    if (r.transcript) setText((t) => (t ? t + " " : "") + r.transcript);
  };

  return (
    <div className="space-y-5">
      <Card className="p-0">
        <div className="flex items-center gap-2 border-b border-line p-3">
          <select className="field !w-auto flex-1 !py-2" value={from} onChange={(e) => setFrom(e.target.value as LangCode | "auto")}>
            <option value="auto">🌐 Détecter</option>
            {LANG_LIST.map((l) => (
              <option key={l.code} value={l.code}>
                {l.flag} {l.name}
              </option>
            ))}
          </select>
          <button onClick={swap} disabled={from === "auto"} aria-label="Inverser" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-muted transition hover:rotate-180 hover:text-ink disabled:opacity-30">
            <ArrowLeftRight className="size-4" />
          </button>
          <select className="field !w-auto flex-1 !py-2" value={to} onChange={(e) => setTo(e.target.value as LangCode)}>
            {LANG_LIST.map((l) => (
              <option key={l.code} value={l.code}>
                {l.flag} {l.name}
              </option>
            ))}
          </select>
        </div>
        <textarea
          value={stt.listening ? stt.interim : text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) run();
          }}
          placeholder="Tape ou dicte un mot, une phrase, un texte…"
          rows={4}
          className="w-full resize-none bg-transparent p-4 text-lg outline-none placeholder:text-faint"
        />
        <div className="flex items-center gap-2 border-t border-line p-3">
          {stt.supported && (
            <button
              onClick={dictate}
              aria-label="Dicter"
              className={clsx("flex size-10 items-center justify-center rounded-full transition", stt.listening ? "animate-pulse-ring bg-brand2 text-white" : "bg-white/[0.06] text-muted hover:text-ink")}
            >
              {stt.listening ? <MicOff className="size-4" /> : <Mic className="size-4" />}
            </button>
          )}
          <span className="text-xs text-faint">{text.length} car.</span>
          <span className="hidden text-xs text-faint md:inline">· Ctrl + Entrée</span>
          <Button variant="primary" className="ml-auto" onClick={run} loading={loading} disabled={!text.trim()}>
            <Languages className="size-4" /> Traduire
          </Button>
        </div>
      </Card>

      {stt.error && <p className="text-xs text-bad">{stt.error}</p>}
      {error && <ErrorBox message={error} onRetry={run} />}
      {loading && !res && (
        <Card>
          <Spinner label="Analyse mot à mot en cours…" />
        </Card>
      )}

      {res && (
        <div className={clsx("space-y-5 transition", loading && "opacity-50")}>
          {/* Traduction principale */}
          <Card className="relative overflow-hidden animate-fade-up">
            <div className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-violet-500/15 blur-3xl" />
            <div className="flex items-center gap-2">
              <Badge tone="brand">
                {LANGS[to].flag} {LANGS[to].name}
              </Badge>
              {from === "auto" && <Badge>détecté : {res.detected}</Badge>}
            </div>
            <p className="mt-3 font-display text-3xl leading-snug md:text-4xl">{res.translation}</p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <SpeakButton text={res.translation} lang={to} />
              <SpeakButton text={res.translation} lang={to} rate={0.6} />
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  navigator.clipboard?.writeText(res.translation);
                  toast("Copié");
                }}
              >
                <Copy className="size-4" /> Copier
              </Button>
              <Button size="sm" variant="ghost" onClick={() => save(res.translation, text.trim())}>
                <BookmarkPlus className="size-4" /> Réviser
              </Button>
            </div>
          </Card>

          {/* Mot à mot */}
          <Card className="animate-fade-up">
            <SectionTitle>Mot à mot · touche un bloc pour l'explication</SectionTitle>
            <div className="flex flex-wrap gap-2">
              {res.alignment.map((a, i) => (
                <button
                  key={i}
                  onClick={() => setSelected(selected === i ? null : i)}
                  className={clsx(
                    "flex min-w-14 flex-col items-center rounded-xl border px-3 py-2 text-center transition",
                    selected === i ? "border-brand/70 bg-brand/15" : "border-line bg-white/[0.03] hover:bg-white/[0.07]"
                  )}
                >
                  <span className="text-[15px] font-medium">{a.source}</span>
                  <span className="mt-1 h-px w-full bg-line2" />
                  <span className={clsx("mt-1 text-sm", a.target === "∅" ? "text-faint" : "text-violet-300")}>{a.target}</span>
                </button>
              ))}
            </div>
            {selected !== null && res.alignment[selected]?.note && (
              <p className="mt-3 rounded-xl bg-black/25 p-3 text-sm text-muted animate-fade-up">
                <span className="font-semibold text-ink">{res.alignment[selected].source}</span> — {res.alignment[selected].note}
              </p>
            )}
            {res.literal && (
              <div className="mt-4 rounded-xl border border-dashed border-line2 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-faint">Traduction littérale</p>
                <p className="mt-1 text-sm italic text-muted">{res.literal}</p>
              </div>
            )}
          </Card>

          <div className="grid gap-5 md:grid-cols-2">
            {res.alternatives.length > 0 && (
              <Card className="animate-fade-up">
                <SectionTitle>Autres façons de le dire</SectionTitle>
                <ul className="space-y-3">
                  {res.alternatives.map((a, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">{a.text}</span>
                          <Badge tone={REGISTER_TONE[a.register] ?? "neutral"}>{a.register}</Badge>
                        </div>
                        {a.note && <p className="mt-0.5 text-xs text-muted">{a.note}</p>}
                      </div>
                      <SpeakButton text={a.text} lang={to} size="sm" />
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {res.vocabulary.length > 0 && (
              <Card className="animate-fade-up">
                <SectionTitle>Vocabulaire à retenir</SectionTitle>
                <ul className="space-y-3">
                  {res.vocabulary.map((v, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <div className="flex-1">
                        <p>
                          <span className="font-semibold">{v.term}</span> <span className="text-xs text-faint">· {v.kind}</span>
                        </p>
                        <p className="text-sm text-muted">{v.translation}</p>
                        <p className="mt-0.5 text-xs italic text-faint">{v.example}</p>
                      </div>
                      <SpeakButton text={v.term} lang={to} size="sm" />
                      <button onClick={() => save(v.term, v.translation, v.example)} aria-label="Ajouter aux révisions" className="flex size-7 items-center justify-center rounded-full bg-white/[0.06] text-violet-300 hover:bg-white/[0.12]">
                        <BookmarkPlus className="size-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </div>

          {res.notes.length > 0 && (
            <Card className="animate-fade-up">
              <SectionTitle>Points de grammaire & pièges</SectionTitle>
              <ul className="space-y-2 text-sm">
                {res.notes.map((n, i) => (
                  <li key={i} className="flex gap-2">
                    <Sparkles className="mt-0.5 size-4 shrink-0 text-warn" />
                    <span className="text-muted">{n}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {res.examples.length > 0 && (
            <Card className="animate-fade-up">
              <SectionTitle>En contexte</SectionTitle>
              <ul className="divide-y divide-line">
                {res.examples.map((ex, i) => (
                  <li key={i} className="grid gap-1 py-2.5 md:grid-cols-2 md:gap-4">
                    <p className="text-sm text-muted">{ex.source}</p>
                    <div className="flex items-start gap-2">
                      <p className="flex-1 text-sm">{ex.target}</p>
                      <SpeakButton text={ex.target} lang={to} size="sm" />
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

// ───────────────────────────── Correcteur ─────────────────────────────

function Corrector() {
  const { settings, addXp, addMistakes } = useStore();
  const [text, setText] = useState("");
  const [res, setRes] = useState<CorrectorResult | null>(null);
  const [submitted, setSubmitted] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lang = settings.target;

  const run = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const r = await askJson<CorrectorResult>({
        system: correctorSystem(lang, settings.native, settings.level, settings.strictness),
        messages: [{ role: "user", content: text.trim() }],
        schema: correctorSchema,
        effort: "medium",
      });
      setRes(r);
      setSubmitted(text.trim());
      addXp(10, "translations");
      if (r.correction.errors.length) addMistakes(text.trim(), r.correction.errors);
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <Card className="p-0">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`Écris un texte en ${LANGS[lang].name.toLowerCase()} (un mail, un message, une rédaction…) : il sera corrigé sans pitié.`}
          rows={7}
          className="w-full resize-y bg-transparent p-4 text-base outline-none placeholder:text-faint"
        />
        <div className="flex items-center gap-2 border-t border-line p-3">
          <span className="text-xs text-faint">{text.trim() ? text.trim().split(/\s+/).length : 0} mots</span>
          <Button variant="primary" className="ml-auto" onClick={run} loading={loading} disabled={!text.trim()}>
            <FileCheck2 className="size-4" /> Corriger
          </Button>
        </div>
      </Card>

      {error && <ErrorBox message={error} onRetry={run} />}

      {res && (
        <div className="space-y-5 animate-fade-up">
          <Card>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-brand-gradient text-xl font-bold text-white">{res.cefr}</div>
              <div className="flex-1">
                <p className="text-sm font-semibold">Niveau démontré par ce texte</p>
                <p className="text-sm text-muted">{res.feedback}</p>
              </div>
            </div>
          </Card>
          <CorrectionView c={res.correction} lang={lang} original={submitted} />
        </div>
      )}
    </div>
  );
}

export default function Translate() {
  const [tab, setTab] = useState<"traduire" | "corriger">("traduire");
  return (
    <div>
      <PageHeader title="Traduire" subtitle="Traduction naturelle, mot à mot, registres et correcteur de texte." />
      <Segmented
        className="mb-5 w-fit"
        value={tab}
        onChange={setTab}
        options={[
          { value: "traduire", label: <><Languages className="size-4" /> Traduction</> },
          { value: "corriger", label: <><FileCheck2 className="size-4" /> Correcteur</> },
        ]}
      />
      {tab === "traduire" ? <Translator /> : <Corrector />}
    </div>
  );
}

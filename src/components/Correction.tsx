import { useState } from "react";
import clsx from "clsx";
import { BookmarkPlus, CheckCircle2, ChevronDown, Lightbulb, Sparkles, XCircle } from "lucide-react";
import type { Correction } from "../store/useStore";
import { useStore } from "../store/useStore";
import type { LangCode } from "../lib/languages";
import { ScorePill, SpeakButton, toast } from "./ui";

const TYPE_COLORS: Record<string, string> = {
  grammaire: "text-brand",
  conjugaison: "text-brand",
  vocabulaire: "text-warn",
  orthographe: "text-bad",
  accents: "text-bad",
  naturel: "text-brand",
  registre: "text-brand",
  "faux ami": "text-brand2",
};

/** Affiche une correction détaillée : erreurs, version corrigée, version native, astuce. */
export function CorrectionView({ c, lang, original, compact }: { c: Correction; lang: LangCode; original: string; compact?: boolean }) {
  const [open, setOpen] = useState(!compact);
  const addCard = useStore((s) => s.addCard);

  if (c.score < 0) return null;

  const saveCard = () => {
    const ok = addCard({
      front: c.natural || c.corrected,
      back: original,
      note: c.errors.map((e) => `${e.wrong} → ${e.right} : ${e.explanation}`).join("\n"),
      source: "coach",
      lang,
    });
    toast(ok ? "Ajouté à tes révisions" : "Déjà dans tes révisions", ok ? "ok" : "info");
  };

  if (c.isCorrect && !c.errors.length) {
    return (
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-ok/25 bg-ok/[0.07] px-3 py-2 text-xs">
        <CheckCircle2 className="size-4 text-ok" />
        <span className="text-ok">Aucune faute.</span>
        <ScorePill score={c.score} />
        {c.natural && c.natural.trim() !== original.trim() && (
          <span className="text-muted">
            Plus naturel : <span className="text-ink">{c.natural}</span>
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-bad/25 bg-bad/[0.05] text-sm">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs">
        <XCircle className="size-4 shrink-0 text-bad" />
        <span className="font-medium text-bad">
          {c.errors.length} faute{c.errors.length > 1 ? "s" : ""}
        </span>
        <ScorePill score={c.score} />
        <span className="ml-auto flex items-center gap-1 text-muted">
          {open ? "Masquer" : "Voir la correction"}
          <ChevronDown className={clsx("size-3.5 transition", open && "rotate-180")} />
        </span>
      </button>

      {open && (
        <div className="space-y-3 border-t border-bad/15 px-3 pb-3 pt-3 animate-fade-up">
          <ul className="space-y-2">
            {c.errors.map((e, i) => (
              <li key={i} className="rounded-lg bg-sunk p-2.5">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="text-bad line-through decoration-bad/60">{e.wrong}</span>
                  <span className="text-faint">→</span>
                  <span className="font-medium text-ok">{e.right}</span>
                  <span className={clsx("ml-auto text-xs font-semibold uppercase tracking-wider", TYPE_COLORS[e.type] ?? "text-muted")}>
                    {e.type}
                  </span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-muted">{e.explanation}</p>
              </li>
            ))}
          </ul>

          {c.corrected && (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-faint">Corrigé</p>
              <div className="flex items-start gap-2">
                <p className="flex-1 text-ink">{c.corrected}</p>
                <SpeakButton text={c.corrected} lang={lang} size="sm" />
              </div>
            </div>
          )}
          {c.natural && c.natural !== c.corrected && (
            <div>
              <p className="mb-1 flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-brand">
                <Sparkles className="size-3" /> Comme un natif
              </p>
              <div className="flex items-start gap-2">
                <p className="flex-1 text-ink">{c.natural}</p>
                <SpeakButton text={c.natural} lang={lang} size="sm" />
              </div>
            </div>
          )}
          {c.tip && (
            <div className="flex gap-2 rounded-lg bg-warn/10 p-2.5 text-xs text-ink">
              <Lightbulb className="size-4 shrink-0 text-warn" />
              {c.tip}
            </div>
          )}
          <button onClick={saveCard} className="flex items-center gap-1.5 text-xs font-medium text-brand hover:text-brand">
            <BookmarkPlus className="size-3.5" /> Ajouter aux révisions
          </button>
        </div>
      )}
    </div>
  );
}

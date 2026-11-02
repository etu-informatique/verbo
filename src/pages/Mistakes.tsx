import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import clsx from "clsx";
import { BookOpenCheck, BookmarkPlus, Dumbbell, Trash2 } from "lucide-react";
import { useStore } from "../store/useStore";
import { Button, Card, EmptyState, IconButton, PageHeader, toast } from "../components/ui";

export default function Mistakes() {
  const { mistakes, settings, deleteMistake, addCard } = useStore();
  const navigate = useNavigate();
  const [type, setType] = useState<string | null>(null);

  const mine = useMemo(() => mistakes.filter((m) => m.lang === settings.target), [mistakes, settings.target]);
  const byType = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const m of mine) counts[m.type] = (counts[m.type] ?? 0) + 1;
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [mine]);
  const list = type ? mine.filter((m) => m.type === type) : mine;
  const max = byType[0]?.[1] ?? 1;

  const train = () => {
    const sample = mine
      .slice(0, 12)
      .map((m) => `"${m.wrong}" → "${m.right}" (${m.type})`)
      .join("; ");
    navigate("/exercices", { state: { theme: `Target the learner's recurring mistakes: ${sample}` } });
  };

  return (
    <div>
      <PageHeader
        title="Carnet d'erreurs"
        subtitle="Toutes tes fautes, classées. Ce qui revient ici, c'est ce qu'il faut travailler."
        right={
          mine.length > 0 && (
            <Button variant="primary" onClick={train}>
              <Dumbbell className="size-4" /> M'entraîner dessus
            </Button>
          )
        }
      />

      {mine.length === 0 ? (
        <Card>
          <EmptyState icon={<BookOpenCheck className="size-6" />} title="Aucune erreur enregistrée">
            Tes fautes dans le coach, le correcteur et les exercices apparaîtront ici automatiquement.
          </EmptyState>
        </Card>
      ) : (
        <div className="grid gap-5 lg:grid-cols-3">
          <Card className="h-fit">
            <p className="text-sm font-semibold">Tes points faibles</p>
            <ul className="mt-4 space-y-2.5">
              {byType.map(([t, n]) => (
                <li key={t}>
                  <button onClick={() => setType(type === t ? null : t)} className={clsx("w-full text-left transition", type && type !== t && "opacity-40")}>
                    <div className="flex justify-between text-sm">
                      <span className="capitalize">{t}</span>
                      <span className="font-semibold">{n}</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                      <div className="h-full rounded-full bg-brand-gradient" style={{ width: `${(n / max) * 100}%` }} />
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </Card>

          <div className="space-y-3 lg:col-span-2">
            {list.map((m) => (
              <Card key={m.id} className="p-4 animate-fade-up">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="text-bad line-through decoration-bad/60">{m.wrong}</span>
                  <span className="text-faint">→</span>
                  <span className="font-semibold text-ok">{m.right}</span>
                  <span className="ml-auto text-[10px] font-semibold uppercase tracking-wider text-violet-300">{m.type}</span>
                </div>
                <p className="mt-1.5 text-sm text-muted">{m.explanation}</p>
                {m.sentence !== m.wrong && <p className="mt-2 truncate text-xs italic text-faint">« {m.sentence} »</p>}
                <div className="mt-2 flex items-center gap-1">
                  <span className="text-[11px] text-faint">{new Date(m.at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</span>
                  <button
                    onClick={() => {
                      const ok = addCard({ front: m.right, back: `✗ ${m.wrong}`, note: m.explanation, source: "coach" });
                      toast(ok ? "Ajouté aux révisions" : "Déjà dans tes révisions", ok ? "ok" : "info");
                    }}
                    className="ml-auto flex items-center gap-1 rounded-full px-2 py-1 text-xs text-violet-300 hover:bg-white/[0.06]"
                  >
                    <BookmarkPlus className="size-3.5" /> Réviser
                  </button>
                  <IconButton label="Supprimer" onClick={() => deleteMistake(m.id)} className="size-7">
                    <Trash2 className="size-3.5" />
                  </IconButton>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

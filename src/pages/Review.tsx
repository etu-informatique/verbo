import { useMemo, useState } from "react";
import clsx from "clsx";
import { CheckCircle2, Layers, Plus, Search, Trash2 } from "lucide-react";
import { LANGS } from "../lib/languages";
import { previewInterval, type Grade } from "../lib/srs";
import { checkAnswer } from "../lib/score";
import { useStore, type Card as CardT } from "../store/useStore";
import { Badge, Button, Card, EmptyState, IconButton, Modal, PageHeader, Segmented, SpeakButton, toast } from "../components/ui";

const GRADES: { g: Grade; label: string; cls: string }[] = [
  { g: 0, label: "À revoir", cls: "border-bad/40 text-bad hover:bg-bad/10" },
  { g: 1, label: "Difficile", cls: "border-warn/40 text-warn hover:bg-warn/10" },
  { g: 2, label: "Bien", cls: "border-ok/40 text-ok hover:bg-ok/10" },
  { g: 3, label: "Facile", cls: "border-brand/40 text-brand hover:bg-brand-soft" },
];

function Session({ cards, onExit }: { cards: CardT[]; onExit: () => void }) {
  const { reviewCard, addXp, settings } = useStore();
  const [queue, setQueue] = useState(cards.map((c) => c.id));
  const [flipped, setFlipped] = useState(false);
  const [mode, setMode] = useState<"reco" | "ecrit">("reco");
  const [typed, setTyped] = useState("");
  const [count, setCount] = useState(0);
  const all = useStore((s) => s.cards);

  const card = all.find((c) => c.id === queue[0]);

  if (!card) {
    return (
      <Card className="flex flex-col items-center gap-3 py-12 text-center animate-pop">
        <CheckCircle2 className="size-12 text-ok" />
        <p className="font-extrabold tracking-tight text-4xl">Session terminée</p>
        <p className="text-muted">{count} cartes révisées. Reviens demain pour la suite.</p>
        <Button variant="primary" onClick={onExit}>
          Retour
        </Button>
      </Card>
    );
  }

  const grade = (g: Grade) => {
    reviewCard(card.id, g);
    addXp(1, "reviews");
    setCount((c) => c + 1);
    setFlipped(false);
    setTyped("");
    // Une carte ratée revient en fin de file
    setQueue((q) => (g === 0 ? [...q.slice(1), q[0]] : q.slice(1)));
  };

  const verdict = mode === "ecrit" && flipped ? checkAnswer(typed, [card.front], settings.strictness) : null;
  const prompt = mode === "reco" ? card.front : card.back;
  const answer = mode === "reco" ? card.back : card.front;

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-4 flex items-center gap-3">
        <button onClick={onExit} className="text-sm text-muted hover:text-ink">
          Quitter
        </button>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-sunk">
          <div className="h-full bg-brand transition-all" style={{ width: `${(count / (count + queue.length)) * 100}%` }} />
        </div>
        <span className="text-sm text-faint">{queue.length} restantes</span>
      </div>
      <Segmented
        className="mb-4 w-fit"
        value={mode}
        onChange={(m) => {
          setMode(m);
          setFlipped(false);
          setTyped("");
        }}
        options={[
          { value: "reco", label: "Comprendre" },
          { value: "ecrit", label: "Produire (écrit)" },
        ]}
      />

      <div className="flip">
        <div
          className={clsx("flip-inner relative min-h-72 cursor-pointer", flipped && "flipped")}
          onClick={() => mode === "reco" && setFlipped(!flipped)}
        >
          <div className="flip-face card absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
            <Badge className="absolute left-4 top-4">{card.source}</Badge>
            <p className="font-extrabold tracking-tight text-3xl leading-snug md:text-4xl">{prompt}</p>
            {mode === "reco" && <SpeakButton text={card.front} lang={card.lang} className="mt-4" />}
            {mode === "reco" && <p className="absolute bottom-4 text-xs text-faint">Touche pour retourner</p>}
          </div>
          <div className="flip-face flip-back card absolute inset-0 flex flex-col items-center justify-center overflow-y-auto p-6 text-center">
            <p className="text-sm text-faint">{prompt}</p>
            <p className="mt-3 font-extrabold tracking-tight text-3xl leading-snug md:text-4xl">{answer}</p>
            {mode === "ecrit" && <SpeakButton text={card.front} lang={card.lang} className="mt-3" />}
            {card.note && <p className="mt-4 whitespace-pre-line text-sm text-muted">{card.note}</p>}
          </div>
        </div>
      </div>

      {mode === "ecrit" && !flipped && (
        <form
          className="mt-4 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            setFlipped(true);
          }}
        >
          <input className="field" autoFocus value={typed} onChange={(e) => setTyped(e.target.value)} placeholder={`En ${LANGS[card.lang].name.toLowerCase()}…`} autoCapitalize="off" autoCorrect="off" spellCheck={false} />
          <Button variant="primary" type="submit">
            Vérifier
          </Button>
        </form>
      )}
      {verdict && (
        <p className={clsx("mt-3 text-center text-sm font-medium", verdict === "correct" ? "text-ok" : verdict === "wrong" ? "text-bad" : "text-warn")}>
          {verdict === "correct" ? "Exact." : verdict === "wrong" ? `Faux — tu as écrit « ${typed || "…"} »` : "Presque : vérifie l'orthographe / les accents."}
        </p>
      )}

      {flipped ? (
        <div className="mt-5 grid grid-cols-4 gap-2 animate-fade-up">
          {GRADES.map(({ g, label, cls }) => (
            <button key={g} onClick={() => grade(g)} className={clsx("flex flex-col items-center rounded-2xl border bg-sunk py-3 text-sm font-medium transition active:scale-95", cls)}>
              {label}
              <span className="mt-0.5 text-xs opacity-70">{previewInterval(card, g)}</span>
            </button>
          ))}
        </div>
      ) : (
        mode === "reco" && (
          <Button variant="primary" size="lg" className="mt-5 w-full" onClick={() => setFlipped(true)}>
            Voir la réponse
          </Button>
        )
      )}
    </div>
  );
}

function AddCardModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { addCard, settings } = useStore();
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [note, setNote] = useState("");
  return (
    <Modal open={open} onClose={onClose} title="Nouvelle carte">
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (!front.trim() || !back.trim()) return;
          const ok = addCard({ front: front.trim(), back: back.trim(), note: note.trim() || undefined, source: "manuel" });
          toast(ok ? "Carte ajoutée" : "Cette carte existe déjà", ok ? "ok" : "info");
          setFront("");
          setBack("");
          setNote("");
        }}
      >
        <label className="block text-sm">
          <span className="text-muted">En {LANGS[settings.target].name.toLowerCase()}</span>
          <input className="field mt-1" value={front} onChange={(e) => setFront(e.target.value)} autoFocus />
        </label>
        <label className="block text-sm">
          <span className="text-muted">Traduction / sens</span>
          <input className="field mt-1" value={back} onChange={(e) => setBack(e.target.value)} />
        </label>
        <label className="block text-sm">
          <span className="text-muted">Note ou exemple (optionnel)</span>
          <textarea className="field mt-1" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
        </label>
        <Button variant="primary" type="submit" className="w-full" disabled={!front.trim() || !back.trim()}>
          Ajouter
        </Button>
      </form>
    </Modal>
  );
}

export default function Review() {
  const { cards, settings, deleteCard } = useStore();
  const [tab, setTab] = useState<"reviser" | "cartes">("reviser");
  const [session, setSession] = useState<CardT[] | null>(null);
  const [adding, setAdding] = useState(false);
  const [q, setQ] = useState("");

  const mine = useMemo(() => cards.filter((c) => c.lang === settings.target), [cards, settings.target]);
  const now = Date.now();
  const due = mine.filter((c) => c.due <= now).sort((a, b) => a.due - b.due);
  const nextDue = mine.filter((c) => c.due > now).sort((a, b) => a.due - b.due)[0];
  const filtered = mine.filter((c) => !q || (c.front + c.back).toLowerCase().includes(q.toLowerCase()));

  if (session) return <Session cards={session} onExit={() => setSession(null)} />;

  return (
    <div>
      <PageHeader
        title="Révisions"
        subtitle="Répétition espacée : chaque carte revient juste avant que tu l'oublies."
        right={
          <Button variant="soft" onClick={() => setAdding(true)}>
            <Plus className="size-4" /> Carte
          </Button>
        }
      />
      <Segmented
        className="mb-5 w-fit"
        value={tab}
        onChange={setTab}
        options={[
          { value: "reviser", label: `Réviser${due.length ? ` (${due.length})` : ""}` },
          { value: "cartes", label: `Mes cartes (${mine.length})` },
        ]}
      />

      {tab === "reviser" &&
        (mine.length === 0 ? (
          <Card>
            <EmptyState icon={<Layers className="size-6" />} title="Aucune carte pour l'instant">
              Ajoute des mots depuis la traduction, le coach, l'argot ou les exercices (bouton « Réviser »), ou crée tes propres cartes.
            </EmptyState>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="relative overflow-hidden md:col-span-2">
              <p className="text-sm text-muted">À réviser maintenant</p>
              <p className="mt-1 font-extrabold tracking-tight text-7xl">{due.length}</p>
              <p className="mt-1 text-sm text-faint">
                {due.length ? "cartes t'attendent." : nextDue ? `Prochaine carte ${new Date(nextDue.due).toLocaleString("fr-FR", { weekday: "long", hour: "2-digit", minute: "2-digit" })}.` : ""}
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                <Button variant="primary" size="lg" disabled={!due.length} onClick={() => setSession(due.slice(0, 50))}>
                  Commencer
                </Button>
                {!due.length && (
                  <Button variant="soft" size="lg" onClick={() => setSession([...mine].sort((a, b) => a.due - b.due).slice(0, 20))}>
                    Réviser en avance
                  </Button>
                )}
              </div>
            </Card>
            <Card>
              <p className="text-sm font-semibold">Ta mémoire</p>
              <ul className="mt-4 space-y-3 text-sm">
                {[
                  { l: "Nouvelles", v: mine.filter((c) => c.reps === 0).length, c: "bg-brand" },
                  { l: "En apprentissage", v: mine.filter((c) => c.reps > 0 && c.interval < 21).length, c: "bg-warn" },
                  { l: "Maîtrisées (21 j+)", v: mine.filter((c) => c.interval >= 21).length, c: "bg-ok" },
                ].map((r) => (
                  <li key={r.l} className="flex items-center gap-3">
                    <span className={clsx("size-2.5 rounded-full", r.c)} />
                    <span className="flex-1 text-muted">{r.l}</span>
                    <span className="font-semibold">{r.v}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        ))}

      {tab === "cartes" && (
        <>
          <div className="relative mb-4 md:w-80">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint" />
            <input className="field pl-9" placeholder="Chercher une carte…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <Card className="p-2">
            {filtered.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted">Aucune carte.</p>
            ) : (
              <ul className="divide-y divide-line">
                {filtered.map((c) => (
                  <li key={c.id} className="flex items-center gap-3 px-3 py-3">
                    <SpeakButton text={c.front} lang={c.lang} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{c.front}</p>
                      <p className="truncate text-sm text-muted">{c.back}</p>
                    </div>
                    <span className="hidden text-xs text-faint sm:block">{c.due <= now ? "à réviser" : `dans ${Math.max(1, Math.round((c.due - now) / 864e5))} j`}</span>
                    <Badge className="hidden sm:inline-flex">{c.source}</Badge>
                    <IconButton label="Supprimer" onClick={() => deleteCard(c.id)}>
                      <Trash2 className="size-4" />
                    </IconButton>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </>
      )}
      <AddCardModal open={adding} onClose={() => setAdding(false)} />
    </div>
  );
}

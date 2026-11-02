import { Link } from "react-router-dom";
import clsx from "clsx";
import { ArrowRight, BookmarkPlus, ChevronRight, Dumbbell, Flame, Languages, Layers, MessageCircle, Mic, Trophy, Zap } from "lucide-react";
import { LANGS, LEVEL_LABELS } from "../lib/languages";
import { SLANG } from "../data/slang";
import { currentStreak, dayKey, useStore } from "../store/useStore";
import { Badge, Card, ProgressRing, SpeakButton, toast } from "../components/ui";
import { Flag } from "../components/Flag";

const ACTIONS = [
  { to: "/traduire", title: "Traduire", desc: "Naturel, mot à mot, correcteur", icon: Languages },
  { to: "/prononciation", title: "Prononciation", desc: "Ton accent noté mot par mot", icon: Mic },
  { to: "/argot", title: "Argot & expressions", desc: "Le langage de tous les jours", icon: Zap },
  { to: "/exercices", title: "Exercices", desc: "QCM, trous, dictée, traduction", icon: Dumbbell },
  { to: "/revision", title: "Révisions", desc: "Répétition espacée", icon: Layers },
];

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return "Bonne nuit";
  if (h < 12) return "Bonjour";
  if (h < 18) return "Bon après-midi";
  return "Bonsoir";
}

export default function Home() {
  const { settings, progress, cards, addCard } = useStore();
  const lang = LANGS[settings.target];
  const today = dayKey();
  const xpToday = progress.xpByDay[today] ?? 0;
  const goalDone = xpToday >= settings.dailyGoal;
  const streak = currentStreak(progress);
  const mine = cards.filter((c) => c.lang === settings.target);
  const due = mine.filter((c) => c.due <= Date.now()).length;
  const learned = mine.filter((c) => c.reps >= 2).length;

  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = dayKey(d);
    return { key, label: d.toLocaleDateString("fr-FR", { weekday: "short" }).replace(".", ""), xp: progress.xpByDay[key] ?? 0 };
  });
  const maxXp = Math.max(settings.dailyGoal, ...week.map((w) => w.xp));

  // Expression du jour : déterministe selon la date
  const list = SLANG[settings.target];
  const seed = today.split("-").reduce((a, b) => a * 31 + Number(b), 7);
  const expr = list[seed % list.length];

  return (
    <div className="space-y-6">
      {/* ── En-tête ── */}
      <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="flex items-center gap-2 font-medium text-muted">
            {greeting()} · <Flag code={settings.target} /> {lang.name}
          </p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-balance md:text-4xl">On pratique un peu ?</h1>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge tone="brand">
              {settings.level} · {LEVEL_LABELS[settings.level]}
            </Badge>
            <Badge>IA gratuite, sans compte</Badge>
          </div>
        </div>

        <Card className="flex items-center gap-4 p-4 md:min-w-72">
          <ProgressRing value={xpToday / settings.dailyGoal} size={72} stroke={7} tone={goalDone ? "brand" : "accent"}>
            <span className="text-lg font-extrabold">{Math.min(100, Math.round((xpToday / settings.dailyGoal) * 100))}%</span>
          </ProgressRing>
          <div>
            <p className="font-bold">{goalDone ? "Objectif atteint" : "Objectif du jour"}</p>
            <p className="text-sm text-muted">
              {xpToday} / {settings.dailyGoal} XP
            </p>
          </div>
        </Card>
      </section>

      {/* ── Coach : action principale ── */}
      <Link to="/coach" className="group flex items-center gap-4 rounded-2xl bg-brand p-5 text-on-brand transition-[filter] duration-150 hover:brightness-110 md:p-6">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-white/15">
          <MessageCircle className="size-6" aria-hidden />
        </span>
        <span className="flex-1">
          <span className="block text-lg font-bold">Parler avec le coach</span>
          <span className="block text-sm opacity-90">Conversation, débat ou jeu de rôle — chaque faute est corrigée.</span>
        </span>
        <ArrowRight className="size-5 transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden />
      </Link>

      {/* ── Statistiques ── */}
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4" aria-label="Statistiques">
        {[
          { icon: Flame, label: "Série", value: `${streak} j`, sub: `record ${progress.bestStreak} j`, color: "text-brand2" },
          { icon: Trophy, label: "XP total", value: progress.xp.toLocaleString("fr-FR"), sub: `${progress.stats.messages} messages`, color: "text-warn" },
          { icon: Layers, label: "À réviser", value: String(due), sub: `${mine.length} cartes`, color: "text-brand" },
          { icon: Zap, label: "Mémorisés", value: String(learned), sub: "mots et phrases", color: "text-ok" },
        ].map((s) => (
          <Card key={s.label} className="p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted">
              <s.icon className={clsx("size-4 shrink-0", s.color)} aria-hidden />
              {s.label}
            </div>
            <p className="mt-2 text-2xl font-extrabold">{s.value}</p>
            <p className="text-xs text-faint">{s.sub}</p>
          </Card>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* ── Autres modules ── */}
        <section className="card divide-y divide-line overflow-hidden lg:col-span-3" aria-label="Modules">
          {ACTIONS.map((a) => (
            <Link key={a.to} to={a.to} className="flex min-h-16 items-center gap-4 px-4 py-3 transition-colors duration-150 hover:bg-sunk">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand">
                <a.icon className="size-5" aria-hidden />
              </span>
              <span className="flex-1">
                <span className="block font-semibold">{a.title}</span>
                <span className="block text-sm text-muted">{a.desc}</span>
              </span>
              {a.to === "/revision" && due > 0 && <Badge tone="accent">{due} à revoir</Badge>}
              <ChevronRight className="size-4 text-faint" aria-hidden />
            </Link>
          ))}
        </section>

        <div className="space-y-6 lg:col-span-2">
          {/* ── Expression du jour ── */}
          <Card>
            <div className="flex items-center justify-between">
              <p className="eyebrow">Expression du jour</p>
              <Badge>{expr.register}</Badge>
            </div>
            <div className="mt-3 flex items-start gap-3">
              <h2 className="flex-1 text-2xl font-extrabold tracking-tight">{expr.expr}</h2>
              <SpeakButton text={expr.expr} lang={settings.target} />
            </div>
            <p className="mt-1 text-muted">{expr.meaning}</p>
            <div className="mt-4 border-l-2 border-brand pl-3 text-sm">
              <p className="italic">{expr.example}</p>
              <p className="mt-1 text-faint">{expr.exampleTr}</p>
            </div>
            <button
              onClick={() => {
                const ok = addCard({ front: expr.expr, back: expr.meaning, note: expr.example, source: "argot" });
                toast(ok ? "Ajoutée aux révisions" : "Déjà dans tes révisions", ok ? "ok" : "info");
              }}
              className="mt-4 flex min-h-9 items-center gap-1.5 text-sm font-semibold text-brand hover:underline"
            >
              <BookmarkPlus className="size-4" aria-hidden /> Ajouter aux révisions
            </button>
          </Card>

          {/* ── Semaine ── */}
          <Card>
            <p className="font-bold">Ta semaine</p>
            <div className="mt-4 flex h-28 items-end gap-2" role="img" aria-label={`XP des 7 derniers jours : ${week.map((w) => w.xp).join(", ")}`}>
              {week.map((w) => (
                <div key={w.key} className="flex flex-1 flex-col items-center gap-1.5">
                  <div className="flex w-full flex-1 items-end">
                    <div
                      className={clsx("w-full rounded-md", w.xp >= settings.dailyGoal ? "bg-brand" : w.xp ? "bg-brand/40" : "bg-sunk")}
                      style={{ height: `${Math.max(6, (w.xp / maxXp) * 100)}%` }}
                      title={`${w.xp} XP`}
                    />
                  </div>
                  <span className={clsx("text-xs capitalize", w.key === today ? "font-bold text-ink" : "text-faint")}>{w.label}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

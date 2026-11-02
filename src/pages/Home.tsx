import { Link } from "react-router-dom";
import clsx from "clsx";
import { ArrowRight, BookmarkPlus, Dumbbell, Flame, KeyRound, Languages, Layers, MessageCircle, Mic, Trophy, Zap } from "lucide-react";
import { LANGS, LEVEL_LABELS } from "../lib/languages";
import { SLANG } from "../data/slang";
import { currentStreak, dayKey, useStore } from "../store/useStore";
import { Badge, Card, ProgressRing, SpeakButton, toast } from "../components/ui";

const ACTIONS = [
  { to: "/coach", title: "Coach IA", desc: "Discute, débats, fais-toi corriger", icon: MessageCircle, grad: "from-violet-500/25 to-fuchsia-500/10" },
  { to: "/traduire", title: "Traduire", desc: "Naturel, mot à mot, correcteur", icon: Languages, grad: "from-sky-500/25 to-cyan-500/10" },
  { to: "/prononciation", title: "Prononciation", desc: "Ton accent noté mot par mot", icon: Mic, grad: "from-rose-500/25 to-orange-500/10" },
  { to: "/argot", title: "Argot", desc: "Le vrai langage de tous les jours", icon: Zap, grad: "from-amber-500/25 to-yellow-500/10" },
  { to: "/exercices", title: "Exercices", desc: "QCM, trous, dictée, traduction", icon: Dumbbell, grad: "from-emerald-500/25 to-teal-500/10" },
  { to: "/revision", title: "Révisions", desc: "Répétition espacée", icon: Layers, grad: "from-indigo-500/25 to-blue-500/10" },
];

function greeting() {
  const h = new Date().getHours();
  if (h < 6) return "Encore debout";
  if (h < 12) return "Bonjour";
  if (h < 18) return "Bon après-midi";
  return "Bonsoir";
}

export default function Home() {
  const { settings, progress, cards, addCard } = useStore();
  const lang = LANGS[settings.target];
  const today = dayKey();
  const xpToday = progress.xpByDay[today] ?? 0;
  const streak = currentStreak(progress);
  const due = cards.filter((c) => c.lang === settings.target && c.due <= Date.now()).length;
  const learned = cards.filter((c) => c.lang === settings.target && c.reps >= 2).length;

  // Les 7 derniers jours
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = dayKey(d);
    return { key, label: d.toLocaleDateString("fr-FR", { weekday: "narrow" }), xp: progress.xpByDay[key] ?? 0 };
  });
  const maxXp = Math.max(settings.dailyGoal, ...week.map((w) => w.xp));

  // Expression du jour : déterministe selon la date
  const list = SLANG[settings.target];
  const seed = today.split("-").reduce((a, b) => a * 31 + Number(b), 7);
  const expr = list[seed % list.length];

  return (
    <div className="space-y-6">
      {/* ── Héros ── */}
      <section className="glass relative overflow-hidden p-6 md:p-8 animate-fade-up">
        <div className="pointer-events-none absolute -right-16 -top-20 size-64 rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-10 size-64 rounded-full bg-violet-600/20 blur-3xl" />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-muted">{greeting()} 👋</p>
            <h1 className="mt-1 font-display text-5xl leading-none tracking-tight md:text-6xl">
              On parle <span className="italic text-gradient">{lang.native.toLowerCase()}</span> ?
            </h1>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge tone="brand">
                {lang.flag} {lang.name}
              </Badge>
              <Badge>
                {settings.level} · {LEVEL_LABELS[settings.level]}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <ProgressRing value={xpToday / settings.dailyGoal} size={96} stroke={8}>
              <div className="text-center">
                <p className="text-xl font-bold leading-none">{xpToday}</p>
                <p className="text-[10px] text-faint">/ {settings.dailyGoal} XP</p>
              </div>
            </ProgressRing>
            <div className="text-sm">
              <p className="font-semibold">{xpToday >= settings.dailyGoal ? "Objectif atteint 🎉" : "Objectif du jour"}</p>
              <p className="text-muted">{xpToday >= settings.dailyGoal ? "Continue sur ta lancée." : `Encore ${settings.dailyGoal - xpToday} XP.`}</p>
            </div>
          </div>
        </div>
      </section>

      {!settings.apiKey && (
        <Link to="/reglages" className="flex items-center gap-3 rounded-2xl border border-warn/30 bg-warn/[0.08] p-4 text-sm transition hover:bg-warn/[0.12]">
          <KeyRound className="size-5 shrink-0 text-warn" />
          <span className="flex-1">
            <span className="font-medium">Ajoute ta clé API Claude</span>
            <span className="block text-muted">pour débloquer le coach, la traduction et les exercices.</span>
          </span>
          <ArrowRight className="size-4 text-muted" />
        </Link>
      )}

      {/* ── Stats ── */}
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { icon: Flame, label: "Série", value: `${streak} j`, sub: `record ${progress.bestStreak} j`, color: "text-orange-300" },
          { icon: Trophy, label: "XP total", value: progress.xp.toLocaleString("fr-FR"), sub: `${progress.stats.messages} messages`, color: "text-amber-300" },
          { icon: Layers, label: "À réviser", value: String(due), sub: `${cards.filter((c) => c.lang === settings.target).length} cartes`, color: "text-sky-300" },
          { icon: Zap, label: "Mémorisés", value: String(learned), sub: "mots & phrases", color: "text-emerald-300" },
        ].map((s, i) => (
          <Card key={s.label} className="p-4 animate-fade-up" style={{ animationDelay: `${i * 50}ms` }}>
            <s.icon className={clsx("size-5", s.color)} />
            <p className="mt-3 text-2xl font-bold">{s.value}</p>
            <p className="text-xs text-muted">{s.label}</p>
            <p className="mt-0.5 text-[11px] text-faint">{s.sub}</p>
          </Card>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* ── Actions ── */}
        <section className="grid grid-cols-2 gap-3 lg:col-span-3">
          {ACTIONS.map((a, i) => (
            <Link
              key={a.to}
              to={a.to}
              className={clsx(
                "group relative overflow-hidden rounded-[20px] border border-line bg-gradient-to-br p-4 transition hover:border-line2 active:scale-[0.98] animate-fade-up",
                a.grad
              )}
              style={{ animationDelay: `${100 + i * 40}ms` }}
            >
              <a.icon className="size-6 text-ink/90" />
              <p className="mt-6 font-semibold">{a.title}</p>
              <p className="text-xs text-muted">{a.desc}</p>
              {a.to === "/revision" && due > 0 && (
                <span className="absolute right-3 top-3 rounded-full bg-brand-gradient px-2 py-0.5 text-[11px] font-bold text-white">{due}</span>
              )}
              <ArrowRight className="absolute bottom-4 right-4 size-4 text-faint opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
            </Link>
          ))}
        </section>

        <div className="space-y-6 lg:col-span-2">
          {/* ── Expression du jour ── */}
          <Card className="animate-fade-up">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-violet-300">Expression du jour</p>
              <Badge>{expr.register}</Badge>
            </div>
            <div className="mt-3 flex items-start gap-3">
              <h3 className="flex-1 font-display text-3xl leading-tight">{expr.expr}</h3>
              <SpeakButton text={expr.expr} lang={settings.target} />
            </div>
            <p className="mt-1 text-sm text-muted">{expr.meaning}</p>
            <div className="mt-4 rounded-xl bg-black/20 p-3 text-sm">
              <p className="italic">« {expr.example} »</p>
              <p className="mt-1 text-xs text-faint">{expr.exampleTr}</p>
            </div>
            <button
              onClick={() => {
                const ok = addCard({ front: expr.expr, back: expr.meaning, note: expr.example, source: "argot" });
                toast(ok ? "Ajoutée aux révisions" : "Déjà dans tes révisions", ok ? "ok" : "info");
              }}
              className="mt-3 flex items-center gap-1.5 text-xs font-medium text-violet-300 hover:text-violet-200"
            >
              <BookmarkPlus className="size-3.5" /> Ajouter aux révisions
            </button>
          </Card>

          {/* ── Semaine ── */}
          <Card className="animate-fade-up">
            <p className="text-sm font-semibold">Ta semaine</p>
            <div className="mt-4 flex h-28 items-end gap-2">
              {week.map((w) => (
                <div key={w.key} className="flex flex-1 flex-col items-center gap-1.5">
                  <div className="relative flex w-full flex-1 items-end">
                    <div
                      className={clsx("w-full rounded-lg transition-all", w.xp >= settings.dailyGoal ? "bg-brand-gradient" : w.xp ? "bg-violet-400/40" : "bg-white/[0.06]")}
                      style={{ height: `${Math.max(6, (w.xp / maxXp) * 100)}%` }}
                      title={`${w.xp} XP`}
                    />
                  </div>
                  <span className={clsx("text-[11px] uppercase", w.key === today ? "font-bold text-ink" : "text-faint")}>{w.label}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import clsx from "clsx";
import { BookOpenCheck, Check, ChevronDown, Dumbbell, Flame, Home, Languages, Layers, MessageCircle, Mic, MoreHorizontal, Settings, Zap } from "lucide-react";
import { LANG_LIST, LANGS, type LangCode } from "../lib/languages";
import { currentStreak, useStore } from "../store/useStore";
import { Modal } from "./ui";
import { Flag } from "./Flag";

export const NAV = [
  { to: "/", label: "Accueil", short: "Accueil", icon: Home },
  { to: "/coach", label: "Coach IA", short: "Coach", icon: MessageCircle },
  { to: "/traduire", label: "Traduire", short: "Traduire", icon: Languages },
  { to: "/prononciation", label: "Prononciation", short: "Parler", icon: Mic },
  { to: "/argot", label: "Argot & expressions", short: "Argot", icon: Zap },
  { to: "/exercices", label: "Exercices", short: "Exercices", icon: Dumbbell },
  { to: "/revision", label: "Révisions", short: "Révisions", icon: Layers },
  { to: "/erreurs", label: "Carnet d'erreurs", short: "Erreurs", icon: BookOpenCheck },
  { to: "/reglages", label: "Réglages", short: "Réglages", icon: Settings },
];

const MOBILE_MAIN = ["/", "/coach", "/traduire", "/prononciation"];

function useDueCount() {
  const cards = useStore((s) => s.cards);
  const target = useStore((s) => s.settings.target);
  const now = Date.now();
  return cards.filter((c) => c.lang === target && c.due <= now).length;
}

export function Logo({ className }: { className?: string }) {
  return (
    <div className={clsx("flex items-center gap-2.5", className)}>
      <img src="./icon.svg" alt="" className="size-8 rounded-lg" />
      <span className="text-xl font-extrabold tracking-tight">Verbo</span>
    </div>
  );
}

export function LangSwitcher({ compact }: { compact?: boolean }) {
  const { target, native } = useStore((s) => s.settings);
  const update = useStore((s) => s.updateSettings);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const choose = (code: LangCode) => {
    // Choisir sa langue maternelle comme cible : on échange les deux.
    update(code === native ? { target: code, native: target } : { target: code });
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Langue apprise : ${LANGS[target].name}`}
        className={clsx(
          "flex min-h-11 items-center gap-2.5 rounded-xl border border-line bg-panel transition-colors duration-150 hover:bg-sunk",
          compact ? "px-3" : "w-full px-3 py-2"
        )}
      >
        <Flag code={target} className="text-lg" />
        {!compact && (
          <span className="flex-1 text-left leading-tight">
            <span className="block text-sm font-semibold">{LANGS[target].name}</span>
            <span className="block text-xs text-faint">depuis le {LANGS[native].name.toLowerCase()}</span>
          </span>
        )}
        <ChevronDown className="size-4 text-muted" aria-hidden />
      </button>
      {open && (
        <div role="listbox" className={clsx("absolute z-40 mt-2 min-w-56 rounded-xl border border-line bg-panel2 p-1.5 animate-pop", compact ? "right-0" : "inset-x-0")}>
          <p className="eyebrow px-3 pb-1 pt-2">J'apprends</p>
          {LANG_LIST.map((l) => (
            <button
              key={l.code}
              role="option"
              aria-selected={l.code === target}
              onClick={() => choose(l.code)}
              className={clsx("flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-sm transition-colors hover:bg-sunk", l.code === target && "bg-sunk font-semibold")}
            >
              <Flag code={l.code} className="text-base" />
              <span className="flex-1 text-left">{l.name}</span>
              {l.code === native && <span className="text-xs text-faint">ta langue</span>}
              {l.code === target && <Check className="size-4 text-brand" aria-hidden />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function StreakChip() {
  const progress = useStore((s) => s.progress);
  const streak = currentStreak(progress);
  return (
    <div
      title={`Série : ${streak} jour${streak > 1 ? "s" : ""}`}
      className={clsx("flex min-h-9 items-center gap-1 rounded-lg px-2.5 text-sm font-bold", streak ? "bg-brand2-soft text-brand2" : "bg-sunk text-faint")}
    >
      <Flame className="size-4" aria-hidden />
      {streak}
    </div>
  );
}

function CountBadge({ n }: { n: number }) {
  return <span className="min-w-5 rounded-md bg-brand2 px-1.5 text-center text-xs font-bold leading-5 text-on-brand2">{n}</span>;
}

export default function Layout() {
  const due = useDueCount();
  const [more, setMore] = useState(false);
  const { pathname } = useLocation();
  const xp = useStore((s) => s.progress.xp);

  useEffect(() => {
    setMore(false);
    window.scrollTo(0, 0);
  }, [pathname]);

  const isChat = pathname.startsWith("/coach");

  return (
    <div className="min-h-dvh">
      {/* ── Barre latérale (ordinateur) ── */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-line bg-panel px-4 py-5 md:flex">
        <Logo className="mb-5 px-2" />
        <LangSwitcher />
        <nav className="no-scrollbar mt-4 flex flex-1 flex-col gap-0.5 overflow-y-auto" aria-label="Navigation principale">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                clsx(
                  "flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors duration-150",
                  isActive ? "bg-brand-soft text-brand" : "text-muted hover:bg-sunk hover:text-ink"
                )
              }
            >
              <Icon className="size-[18px]" aria-hidden />
              <span className="flex-1">{label}</span>
              {to === "/revision" && due > 0 && <CountBadge n={due} />}
            </NavLink>
          ))}
        </nav>
        <div className="mt-4 flex items-center justify-between rounded-xl bg-sunk px-3 py-2.5">
          <StreakChip />
          <p className="text-sm font-bold">
            {xp.toLocaleString("fr-FR")} <span className="font-medium text-faint">XP</span>
          </p>
        </div>
      </aside>

      {/* ── En-tête (mobile) ── */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-panel px-4 md:hidden">
        <Logo />
        <div className="flex items-center gap-2">
          <StreakChip />
          <LangSwitcher compact />
        </div>
      </header>

      <main className="md:pl-64">
        <div className={clsx("mx-auto max-w-5xl", isChat ? "px-3 pt-3 md:px-6 md:pt-6" : "px-4 pb-28 pt-6 md:px-10 md:pb-12 md:pt-10")}>
          <Outlet />
        </div>
      </main>

      {/* ── Barre d'onglets (mobile) ── */}
      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-line bg-panel md:hidden" aria-label="Navigation">
        <div className="grid h-16 grid-cols-5">
          {NAV.filter((n) => MOBILE_MAIN.includes(n.to)).map(({ to, short, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) => clsx("flex flex-col items-center justify-center gap-0.5 text-xs font-semibold transition-colors", isActive ? "text-brand" : "text-faint")}
            >
              {({ isActive }) => (
                <>
                  <span className={clsx("flex h-7 w-14 items-center justify-center rounded-full transition-colors", isActive && "bg-brand-soft")}>
                    <Icon className="size-5" aria-hidden />
                  </span>
                  {short}
                </>
              )}
            </NavLink>
          ))}
          <button onClick={() => setMore(true)} className="relative flex flex-col items-center justify-center gap-0.5 text-xs font-semibold text-faint">
            <span className="flex h-7 w-14 items-center justify-center">
              <MoreHorizontal className="size-5" aria-hidden />
            </span>
            Plus
            {due > 0 && <span className="absolute right-4 top-2 size-2 rounded-full bg-brand2" aria-label={`${due} cartes à réviser`} />}
          </button>
        </div>
      </nav>

      <Modal open={more} onClose={() => setMore(false)} title="Plus">
        <div className="grid grid-cols-2 gap-2">
          {NAV.filter((n) => !MOBILE_MAIN.includes(n.to)).map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className="flex min-h-14 items-center gap-3 rounded-xl border border-line bg-panel p-3 text-sm font-semibold active:scale-[0.98]">
              <Icon className="size-5 text-brand" aria-hidden />
              <span className="flex-1">{label}</span>
              {to === "/revision" && due > 0 && <CountBadge n={due} />}
            </NavLink>
          ))}
        </div>
      </Modal>
    </div>
  );
}

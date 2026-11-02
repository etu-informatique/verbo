import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import clsx from "clsx";
import {
  BookOpenCheck,
  ChevronDown,
  Dumbbell,
  Flame,
  Home,
  Languages,
  Layers,
  MessageCircle,
  Mic,
  MoreHorizontal,
  Settings,
  Zap,
} from "lucide-react";
import { LANG_LIST, LANGS, type LangCode } from "../lib/languages";
import { currentStreak, useStore } from "../store/useStore";
import { Modal } from "./ui";

export const NAV = [
  { to: "/", label: "Accueil", icon: Home },
  { to: "/coach", label: "Coach IA", icon: MessageCircle },
  { to: "/traduire", label: "Traduire", icon: Languages },
  { to: "/prononciation", label: "Prononciation", icon: Mic },
  { to: "/argot", label: "Argot & expressions", icon: Zap },
  { to: "/exercices", label: "Exercices", icon: Dumbbell },
  { to: "/revision", label: "Révisions", icon: Layers },
  { to: "/erreurs", label: "Carnet d'erreurs", icon: BookOpenCheck },
  { to: "/reglages", label: "Réglages", icon: Settings },
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
      <img src="./icon.svg" alt="" className="size-8 rounded-[10px] shadow-lg shadow-fuchsia-500/30" />
      <span className="font-display text-[26px] leading-none tracking-tight">Verbo</span>
    </div>
  );
}

export function LangSwitcher({ compact }: { compact?: boolean }) {
  const { target, native } = useStore((s) => s.settings);
  const update = useStore((s) => s.updateSettings);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const choose = (code: LangCode) => {
    // Si on choisit sa langue maternelle comme cible, on échange les deux.
    update(code === native ? { target: code, native: target } : { target: code });
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={clsx(
          "flex items-center gap-2 rounded-xl border border-line bg-white/[0.04] transition hover:bg-white/[0.08]",
          compact ? "px-2.5 py-1.5" : "w-full px-3 py-2.5"
        )}
      >
        <span className="text-lg leading-none">{LANGS[target].flag}</span>
        {!compact && (
          <span className="flex-1 text-left">
            <span className="block text-sm font-medium">{LANGS[target].name}</span>
            <span className="block text-[11px] text-faint">depuis le {LANGS[native].name.toLowerCase()}</span>
          </span>
        )}
        <ChevronDown className="size-4 text-muted" />
      </button>
      {open && (
        <div className={clsx("absolute z-40 mt-2 min-w-52 rounded-2xl border border-line2 bg-panel2 p-1.5 shadow-2xl animate-pop", compact ? "right-0" : "inset-x-0")}>
          <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-faint">J'apprends</p>
          {LANG_LIST.map((l) => (
            <button
              key={l.code}
              onClick={() => choose(l.code)}
              className={clsx(
                "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm transition hover:bg-white/[0.06]",
                l.code === target && "bg-white/[0.08]"
              )}
            >
              <span className="text-lg">{l.flag}</span>
              <span className="flex-1 text-left">{l.name}</span>
              {l.code === native && <span className="text-[10px] text-faint">ta langue</span>}
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
    <div className={clsx("flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-sm font-semibold", streak ? "bg-orange-500/15 text-orange-300" : "bg-white/[0.05] text-faint")}>
      <Flame className={clsx("size-4", streak && "fill-orange-400/40")} />
      {streak}
    </div>
  );
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
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-line bg-bg/60 px-4 py-6 backdrop-blur-xl md:flex">
        <Logo className="mb-6 px-2" />
        <LangSwitcher />
        <nav className="mt-5 flex flex-1 flex-col gap-0.5 overflow-y-auto">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                clsx(
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                  isActive ? "bg-white/[0.08] text-ink" : "text-muted hover:bg-white/[0.04] hover:text-ink"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={clsx("size-[18px]", isActive ? "text-violet-300" : "text-faint group-hover:text-muted")} />
                  <span className="flex-1">{label}</span>
                  {to === "/revision" && due > 0 && (
                    <span className="rounded-full bg-brand-gradient px-1.5 text-[11px] font-bold text-white">{due}</span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="mt-4 flex items-center justify-between rounded-2xl border border-line bg-white/[0.03] px-3 py-2.5">
          <StreakChip />
          <div className="text-right">
            <p className="text-sm font-semibold">{xp.toLocaleString("fr-FR")} XP</p>
            <p className="text-[11px] text-faint">total</p>
          </div>
        </div>
      </aside>

      {/* ── En-tête (mobile) ── */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-bg/75 px-4 backdrop-blur-xl md:hidden">
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
      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg/85 backdrop-blur-xl md:hidden">
        <div className="grid h-16 grid-cols-5">
          {NAV.filter((n) => MOBILE_MAIN.includes(n.to)).map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                clsx("flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition", isActive ? "text-ink" : "text-faint")
              }
            >
              {({ isActive }) => (
                <>
                  <span className={clsx("flex h-7 w-12 items-center justify-center rounded-full transition", isActive && "bg-white/[0.1]")}>
                    <Icon className={clsx("size-5", isActive && "text-violet-300")} />
                  </span>
                  {label.split(" ")[0]}
                </>
              )}
            </NavLink>
          ))}
          <button onClick={() => setMore(true)} className="relative flex flex-col items-center justify-center gap-1 text-[10px] font-medium text-faint">
            <span className="flex h-7 w-12 items-center justify-center">
              <MoreHorizontal className="size-5" />
            </span>
            Plus
            {due > 0 && <span className="absolute right-4 top-2 size-2 rounded-full bg-brand2" />}
          </button>
        </div>
      </nav>

      <Modal open={more} onClose={() => setMore(false)} title="Plus">
        <div className="grid grid-cols-2 gap-2">
          {NAV.filter((n) => !MOBILE_MAIN.includes(n.to)).map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className="flex items-center gap-3 rounded-2xl border border-line bg-white/[0.03] p-4 text-sm font-medium active:scale-[0.98]">
              <Icon className="size-5 text-violet-300" />
              <span className="flex-1">{label}</span>
              {to === "/revision" && due > 0 && <span className="rounded-full bg-brand-gradient px-1.5 text-[11px] font-bold text-white">{due}</span>}
            </NavLink>
          ))}
        </div>
      </Modal>
    </div>
  );
}

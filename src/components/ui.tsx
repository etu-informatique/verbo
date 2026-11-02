import clsx from "clsx";
import { useEffect, useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import { create } from "zustand";
import { Link } from "react-router-dom";
import { AiFallback } from "./AiFallback";
import { AlertTriangle, Check, Loader2, Snail, Volume2, X } from "lucide-react";
import { speak, stopSpeaking, ttsSupported } from "../lib/speech";
import type { LangCode } from "../lib/languages";

// ───────────────────────────── Bouton ─────────────────────────────

type Variant = "primary" | "accent" | "soft" | "ghost" | "danger" | "outline";

const variants: Record<Variant, string> = {
  primary: "bg-brand text-on-brand hover:brightness-110",
  accent: "bg-brand2 text-on-brand2 hover:brightness-110",
  soft: "bg-sunk text-ink hover:bg-brand-soft",
  outline: "border border-line2 bg-panel text-ink hover:bg-sunk",
  ghost: "text-muted hover:bg-sunk hover:text-ink",
  danger: "border border-bad/40 bg-panel text-bad hover:bg-bad/10",
};

export function Button({
  variant = "soft",
  size = "md",
  loading,
  className,
  children,
  disabled,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: "sm" | "md" | "lg"; loading?: boolean }) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={clsx(
        "inline-flex select-none items-center justify-center gap-2 rounded-xl font-semibold transition-[background-color,filter,transform] duration-150 active:scale-[0.98] disabled:opacity-50",
        size === "sm" && "min-h-9 px-3 text-sm",
        size === "md" && "min-h-11 px-4 text-sm",
        size === "lg" && "min-h-12 px-6 text-base",
        variants[variant],
        className
      )}
    >
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}

export function IconButton({ className, label, children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      {...rest}
      aria-label={label}
      title={label}
      className={clsx(
        "inline-flex size-11 shrink-0 items-center justify-center rounded-xl text-muted transition-colors duration-150 hover:bg-sunk hover:text-ink active:scale-95 disabled:opacity-40",
        className
      )}
    >
      {children}
    </button>
  );
}

// ───────────────────────────── Divers ─────────────────────────────

export function Card({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...rest} className={clsx("card p-5", className)}>
      {children}
    </div>
  );
}

export function Badge({ children, tone = "neutral", className }: { children: ReactNode; tone?: "neutral" | "brand" | "accent" | "ok" | "warn" | "bad"; className?: string }) {
  const tones = {
    neutral: "bg-sunk text-muted",
    brand: "bg-brand-soft text-brand",
    accent: "bg-brand2-soft text-brand2",
    ok: "bg-ok/12 text-ok",
    warn: "bg-warn/12 text-warn",
    bad: "bg-bad/12 text-bad",
  };
  return <span className={clsx("inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold", tones[tone], className)}>{children}</span>;
}

export function PageHeader({ title, subtitle, right }: { title: ReactNode; subtitle?: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-2xl font-extrabold tracking-tight text-balance md:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-muted">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className,
  label,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: ReactNode }[];
  className?: string;
  label?: string;
}) {
  return (
    <div role="tablist" aria-label={label} className={clsx("no-scrollbar flex max-w-full gap-1 overflow-x-auto rounded-xl bg-sunk p-1", className)}>
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={clsx(
            "flex min-h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 text-sm font-semibold transition-colors duration-150",
            value === o.value ? "bg-panel text-ink ring-1 ring-line" : "text-muted hover:text-ink"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const quota = /quota/i.test(message);
  return (
    <div role="alert" className="flex items-start gap-3 rounded-xl border border-bad/30 bg-bad/8 p-4 text-sm">
      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-bad" aria-hidden />
      <div className="flex-1">
        <p>{message}</p>
        {quota && <AiFallback onRetry={onRetry} />}
        <div className="mt-2 flex flex-wrap gap-4">
          {!quota && /réglages/i.test(message) && (
            <Link to="/reglages" className="font-semibold text-brand underline-offset-2 hover:underline">
              Ouvrir les réglages
            </Link>
          )}
          {onRetry && (
            <button onClick={onRetry} className="font-semibold text-brand underline-offset-2 hover:underline">
              Réessayer
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 text-sm text-muted" role="status">
      <Loader2 className="size-4 animate-spin text-brand" aria-hidden />
      {label}
    </div>
  );
}

export function EmptyState({ icon, title, children }: { icon: ReactNode; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      <div className="flex size-12 items-center justify-center rounded-xl bg-brand-soft text-brand">{icon}</div>
      <h3 className="text-lg font-bold">{title}</h3>
      {children && <div className="max-w-sm text-sm text-muted">{children}</div>}
    </div>
  );
}

export function ProgressRing({ value, size = 64, stroke = 6, children, tone = "brand" }: { value: number; size?: number; stroke?: number; children?: ReactNode; tone?: "brand" | "accent" }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value));
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--sunk)" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={tone === "brand" ? "var(--brand)" : "var(--brand2)"}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - v)}
          style={{ transition: "stroke-dashoffset 0.5s ease-out" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}

export function ScorePill({ score }: { score: number }) {
  const tone = score >= 90 ? "ok" : score >= 70 ? "warn" : "bad";
  return <Badge tone={tone}>{score}/100</Badge>;
}

/** Bouton « écouter » (synthèse vocale). rate < 1 = lecture lente. */
export function SpeakButton({ text, lang, rate, className, size = "md" }: { text: string; lang: LangCode; rate?: number; className?: string; size?: "sm" | "md" }) {
  const [playing, setPlaying] = useState(false);
  useEffect(
    () => () => {
      if (playing) stopSpeaking();
    },
    [playing]
  );
  if (!ttsSupported) return null;
  const slow = !!rate && rate < 1;
  const label = slow ? "Écouter lentement" : "Écouter";
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={(e) => {
        e.stopPropagation();
        if (playing) {
          stopSpeaking();
          setPlaying(false);
          return;
        }
        setPlaying(true);
        speak(text, lang, { rate, onEnd: () => setPlaying(false) });
      }}
      className={clsx(
        "inline-flex shrink-0 items-center justify-center rounded-lg transition-colors duration-150 active:scale-95",
        size === "sm" ? "size-9" : "size-11",
        playing ? "bg-brand text-on-brand" : "bg-sunk text-brand hover:bg-brand-soft",
        className
      )}
    >
      {slow ? <Snail className="size-4" aria-hidden /> : <Volume2 className="size-4" aria-hidden />}
    </button>
  );
}

// ───────────────────────────── Toasts ─────────────────────────────

interface Toast {
  id: number;
  text: string;
  tone: "ok" | "info" | "bad";
}
const useToasts = create<{ toasts: Toast[]; push: (t: Omit<Toast, "id">) => void; remove: (id: number) => void }>((set) => ({
  toasts: [],
  push: (t) => {
    const id = Date.now() + Math.random();
    set((s) => ({ toasts: [...s.toasts, { ...t, id }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })), 2600);
  },
  remove: (id) => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
}));

export const toast = (text: string, tone: Toast["tone"] = "ok") => useToasts.getState().push({ text, tone });

export function Toaster() {
  const { toasts, remove } = useToasts();
  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[100] flex flex-col items-center gap-2 px-4" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto flex items-center gap-2 rounded-xl border border-line bg-panel2 px-4 py-2.5 text-sm font-medium animate-pop">
          {t.tone === "ok" ? <Check className="size-4 text-ok" aria-hidden /> : t.tone === "bad" ? <AlertTriangle className="size-4 text-bad" aria-hidden /> : null}
          {t.text}
          <button onClick={() => remove(t.id)} className="ml-1 rounded p-1 text-faint hover:text-ink" aria-label="Fermer">
            <X className="size-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}

// ───────────────────────────── Modale ─────────────────────────────

export function Modal({ open, onClose, children, title }: { open: boolean; onClose: () => void; children: ReactNode; title?: string }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className="safe-bottom max-h-[90dvh] w-full overflow-y-auto rounded-t-2xl border border-line bg-panel2 p-5 animate-fade-up sm:max-w-lg sm:rounded-2xl"
      >
        {title && (
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold">{title}</h2>
            <IconButton label="Fermer" onClick={onClose}>
              <X className="size-5" />
            </IconButton>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

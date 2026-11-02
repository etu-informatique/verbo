import clsx from "clsx";
import { useEffect, useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import { create } from "zustand";
import { AlertTriangle, Check, Loader2, Volume2, X } from "lucide-react";
import { Link } from "react-router-dom";
import { speak, stopSpeaking, ttsSupported } from "../lib/speech";
import type { LangCode } from "../lib/languages";

// ───────────────────────────── Bouton ─────────────────────────────

type Variant = "primary" | "soft" | "ghost" | "danger" | "outline";

const variants: Record<Variant, string> = {
  primary: "bg-brand-gradient text-white shadow-lg shadow-fuchsia-500/20 hover:brightness-110",
  soft: "bg-white/[0.06] text-ink hover:bg-white/[0.1] border border-line",
  outline: "border border-line2 text-ink hover:bg-white/[0.05]",
  ghost: "text-muted hover:text-ink hover:bg-white/[0.05]",
  danger: "bg-bad/15 text-bad hover:bg-bad/25 border border-bad/30",
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
        "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none select-none",
        size === "sm" && "px-3 py-1.5 text-sm",
        size === "md" && "px-4 py-2.5 text-sm",
        size === "lg" && "px-6 py-3.5 text-base",
        variants[variant],
        className
      )}
    >
      {loading && <Loader2 className="size-4 animate-spin" />}
      {children}
    </button>
  );
}

export function IconButton({
  className,
  label,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      {...rest}
      aria-label={label}
      title={label}
      className={clsx(
        "inline-flex size-9 items-center justify-center rounded-xl text-muted transition hover:bg-white/[0.07] hover:text-ink active:scale-95 disabled:opacity-40",
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
    <div {...rest} className={clsx("glass p-5", className)}>
      {children}
    </div>
  );
}

export function Badge({ children, tone = "neutral", className }: { children: ReactNode; tone?: "neutral" | "brand" | "ok" | "warn" | "bad"; className?: string }) {
  const tones = {
    neutral: "bg-white/[0.06] text-muted border-line",
    brand: "bg-brand/15 text-violet-300 border-brand/30",
    ok: "bg-ok/12 text-ok border-ok/30",
    warn: "bg-warn/12 text-warn border-warn/30",
    bad: "bg-bad/12 text-bad border-bad/30",
  };
  return (
    <span className={clsx("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium", tones[tone], className)}>
      {children}
    </span>
  );
}

export function PageHeader({ title, subtitle, right }: { title: ReactNode; subtitle?: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3 animate-fade-up">
      <div>
        <h1 className="font-display text-4xl leading-none tracking-tight md:text-5xl">{title}</h1>
        {subtitle && <p className="mt-2 text-sm text-muted md:text-base">{subtitle}</p>}
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
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: ReactNode }[];
  className?: string;
}) {
  return (
    <div className={clsx("no-scrollbar flex gap-1 overflow-x-auto rounded-2xl border border-line bg-white/[0.03] p-1", className)}>
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={clsx(
            "flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium transition",
            value === o.value ? "bg-white/[0.1] text-ink shadow-sm" : "text-muted hover:text-ink"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const needsKey = /clé api/i.test(message);
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-bad/30 bg-bad/10 p-4 text-sm animate-fade-up">
      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-bad" />
      <div className="flex-1">
        <p className="text-ink">{message}</p>
        <div className="mt-2 flex gap-2">
          {needsKey && (
            <Link to="/reglages" className="font-medium text-violet-300 underline-offset-2 hover:underline">
              Ouvrir les réglages →
            </Link>
          )}
          {onRetry && (
            <button onClick={onRetry} className="font-medium text-violet-300 hover:underline">
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
    <div className="flex items-center gap-3 text-sm text-muted">
      <span className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <span key={i} className="size-1.5 animate-bounce rounded-full bg-violet-400" style={{ animationDelay: `${i * 120}ms` }} />
        ))}
      </span>
      {label}
    </div>
  );
}

export function EmptyState({ icon, title, children }: { icon: ReactNode; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-white/[0.05] text-violet-300">{icon}</div>
      <h3 className="text-lg font-semibold">{title}</h3>
      {children && <div className="max-w-sm text-sm text-muted">{children}</div>}
    </div>
  );
}

export function ProgressRing({ value, size = 64, stroke = 6, children }: { value: number; size?: number; stroke?: number; children?: ReactNode }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value));
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#8b5cf6" />
            <stop offset="1" stopColor="#ec4899" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgb(255 255 255 / 0.08)" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="url(#ringGrad)"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - v)}
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}

export function ScorePill({ score }: { score: number }) {
  const tone = score >= 90 ? "ok" : score >= 70 ? "warn" : "bad";
  return (
    <Badge tone={tone} className="text-xs">
      {score}/100
    </Badge>
  );
}

/** Bouton « écouter » (synthèse vocale). */
export function SpeakButton({ text, lang, rate, className, size = "md" }: { text: string; lang: LangCode; rate?: number; className?: string; size?: "sm" | "md" }) {
  const [playing, setPlaying] = useState(false);
  useEffect(() => () => {
    if (playing) stopSpeaking();
  }, [playing]);
  if (!ttsSupported) return null;
  return (
    <button
      type="button"
      aria-label="Écouter"
      title={rate && rate < 1 ? "Écouter lentement" : "Écouter"}
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
        "inline-flex shrink-0 items-center justify-center rounded-full transition active:scale-90",
        size === "sm" ? "size-7" : "size-9",
        playing ? "bg-brand-gradient text-white" : "bg-white/[0.06] text-violet-300 hover:bg-white/[0.12]",
        className
      )}
    >
      {rate && rate < 1 ? <span className="text-[10px] font-bold">0.6×</span> : <Volume2 className={size === "sm" ? "size-3.5" : "size-4"} />}
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
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[100] flex flex-col items-center gap-2 px-4">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto flex items-center gap-2 rounded-2xl border border-line2 bg-panel2/95 px-4 py-2.5 text-sm shadow-2xl backdrop-blur animate-pop"
        >
          {t.tone === "ok" ? <Check className="size-4 text-ok" /> : t.tone === "bad" ? <AlertTriangle className="size-4 text-bad" /> : null}
          {t.text}
          <button onClick={() => remove(t.id)} className="ml-1 text-faint hover:text-ink" aria-label="Fermer">
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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="safe-bottom max-h-[90dvh] w-full overflow-y-auto rounded-t-3xl border border-line2 bg-panel p-5 shadow-2xl animate-fade-up sm:max-w-lg sm:rounded-3xl"
      >
        {title && (
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">{title}</h2>
            <IconButton label="Fermer" onClick={onClose}>
              <X className="size-4" />
            </IconButton>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

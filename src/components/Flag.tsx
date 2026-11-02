import { useId } from "react";
import clsx from "clsx";
import { LANGS, type LangCode } from "../lib/languages";

/** Drapeaux en SVG (les emojis drapeaux ne s'affichent pas sur Windows). */
export function Flag({ code, className }: { code: LangCode; className?: string }) {
  const clip = useId();
  return (
    <svg
      viewBox={code === "en" ? "0 0 60 30" : "0 0 30 20"}
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label={LANGS[code].name}
      className={clsx("inline-block h-[1em] w-[1.5em] shrink-0 overflow-hidden rounded-[3px] ring-1 ring-black/10", className)}
    >
      {code === "fr" && (
        <>
          <rect width="10" height="20" fill="#0055A4" />
          <rect x="10" width="10" height="20" fill="#FFFFFF" />
          <rect x="20" width="10" height="20" fill="#EF4135" />
        </>
      )}
      {code === "it" && (
        <>
          <rect width="10" height="20" fill="#009246" />
          <rect x="10" width="10" height="20" fill="#FFFFFF" />
          <rect x="20" width="10" height="20" fill="#CE2B37" />
        </>
      )}
      {code === "es" && (
        <>
          <rect width="30" height="20" fill="#AA151B" />
          <rect y="5" width="30" height="10" fill="#F1BF00" />
        </>
      )}
      {code === "en" && (
        <>
          <clipPath id={clip}>
            <path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" />
          </clipPath>
          <rect width="60" height="30" fill="#012169" />
          <path d="M0,0 L60,30 M60,0 L0,30" stroke="#FFFFFF" strokeWidth="6" />
          <path d="M0,0 L60,30 M60,0 L0,30" clipPath={`url(#${clip})`} stroke="#C8102E" strokeWidth="4" />
          <path d="M30,0 v30 M0,15 h60" stroke="#FFFFFF" strokeWidth="10" />
          <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6" />
        </>
      )}
    </svg>
  );
}

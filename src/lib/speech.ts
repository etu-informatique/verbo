import { useCallback, useEffect, useRef, useState } from "react";
import { LANGS, type LangCode } from "./languages";
import { useStore } from "../store/useStore";

// ───────────────────────── Synthèse vocale (TTS) ─────────────────────────

export const ttsSupported = typeof window !== "undefined" && "speechSynthesis" in window;

export function useVoices(lang?: LangCode) {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>(() => (ttsSupported ? speechSynthesis.getVoices() : []));
  useEffect(() => {
    if (!ttsSupported) return;
    const update = () => setVoices(speechSynthesis.getVoices());
    update();
    speechSynthesis.addEventListener("voiceschanged", update);
    return () => speechSynthesis.removeEventListener("voiceschanged", update);
  }, []);
  if (!lang) return voices;
  const prefix = lang + "-";
  return voices.filter((v) => v.lang.toLowerCase().startsWith(prefix) || v.lang.toLowerCase() === lang);
}

/** Les voix « naturelles » / Google / premium sonnent bien mieux que les voix système de base. */
function rankVoice(v: SpeechSynthesisVoice): number {
  const n = v.name.toLowerCase();
  let s = 0;
  if (/natural|neural|online/.test(n)) s += 4;
  if (/google/.test(n)) s += 3;
  if (/premium|enhanced/.test(n)) s += 2;
  if (v.localService === false) s += 1;
  return s;
}

export function pickVoice(lang: LangCode): SpeechSynthesisVoice | undefined {
  if (!ttsSupported) return undefined;
  const wanted = useStore.getState().settings.voices[lang];
  const all = speechSynthesis.getVoices();
  const candidates = all.filter((v) => v.lang.toLowerCase().startsWith(lang));
  if (wanted) {
    const v = candidates.find((x) => x.voiceURI === wanted);
    if (v) return v;
  }
  const exact = candidates.filter((v) => v.lang.replace("_", "-") === LANGS[lang].speech);
  const pool = exact.length ? exact : candidates;
  return [...pool].sort((a, b) => rankVoice(b) - rankVoice(a))[0];
}

export function speak(text: string, lang: LangCode, opts: { rate?: number; onEnd?: () => void } = {}) {
  if (!ttsSupported || !text.trim()) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = LANGS[lang].speech;
  const voice = pickVoice(lang);
  if (voice) u.voice = voice;
  u.rate = (opts.rate ?? 1) * useStore.getState().settings.speechRate;
  if (opts.onEnd) {
    u.onend = opts.onEnd;
    u.onerror = opts.onEnd;
  }
  speechSynthesis.speak(u);
}

export function stopSpeaking() {
  if (ttsSupported) speechSynthesis.cancel();
}

// ──────────────────────── Reconnaissance vocale (STT) ────────────────────────

// Types minimaux : l'API Web Speech n'est pas dans lib.dom pour tous les navigateurs.
interface RecognitionAlt {
  transcript: string;
  confidence: number;
}
interface RecognitionResult {
  isFinal: boolean;
  length: number;
  [i: number]: RecognitionAlt;
}
interface RecognitionEvent {
  resultIndex: number;
  results: { length: number; [i: number]: RecognitionResult };
}
interface Recognition {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: RecognitionEvent) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
}

const RecognitionCtor: (new () => Recognition) | undefined =
  typeof window !== "undefined"
    ? ((window as unknown as Record<string, unknown>).SpeechRecognition as new () => Recognition) ??
      ((window as unknown as Record<string, unknown>).webkitSpeechRecognition as new () => Recognition)
    : undefined;

export const sttSupported = !!RecognitionCtor;

export interface SttResult {
  transcript: string;
  confidence: number; // 0..1 (0 si le navigateur ne la fournit pas)
  alternatives: string[];
}

const STT_ERRORS: Record<string, string> = {
  "not-allowed": "Accès au micro refusé. Autorise le micro dans ton navigateur.",
  "no-speech": "Je n'ai rien entendu. Parle plus près du micro.",
  "audio-capture": "Aucun micro détecté.",
  network: "La reconnaissance vocale a besoin d'internet.",
  aborted: "",
};

/**
 * Reconnaissance vocale dans une langue donnée.
 * `continuous` = dictée longue (coach), sinon une seule phrase (prononciation).
 */
export function useSpeechRecognition(lang: LangCode, continuous = false) {
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<Recognition | null>(null);
  const finalRef = useRef<SttResult>({ transcript: "", confidence: 0, alternatives: [] });
  const resolveRef = useRef<((r: SttResult) => void) | null>(null);

  useEffect(() => () => recRef.current?.abort(), []);

  const start = useCallback((): Promise<SttResult> => {
    return new Promise((resolve) => {
      if (!RecognitionCtor) {
        setError("La reconnaissance vocale n'est pas disponible sur ce navigateur (utilise Chrome, Edge ou Safari).");
        resolve({ transcript: "", confidence: 0, alternatives: [] });
        return;
      }
      recRef.current?.abort();
      const rec = new RecognitionCtor();
      rec.lang = LANGS[lang].speech;
      rec.interimResults = true;
      rec.continuous = continuous;
      rec.maxAlternatives = 3;
      finalRef.current = { transcript: "", confidence: 0, alternatives: [] };
      resolveRef.current = resolve;
      setError(null);
      setInterim("");

      const confs: number[] = [];
      rec.onresult = (e) => {
        let interimText = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const r = e.results[i];
          if (r.isFinal) {
            finalRef.current.transcript += (finalRef.current.transcript ? " " : "") + r[0].transcript.trim();
            if (r[0].confidence > 0) confs.push(r[0].confidence);
            for (let j = 1; j < r.length; j++) finalRef.current.alternatives.push(r[j].transcript.trim());
          } else interimText += r[0].transcript;
        }
        finalRef.current.confidence = confs.length ? confs.reduce((a, b) => a + b, 0) / confs.length : 0;
        setInterim((finalRef.current.transcript + " " + interimText).trim());
      };
      rec.onerror = (e) => {
        const msg = STT_ERRORS[e.error] ?? `Erreur micro : ${e.error}`;
        if (msg) setError(msg);
      };
      rec.onend = () => {
        setListening(false);
        resolveRef.current?.(finalRef.current);
        resolveRef.current = null;
      };
      recRef.current = rec;
      stopSpeaking();
      rec.start();
      setListening(true);
    });
  }, [lang, continuous]);

  const stop = useCallback(() => recRef.current?.stop(), []);

  return { supported: sttSupported, listening, interim, error, start, stop };
}

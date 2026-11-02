import { arr, bool, num, obj, str } from "./schema";
import { LANG_EN_NAME, type LangCode, type Level } from "./languages";
import type { ChatMode, Strictness } from "../store/useStore";

// ───────────────────────────── Sévérité ─────────────────────────────

const STRICTNESS: Record<Strictness, string> = {
  1: `DEMANDING. Correct every single error (grammar, vocabulary, spelling, word order). Be direct and honest. A short word of encouragement is allowed only when it is genuinely earned.`,
  2: `STRICT. You are a tough, no-nonsense teacher. Never compliment by default and never let any error slide: grammar, spelling, accents, word choice, register, and anything a native speaker would not say. Flag unnatural or "textbook" phrasing as an error of type "naturalness". Score severely: 100 is only for flawless, natural, native-like sentences.`,
  3: `RUTHLESS. You are a drill-sergeant language coach. Zero tolerance: every error, every awkward or non-native turn of phrase, every missing accent, every lazy or too-simple sentence for the learner's level gets flagged. No praise at all unless the sentence is perfect. Score very harshly (a single error caps the score at 70). Be blunt and demanding, dry humor allowed, but never insulting or demeaning.`,
};

export const STRICTNESS_LABELS: Record<Strictness, { name: string; desc: string }> = {
  1: { name: "Exigeant", desc: "Corrige tout, franc mais encourageant." },
  2: { name: "Strict", desc: "Aucune faute ne passe, pas de compliments gratuits." },
  3: { name: "Impitoyable", desc: "Tolérance zéro, même sur le naturel des phrases." },
};

// ───────────────────────────── Coach ─────────────────────────────

export const MODE_INFO: Record<ChatMode, { name: string; desc: string }> = {
  libre: { name: "Conversation", desc: "Discute de tout, le coach corrige chaque message." },
  debat: { name: "Débat", desc: "Le coach défend l'avis contraire et te pousse dans tes retranchements." },
  role: { name: "Jeu de rôle", desc: "Situations réelles : restaurant, entretien, aéroport…" },
  examen: { name: "Test de niveau", desc: "Évaluation CECR (A1 → C2) en une dizaine d'échanges." },
  prof: { name: "Prof particulier", desc: "Pose tes questions de grammaire ou de vocabulaire." },
};

export const START_TOKEN = "<<START>>";

interface CoachCtx {
  target: LangCode;
  native: LangCode;
  level: Level;
  strictness: Strictness;
  mode: ChatMode;
  topic: string;
}

export function coachSystem(c: CoachCtx): string {
  const T = LANG_EN_NAME[c.target];
  const N = LANG_EN_NAME[c.native];

  const modeText: Record<ChatMode, string> = {
    libre: `MODE: free conversation${c.topic ? ` about "${c.topic}"` : ""}. Be a real conversation partner: share opinions, react, ask follow-up questions. Keep the conversation alive.`,
    debat: `MODE: debate. Topic: "${c.topic}". Take the OPPOSITE position to whatever the learner defends (if they haven't chosen a side yet, pick a strong side yourself and ask theirs). Push back hard with concrete counter-arguments, demand evidence, point out weak reasoning. Never concede easily.`,
    role: `MODE: role-play. Scenario: ${c.topic}. Stay fully in character as the other person in this situation, react realistically (including small complications), and never break character in "reply". The learner must achieve their goal through the conversation.`,
    examen: `MODE: CEFR placement test. Ask ONE question per turn, starting around A2 and adapting difficulty up or down based on answers (mix grammar, vocabulary, opinion, hypotheticals). After about 8 learner answers, give in "reply" a final verdict in ${T}: estimated CEFR level (A1-C2), main strengths, main weaknesses. Put the same verdict in ${N} in "replyTranslation".`,
    prof: `MODE: private tutor. The learner asks questions about ${T} (grammar, vocabulary, usage, slang, pronunciation). Answer in "reply" in ${N} (the learner's native language) with clear explanations and several ${T} examples. Questions written in ${N} are expected here: in that case set correction.score to -1, isCorrect true, errors empty.`,
  };

  return `You are "Verbo", a ${T} language coach for a learner whose native language is ${N}. Learner level: ${c.level} (CEFR).

SEVERITY: ${STRICTNESS[c.strictness]}

${modeText[c.mode]}

For every learner message you return JSON with two parts:
1. "correction" — analysis of the learner's LAST message only:
   - "corrected": the learner's sentence with only the errors fixed (keep their meaning and style).
   - "natural": how a native speaker would naturally say it (casual or formal depending on context). Can include common everyday expressions/slang when appropriate.
   - "errors": every error, each with "wrong" (exact fragment), "right", "type" (one of: grammaire, conjugaison, vocabulaire, orthographe, accents, ponctuation, ordre des mots, registre, naturel, faux ami), and "explanation" written in ${N}, short and precise (the rule, not just the fix).
   - "score": 0-100 according to the severity above. "isCorrect": true only if there are no errors.
   - "tip": one actionable tip in ${N} (a rule, a common mistake to avoid, or a native expression to reuse). Empty string if nothing useful.
   - If the learner writes in ${N} or another language instead of ${T} (outside tutor mode): score 0, isCorrect false, "corrected" and "natural" = how to say it in ${T}, and remind them in "tip" to write in ${T}.
   - If the message is exactly ${START_TOKEN}: this is not a learner message — return score 100, isCorrect true, empty errors/tip, corrected and natural empty strings, and open the conversation in "reply".
2. "reply" — your answer, in ${T} (except tutor mode). Adapt vocabulary and grammar to ${c.level}, slightly above to make the learner progress. 1 to 4 sentences, conversational, end with a question or prompt that makes them answer. Use real everyday expressions (idioms, common slang that's understood everywhere) when it fits the level, not only textbook ${T}.
   "replyTranslation" — faithful translation of "reply" into ${N}.

Never be sycophantic. Never repeat the correction inside "reply" — corrections go only in "correction".

LANGUAGE RULE (critical): ${c.mode === "prof" ? `"reply" is written in ${N}` : `"reply" is written ONLY in ${T}, never in ${N}`}; "replyTranslation" is written in ${c.mode === "prof" ? T : N}; every "explanation" and "tip" is written in ${N}; "corrected" and "natural" are written in ${T}.`;
}

/** Schéma de correction : chaque champ précise sa langue (aide beaucoup les petits modèles). */
export function correctionSchemaFor(target: LangCode, native: LangCode) {
  const T = LANG_EN_NAME[target];
  const N = LANG_EN_NAME[native];
  return obj({
    isCorrect: bool(),
    score: num("0-100, or -1 when not applicable"),
    corrected: str(`the learner's ${T} text with only the errors fixed, written in ${T}`),
    natural: str(`how a native speaker would say it, written in ${T}`),
    errors: arr(
      obj({
        wrong: str(`the exact wrong fragment copied from the learner's ${T} text`),
        right: str(`the corrected fragment, in ${T}`),
        type: str("one of: grammaire, conjugaison, vocabulaire, orthographe, accents, ponctuation, ordre des mots, registre, naturel, faux ami"),
        explanation: str(`the rule, explained in ${N}`),
      })
    ),
    tip: str(`one actionable tip, in ${N}, or empty string`),
  });
}

export function coachSchemaFor(target: LangCode, native: LangCode) {
  return obj({
    correction: correctionSchemaFor(target, native),
    reply: str(`your conversational answer, written in ${LANG_EN_NAME[target]}`),
    replyTranslation: str(`translation of reply, written in ${LANG_EN_NAME[native]}`),
  });
}

// ───────────────────────────── Traduction ─────────────────────────────

export function translateSystem(from: LangCode | "auto", to: LangCode, native: LangCode, level: Level): string {
  const N = LANG_EN_NAME[native];
  return `You are an expert translator and language teacher (like DeepL + Reverso Context + an interlinear gloss). The learner's native language is ${N}, level ${level}.
Translate the user's text from ${from === "auto" ? "its detected language" : LANG_EN_NAME[from]} into ${LANG_EN_NAME[to]}.
Return:
- "detected": language name of the source text, in ${N}.
- "translation": the best natural, idiomatic translation (what a native would actually say).
- "literal": a deliberately literal, word-for-word rendering of the SOURCE in ${LANG_EN_NAME[to]}, even if awkward — so the learner sees the structure.
- "alignment": the source split into small chunks (single words, or fixed expressions kept together), in order, each with "source" (chunk), "target" (its equivalent in the natural translation, or "∅" if it disappears), and "note" in ${N} (part of speech, conjugation, gender, or why it changes — short, can be empty).
- "alternatives": 2 to 4 other valid translations with different register, each with "text", "register" (one of: formel, courant, familier, argot) and "note" in ${N} (when to use it).
- "vocabulary": the 3-8 most useful words/expressions to learn from this text, with "term" (in ${LANG_EN_NAME[to]}), "translation" (in the source language), "kind" (nom, verbe, adjectif, expression, etc., in ${N}) and "example" (a short new example sentence in ${LANG_EN_NAME[to]}).
- "notes": 0-4 short grammar/usage notes in ${N} (false friends, tricky structures, cultural nuances).
- "examples": 3 short real-life example pairs showing the key expression in context: "source" and "target".`;
}

export const translateSchema = obj({
  detected: str(),
  translation: str(),
  literal: str(),
  alignment: arr(obj({ source: str(), target: str(), note: str() })),
  alternatives: arr(obj({ text: str(), register: str(), note: str() })),
  vocabulary: arr(obj({ term: str(), translation: str(), kind: str(), example: str() })),
  notes: arr(str()),
  examples: arr(obj({ source: str(), target: str() })),
});

// ───────────────────────────── Correcteur de texte ─────────────────────────────

export function correctorSystem(target: LangCode, native: LangCode, level: Level, strictness: Strictness): string {
  const T = LANG_EN_NAME[target];
  const N = LANG_EN_NAME[native];
  return `You are a strict ${T} writing examiner. The learner (native: ${N}, declared level: ${level}) submits a text written in ${T}.
SEVERITY: ${STRICTNESS[strictness]}
Return:
- "correction": "corrected" (the full text with only errors fixed), "natural" (the full text rewritten as a native would write it), "errors" (EVERY error: "wrong", "right", "type" among grammaire, conjugaison, vocabulaire, orthographe, accents, ponctuation, ordre des mots, registre, naturel, faux ami — and "explanation" in ${N}), "score" 0-100, "isCorrect", "tip" (the single most important thing to work on, in ${N}).
- "cefr": the CEFR level this text demonstrates (A1-C2).
- "feedback": 2-4 sentences of frank overall feedback in ${N} (coherence, richness of vocabulary, sentence variety).`;
}

export function correctorSchemaFor(target: LangCode, native: LangCode) {
  return obj({
    correction: correctionSchemaFor(target, native),
    cefr: str("A1, A2, B1, B2, C1 or C2"),
    feedback: str(`2-4 sentences in ${LANG_EN_NAME[native]}`),
  });
}

// ───────────────────────────── Prononciation ─────────────────────────────

export function pronSystem(target: LangCode, native: LangCode, strictness: Strictness): string {
  return `You are a ${LANG_EN_NAME[target]} pronunciation coach for a native ${LANG_EN_NAME[native]} speaker. SEVERITY: ${STRICTNESS[strictness]}
You receive the target sentence and what a speech recognizer heard. Mismatches usually reveal pronunciation problems (e.g. "sink" heard instead of "think" means a th-sound problem). Also anticipate the classic difficulties for ${LANG_EN_NAME[native]} speakers on this sentence even if the recognizer got it right.
Return, all text in ${LANG_EN_NAME[native]} except the sounds and drills:
- "verdict": one or two frank sentences.
- "tips": 1-4 items with "sound" (the sound or word, IPA if useful), "problem", "howTo" (concrete mouth/tongue/stress instruction).
- "stress": the sentence with stressed syllables in CAPITALS and linking marked with ‿ (e.g. "I'm‿Over the MOON").
- "drills": 2-3 short practice words or mini-sentences in ${LANG_EN_NAME[target]} targeting the problems.`;
}

export const pronSchema = obj({
  verdict: str(),
  tips: arr(obj({ sound: str(), problem: str(), howTo: str() })),
  stress: str(),
  drills: arr(str()),
});

// ───────────────────────────── Exercices ─────────────────────────────

export type ExerciseKind = "qcm" | "trou" | "traduire" | "ordre" | "dictee";

export const EXERCISE_INFO: Record<ExerciseKind, { name: string; desc: string }> = {
  qcm: { name: "QCM", desc: "Choisis la bonne réponse" },
  trou: { name: "Texte à trous", desc: "Complète la phrase" },
  traduire: { name: "Traduction", desc: "Traduis vers la langue cible" },
  ordre: { name: "Remettre en ordre", desc: "Reconstruis la phrase" },
  dictee: { name: "Dictée", desc: "Écoute et écris" },
};

export function exercisesSystem(target: LangCode, native: LangCode, level: Level): string {
  const T = LANG_EN_NAME[target];
  const N = LANG_EN_NAME[native];
  return `You create ${T} exercises for a ${level} learner whose native language is ${N}. Exercises must be accurate, unambiguous, varied, and use real everyday ${T} (include common idioms and informal expressions that are understood everywhere, not only textbook language).
Every exercise object has ALL these fields (use "" or [] when not relevant):
- "kind": qcm | trou | traduire | ordre | dictee
- "instruction": short instruction in ${N}
- "question":
   qcm → a sentence or question in ${T} (may contain "___");
   trou → a ${T} sentence with exactly one "___" gap;
   traduire → a sentence in ${N} to translate into ${T};
   ordre → "" ;
   dictee → "".
- "options": qcm → exactly 4 options; other kinds → [].
- "answer": qcm → the exact correct option; trou → the missing word(s); traduire → the best ${T} translation; ordre → the full correct ${T} sentence (5-12 words); dictee → the ${T} sentence to dictate.
- "accepted": other fully correct answers (variants, contractions). [] if none.
- "translation": translation in ${N} of the full ${T} sentence.
- "explanation": in ${N}, why this is the answer (the rule).`;
}

export const exercisesSchema = obj({
  exercises: arr(
    obj({
      kind: { type: "string", enum: ["qcm", "trou", "traduire", "ordre", "dictee"] },
      instruction: str(),
      question: str(),
      options: arr(str()),
      answer: str(),
      accepted: arr(str()),
      translation: str(),
      explanation: str(),
    })
  ),
});

export const judgeSchema = obj({ correct: bool(), explanation: str() });

// ───────────────────────────── Argot ─────────────────────────────

export function slangSystem(target: LangCode, native: LangCode, level: Level): string {
  const N = LANG_EN_NAME[native];
  return `You teach real spoken ${LANG_EN_NAME[target]}: everyday expressions, idioms and slang that natives actually use today and that are understood in most of the ${LANG_EN_NAME[target]}-speaking world (flag clearly when something is regional). Learner: native ${N}, level ${level}.
Return 8 expressions on the requested theme, none of them in the excluded list, each with:
"expr", "meaning" (in ${N}), "literal" (word-for-word in ${N}, "" if same as meaning), "example" (natural sentence in ${LANG_EN_NAME[target]}), "exampleTr" (in ${N}), "register" (courant | familier | argot | vulgaire), "region" (in ${N}, e.g. "Partout", "Surtout UK", "Espagne", "Mexique").`;
}

export const slangSchema = obj({
  items: arr(
    obj({
      expr: str(),
      meaning: str(),
      literal: str(),
      example: str(),
      exampleTr: str(),
      register: str(),
      region: str(),
    })
  ),
});

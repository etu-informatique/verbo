import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { ArrowLeft, ArrowUp, History, Languages, Mic, MicOff, Plus, Trash2, Volume2, VolumeX } from "lucide-react";
import type { BetaMessageParam } from "@anthropic-ai/sdk/resources/beta/messages/messages";
import { askJson, friendlyError } from "../lib/claude";
import { coachSchema, coachSystem, MODE_INFO, START_TOKEN } from "../lib/prompts";
import { LANGS } from "../lib/languages";
import { speak, useSpeechRecognition } from "../lib/speech";
import { DEBATE_TOPICS, FREE_TOPICS, SCENARIOS } from "../data/scenarios";
import { uid, useStore, type ChatMode, type ChatMsg, type Conversation, type Correction } from "../store/useStore";
import { Badge, Button, ErrorBox, IconButton, Modal, PageHeader, SpeakButton, Spinner } from "../components/ui";
import { CorrectionView } from "../components/Correction";

interface CoachReply {
  correction: Correction;
  reply: string;
  replyTranslation: string;
}

// ───────────────────────────── Écran de démarrage ─────────────────────────────

function Setup({ onStart, right }: { onStart: (mode: ChatMode, topic: string, title: string) => void; right?: React.ReactNode }) {
  const [mode, setMode] = useState<ChatMode>("libre");
  const [custom, setCustom] = useState("");

  const start = (topic: string, title?: string) => onStart(mode, topic, title ?? topic);

  return (
    <div className="pb-28 md:pb-10">
      <PageHeader title="Coach IA" subtitle="Un partenaire de conversation qui ne te laisse rien passer." right={right} />

      <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
        {(Object.keys(MODE_INFO) as ChatMode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={clsx(
              "rounded-2xl border p-3 text-left transition active:scale-[0.98] md:p-4",
              mode === m ? "border-brand/60 bg-brand/10" : "border-line bg-white/[0.03] hover:bg-white/[0.06]",
              m === "prof" && "col-span-2 md:col-span-1"
            )}
          >
            <span className="text-2xl">{MODE_INFO[m].emoji}</span>
            <p className="mt-2 text-sm font-semibold">{MODE_INFO[m].name}</p>
            <p className="mt-0.5 text-xs leading-snug text-muted">{MODE_INFO[m].desc}</p>
          </button>
        ))}
      </div>

      <div className="mt-6 animate-fade-up" key={mode}>
        {mode === "libre" && (
          <>
            <h2 className="mb-3 text-sm font-semibold text-muted">De quoi veux-tu parler ?</h2>
            <div className="flex flex-wrap gap-2">
              {FREE_TOPICS.map((t) => (
                <button key={t} onClick={() => start(t)} className="rounded-full border border-line bg-white/[0.04] px-4 py-2 text-sm transition hover:border-brand/50 hover:bg-brand/10">
                  {t}
                </button>
              ))}
              <button onClick={() => start("", "Conversation libre")} className="rounded-full bg-brand-gradient px-4 py-2 text-sm font-medium text-white">
                Surprends-moi
              </button>
            </div>
          </>
        )}

        {mode === "debat" && (
          <>
            <h2 className="mb-3 text-sm font-semibold text-muted">Choisis un sujet — le coach prendra le camp opposé.</h2>
            <div className="grid gap-2 md:grid-cols-2">
              {DEBATE_TOPICS.map((t) => (
                <button key={t} onClick={() => start(t)} className="rounded-2xl border border-line bg-white/[0.03] p-3 text-left text-sm transition hover:border-brand/50 hover:bg-brand/10">
                  ⚔️ {t}
                </button>
              ))}
            </div>
          </>
        )}

        {mode === "role" && (
          <>
            <h2 className="mb-3 text-sm font-semibold text-muted">Choisis une situation.</h2>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
              {SCENARIOS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => onStart("role", `${s.setup} The learner's goal: ${s.goal}`, s.title)}
                  className="rounded-2xl border border-line bg-white/[0.03] p-3 text-left transition hover:border-brand/50 hover:bg-brand/10"
                >
                  <span className="text-2xl">{s.emoji}</span>
                  <p className="mt-1.5 text-sm font-semibold">{s.title}</p>
                  <p className="text-xs leading-snug text-muted">{s.goal}</p>
                </button>
              ))}
            </div>
          </>
        )}

        {(mode === "examen" || mode === "prof") && (
          <div className="glass p-5">
            <p className="text-sm text-muted">
              {mode === "examen"
                ? "Une dizaine de questions de difficulté croissante. À la fin, le coach te donne ton niveau CECR, tes points forts et tes faiblesses."
                : "Pose n'importe quelle question : grammaire, différence entre deux mots, expression, prononciation… Tu peux écrire dans ta langue."}
            </p>
            <Button variant="primary" className="mt-4" onClick={() => start("", MODE_INFO[mode].name)}>
              Commencer
            </Button>
          </div>
        )}

        {(mode === "libre" || mode === "debat" || mode === "role") && (
          <form
            className="mt-4 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (custom.trim()) start(custom.trim());
            }}
          >
            <input
              className="field"
              placeholder={mode === "role" ? "Ou décris ta propre situation…" : "Ou propose ton propre sujet…"}
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
            />
            <Button variant="primary" type="submit" disabled={!custom.trim()}>
              Go
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}

// ───────────────────────────── Bulles ─────────────────────────────

function Bubble({ m, lang, showTr, latest }: { m: ChatMsg; lang: Parameters<typeof speak>[1]; showTr: boolean; latest: boolean }) {
  const [tr, setTr] = useState(false);
  if (m.role === "user") {
    return (
      <div className="flex flex-col items-end gap-1.5 animate-fade-up">
        <div className="max-w-[85%] whitespace-pre-wrap rounded-3xl rounded-br-lg bg-brand-gradient px-4 py-2.5 text-[15px] text-white shadow-lg shadow-fuchsia-500/10">
          {m.text}
        </div>
        {m.correction && (
          <div className="w-full max-w-[92%] md:max-w-[80%]">
            <CorrectionView c={m.correction} lang={lang} original={m.text} compact={!latest} />
          </div>
        )}
      </div>
    );
  }
  return (
    <div className="flex items-start gap-2.5 animate-fade-up">
      <img src="./icon.svg" alt="" className="mt-1 size-7 shrink-0 rounded-lg" />
      <div className="max-w-[85%]">
        <div className="whitespace-pre-wrap rounded-3xl rounded-tl-lg border border-line bg-white/[0.05] px-4 py-2.5 text-[15px]">{m.text}</div>
        {(showTr || tr) && m.translation && <p className="mt-1.5 px-2 text-sm italic text-muted">{m.translation}</p>}
        <div className="mt-1 flex items-center gap-1 px-1">
          <SpeakButton text={m.text} lang={lang} size="sm" />
          <SpeakButton text={m.text} lang={lang} size="sm" rate={0.6} />
          {m.translation && !showTr && (
            <button onClick={() => setTr(!tr)} className="ml-1 flex items-center gap-1 rounded-full px-2 py-1 text-xs text-muted hover:bg-white/[0.06] hover:text-ink">
              <Languages className="size-3.5" /> {tr ? "Masquer" : "Traduire"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ───────────────────────────── Page ─────────────────────────────

export default function Coach() {
  const { settings, chats, upsertChat, deleteChat, addXp, addMistakes, updateSettings } = useStore();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showTr, setShowTr] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const stt = useSpeechRecognition(settings.target, true);

  const chat = chats.find((c) => c.id === activeId) ?? null;
  const history = chats.filter((c) => c.lang === settings.target);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [chat?.messages.length, loading]);

  useEffect(() => {
    if (stt.listening) setInput(stt.interim);
  }, [stt.interim, stt.listening]);

  // Auto-hauteur de la zone de saisie
  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 160) + "px";
  }, [input]);

  const callCoach = async (conv: Conversation) => {
    setLoading(true);
    setError(null);
    try {
      const msgs: BetaMessageParam[] = conv.messages.slice(-40).map((m) => ({ role: m.role, content: m.text }));
      while (msgs.length && msgs[0].role !== "user") msgs.shift();
      const res = await askJson<CoachReply>({
        system: coachSystem({ target: conv.lang, native: settings.native, level: settings.level, strictness: settings.strictness, mode: conv.mode, topic: conv.topic }),
        messages: msgs,
        schema: coachSchema,
      });
      const last = conv.messages[conv.messages.length - 1];
      const isStart = last.text === START_TOKEN;
      const updated: Conversation = {
        ...conv,
        messages: [
          ...conv.messages.slice(0, -1),
          isStart ? last : { ...last, correction: res.correction },
          { id: uid(), role: "assistant", text: res.reply, translation: res.replyTranslation, at: Date.now() },
        ],
      };
      upsertChat(updated);
      if (!isStart) {
        const sc = res.correction.score;
        addXp(sc >= 90 ? 10 : sc >= 0 ? 5 : 3, "messages");
        if (res.correction.errors.length) addMistakes(last.text, res.correction.errors);
      }
      if (settings.autoSpeak) speak(res.reply, conv.lang);
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setLoading(false);
    }
  };

  const startChat = (mode: ChatMode, topic: string, title: string) => {
    const conv: Conversation = {
      id: uid(),
      lang: settings.target,
      mode,
      topic,
      title,
      created: Date.now(),
      messages: [{ id: uid(), role: "user", text: START_TOKEN, at: Date.now() }],
    };
    upsertChat(conv);
    setActiveId(conv.id);
    callCoach(conv);
  };

  const send = () => {
    const text = input.trim();
    if (!text || !chat || loading) return;
    if (stt.listening) stt.stop();
    const conv = { ...chat, messages: [...chat.messages, { id: uid(), role: "user" as const, text, at: Date.now() }] };
    upsertChat(conv);
    setInput("");
    callCoach(conv);
  };

  const retry = () => chat && callCoach(chat);

  const visible = chat?.messages.filter((m) => m.text !== START_TOKEN) ?? [];
  const lastUserId = [...visible].reverse().find((m) => m.role === "user")?.id;
  const waitingReply = chat && chat.messages[chat.messages.length - 1]?.role === "user";

  const historyModal = (
    <Modal open={showHistory} onClose={() => setShowHistory(false)} title="Conversations">
      {history.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted">Aucune conversation pour l'instant.</p>
      ) : (
        <ul className="space-y-1.5">
          {history.map((c) => (
            <li key={c.id} className="flex items-center gap-2">
              <button
                onClick={() => {
                  setActiveId(c.id);
                  setShowHistory(false);
                  setError(null);
                }}
                className={clsx("flex flex-1 items-center gap-3 rounded-xl border border-line p-3 text-left transition hover:bg-white/[0.05]", c.id === activeId && "bg-white/[0.06]")}
              >
                <span className="text-xl">{MODE_INFO[c.mode].emoji}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{c.title}</span>
                  <span className="block text-xs text-faint">
                    {new Date(c.created).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} · {c.messages.filter((m) => m.role === "user").length - 1} messages
                  </span>
                </span>
              </button>
              <IconButton
                label="Supprimer"
                onClick={() => {
                  deleteChat(c.id);
                  if (c.id === activeId) setActiveId(null);
                }}
              >
                <Trash2 className="size-4" />
              </IconButton>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );

  if (!chat) {
    return (
      <>
        <Setup
          onStart={startChat}
          right={
            history.length > 0 && (
              <Button size="sm" variant="soft" onClick={() => setShowHistory(true)}>
                <History className="size-4" /> Historique ({history.length})
              </Button>
            )
          }
        />
        {historyModal}
      </>
    );
  }

  return (
    <div className="chat-h flex flex-col">
      {/* En-tête de conversation */}
      <div className="flex items-center gap-2 border-b border-line pb-3">
        <IconButton label="Nouvelle conversation" onClick={() => setActiveId(null)}>
          <ArrowLeft className="size-5" />
        </IconButton>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{chat.title}</p>
          <div className="flex items-center gap-1.5">
            <Badge tone="brand">
              {MODE_INFO[chat.mode].emoji} {MODE_INFO[chat.mode].name}
            </Badge>
            <span className="text-xs text-faint">
              {LANGS[chat.lang].flag} {settings.level}
            </span>
          </div>
        </div>
        <IconButton label={showTr ? "Masquer les traductions" : "Toujours traduire"} onClick={() => setShowTr(!showTr)} className={clsx(showTr && "text-violet-300")}>
          <Languages className="size-5" />
        </IconButton>
        <IconButton label={settings.autoSpeak ? "Lecture auto activée" : "Lecture auto désactivée"} onClick={() => updateSettings({ autoSpeak: !settings.autoSpeak })} className={clsx(settings.autoSpeak && "text-violet-300")}>
          {settings.autoSpeak ? <Volume2 className="size-5" /> : <VolumeX className="size-5" />}
        </IconButton>
        <IconButton label="Historique" onClick={() => setShowHistory(true)}>
          <History className="size-5" />
        </IconButton>
        <IconButton label="Nouvelle conversation" onClick={() => setActiveId(null)} className="hidden sm:inline-flex">
          <Plus className="size-5" />
        </IconButton>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 space-y-5 overflow-y-auto py-5 pr-1">
        {visible.map((m) => (
          <Bubble key={m.id} m={m} lang={chat.lang} showTr={showTr} latest={m.id === lastUserId} />
        ))}
        {loading && (
          <div className="flex items-center gap-2.5 pl-1">
            <img src="./icon.svg" alt="" className="size-7 rounded-lg" />
            <div className="rounded-3xl rounded-tl-lg border border-line bg-white/[0.05] px-4 py-3">
              <Spinner label={visible.length ? "Le coach corrige…" : "Le coach arrive…"} />
            </div>
          </div>
        )}
        {error && <ErrorBox message={error} onRetry={waitingReply ? retry : undefined} />}
      </div>

      {/* Saisie */}
      <div className="pb-2 md:pb-4">
        {stt.error && <p className="mb-2 text-xs text-bad">{stt.error}</p>}
        <div className={clsx("flex items-end gap-2 rounded-3xl border bg-panel/80 p-2 backdrop-blur transition", stt.listening ? "border-brand2/60" : "border-line2")}>
          {stt.supported && (
            <button
              onClick={() => (stt.listening ? stt.stop() : stt.start())}
              aria-label={stt.listening ? "Arrêter la dictée" : "Dicter"}
              className={clsx(
                "flex size-10 shrink-0 items-center justify-center rounded-full transition",
                stt.listening ? "animate-pulse-ring bg-brand2 text-white" : "bg-white/[0.06] text-muted hover:text-ink"
              )}
            >
              {stt.listening ? <MicOff className="size-5" /> : <Mic className="size-5" />}
            </button>
          )}
          <textarea
            ref={taRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                send();
              }
            }}
            placeholder={stt.listening ? "Je t'écoute…" : `Écris en ${LANGS[chat.lang].name.toLowerCase()}…`}
            className="max-h-40 flex-1 resize-none bg-transparent px-2 py-2.5 text-[16px] outline-none placeholder:text-faint"
          />
          <button
            onClick={send}
            disabled={!input.trim() || loading}
            aria-label="Envoyer"
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-gradient text-white transition active:scale-90 disabled:opacity-30"
          >
            <ArrowUp className="size-5" />
          </button>
        </div>
      </div>
      {historyModal}
    </div>
  );
}

import { transitionTo, transitionRoute } from '../lib/routeTransition';
import { m as motion, AnimatePresence } from 'framer-motion';
import { useViewportSpring } from '../lib/useViewportSpring';
import { kiraMessageMotion } from '../lib/kiraMotion';
import { useStudyReducedMotion } from '../lib/motion';
import { KiraAvatar } from '../components/KiraAvatar'
import PromptField from '../components/PromptField';
import { useSearchParams, useNavigate } from "react-router-dom";
import Lembretes from "./Lembretes";
import EnemAdmissions from "../components/EnemAdmissions";
import EnemPractice from "../components/EnemPractice";

import { useState, useEffect, useLayoutEffect, useRef } from "react";
import { ArrowUp, BookmarkPlus, ChevronRight, RotateCcw } from "lucide-react";
import { supabase } from "../lib/supabase";
import { FOCUS_SECONDS, readFocus } from "../lib/focus";
import { notifyFocus } from "../lib/preferences";
import { KIRA_DAILY_LIMIT } from "../lib/groq";
import { useKira } from "../lib/useKira";

const AREAS = [
  { id: "lc", label: "Linguagens", short: "LC", color: "#f59e0b" },
  { id: "ch", label: "Humanas", short: "CH", color: "#10b981" },
  { id: "cn", label: "Natureza", short: "CN", color: "#3b82f6" },
  { id: "mt", label: "Matemática", short: "MT", color: "#8b5cf6" },
  { id: "red", label: "Redação", short: "RED", color: "#ef4444" },
];

const QUICK_PROMPTS = [
  "O que estudar hoje",
  "Dica de redação",
  "Simulado rápido",
];

const BOLSAS = [
  { id: 'prouni', nome: 'ProUni', detalhe: 'Bolsas integrais e parciais', url: 'https://acessounico.mec.gov.br/prouni' },
  { id: 'fies', nome: 'Fies', detalhe: 'Financiamento estudantil', url: 'https://acessounico.mec.gov.br/fies' },
  { id: 'educa', nome: 'Educa Mais Brasil', detalhe: 'Descontos em graduação', url: 'https://www.educamaisbrasil.com.br' },
];

function fmt(s) {
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

function SessaoFoco({ userId }) {
  const key = `studyos:focus:${userId}`;
  const [focus, setFocus] = useState(() => readFocus(key));
  const [areaChoice, setAreaChoice] = useState(AREAS[0]);
  const [now, setNow] = useState(() => Date.now());
  const [saveState, setSaveState] = useState("idle");
  const [retry, setRetry] = useState(0);
  const area = AREAS.find(({ id }) => id === focus?.areaId) ?? areaChoice;
  const deadline = focus?.deadline;
  const seconds = deadline == null ? (focus?.seconds ?? FOCUS_SECONDS) : Math.max(0, Math.ceil((deadline - now) / 1000));
  const running = deadline != null && seconds > 0;
  const done = deadline != null && seconds === 0;
  const focusId = focus?.id;
  const focusArea = focus?.areaId;

  useEffect(() => {
    function sync(event) {
      if (event.key !== key) return;
      setFocus(readFocus(key));
      setNow(Date.now());
      setSaveState("idle");
    }
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, [key]);

  function updateFocus(value) {
    setFocus(value);
    try {
      if (value) localStorage.setItem(key, JSON.stringify(value));
      else localStorage.removeItem(key);
    } catch { /* O timer continua nesta tela. */ }
  }

  useEffect(() => {
    if (deadline == null || done) return;
    const tick = () => setNow(Date.now());
    const timer = setInterval(tick, 1000);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [deadline, done]);

  useEffect(() => {
    if (!done || !userId) return;
    let active = true;
    async function save() {
      try {
        const { error } = await supabase.from("study_sessions").upsert({
          id: focusId, user_id: userId, area: focusArea, duration_min: 25,
          created_at: new Date(deadline).toISOString(),
        }, { onConflict: "id", ignoreDuplicates: true });
        if (error) throw error;
        if (active) {
          setSaveState("saved");
          void notifyFocus(focusId);
        }
      } catch {
        if (active) setSaveState("error");
      }
    }
    void save();
    return () => { active = false; };
  }, [done, userId, focusId, focusArea, deadline, retry]);

  function toggleTimer() {
    const timestamp = Date.now();
    setNow(timestamp);
    if (deadline != null) {
      if (deadline <= timestamp) return;
      updateFocus({ ...focus, seconds: Math.ceil((deadline - timestamp) / 1000), deadline: null });
    } else {
      updateFocus({ id: focusId ?? crypto.randomUUID(), areaId: area.id, seconds, deadline: timestamp + seconds * 1000 });
    }
  }

  function reset() {
    setSaveState("idle");
    updateFocus(null);
  }

  function retrySave() {
    setSaveState("idle");
    setRetry((value) => value + 1);
  }
  const progress = (1 - seconds / FOCUS_SECONDS) * 100;

  return (
    <section className="study-enem-focus" aria-label="Sessão de foco">
      <div className="study-enem-areas" role="group" aria-label="Área de estudo">
        {AREAS.map((item) => (
          <button key={item.id} type="button" aria-label={item.label}
            aria-pressed={area.id === item.id} disabled={Boolean(focus) && (!done || saveState === "idle")}
            onClick={() => { reset(); setAreaChoice(item); }}>
            {item.short}
          </button>
        ))}
      </div>
      <div className="study-enem-dial" style={{ "--enem-progress": `${progress}%`, "--enem-area": area.color }}>
        <div className="study-enem-dial-face">
          <span>{running ? "Em foco" : done ? "Concluído" : focus ? "Pausado" : "Sessão de foco"}</span>
          <strong aria-label={`${Math.floor(seconds / 60)} minutos e ${seconds % 60} segundos`}>{fmt(seconds)}</strong>
          <span>{area.label}</span>
        </div>
      </div>
      <div className="study-enem-controls">
        {done ? (
          <button type="button" className="study-primary" disabled={saveState === "idle"} onClick={reset}>Nova sessão</button>
        ) : (
          <button type="button" className="study-primary" onClick={toggleTimer}>
            {running ? "Pausar" : focus ? "Retomar foco" : "Iniciar foco"}
          </button>
        )}
        {!done && focus && <button type="button" aria-label="Cancelar sessão de foco" onClick={reset}>
          <RotateCcw size={18} aria-hidden="true" />
        </button>}
      </div>
      {done && <div className="study-note">
        <p role="status">{saveState === "idle" ? "Salvando sessão…" : saveState === "saved"
          ? `Sessão registrada` : "Falha ao salvar a sessão."}</p>
        {saveState === "error" && <button type="button" onClick={retrySave}>Tentar novamente</button>}
      </div>}
    </section>
  );
}

export default function EnemScreen({ userId }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const fromNfc = params.get("modo") === "foco";
  const [tab, setTab] = useState(fromNfc ? "foco" : "praticar");
  const [switched, setSwitched] = useState(false);
  const [kiraInput, setKiraInput] = useState("");
  const { messages, remaining, loading, error, send, clear } = useKira(tab === "kira", userId ? `studyos:chat:${userId}` : null);
  const log = useRef(null);
  const reduced = useStudyReducedMotion();
  const [restoredCount] = useState(messages.length);

  const page = useRef(null);
  const updateViewport = useViewportSpring(page, "enem");
  useLayoutEffect(() => {
    if (tab !== 'kira') return;
    const root = document.documentElement;
    const viewport = window.visualViewport;
    let frame = 0;
    let normalHeight = window.innerHeight;
    let width = window.innerWidth;
    root.dataset.enemChat = '';
    function update() {
      frame = 0;
      if (viewport && viewport.scale !== 1) return;
      if (width !== window.innerWidth) { width = window.innerWidth; normalHeight = window.innerHeight; }
      const height = viewport?.height ?? window.innerHeight;
      normalHeight = Math.max(normalHeight, window.innerHeight, height);
      const editing = document.activeElement?.matches('.study-enem-chat textarea');
      root.toggleAttribute('data-study-keyboard', normalHeight - height > 120 && (editing || root.hasAttribute('data-study-keyboard')));
      updateViewport(height, viewport?.offsetTop ?? 0);
    }
    function schedule() { if (!frame) frame = requestAnimationFrame(update); }
    update();
    viewport?.addEventListener('resize', schedule);
    viewport?.addEventListener('scroll', schedule);
    window.addEventListener('resize', schedule);
    document.addEventListener('focusin', schedule);
    return () => {
      cancelAnimationFrame(frame);
      viewport?.removeEventListener('resize', schedule);
      viewport?.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      document.removeEventListener('focusin', schedule);
      delete root.dataset.enemChat;
      delete root.dataset.studyKeyboard;
    };
  }, [tab, updateViewport]);

  useEffect(() => {
    if (log.current) log.current.scrollTop = log.current.scrollHeight;
  }, [messages, loading, tab]);

  async function enviar(texto) {
    const draft = texto ?? kiraInput;
    if (await send(draft) && !texto) setKiraInput((current) => current === draft ? "" : current);
  }

  function guardarResposta(content, index) {
    const question = [...messages.slice(0, index)].reverse().find(message => message.role === "user")?.content;
    navigate("/anotacoes", { state: { draft: {
      title: (question || "Revisão com a Kira ENEM").slice(0, 120),
      content,
      area: "geral",
    } } });
  }

  const tabs = [
    ["praticar", "Praticar"],
    ["foco", "Foco"],
    ["postits", "Post-its"],
    ["corte", "Ingresso"],
    ["kira", "Kira"],
  ];

  const paneMotion = reduced
    ? { initial: false, animate: { opacity: 1 } }
    : {
        initial: { opacity: .45, y: 5 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: .28, ease: [.22, 1, .36, 1] },
      };

  return (
    <motion.main
      ref={page}
      data-enem-section={tab}
      data-chat-active={tab === "kira" || undefined}
      className="study-page study-enem"
      data-switched={switched || undefined}
    >
      <header className="study-enem-header"><h1>ENEM</h1></header>

      <div className="study-enem-tabs" role="group" aria-label="Seções do modo ENEM">
        {tabs.map(([id, label]) => {
          const active = tab === id;
          return (
            <button
              className="study-enem-segment"
              key={id}
              type="button"
              aria-pressed={active}
              onClick={() => { if (!active) transitionTo(() => { setSwitched(true); setTab(id); }); }}
            >
              {active && (
                <motion.span
                  layoutId="enem-active-pill"
                  className="study-enem-segment-active"
                  aria-hidden="true"
                  transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 480, damping: 38, mass: 0.65 }}
                />
              )}
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {tab === "praticar" && (
          <motion.div key="praticar" {...paneMotion}>
            <EnemPractice key={userId} userId={userId} />
          </motion.div>
        )}

        {tab === "foco" && (
          <motion.div key="foco" className="study-enem-pane" {...paneMotion}>
            <SessaoFoco key={userId} userId={userId} />
          </motion.div>
        )}

        {tab === "postits" && (
          <motion.div key="postits" className="study-enem-pane" {...paneMotion}>
            <Lembretes key={userId} userId={userId} />
          </motion.div>
        )}

        {tab === "corte" && (
          <motion.section key="corte" className="study-enem-pane" aria-label="Notas de corte e bolsas" {...paneMotion}>
            <EnemAdmissions key={userId} userId={userId} />
            <h2 className="study-enem-subtitle">Bolsas e financiamentos</h2>
            <div className="study-enem-scholarships-grid">
              {BOLSAS.map((bolsa) => (
                <a className="study-enem-scholarship" key={bolsa.id} href={bolsa.url} target="_blank" rel="noreferrer">
                  <span>
                    <strong style={{ display: 'block', fontSize: '15px' }}>{bolsa.nome}</strong>
                    <small style={{ display: 'block', fontSize: '12px', color: '#a2b7d4', marginTop: '2px' }}>{bolsa.detalhe}</small>
                  </span>
                  <ChevronRight size={17} aria-hidden="true" />
                </a>
              ))}
            </div>
            <p className="study-note">Consulte requisitos, prazos e ofertas no site de cada programa.</p>
          </motion.section>
        )}

        {tab === "kira" && (
          <motion.section key="kira" className="study-enem-pane study-enem-chat" aria-label="Kira no modo ENEM" {...paneMotion}>
            <div className="study-enem-kira-title">
              <div><h2>Kira ENEM</h2>{remaining !== null && <p>{remaining}/{KIRA_DAILY_LIMIT} mensagens hoje</p>}</div>
              <button type="button" onClick={() => { void transitionRoute("/chat", () => navigate("/chat", { state: { expanded: true } })); }}>Expandir</button>
              {messages.length > 0 && <button type="button" onClick={clear} disabled={loading}>Limpar</button>}
            </div>
            <div className="study-enem-conversation" ref={log}>
              {messages.length === 0 && !loading && (
                <div className="enem-kira-welcome">
                  <KiraAvatar size={50} />
                  <h3>O que vamos revisar?</h3>
                  <div className="study-enem-prompts">
                  {QUICK_PROMPTS.map((prompt, index) => <button key={prompt} style={{ "--prompt-order": index }} type="button" onClick={() => enviar(prompt)}>{prompt}</button>)}
                  </div>
                </div>
              )}
              {(messages.length > 0 || loading) && (
                <div className="study-chat-log study-enem-log" role="log">
                  {messages.map(({ role, content }, index) => (
                    <motion.div key={index} {...kiraMessageMotion(role, reduced, index < restoredCount)}>
                      <p className={`study-message study-message--${role}`}>{content}</p>
                      {role === "assistant" && (
                        <div className="study-reply-actions">
                          <button type="button" onClick={() => guardarResposta(content, index)} aria-label="Guardar resposta no caderno">
                            <BookmarkPlus size={15} aria-hidden="true" /> Guardar no caderno
                          </button>
                        </div>
                      )}
                    </motion.div>
                  ))}
                  {loading && <p className="study-chat-status">Kira está preparando a resposta…</p>}
                </div>
              )}
            </div>
            <form className="study-composer" onSubmit={(event) => { event.preventDefault(); void enviar(); }}>
              {error && <p role="alert" className="study-chat-error">{error}</p>}
              <div className="study-composer-field">
                <PromptField aria-label="Mensagem para a Kira" placeholder="Mensagem para a Kira" value={kiraInput}
                  onChange={(event) => setKiraInput(event.target.value)} maxLength={2000} />
                <button type="submit" aria-label="Enviar mensagem" disabled={loading || !kiraInput.trim()}>
                  <ArrowUp size={20} aria-hidden="true" />
                </button>
              </div>
            </form>
          </motion.section>
        )}
      </AnimatePresence>
    </motion.main>
  );
}
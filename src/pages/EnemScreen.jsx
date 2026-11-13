import { useSearchParams } from "react-router-dom";
import Lembretes from "./Lembretes";
import EnemAdmissions from "../components/EnemAdmissions";
import EnemPractice from "../components/EnemPractice";
// Modo ENEM: prática, post-its, referências de ingresso e tutoria.

import { useState, useEffect, useLayoutEffect, useRef } from "react";
import { ArrowUp, ChevronRight, RotateCcw } from "lucide-react";
import { supabase }   from "../lib/supabase";
import { FOCUS_SECONDS, readFocus } from "../lib/focus";
import { notifyFocus } from "../lib/preferences";
import { KIRA_DAILY_LIMIT } from "../lib/groq";
import { useKira } from "../lib/useKira";

// ─── Constantes ───────────────────────────────────────────────────────────────

const AREAS = [
  { id: "lc",  label: "Linguagens", short: "LC",  color: "#f59e0b" },
  { id: "ch",  label: "Humanas",    short: "CH",  color: "#10b981" },
  { id: "cn",  label: "Natureza",   short: "CN",  color: "#3b82f6" },
  { id: "mt",  label: "Matemática", short: "MT",  color: "#8b5cf6" },
  { id: "red", label: "Redação",    short: "RED", color: "#ef4444" },
];

const QUICK_PROMPTS = [
  "O que estudar hoje",
  "Dica de redação",
  "Resumo de CN",
  "Simulado rápido",
  "Cronograma final",
];

const BOLSAS = [
  { id: 'prouni', nome: 'ProUni', url: 'https://acessounico.mec.gov.br/prouni' },
  { id: 'fies', nome: 'Fies', url: 'https://acessounico.mec.gov.br/fies' },
  { id: 'educa', nome: 'Educa Mais Brasil', url: 'https://www.educamaisbrasil.com.br' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(s) {
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}
// ─── Sessão de Foco ───────────────────────────────────────────────────────────
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
          ? `Sessão registrada · +30 XP` : "Falha ao salvar a sessão."}</p>
        {saveState === "error" && <button type="button" onClick={retrySave}>Tentar novamente</button>}
      </div>}
    </section>
  );
}

// ─── Tela Principal ───────────────────────────────────────────────────────────
export default function EnemScreen({ userId }) {
  const [params] = useSearchParams();
  const fromNfc = params.get("modo") === "foco";
  const [tab, setTab] = useState(fromNfc ? "foco" : "praticar");
  const [switched, setSwitched] = useState(false);
  const [kiraInput, setKiraInput] = useState("");
  const { messages, remaining, loading, error, send, clear } = useKira(tab === "kira");
  const log = useRef(null);

  const page = useRef(null);
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
      const editing = document.activeElement?.matches('.study-enem-chat input');
      root.toggleAttribute('data-study-keyboard', normalHeight - height > 120 && (editing || root.hasAttribute('data-study-keyboard')));
      page.current?.style.setProperty('--enem-height', `${height}px`);
      page.current?.style.setProperty('--enem-top', `${viewport?.offsetTop ?? 0}px`);
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
  }, [tab]);

  useEffect(() => {
    if (log.current) log.current.scrollTop = log.current.scrollHeight;
  }, [messages, loading, tab]);

  async function enviar(texto) {
    const draft = texto ?? kiraInput;
    if (await send(draft) && !texto) setKiraInput((current) => current === draft ? "" : current);
  }

  const tabs = [
    [fromNfc ? "foco" : "praticar", fromNfc ? "Foco" : "Praticar"], ["postits", "Post-its"], ["corte", "Ingresso"], ["kira", "Kira"],
  ];

  return (
    <main ref={page} data-chat-active={tab === "kira" || undefined} className="study-page study-enem" data-switched={switched || undefined}>
      <header className="study-enem-header">
        <h1>Modo ENEM</h1>
        <p>Foco, revisão e planejamento.</p>
      </header>
      <div className="study-enem-tabs" role="group" aria-label="Seções do modo ENEM">
        {tabs.map(([id, label]) => (
          <button key={id} type="button" aria-pressed={tab === id} onClick={() => { if (id !== tab) { setSwitched(true); setTab(id); } }}>{label}</button>
        ))}
      </div>
      {tab === "praticar" && <EnemPractice key={userId} userId={userId} />}
      {fromNfc && <div className="study-enem-pane" hidden={tab !== "foco"}><SessaoFoco key={userId} userId={userId} /></div>}
      {tab === "postits" && <div className="study-enem-pane"><Lembretes key={userId} userId={userId} /></div>}
      {tab === "corte" && <section className="study-enem-pane" aria-label="Notas de corte e bolsas">
        <EnemAdmissions key={userId} userId={userId} />
        <h2 className="study-enem-subtitle">Bolsas e financiamentos</h2>
        {BOLSAS.map((bolsa) => (
          <a className="study-enem-scholarship" key={bolsa.id} href={bolsa.url} target="_blank" rel="noreferrer">
            <strong>{bolsa.nome}</strong><ChevronRight size={17} aria-hidden="true" />
          </a>
        ))}
        <p className="study-note">Consulte requisitos, prazos e ofertas no site de cada programa.</p>
      </section>}
      {tab === "kira" && <section className="study-enem-pane study-enem-chat" aria-label="Kira no modo ENEM">
        <div className="study-enem-kira-title">
          <div><h2>Kira ENEM</h2>{remaining !== null && <p>{remaining}/{KIRA_DAILY_LIMIT} mensagens hoje</p>}</div>
          {messages.length > 0 && <button type="button" onClick={clear} disabled={loading}>Limpar</button>}
        </div>
        <div className="study-enem-conversation" ref={log}>
        {messages.length === 0 && !loading && <div className="study-enem-prompts">
          {QUICK_PROMPTS.map((prompt) => <button key={prompt} type="button" onClick={() => enviar(prompt)}>{prompt}</button>)}
        </div>}
        {(messages.length > 0 || loading) && <div className="study-chat-log study-enem-log" role="log">
          {messages.map(({ role, content }, index) => <p key={index} className={`study-message study-message--${role}`}>{content}</p>)}
          {loading && <p className="study-chat-status">Kira está preparando a resposta…</p>}
        </div>}
        </div>
        <form className="study-composer" onSubmit={(event) => { event.preventDefault(); void enviar(); }}>
          {error && <p role="alert" className="study-chat-error">{error}</p>}
          <div className="study-composer-field">
            <input aria-label="Mensagem para a Kira" placeholder="Mensagem para a Kira" value={kiraInput}
              onChange={(event) => setKiraInput(event.target.value)} maxLength={2000} enterKeyHint="send" />
            <button type="submit" aria-label="Enviar mensagem" disabled={loading || !kiraInput.trim()}>
              <ArrowUp size={20} aria-hidden="true" />
            </button>
          </div>
        </form>
      </section>}
    </main>
  );
}

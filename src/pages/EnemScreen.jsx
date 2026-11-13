import { useSearchParams } from "react-router-dom";
import Lembretes from "./Lembretes";
import EnemPractice from "../components/EnemPractice";
// EnemScreen.jsx — StudyOS
// Modo ENEM: Sessão de Foco + Notas de Corte + Kira ENEM + BolsasModal

import { useState, useEffect, useRef } from "react";
import { ArrowUp, ChevronRight, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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

// Fallback enquanto Supabase não estiver configurado ou o usuário não tiver scores
const NOTAS_FALLBACK = { lc: 630, ch: 681, cn: 663, mt: 633, red: 708 };

const QUICK_PROMPTS = [
  "O que estudar hoje",
  "Dica de redação",
  "Resumo de CN",
  "Simulado rápido",
  "Cronograma final",
];

const FACULDADES_MOCK = [
  { nome: "USP — Medicina (Ribeirão Preto)",    corte: 795.2, bolsas: false },
  { nome: "UNICAMP — Engenharia de Computação", corte: 740.8, bolsas: true  },
  { nome: "UFMG — Direito",                     corte: 723.1, bolsas: true  },
  { nome: "UFV — Ciências Biológicas",          corte: 661.4, bolsas: true  },
  { nome: "UFOP — Engenharia Civil",            corte: 598.0, bolsas: true  },
  { nome: "PUC-MG — Psicologia",                corte: 572.5, bolsas: true  },
  { nome: "UNIMINAS — Administração",           corte: 510.3, bolsas: true  },
];

const BOLSAS = [
  {
    id: "educa",
    nome: "Educa Mais Brasil",
    tag: "ATÉ 70% DE BOLSA",
    tagCor: "#f59e0b",
    desc: "Bolsas parciais em mais de 2.000 faculdades particulares em todo o Brasil.",
    requisitos: [
      "ENEM realizado (qualquer edição)",
      "Renda familiar até 3 salários mínimos",
      "Matriculado ou candidato a curso presencial",
    ],
    url: "https://www.educamaisbrasil.com.br",
    cor: "#f59e0b",
    corBg: "rgba(245,158,11,.10)",
    corBorder: "rgba(245,158,11,.22)",
  },
  {
    id: "prouni",
    nome: "ProUni",
    tag: "BOLSA INTEGRAL",
    tagCor: "#3b82f6",
    desc: "Programa do MEC com bolsas integrais e parciais em faculdades privadas.",
    requisitos: [
      "ENEM a partir de 2010 com nota ≥ 450",
      "Redação com nota acima de zero",
      "Renda per capita até 1,5 s.m. (integral) ou 3 s.m. (parcial)",
    ],
    url: "https://prouniportal.mec.gov.br",
    cor: "#3b82f6",
    corBg: "rgba(59,130,246,.10)",
    corBorder: "rgba(59,130,246,.22)",
  },
  {
    id: "fies",
    nome: "FIES",
    tag: "FINANCIAMENTO FEDERAL",
    tagCor: "#10b981",
    desc: "Financiamento estudantil federal com juros baixos e carência de 18 meses.",
    requisitos: [
      "ENEM a partir de 2010 com nota ≥ 450",
      "Renda familiar mensal bruta por pessoa ≤ 3 s.m.",
      "Regularidade no CPF e quitação eleitoral",
    ],
    url: "https://fies.mec.gov.br",
    cor: "#10b981",
    corBg: "rgba(16,185,129,.10)",
    corBorder: "rgba(16,185,129,.22)",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(s) {
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}
function mediaDeNotas(n) {
  return Math.round((n.lc + n.ch + n.cn + n.mt + n.red) / 5);
}

// ─── Estilos base ─────────────────────────────────────────────────────────────
const T = {
  label: { fontSize: 10, letterSpacing: ".18em", fontWeight: 700, color: "#52525b" },
  muted: { color: "#71717a" },
};

// ─── BolsasModal ──────────────────────────────────────────────────────────────
function BolsasModal({ bolsa, onClose }) {
  if (!bolsa) return null;
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,.7)", backdropFilter: "blur(8px)" }}
      />
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 32, stiffness: 300 }}
        style={{
          position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 101,
          maxWidth: 430, margin: "0 auto",
          background: "#0e0e12",
          border: "1px solid rgba(255,255,255,.10)",
          borderBottom: "none",
          borderRadius: "28px 28px 0 0",
          padding: "0 0 44px",
          boxShadow: "0 -20px 60px rgba(0,0,0,.6)",
          color: "#f4f4f5",
        }}
      >
        <div style={{ display: "flex", justifyContent: "center", padding: "14px 0 0" }}>
          <div style={{ width: 36, height: 4, borderRadius: 99, background: "rgba(255,255,255,.12)" }} />
        </div>

        <div style={{ padding: "16px 24px 20px", borderBottom: "1px solid rgba(255,255,255,.06)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <span style={{ ...T.label, color: bolsa.tagCor, display: "block", marginBottom: 6 }}>{bolsa.tag}</span>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: "-.04em", color: "#f4f4f5" }}>{bolsa.nome}</h2>
            </div>
            <button onClick={onClose} style={{
              width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
              background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.10)",
              color: "#a1a1aa", fontSize: 20, cursor: "pointer", display: "grid", placeItems: "center",
            }}>×</button>
          </div>
          <p style={{ margin: "12px 0 0", fontSize: 14, lineHeight: 1.65, color: "#a1a1aa" }}>{bolsa.desc}</p>
        </div>

        <div style={{ padding: "20px 24px" }}>
          <p style={{ ...T.label, margin: "0 0 12px" }}>REQUISITOS PRINCIPAIS</p>
          {bolsa.requisitos.map((r, i) => (
            <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 10 }}>
              <div style={{
                width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                background: bolsa.corBg, border: `1px solid ${bolsa.corBorder}`,
                display: "grid", placeItems: "center", fontSize: 10, color: bolsa.cor, fontWeight: 700,
              }}>✓</div>
              <span style={{ fontSize: 13, lineHeight: 1.55, color: "#d4d4d8", paddingTop: 1 }}>{r}</span>
            </div>
          ))}
        </div>

        <div style={{ padding: "0 24px" }}>
          <a href={bolsa.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
            <button className="btn" style={{
              width: "100%", background: bolsa.cor, color: "#000",
              fontWeight: 800, fontSize: 15,
              boxShadow: `0 10px 32px ${bolsa.cor}44, inset 0 1px 0 rgba(255,255,255,.22)`,
            }}>
              Acessar site oficial ↗
            </button>
          </a>
          <p style={{ margin: "10px 0 0", fontSize: 11, color: "#3f3f46", textAlign: "center" }}>
            Redirecionado para o site oficial do programa.
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
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

// ─── Notas de Corte ───────────────────────────────────────────────────────────
function NotasCorte({ minhaMedia, simulada }) {
  const [busca, setBusca]           = useState("");
  const [soComBolsa, setSoComBolsa] = useState(false);

  const filtradas = FACULDADES_MOCK.filter(f =>
    f.nome.toLowerCase().includes(busca.toLowerCase()) && (soComBolsa ? f.bolsas : true)
  );

  return (
    <div style={{ color: "#f4f4f5" }}>
      <div className="glass-deep" style={{ borderRadius: 20, padding: "16px 18px", marginBottom: 14 }}>
        <p style={{ ...T.label, margin: "0 0 10px" }}>{simulada ? "MÉDIA DE EXEMPLO" : "MÉDIA REGISTRADA"}</p>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <progress className="study-enem-score" aria-label="Pontuação de 0 a 1.000" max="1000" value={minhaMedia} />
          <strong style={{ fontSize: 26, minWidth: 55, textAlign: "right", color: "#93c5fd", letterSpacing: "-.04em" }}>
            {minhaMedia}
          </strong>
        </div>
      </div>

      <div className="study-enem-search">
        <input className="input-glass" aria-label="Buscar faculdade ou curso" placeholder="Faculdade ou curso" value={busca}
          onChange={e => setBusca(e.target.value)} style={{ flex: 1 }} />
        <button className={soComBolsa ? "btn btn-enem" : "btn btn-ghost"}
          onClick={() => setSoComBolsa(b => !b)} style={{ padding: "0 14px", fontSize: 12 }}>Bolsa</button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {filtradas.map((f) => {
          const pct    = minhaMedia / f.corte;
          const status = pct >= 1 ? "ok" : pct >= .9 ? "perto" : "longe";
          const cor    = status === "ok" ? "#10b981" : status === "perto" ? "#f59e0b" : "#6b7280";
          return (
            <motion.div key={f.nome} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: .16 }} className="glass" style={{ borderRadius: 18, padding: "14px 16px" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, lineHeight: 1.35, color: "#f4f4f5" }}>{f.nome}</p>
                  <div style={{ marginTop: 10 }}>
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: `${Math.min(100, pct * 100)}%`, background: cor }} />
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <strong style={{ fontSize: 20, color: cor, letterSpacing: "-.03em" }}>{f.corte}</strong>
                  <p style={{ margin: "2px 0 0", fontSize: 10, color: "#52525b" }}>corte</p>
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
                {f.bolsas && <span className="badge badge-yellow">Bolsas disponíveis</span>}
                {status === "ok"    && <span className="badge badge-green">Nota atingida</span>}
                {status === "perto" && <span className="badge badge-yellow">Faltam {(f.corte - minhaMedia).toFixed(1)} pts</span>}
                {status === "longe" && <span className="badge" style={{ background: "rgba(107,114,128,.08)", border: "1px solid rgba(107,114,128,.18)", color: "#6b7280" }}>
                  {(f.corte - minhaMedia).toFixed(1)} pts abaixo
                </span>}
              </div>
            </motion.div>
          );
        })}
        {filtradas.length === 0 && (
          <p style={{ color: "#3a3a42", textAlign: "center", padding: "32px 0", fontSize: 13 }}>
            Nenhum resultado para "{busca}"
          </p>
        )}
      </div>
      <p style={{ fontSize: 11, color: "#2e2e35", marginTop: 14, textAlign: "center" }}>
        Notas de corte ilustrativas. Confira os valores oficiais antes de decidir.
      </p>
    </div>
  );
}

// ─── Tela Principal ───────────────────────────────────────────────────────────
export default function EnemScreen({ userId }) {
  const [params] = useSearchParams();
  const fromNfc = params.get("modo") === "foco";
  const [tab, setTab] = useState(fromNfc ? "foco" : "praticar");
  const [switched, setSwitched] = useState(false);
  const [bolsaAberta, setBolsaAberta] = useState(null);
  const [scores, setScores] = useState(null);
  const [kiraInput, setKiraInput] = useState("");
  const { messages, remaining, loading, error, send, clear } = useKira(tab === "kira");
  const log = useRef(null);

  useEffect(() => {
    if (tab !== "corte" || !userId) return;
    let active = true;
    supabase.from("enem_scores").select("lc, ch, cn, mt, red").eq("user_id", userId)
      .maybeSingle().then(({ data }) => { if (active && data) setScores(data); });
    return () => { active = false; };
  }, [tab, userId]);

  useEffect(() => {
    if (log.current) log.current.scrollTop = log.current.scrollHeight;
  }, [messages, loading, tab]);

  useEffect(() => {
    if (!bolsaAberta) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [bolsaAberta]);

  async function enviar(texto) {
    const draft = texto ?? kiraInput;
    if (await send(draft) && !texto) setKiraInput((current) => current === draft ? "" : current);
  }

  const tabs = [
    [fromNfc ? "foco" : "praticar", fromNfc ? "Foco" : "Praticar"], ["postits", "Post-its"], ["corte", "Ingresso"], ["kira", "Kira"],
  ];

  return (
    <main className="study-page study-enem" data-switched={switched || undefined}>
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
        <p className="study-note">Os valores abaixo são fictícios e não indicam aprovação nem bolsas disponíveis. Compare apenas como demonstração.</p>
        <details><summary>Ver demonstração de comparação de notas</summary><NotasCorte minhaMedia={mediaDeNotas(scores ?? NOTAS_FALLBACK)} simulada={!scores} /></details>
        <h2 className="study-enem-subtitle">Bolsas e financiamentos</h2>
        {BOLSAS.map((bolsa) => (
          <button className="study-enem-scholarship" key={bolsa.id} type="button" onClick={() => setBolsaAberta(bolsa)}>
            <strong>{bolsa.nome}</strong><ChevronRight size={17} aria-hidden="true" />
          </button>
        ))}
      </section>}
      {tab === "kira" && <section className="study-enem-pane" aria-label="Kira no modo ENEM">
        <div className="study-enem-kira-title">
          <div><h2>Kira ENEM</h2>{remaining !== null && <p>{remaining}/{KIRA_DAILY_LIMIT} mensagens hoje</p>}</div>
          {messages.length > 0 && <button type="button" onClick={clear} disabled={loading}>Limpar</button>}
        </div>
        {messages.length === 0 && !loading && <div className="study-enem-prompts">
          {QUICK_PROMPTS.map((prompt) => <button key={prompt} type="button" onClick={() => enviar(prompt)}>{prompt}</button>)}
        </div>}
        {(messages.length > 0 || loading) && <div className="study-chat-log study-enem-log" role="log" ref={log}>
          {messages.map(({ role, content }, index) => <p key={index} className={`study-message study-message--${role}`}>{content}</p>)}
          {loading && <p className="study-chat-status">Kira está preparando a resposta…</p>}
        </div>}
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
      <BolsasModal bolsa={bolsaAberta} onClose={() => setBolsaAberta(null)} />
    </main>
  );
}

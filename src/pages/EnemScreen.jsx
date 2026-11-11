// EnemScreen.jsx — StudyOS
// Modo ENEM: Sessão de Foco + Notas de Corte + Kira ENEM + BolsasModal

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase }   from "../lib/supabase";
import { KIRA_DAILY_LIMIT } from "../lib/groq";
import { useKira } from "../lib/useKira";

// ─── Constantes ───────────────────────────────────────────────────────────────
const ENEM_DATE = new Date("2026-11-15T08:00:00-03:00");

const AREAS = [
  { id: "lc",  label: "Linguagens", short: "LC",  color: "#f59e0b" },
  { id: "ch",  label: "Humanas",    short: "CH",  color: "#10b981" },
  { id: "cn",  label: "Natureza",   short: "CN",  color: "#3b82f6" },
  { id: "mt",  label: "Matemática", short: "MT",  color: "#8b5cf6" },
  { id: "red", label: "Redação",    short: "RED", color: "#ef4444" },
];

// Fallback enquanto Supabase não estiver configurado ou o usuário não tiver scores
const NOTAS_FALLBACK = { lc: 630, ch: 681, cn: 663, mt: 633, red: 708 };

const KIRA_TIPS = [
  "Foque nas questões de Ciências da Natureza hoje — sua taxa de acerto está abaixo da média.",
  "Você tem 3 revisões pendentes de Matemática. São 15 min cada.",
  "Redação: leia 2 artigos de opinião hoje. Argumentação é treinável.",
  "Simulado recomendado: 5 questões de Humanas + 5 de Linguagens. 25 min total.",
  "Sua nota projetada aumentou 18 pontos essa semana. Consistência supera intensidade.",
];

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
function getDaysToEnem() {
  return Math.max(0, Math.ceil((ENEM_DATE - new Date()) / 86400000));
}
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
function SessaoFoco() {
  const duration = 25 * 60;
  const [seconds, setSeconds] = useState(duration);
  const [deadline, setDeadline] = useState(null);
  const [area, setArea] = useState(AREAS[0]);
  const [done, setDone] = useState(false);
  const [saveState, setSaveState] = useState("idle");
  const completed = useRef(null);
  const running = deadline !== null;

  async function saveSession() {
    setSaveState("saving");
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error("Sessão de login indisponível");
      const { error } = await supabase.from("study_sessions").upsert(
        { ...completed.current, user_id: user.id },
        { onConflict: "id", ignoreDuplicates: true },
      );
      if (error) throw error;
      setSaveState("saved");
    } catch {
      setSaveState("error");
    }
  }

  useEffect(() => {
    if (!deadline) return;
    const timer = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setSeconds(remaining);
      if (remaining > 0) return;
      clearInterval(timer);
      completed.current = {
        id: crypto.randomUUID(),
        area: area.id,
        duration_min: 25,
        created_at: new Date(deadline).toISOString(),
      };
      setDeadline(null);
      setDone(true);
      void saveSession();
    }, 250);
    return () => clearInterval(timer);
  }, [deadline, area]);

  function toggleTimer() {
    if (running) {
      setSeconds(Math.max(1, Math.ceil((deadline - Date.now()) / 1000)));
      setDeadline(null);
    } else {
      setDeadline(Date.now() + seconds * 1000);
    }
  }

  function reset() {
    setDeadline(null);
    setSeconds(duration);
    setDone(false);
    setSaveState("idle");
    completed.current = null;
  }
  const pct   = ((25 * 60 - seconds) / (25 * 60)) * 100;
  const r     = 90, circ = 2 * Math.PI * r;

  return (
    <div className="glass-deep glass-sheen" style={{ borderRadius: 28, padding: 24, position: "relative", overflow: "hidden", color: "#f4f4f5" }}>
      <p style={{ ...T.label, margin: "0 0 16px" }}>SESSÃO DE FOCO</p>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 24 }}>
        {AREAS.map(a => (
          <button key={a.id} disabled={saveState === "saving"} onClick={() => { reset(); setArea(a); }} style={{
            padding: "7px 13px", borderRadius: 99, fontSize: 11, fontWeight: 700,
            background: area.id === a.id ? a.color + "1e" : "rgba(255,255,255,.04)",
            border: `1px solid ${area.id === a.id ? a.color + "55" : "rgba(255,255,255,.07)"}`,
            color: area.id === a.id ? a.color : "#52525b",
            cursor: "pointer", transition: ".2s ease",
          }}>{a.short}</button>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
        <div style={{ position: "relative", width: 200, height: 200 }}>
          <svg width="200" height="200" style={{ transform: "rotate(-90deg)" }}>
            <defs>
              <linearGradient id="timerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={area.color} />
                <stop offset="100%" stopColor="#22d3a0" />
              </linearGradient>
            </defs>
            <circle cx="100" cy="100" r={r} fill="none" stroke="rgba(255,255,255,.06)" strokeWidth="8" />
            <circle cx="100" cy="100" r={r} fill="none"
              stroke="url(#timerGrad)" strokeWidth="8" strokeLinecap="round"
              strokeDasharray={circ} strokeDashoffset={circ - (pct / 100) * circ}
              style={{ transition: "stroke-dashoffset 1s linear" }}
            />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <span style={{ ...T.label, marginBottom: 2 }}>{running ? "FOCANDO" : done ? "CONCLUÍDO" : "PAUSADO"}</span>
            <strong style={{ fontSize: 44, letterSpacing: "-.06em", fontVariantNumeric: "tabular-nums", lineHeight: 1.1, color: "#f4f4f5" }}>
              {fmt(seconds)}
            </strong>
            <span style={{ fontSize: 11, color: area.color, marginTop: 2 }}>{area.label}</span>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          {!done ? (
            <button className={running ? "btn btn-danger" : "btn btn-enem"} onClick={toggleTimer} style={{ minWidth: 140 }}>
              {running ? "Pausar" : "Iniciar Foco"}
            </button>
          ) : (
            <button className="btn btn-ghost" disabled={saveState === "saving"} onClick={reset}>Reiniciar</button>
          )}
          {!done && seconds < 25 * 60 && (
            <button className="btn btn-ghost" onClick={reset} style={{ padding: "0 16px" }}>✕</button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {done && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="glass-green" style={{ borderRadius: 16, padding: "13px 16px", marginTop: 20, textAlign: "center" }}
          >
            <p role="status" style={{ margin: 0, fontSize: 14, color: "#6eebd5", fontWeight: 600 }}>
              {saveState === "saving" && "Salvando sessão…"}
              {saveState === "saved" && `+30 XP · Sessão em ${area.label}`}
              {saveState === "error" && "Falha ao salvar a sessão."}
            </p>
            {saveState === "error" && (
              <button className="btn btn-ghost" onClick={saveSession}>Tentar novamente</button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Notas de Corte ───────────────────────────────────────────────────────────
function NotasCorte({ minhaMedia }) {
  const [busca, setBusca]           = useState("");
  const [soComBolsa, setSoComBolsa] = useState(false);

  const filtradas = FACULDADES_MOCK.filter(f =>
    f.nome.toLowerCase().includes(busca.toLowerCase()) && (soComBolsa ? f.bolsas : true)
  );

  return (
    <div style={{ color: "#f4f4f5" }}>
      <div className="glass-deep" style={{ borderRadius: 20, padding: "16px 18px", marginBottom: 14 }}>
        <p style={{ ...T.label, margin: "0 0 10px" }}>SUA NOTA ATUAL</p>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <input type="range" min="400" max="1000" step="5" value={minhaMedia}
            onChange={() => {}} style={{ flex: 1, accentColor: "#2563eb" }} readOnly />
          <strong style={{ fontSize: 26, minWidth: 55, textAlign: "right", color: "#93c5fd", letterSpacing: "-.04em" }}>
            {minhaMedia}
          </strong>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input className="input-glass" placeholder="Buscar faculdade ou curso..." value={busca}
          onChange={e => setBusca(e.target.value)} style={{ flex: 1 }} />
        <button className={soComBolsa ? "btn btn-enem" : "btn btn-ghost"}
          onClick={() => setSoComBolsa(b => !b)} style={{ padding: "0 14px", fontSize: 12 }}>Bolsa</button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {filtradas.map((f, i) => {
          const pct    = minhaMedia / f.corte;
          const status = pct >= 1 ? "ok" : pct >= .9 ? "perto" : "longe";
          const cor    = status === "ok" ? "#10b981" : status === "perto" ? "#f59e0b" : "#6b7280";
          return (
            <motion.div key={f.nome} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * .04 }} className="glass" style={{ borderRadius: 18, padding: "14px 16px" }}
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
        Dados SISU/MEC · edição 2025 · atualização após divulgação 2026
      </p>
    </div>
  );
}

// ─── Tela Principal ───────────────────────────────────────────────────────────
export default function EnemScreen() {
  const daysLeft = getDaysToEnem();

  // ── UI state ──
  const [tab,         setTab]         = useState("foco");
  const [tipIdx,      setTipIdx]      = useState(0);
  const [bolsaAberta, setBolsaAberta] = useState(null);

  // ── Notas (Supabase → fallback mock) ──
  const [notas,      setNotas]      = useState(NOTAS_FALLBACK);
  const [minhaMedia, setMinhaMedia] = useState(mediaDeNotas(NOTAS_FALLBACK));

  // ── Kira chat ──
  const [kiraInput,   setKiraInput]   = useState("");
  const {
    messages: kiraMsgs, remaining: kiraRemaining, loading: kiraLoading,
    error: kiraError, send: sendKira, clear: clearKira,
  } = useKira(tab === "kira");
  const kiraEndRef = useRef(null);

  // Busca notas reais do Supabase quando montar
  useEffect(() => {
    async function fetchNotas() {
      const { data: { user } } = await supabase.auth.getUser().catch(() => ({ data: {} }));
      if (!user) return;

      const { data } = await supabase
        .from("enem_scores")
        .select("lc, ch, cn, mt, red")
        .eq("user_id", user.id)
        .single();

      if (data) {
        setNotas(data);
        setMinhaMedia(mediaDeNotas(data));
      }
    }
    fetchNotas();
  }, []);

  // Rotação dos tips
  useEffect(() => {
    const id = setInterval(() => setTipIdx(i => (i + 1) % KIRA_TIPS.length), 8000);
    return () => clearInterval(id);
  }, []);

  // Scroll automático no chat da Kira
  useEffect(() => {
    kiraEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [kiraMsgs, kiraLoading]);

  // Lock scroll quando modal aberta
  useEffect(() => {
    document.body.style.overflow = bolsaAberta ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [bolsaAberta]);

  async function enviarParaKira(texto) {
    const msg = (texto || kiraInput).trim();
    if (!msg || kiraLoading) return;
    if (await sendKira(msg) && !texto) setKiraInput("");
  }

  const progresso = Math.max(2, 100 - (daysLeft / 365) * 100);
  const barCor    = daysLeft <= 7 ? "#ef4444" : daysLeft <= 30 ? "#f59e0b" : "#2563eb";
  const tabs = [
    { id: "foco",  label: "Sessão"    },
    { id: "corte", label: "Corte"     },
    { id: "kira",  label: "Kira ENEM" },
  ];

  return (
    <>
      <div style={{
        minHeight: "100dvh",
        background: "#050507",
        color: "#f4f4f5",
        padding: "0 0 110px",
        position: "relative",
        fontFamily: "inherit",
      }}>
        {/* Glow */}
        <div style={{
          position: "fixed", inset: 0, pointerEvents: "none",
          background: "radial-gradient(ellipse at 50% -5%, rgba(29,78,216,.20) 0%, transparent 52%)",
        }} />

        {/* ── Header ── */}
        <div style={{ padding: "52px 20px 0", position: "relative" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
            <div>
              <span style={{ ...T.label }}>MODO ENEM</span>
              <div style={{ display: "flex", alignItems: "baseline", gap: 7, marginTop: 4 }}>
                <span style={{ fontSize: 60, fontWeight: 900, letterSpacing: "-.06em", lineHeight: 1, color: "#f4f4f5" }}>
                  {daysLeft}
                </span>
                <span style={{ fontSize: 16, color: "#71717a", fontWeight: 500 }}>dias</span>
              </div>
            </div>

            <div className="glass-blue" style={{ borderRadius: 20, padding: "12px 16px", textAlign: "right", minWidth: 110 }}>
              <p style={{ margin: 0, fontSize: 9, letterSpacing: ".18em", color: "#60a5fa", fontWeight: 700 }}>SUA MÉDIA</p>
              <strong style={{ fontSize: 28, display: "block", letterSpacing: "-.05em", lineHeight: 1.1, color: "#f4f4f5" }}>{minhaMedia}</strong>
              <p style={{ margin: "3px 0 0", fontSize: 9, color: "#6b7280" }}>pts projetados</p>
            </div>
          </div>

          {/* Barra temporal */}
          <div style={{ marginBottom: 18 }}>
            <div className="progress-track" style={{ height: 3 }}>
              <div className="progress-fill" style={{ width: `${progresso}%`, background: barCor, transition: "none" }} />
            </div>
            <p style={{ fontSize: 10, color: "#3f3f46", marginTop: 6, letterSpacing: ".04em" }}>
              ENEM · {ENEM_DATE.toLocaleDateString("pt-BR", { day: "2-digit", month: "long" })}
            </p>
          </div>

          {/* Kira tip rotativo */}
          <AnimatePresence mode="wait">
            <motion.div key={tipIdx}
              initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
              transition={{ duration: .28 }}
              className="glass-violet glass-sheen"
              style={{ borderRadius: 20, padding: "13px 16px", marginBottom: 18, position: "relative", overflow: "hidden" }}
            >
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <div style={{
                  width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
                  background: "radial-gradient(circle, #2d7ff9, rgba(124,58,237,.5))",
                  display: "grid", placeItems: "center", fontSize: 10,
                }}>✦</div>
                <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: "#d4d4d8" }}>{KIRA_TIPS[tipIdx]}</p>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Grid de áreas com notas reais */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 6, marginBottom: 18 }}>
            {AREAS.map(a => (
              <div key={a.id} className="glass" style={{ borderRadius: 16, padding: "11px 6px", textAlign: "center" }}>
                <div style={{
                  width: 6, height: 6, borderRadius: "50%", background: a.color,
                  margin: "0 auto 7px", boxShadow: `0 0 7px ${a.color}88`,
                }} />
                <span style={{ fontSize: 9, color: "#52525b", letterSpacing: ".08em", display: "block", fontWeight: 700 }}>{a.short}</span>
                <strong style={{ fontSize: 15, display: "block", color: a.color, marginTop: 5, letterSpacing: "-.03em" }}>
                  {notas[a.id]}
                </strong>
              </div>
            ))}
          </div>
        </div>

        {/* ── Tabs ── */}
        <div style={{ padding: "0 20px", marginBottom: 16 }}>
          <div className="glass" style={{ borderRadius: 18, padding: 5, display: "grid", gridTemplateColumns: "1fr 1fr 1fr" }}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                border: "none", borderRadius: 13, padding: "10px 8px",
                background: tab === t.id ? "rgba(255,255,255,.08)" : "transparent",
                color: tab === t.id ? "#f4f4f5" : "#52525b",
                cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: 12,
                transition: ".2s ease",
                boxShadow: tab === t.id ? "inset 0 1px 0 rgba(255,255,255,.12), 0 4px 10px rgba(0,0,0,.18)" : "none",
              }}>{t.label}</button>
            ))}
          </div>
        </div>

        {/* ── Conteúdo ── */}
        <div style={{ padding: "0 20px" }}>
          <motion.div hidden={tab !== "foco"} initial={false}
            animate={tab === "foco" ? { opacity: 1, x: 0 } : { opacity: 0, x: -12 }}
            transition={{ duration: .2 }}>
            <SessaoFoco />
          </motion.div>
          <AnimatePresence mode="wait">

            {tab === "corte" && (
              <motion.div key="corte" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }} transition={{ duration: .2 }}>
                <NotasCorte minhaMedia={minhaMedia} />
              </motion.div>
            )}

            {tab === "kira" && (
              <motion.div key="kira" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }} transition={{ duration: .2 }}>

                {/* Kira chat compacto */}
                <div className="glass-deep glass-sheen" style={{ borderRadius: 24, padding: "18px 20px", position: "relative", overflow: "hidden", marginBottom: 14, color: "#f4f4f5" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: "50%",
                      background: "radial-gradient(circle, #2d7ff9, rgba(124,58,237,.5))",
                      display: "grid", placeItems: "center", fontSize: 14,
                      boxShadow: "0 0 16px rgba(45,127,249,.3)", flexShrink: 0,
                    }}>✦</div>
                    <div style={{ flex: 1 }}>
                      <strong style={{ display: "block", fontSize: 14, letterSpacing: "-.02em", color: "#f4f4f5" }}>Kira · Modo ENEM</strong>
                      <span style={{ fontSize: 11, color: kiraLoading ? "#f59e0b" : "#22d3a0" }}>
                        {kiraLoading ? "Preparando resposta…" : kiraRemaining === null
                          ? "Assistente de estudos"
                          : `${kiraRemaining}/${KIRA_DAILY_LIMIT} mensagens hoje`}
                      </span>
                    </div>
                    {kiraMsgs.length > 0 && (
                      <button
                        onClick={clearKira}
                        disabled={kiraLoading}
                        title="Limpar conversa"
                        style={{
                          background: "rgba(255,255,255,.05)",
                          border: "1px solid rgba(255,255,255,.08)",
                          borderRadius: 8, padding: "4px 8px",
                          color: "#52525b", fontSize: 11, cursor: "pointer",
                          flexShrink: 0,
                        }}>
                        limpar
                      </button>
                    )}
                  </div>

                  {/* Quick prompts */}
                  <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4, marginBottom: 12, scrollbarWidth: "none" }}>
                    {QUICK_PROMPTS.map(p => (
                      <button key={p} onClick={() => enviarParaKira(p)} disabled={kiraLoading}
                        className="btn btn-ghost"
                        style={{ padding: "6px 11px", fontSize: 11, minHeight: 34, borderRadius: 10, whiteSpace: "nowrap", flexShrink: 0 }}>
                        {p}
                      </button>
                    ))}
                  </div>

                  {/* Histórico de mensagens */}
                  {kiraMsgs.length > 0 && (
                    <div style={{
                      maxHeight: 260, overflowY: "auto",
                      display: "flex", flexDirection: "column", gap: 8,
                      marginBottom: 12, paddingRight: 2,
                      scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,.08) transparent",
                    }}>
                      {kiraMsgs.map((m, i) => (
                        <div key={i} style={{
                          padding: "9px 13px",
                          borderRadius: 14,
                          fontSize: 13, lineHeight: 1.55,
                          maxWidth: "92%",
                          alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                          background: m.role === "user"
                            ? "rgba(37,99,235,.22)"
                            : "rgba(255,255,255,.05)",
                          border: m.role === "user"
                            ? "1px solid rgba(37,99,235,.35)"
                            : "1px solid rgba(255,255,255,.07)",
                          color: "#d4d4d8",
                        }}>
                          {m.content}
                        </div>
                      ))}
                      {kiraLoading && (
                        <div style={{
                          padding: "9px 13px", borderRadius: 14, alignSelf: "flex-start",
                          background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.07)",
                          color: "#52525b", fontSize: 12,
                        }}>
                          ···
                        </div>
                      )}
                      <div ref={kiraEndRef} />
                    </div>
                  )}

                  {kiraError && <p role="alert" style={{ color: "#fda4af", fontSize: 12 }}>{kiraError}</p>}

                  {/* Input */}
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      className="input-glass"
                      placeholder="Pergunte à Kira..."
                      aria-label="Mensagem para a Kira"
                      maxLength={2000}
                      value={kiraInput}
                      onChange={e => setKiraInput(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && !e.shiftKey && enviarParaKira()}
                      style={{ flex: 1 }}
                      disabled={kiraLoading}
                    />
                    <button
                      className="btn btn-primary"
                      aria-label="Enviar mensagem"
                      onClick={() => enviarParaKira()}
                      disabled={kiraLoading || !kiraInput.trim()}
                      style={{ padding: "0 16px", minWidth: 44 }}>→</button>
                  </div>
                </div>

                {/* Bolsas */}
                <p style={{ ...T.label, margin: "0 0 10px" }}>BOLSAS E FINANCIAMENTOS</p>
                {BOLSAS.map(b => (
                  <button key={b.id} onClick={() => setBolsaAberta(b)} style={{
                    width: "100%", textAlign: "left",
                    display: "flex", alignItems: "center", gap: 14,
                    padding: "14px 16px", marginBottom: 8,
                    background: b.corBg,
                    border: `1px solid ${b.corBorder}`,
                    backdropFilter: "blur(22px)",
                    borderRadius: 18, cursor: "pointer",
                    color: "#f4f4f5",
                    transition: "opacity .15s ease",
                  }}>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: 9, letterSpacing: ".16em", color: b.cor, fontWeight: 700, display: "block", marginBottom: 4 }}>{b.tag}</span>
                      <strong style={{ fontSize: 15, display: "block", letterSpacing: "-.02em", color: "#f4f4f5" }}>{b.nome}</strong>
                      <span style={{ fontSize: 12, color: "#71717a", marginTop: 2, display: "block" }}>{b.desc.split(".")[0]}.</span>
                    </div>
                    <span style={{ color: "#52525b", fontSize: 20, flexShrink: 0 }}>›</span>
                  </button>
                ))}
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>

      <BolsasModal bolsa={bolsaAberta} onClose={() => setBolsaAberta(null)} />
    </>
  );
}

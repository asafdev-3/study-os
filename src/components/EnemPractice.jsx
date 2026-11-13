import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
const areas = ['Matemática', 'Natureza', 'Humanas', 'Linguagens', 'Redação']
export default function EnemPractice({ userId }) {
  const navigate = useNavigate()
  const [area, setArea] = useState('Matemática')
  const [topic, setTopic] = useState('')
  const [reason, setReason] = useState('Não entendi o conteúdo')
  const [notice, setNotice] = useState('')
  const key = 'studyos:errors:' + userId
  const [entries, setEntries] = useState(() => {
    try { const value = JSON.parse(localStorage.getItem(key) || '[]'); return Array.isArray(value) ? value.filter(x => typeof x.topic === 'string' && typeof x.area === 'string').slice(0,50) : [] } catch { return [] }
  })
  function ask(prompt) { navigate('/chat', { state: { prompt } }) }
  function save(event) {
    event.preventDefault()
    if (!topic.trim()) return
    const next = [{ id: crypto.randomUUID(), area, topic: topic.trim(), reason }, ...entries].slice(0,50)
    try { localStorage.setItem(key, JSON.stringify(next)); setEntries(next); setTopic(''); setNotice('Guardado para sua próxima revisão.') }
    catch { setNotice('Não foi possível guardar neste navegador. Tente novamente.') }
  }
  return <section className="enem-practice">
    <div className="enem-practice-hero">
      <span className="study-eyebrow">UM PASSO DE CADA VEZ</span>
      <h2>Entender. Praticar. Evoluir.</h2>
      <p>Escolha uma área e comece com uma questão. A explicação vem depois da sua tentativa.</p>
      <label>Hoje quero estudar<select value={area} onChange={e => setArea(e.target.value)}>{areas.map(x => <option key={x}>{x}</option>)}</select></label>
      <button className="study-primary" onClick={() => ask(area === 'Redação'
        ? 'Quero praticar redação ENEM. Proponha um tema de treino, identificado como autoral, e peça primeiro minha tese. Oriente em etapas curtas. Não atribua nota oficial.'
        : 'Vamos praticar ' + area + ' para o ENEM. Crie uma questão autoral de treino, identificada como gerada por IA, com cinco alternativas. Não dê o gabarito antes da minha tentativa. Depois explique o raciocínio e peça que eu identifique a causa de eventual erro.')}>Começar com Kira →</button>
      <small>Usa sua cota de mensagens somente quando você enviar no chat.</small>
    </div>
    <details className="enem-practice-section"><summary>Meu diário de erros <span>{entries.length} registros</span></summary>
      <p>Guarde o assunto ou a referência da questão que merece outra tentativa.</p>
      <form onSubmit={save}>
        <label>Assunto ou questão<input value={topic} onChange={e=>setTopic(e.target.value)} maxLength={160} required placeholder="Ex.: porcentagem · questão 12" /></label>
        <label>O que atrapalhou?<select value={reason} onChange={e=>setReason(e.target.value)}>{['Não entendi o conteúdo','Falta de atenção','Nervosismo','Faltou tempo'].map(x=><option key={x}>{x}</option>)}</select></label>
        <button className="study-primary">Guardar em {area}</button>
      </form>
      {notice && <p role="status">{notice}</p>}
      {entries.map(entry=><div className="enem-error-entry" key={entry.id}><strong>{entry.topic}</strong><small>{entry.area} · {entry.reason}</small><button onClick={()=>ask('Quero revisar ' + entry.topic + ' em ' + entry.area + '. Minha dificuldade foi: ' + entry.reason + '. Comece com uma pergunta curta para descobrir o que ainda não compreendi. Espere minha resposta.')}>Revisar com Kira →</button></div>)}
      <small>Registros desta conta salvos neste navegador, até 50 itens.</small>
    </details>
    <details className="enem-practice-section"><summary>Provas, redação e materiais oficiais</summary>
      <p>Treine com provas reais. Os links abrem recursos externos; o StudyOS não é vinculado ao MEC.</p>
      <a href="https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem/provas-e-gabaritos" target="_blank" rel="noreferrer">Provas e gabaritos · Inep ↗</a>
      <a href="https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem/outros-documentos" target="_blank" rel="noreferrer">Cartilha de redação e matriz · Inep ↗</a>
      <a href="https://app.mecenem.mec.gov.br" target="_blank" rel="noreferrer">Simulados, aulas e redação · MEC Enem ↗</a>
      <small>MEC Enem: gratuito, com acesso por conta Gov.br.</small>
    </details>
  </section>
}

import { useEffect, useMemo, useState } from 'react'
import { ArrowUpRight, MapPin } from 'lucide-react'
import { SCORE_AREAS, normalizePlace, parseScores, compareOffer } from '../lib/admissions'

function readProfile(key) {
  try {
    const saved = JSON.parse(localStorage.getItem(key))
    if (!saved || typeof saved !== 'object') return {}
    return Object.fromEntries([...SCORE_AREAS.map(([id]) => id), 'uf', 'city'].map(field => [field, typeof saved[field] === 'string' ? saved[field].slice(0,100) : '']))
  } catch { return {} }
}
const number = value => value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
export default function EnemAdmissions({ userId }) {
  const key = `studyos:admissions:${userId}`
  const [profile, setProfile] = useState(() => readProfile(key))
  const [submitted, setSubmitted] = useState(() => Boolean(parseScores(readProfile(key))))
  const [data, setData] = useState(null)
  const [loadError, setLoadError] = useState(false)
  const [retry, setRetry] = useState(0)
  const [notice, setNotice] = useState('')
  const [scope, setScope] = useState('city')
  const [query, setQuery] = useState('')
  const [onlyReached, setOnlyReached] = useState(true)
  const [limit, setLimit] = useState(20)
  useEffect(() => {
    const controller = new AbortController()
    fetch('/data/sisu-2025.json', { signal: controller.signal }).then(response => {
      if (!response.ok) throw new Error('Base indisponível')
      return response.json()
    }).then(value => { setData(value); setLoadError(false) }).catch(error => { if (error.name !== 'AbortError') setLoadError(true) })
    return () => controller.abort()
  }, [retry])
  const scores = parseScores(profile)
  const results = useMemo(() => {
    const valid = parseScores(profile)
    if (!submitted || !valid || !data) return []
    const city = normalizePlace(profile.city)
    const search = normalizePlace(query)
    return data.offers.filter(offer =>
      (scope === 'all' || (!profile.uf || offer.uf === profile.uf) && (scope === 'state' || !city || normalizePlace(offer.city) === city))
      && normalizePlace(`${offer.course} ${offer.institution} ${offer.acronym}`).includes(search))
      .map(offer => ({ ...offer, ...compareOffer(offer, valid) }))
      .filter(offer => !onlyReached || offer.reaches)
      .sort((a, b) => Number(b.reaches) - Number(a.reaches) || b.cutoff - a.cutoff || a.course.localeCompare(b.course))
  }, [data, profile, submitted, query, onlyReached, scope])
  const cities = useMemo(() => [...new Set((data?.offers ?? []).filter(o => !profile.uf || o.uf === profile.uf).map(o => o.city))].sort(), [data, profile.uf])
  function change(field, value) { setProfile(previous => ({ ...previous, [field]: value })); setSubmitted(false); setNotice(''); setLimit(20) }
  function submit(event) {
    event.preventDefault()
    if (!scores) { setNotice('Preencha as cinco notas entre 0 e 1.000.'); return }
    setSubmitted(true); setLimit(20)
    try { localStorage.setItem(key, JSON.stringify(profile)); setNotice('Notas e cidade guardadas neste dispositivo.') }
    catch { setNotice('Comparação pronta. Não foi possível guardar neste dispositivo.') }
  }
  return <section className="study-admissions" aria-label="Faculdades por nota e cidade">
    <header><span className="study-eyebrow">SEU PRÓXIMO PASSO</span><h2>Onde sua nota pode chegar?</h2><p>Compare suas cinco notas com os pesos de cada curso. Referência histórica do Sisu 2025, em ampla concorrência, sem bônus.</p></header>
    <form onSubmit={submit} className="study-admissions-form">
      <fieldset><legend>Suas notas do ENEM</legend><div className="study-score-inputs">{SCORE_AREAS.map(([id, label]) => <label key={id}>{label}<input aria-label={`Nota de ${label}`} inputMode="decimal" required maxLength={7} value={typeof profile[id] === 'string' || typeof profile[id] === 'number' ? profile[id] : ''} onChange={event => change(id, event.target.value)} placeholder="0 a 1.000" /></label>)}</div></fieldset>
      <div className="study-location-inputs"><label>Estado<select aria-label="Estado onde moro" value={profile.uf ?? ''} onChange={event => change('uf', event.target.value)}><option value="">Todos</option>{['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'].map(uf => <option key={uf}>{uf}</option>)}</select></label>
      <label>Minha cidade<input aria-label="Cidade onde moro" list="admission-cities" maxLength={100} placeholder="Ex.: Belo Horizonte" value={typeof profile.city === 'string' ? profile.city : ''} onChange={event => change('city', event.target.value)} autoComplete="address-level2" /><datalist id="admission-cities">{cities.map(city => <option value={city} key={city} />)}</datalist></label></div>
      <button type="submit" className="study-primary">Comparar minha nota <ArrowUpRight size={17} aria-hidden="true" /></button>
      {notice && <p role="status">{notice}</p>}
    </form>
    {loadError ? <p role="alert">Não foi possível carregar os cursos. <button type="button" onClick={() => { setLoadError(false); setRetry(n => n + 1) }}>Tentar novamente</button></p> : !data && <p role="status">Carregando referências…</p>}
    {submitted && scores && data && <div className="study-admissions-results">
      <div className="study-admissions-filters"><label>Localização<select aria-label="Filtrar localização" value={scope} onChange={event => { setScope(event.target.value); setLimit(20) }}><option value="city">Minha cidade{!profile.city && ' (não informada)'}</option><option value="state">Meu estado{!profile.uf && ' (não informado)'}</option><option value="all">Todo o Brasil</option></select></label>
      <label>Curso ou faculdade<input type="search" aria-label="Buscar curso ou faculdade" placeholder="Ex.: Medicina, UFMG" value={query} onChange={event => { setQuery(event.target.value); setLimit(20) }} /></label></div>
      <label className="study-admissions-check"><input type="checkbox" checked={onlyReached} onChange={event => { setOnlyReached(event.target.checked); setLimit(20) }} />Mostrar somente cortes alcançados</label>
      <p role="status">{results.length} opções nesta referência · não são vagas atuais.</p>
      {!results.length && <div className="study-admissions-empty"><MapPin size={24} aria-hidden="true" /><h3>Nenhum curso neste filtro</h3><p>A cidade pode não estar na base ou a nota não alcançar os cortes. Amplie a localização ou desmarque “somente cortes alcançados”.</p><button type="button" onClick={() => { setScope('all'); setLimit(20) }}>Buscar em todo o Brasil</button></div>}
      {results.slice(0, limit).map(offer => <article className="study-admission-card" key={offer.id}>
        <span>{offer.acronym} · {offer.city}/{offer.uf}</span><h3>{offer.course}</h3><p>{offer.institution} · {offer.campus}<br />{offer.degree} · {offer.shift}</p>
        <dl><div><dt>Sua nota ponderada</dt><dd>{number(offer.weighted)}</dd></div><div><dt>Corte em {offer.date.split('-').reverse().join('/')}</dt><dd>{number(offer.cutoff)}</dd></div></dl>
        <strong className={offer.reaches ? 'study-cut-reached' : 'study-cut-below'}>{offer.reaches ? 'Corte histórico alcançado' : !offer.meetsMinimums ? 'Mínimo por área ou média não atendido' : `Faltam ${number(offer.cutoff - offer.weighted)} pontos para esse corte`}</strong>
        <details><summary>Pesos e critérios</summary><p>{SCORE_AREAS.map(([,label], i) => `${label}: peso ${offer.weights[i]}, mínimo ${offer.minimums[i]}`).join(' · ')}. Média mínima: {offer.minimum}. Ampla concorrência, sem bônus. Confira o edital e a edição vigente.</p></details>
      </article>)}
      {results.length > limit && <button type="button" className="study-admissions-more" onClick={() => setLimit(n => n + 20)}>Mostrar mais 20 cursos</button>}
    </div>}
    <footer><p>Base histórica de ofertas de 2025, obtida de cópia pública dos dados do Sisu. Não cobre todas as faculdades do país, cotas ou bonificações. Alcançar esse corte não garante aprovação, bolsa ou vaga na edição atual.</p><a href="https://sisu.mec.gov.br/#/relatorio" target="_blank" rel="noreferrer">Consultar o Sisu oficial ↗</a>{data && <a href={data.mirror} target="_blank" rel="noreferrer">Origem e versão dos dados ↗</a>}</footer>
  </section>
}

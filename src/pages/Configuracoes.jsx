import { useState, useSyncExternalStore } from 'react'
import {
  ArrowLeft,
  Bell,
  ChevronRight,
  CreditCard,
  Download,
  FileDown,
  Fingerprint,
  Info,
  Palette,
  Search,
  Sparkles,
  User,
} from 'lucide-react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { readPreferences, updatePreferences } from '../lib/preferences'
import { InstallAnimation } from '../components/SetupAnimations'

import './Configuracoes.css'

const wideLayout = window.matchMedia('(min-width: 940px)')
function subscribeLayout(callback) {
  wideLayout.addEventListener('change', callback)
  return () => wideLayout.removeEventListener('change', callback)
}
const isWide = () => wideLayout.matches
const groupNames = ['Acesso', 'Preferências', 'Dados e assinatura']
const GROUPS = [
  [
    { id: 'instalar', name: 'Instalar StudyOS', subtitle: 'Adicione o app à tela inicial', Icon: Download },
    { id: 'conta', name: 'Conta', subtitle: 'Seu perfil e acesso', Icon: User },
  ],
  [
    { id: 'aparencia', name: 'Aparência', subtitle: 'Movimento e transparência', Icon: Palette },
    { id: 'kira', name: 'Kira', subtitle: 'Tom e estilo das respostas', Icon: Sparkles },
    { id: 'notificacoes', name: 'Notificações', subtitle: 'Avisos de sessão concluída', Icon: Bell },
    { id: 'entrada', name: 'Tela de bloqueio', subtitle: 'Gesto de entrada ao retornar', Icon: Fingerprint },
  ],
  [
    { id: 'dados', name: 'Seus dados', subtitle: 'Exportar suas anotações', Icon: FileDown },
    { id: 'assinatura', name: 'Assinatura', subtitle: 'Planos do StudyOS', Icon: CreditCard },
    { id: 'sobre', name: 'Sobre', subtitle: 'StudyOS para o ENEM', Icon: Info },
  ],
]

const pages = Object.fromEntries(
  GROUPS.flat().map(({ id, name, subtitle }) => [id, [name, subtitle]])
)

export default function Configuracoes() {
  const { secao } = useParams()
  const wide = useSyncExternalStore(subscribeLayout, isWide)
  const section = secao || (wide ? 'aparencia' : null)
  const navigate = useNavigate()
  const [preferences, setPreferences] = useState(readPreferences)
  const [search, setSearch] = useState('')
  const normalize = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  const groups = GROUPS.map(group => group.filter(item => normalize(item.name + ' ' + item.subtitle).includes(normalize(search.trim()))))
  const [notice, setNotice] = useState('')
  const [pending, setPending] = useState(false)

  function change(patch) {
    try {
      setPreferences(updatePreferences(patch))
      setNotice('Preferência salva neste dispositivo.')
    } catch {
      setNotice('O dispositivo bloqueou o armazenamento das preferências.')
    }
  }

  async function toggleAlerts() {
    if (preferences.focusAlerts) { change({ focusAlerts: false }); return }
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      setNotice('Este navegador não oferece avisos para o StudyOS. No iPhone, instale na Tela de Início e tente de novo.')
      return
    }
    try {
      const allowed = await Notification.requestPermission()
      if (allowed === 'granted') change({ focusAlerts: true })
      else setNotice('Permissão de notificação não concedida.')
    } catch {
      setNotice('Não foi possível solicitar a permissão neste dispositivo.')
    }
  }

  async function signOut() {
    setPending(true)
    try {
      const { error } = await supabase.auth.signOut({ scope: 'local' })
      if (error) throw error
      navigate('/login', { replace: true })
    } catch {
      setNotice('Não foi possível sair. Tente novamente.')
    } finally {
      setPending(false)
    }
  }

  async function exportNotes() {
    setPending(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Sessão indisponível')
      const notes = []
      for (let start = 0; ; start += 250) {
        const { data, error } = await supabase.from('annotations').select('id,title,content')
          .eq('user_id', user.id).order('created_at').order('id').range(start, start + 249)
        if (error) throw error
        notes.push(...data)
        if (data.length < 250) break
      }
      if (!notes.length) { setNotice('Você ainda não tem anotações para exportar.'); return }
      const file = new Blob([notes.map(({ title, content }) =>
        '## ' + (title || 'Sem título').replace(/[\r\n]/g, ' ') + '\n\n' + (content || ''),
      ).join('\n\n---\n\n')], { type: 'text/markdown;charset=utf-8' })
      const url = URL.createObjectURL(file)
      const link = document.createElement('a')
      link.href = url
      link.download = 'studyos-anotacoes.md'
      link.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      setNotice('Exportação preparada.')
    } catch {
      setNotice('Não foi possível exportar suas anotações.')
    } finally {
      setPending(false)
    }
  }

  if (secao && !Object.hasOwn(pages, secao)) return <Navigate to="/configuracoes" replace />

  return (
    <main className="study-page preferences-room">
      {(!secao || wide) && <nav className="pref-index" aria-label="Categorias dos ajustes">
        <h1>Ajustes</h1>
        <label className="pref-search"><Search aria-hidden="true" size={18} />
          <input type="search" aria-label="Buscar ajustes" placeholder="Buscar ajustes" value={search} onChange={event => setSearch(event.target.value)} />
        </label>
        {groups.every(group => !group.length) && <p role="status">Nenhum ajuste encontrado.</p>}
        {groups.map((group, i) => group.length > 0 && <section className="pref-group" key={groupNames[i]}>
          <h2>{groupNames[i]}</h2>
          <div>{group.map(({ id, name, subtitle, Icon }) =>
            <Link key={id} to={'/configuracoes/' + id} aria-current={section === id ? 'page' : undefined}>
              <Icon size={20} strokeWidth={1.6} aria-hidden="true" />
              <span><strong>{name}</strong><small>{subtitle}</small></span>
              <ChevronRight size={15} aria-hidden="true" />
            </Link>
          )}</div>
        </section>)}
      </nav>}
      {section && <article className="pref-detail" key={section} aria-labelledby="pref-detail-title">
        {!wide && <Link to="/configuracoes" className="pref-back"><ArrowLeft size={17} /> Ajustes</Link>}
        <header>
          {wide ? <h2 id="pref-detail-title">{pages[section][0]}</h2> : <h1 id="pref-detail-title">{pages[section][0]}</h1>}
          <p>{pages[section][1]}</p>
        </header>
      {section === 'instalar' && (
        <section className="study-install-guide pref-panel">
          <InstallAnimation />
          <h2>Seu espaço de estudo, sempre à mão.</h2>
          <p>O StudyOS é um aplicativo web instalável (PWA). Adicione-o à tela inicial sem baixar pela App Store ou Play Store.</p>
          <button type="button" className="study-primary" onClick={() => window.dispatchEvent(new Event('studyos:install'))}>Adicionar à tela inicial</button>
        </section>
      )}

      {section === 'conta' && (
        <section className="pref-panel">
          <Link className="study-settings-row"  to="/perfil">
            <span><strong>Abrir perfil</strong><small>Nome, curso e área de foco</small></span>
            <ChevronRight size={17} />
          </Link>
          <button
            type="button"
            className="study-settings-row"
            data-destructive
            disabled={pending}
            onClick={signOut}
          >
            <strong>Sair da conta neste dispositivo</strong>
          </button>
        </section>
      )}

      {section === 'aparencia' && (
        <section className="pref-panel">
          <div className="pref-glass-sample" aria-label="Prévia da intensidade do vidro">
            <img src="/images/janela-de-estudo.webp" alt="" width="512" height="288" decoding="async" />
            <span>StudyOS</span>
          </div>
          <label className="study-settings-row">
            <span><strong>Reduzir movimento</strong><small>Desativa animações suaves</small></span>
            <input type="checkbox" checked={preferences.reduceMotion} onChange={(event) => change({ reduceMotion: event.target.checked })} />
          </label>
          <div className="study-appearance-slider" style={{ paddingTop: '14px' }}>
            <div>
              <label htmlFor="study-glass-opacity">Intensidade do vidro</label>
              <output htmlFor="study-glass-opacity">{Math.round((preferences.glassOpacity ?? .67) * 100)}%</output>
            </div>
            <input id="study-glass-opacity" type="range" min="42" max="92" step="1"
              value={Math.round((preferences.glassOpacity ?? .67) * 100)}
              onChange={event => change({ glassOpacity: Number(event.target.value) / 100 })} />
          </div>
        </section>
      )}

      {section === 'kira' && (
        <fieldset className="pref-panel pref-tones">
          <legend style={{ paddingInline: '6px', color: '#cfe0f8', fontWeight: 600 }}>Tom das respostas</legend>
          {[['amigo', 'Amigável', 'Uma conversa próxima e acolhedora.'], ['formal', 'Formal', 'Explicações com linguagem mais formal.'], ['seco', 'Direto', 'Respostas objetivas, sem rodeios.']].map(([value, label, description]) => (
            <label key={value} >
              <span><strong>{label}</strong><small >{description}</small></span>
              <input type="radio" name="kira-tone" value={value} checked={preferences.kiraTone === value} onChange={() => change({ kiraTone: value })} />
            </label>
          ))}
        </fieldset>
      )}

      {section === 'notificacoes' && (
        <section className="pref-panel">
          <button type="button" className="study-settings-row" onClick={toggleAlerts}>
            <strong>{preferences.focusAlerts ? 'Desativar aviso de foco' : 'Ativar aviso de foco'}</strong>
          </button>
          <label className="study-settings-row" >
            <span><strong>Silenciar entre 02h e 07h</strong></span>
            <input type="checkbox" checked={preferences.quiet} onChange={(event) => change({ quiet: event.target.checked })} />
          </label>
        </section>
      )}

      {section === 'entrada' && (
        <section className="pref-panel">
          <label className="study-settings-row" >
            <span><strong>Mostrar bloqueio ao voltar</strong><small>Tela de bloqueio rápida</small></span>
            <input type="checkbox" checked={preferences.lock} onChange={(event) => change({ lock: event.target.checked })} />
          </label>
        </section>
      )}

      {section === 'dados' && (
        <section className="pref-panel">
          <button type="button" className="study-settings-row"  disabled={pending} onClick={exportNotes}>
            <span><strong>Baixar anotações em Markdown</strong><small>Arquivo .md com todo o seu caderno</small></span>
            <ChevronRight size={17} />
          </button>
        </section>
      )}

      {section === 'assinatura' && (
        <section className="pref-panel">
          <Link className="study-settings-row"  to="/upgrade">
            <span><strong>Ver planos do StudyOS</strong><small>Compare recursos disponíveis</small></span>
            <ChevronRight size={17} />
          </Link>
        </section>
      )}

      {section === 'sobre' && (
        <section className="study-about pref-panel">
          <h2>Um espaço para aprender, no seu ritmo.</h2>
          <p>O StudyOS reúne caderno, tarefas, sessões de estudo e a Kira para ajudar você a organizar ideias e compreender o que está aprendendo.</p>
          <h2>Quem constrói o StudyOS</h2>
          <ul>{['Vitor', 'Ketlin', 'Maria Sara', 'Ana Marcela', 'Júlia', 'Pablo'].map(name => <li key={name}>{name}</li>)}</ul>
          <p>Desenvolvido pela equipe StudyOS · VZP Solutions.</p>
        </section>
      )}

      {notice && <p role="status" className="study-note" style={{ marginTop: '14px' }}>{notice}</p>}
      </article>}
    </main>
  )
}
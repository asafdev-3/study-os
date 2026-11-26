import { useState } from 'react'
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
  Sparkles,
  User,
} from 'lucide-react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { readPreferences, updatePreferences } from '../lib/preferences'
import { InstallAnimation } from '../components/SetupAnimations'

const GROUPS = [
  [
    { id: 'instalar', name: 'Instalar StudyOS', subtitle: 'Adicione o app à tela inicial', Icon: Download, bg: '#2563eb' },
    { id: 'conta', name: 'Conta', subtitle: 'Seu perfil e acesso', Icon: User, bg: '#4f46e5' },
  ],
  [
    { id: 'aparencia', name: 'Aparência', subtitle: 'Movimento, transparência e leitura', Icon: Palette, bg: '#0ea5e9' },
    { id: 'kira', name: 'Kira', subtitle: 'Tom e estilo das respostas', Icon: Sparkles, bg: '#8b5cf6' },
    { id: 'notificacoes', name: 'Notificações', subtitle: 'Avisos de sessão concluída', Icon: Bell, bg: '#ef4444' },
    { id: 'entrada', name: 'Tela de bloqueio', subtitle: 'Impressão digital ao retornar', Icon: Fingerprint, bg: '#10b981' },
  ],
  [
    { id: 'dados', name: 'Seus dados', subtitle: 'Exportar suas anotações', Icon: FileDown, bg: '#f59e0b' },
    { id: 'assinatura', name: 'Assinatura', subtitle: 'Planos do StudyOS', Icon: CreditCard, bg: '#6366f1' },
    { id: 'sobre', name: 'Sobre', subtitle: 'StudyOS para o ENEM', Icon: Info, bg: '#64748b' },
  ],
]

const pages = Object.fromEntries(
  GROUPS.flat().map(({ id, name, subtitle }) => [id, [name, subtitle]])
)

const cardStyle = {
  borderRadius: '22px',
  background: 'linear-gradient(155deg, rgba(22, 36, 58, 0.76), rgba(11, 21, 37, 0.86))',
  border: '1px solid rgba(215, 232, 255, 0.16)',
  boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.12), 0 10px 28px rgba(0, 0, 0, 0.18)',
  overflow: 'hidden',
}

export default function Configuracoes() {
  const { secao } = useParams()
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
    <main
      className="study-page study-dashboard"
      style={{
        width: 'min(100%, 640px)',
        marginInline: 'auto',
        padding: 'max(22px, calc(env(safe-area-inset-top, 0px) + 16px)) 18px calc(var(--study-nav-space, 90px) + 32px)',
      }}
    >
      <header style={{ marginBottom: '20px' }}>
        {secao && (
          <Link
            to="/configuracoes"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              minHeight: '38px',
              padding: '0 12px',
              marginBottom: '12px',
              borderRadius: '999px',
              background: 'rgba(22, 36, 58, 0.72)',
              border: '1px solid rgba(215, 232, 255, 0.16)',
              color: '#dbeafe',
              fontSize: '13px',
              fontWeight: 550,
              textDecoration: 'none',
            }}
          >
            <ArrowLeft size={16} /> Ajustes
          </Link>
        )}
        <h1 style={{ fontSize: 'clamp(28px, 7vw, 34px)', fontWeight: 700, letterSpacing: '-0.035em', color: '#f4f8ff', margin: 0 }}>
          {secao ? pages[secao][0] : 'Ajustes'}
        </h1>
        {secao && <p style={{ margin: '6px 0 0', fontSize: '14px', color: '#a8bddb' }}>{pages[secao][1]}</p>}
      </header>

      {!secao && (
        <div style={{ display: 'grid', gap: '16px' }}>
          <input className="settings-search" type="search" aria-label="Buscar ajustes" placeholder="Buscar ajustes" value={search} onChange={e => setSearch(e.target.value)} />
          {groups.every(group => !group.length) && <p>Nenhum ajuste encontrado.</p>}
          {groups.map((group, groupIndex) => group.length > 0 && (
            <section key={groupIndex} style={cardStyle}>
              {group.map(({ id, name, subtitle, Icon, bg }, rowIndex) => (
                <Link
                  key={id}
                  to={'/configuracoes/' + id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '13px',
                    minHeight: '60px',
                    padding: '12px 16px',
                    textDecoration: 'none',
                    color: '#f2f7ff',
                    borderTop: rowIndex > 0 ? '1px solid rgba(215, 232, 255, 0.1)' : 'none',
                  }}
                >
                  <span
                    style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '10px',
                      background: bg,
                      display: 'grid',
                      placeItems: 'center',
                      color: '#fff',
                      flexShrink: 0,
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.35)',
                    }}
                  >
                    <Icon size={18} strokeWidth={2} />
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <strong style={{ display: 'block', fontSize: '15px', fontWeight: 600 }}>{name}</strong>
                    <small style={{ display: 'block', fontSize: '12px', color: '#a2b7d4', marginTop: '2px' }}>{subtitle}</small>
                  </span>
                  <ChevronRight size={17} style={{ color: '#7f97b8', flexShrink: 0 }} aria-hidden="true" />
                </Link>
              ))}
            </section>
          ))}
        </div>
      )}

      {secao === 'instalar' && (
        <section className="study-install-guide" style={{ ...cardStyle, padding: '20px' }}>
          <InstallAnimation />
          <h2>Seu espaço de estudo, sempre à mão.</h2>
          <p>O StudyOS é um aplicativo web instalável (PWA). Adicione-o à tela inicial sem baixar pela App Store ou Play Store.</p>
          <button type="button" className="study-primary" onClick={() => window.dispatchEvent(new Event('studyos:install'))}>Adicionar à tela inicial</button>
        </section>
      )}

      {secao === 'conta' && (
        <section style={cardStyle}>
          <Link className="study-settings-row" style={{ paddingInline: '16px' }} to="/perfil">
            <span><strong>Abrir perfil</strong><small>Nome, curso e área de foco</small></span>
            <ChevronRight size={17} />
          </Link>
          <button
            type="button"
            className="study-settings-row"
            style={{ paddingInline: '16px', color: '#fda4af', borderBottom: 0 }}
            disabled={pending}
            onClick={signOut}
          >
            <strong>Sair da conta neste dispositivo</strong>
          </button>
        </section>
      )}

      {secao === 'aparencia' && (
        <section style={{ ...cardStyle, padding: '16px' }}>
          <label className="study-settings-row" style={{ borderBottom: '1px solid rgba(215, 232, 255, 0.1)' }}>
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

      {secao === 'kira' && (
        <fieldset className="study-tone-picker" style={{ ...cardStyle, padding: '16px' }}>
          <legend style={{ paddingInline: '6px', color: '#cfe0f8', fontWeight: 600 }}>Tom das respostas</legend>
          {[['amigo', 'Amigável', 'Uma conversa próxima e acolhedora.'], ['formal', 'Formal', 'Explicações com linguagem mais formal.'], ['seco', 'Direto', 'Respostas objetivas, sem rodeios.']].map(([value, label, description]) => (
            <label key={value} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 4px', borderBottom: '1px solid rgba(215, 232, 255, 0.08)' }}>
              <span><strong>{label}</strong><small style={{ display: 'block', color: '#a2b7d4' }}>{description}</small></span>
              <input type="radio" name="kira-tone" value={value} checked={preferences.kiraTone === value} onChange={() => change({ kiraTone: value })} />
            </label>
          ))}
        </fieldset>
      )}

      {secao === 'notificacoes' && (
        <section style={{ ...cardStyle, padding: '16px' }}>
          <button type="button" className="study-settings-row" onClick={toggleAlerts}>
            <strong>{preferences.focusAlerts ? 'Desativar aviso de foco' : 'Ativar aviso de foco'}</strong>
          </button>
          <label className="study-settings-row" style={{ borderBottom: 0 }}>
            <span><strong>Silenciar entre 02h e 07h</strong></span>
            <input type="checkbox" checked={preferences.quiet} onChange={(event) => change({ quiet: event.target.checked })} />
          </label>
        </section>
      )}

      {secao === 'entrada' && (
        <section style={{ ...cardStyle, padding: '16px' }}>
          <label className="study-settings-row" style={{ borderBottom: 0 }}>
            <span><strong>Mostrar biometria ao voltar</strong><small>Tela de bloqueio rápida</small></span>
            <input type="checkbox" checked={preferences.lock} onChange={(event) => change({ lock: event.target.checked })} />
          </label>
        </section>
      )}

      {secao === 'dados' && (
        <section style={{ ...cardStyle, padding: '16px' }}>
          <button type="button" className="study-settings-row" style={{ borderBottom: 0 }} disabled={pending} onClick={exportNotes}>
            <span><strong>Baixar anotações em Markdown</strong><small>Arquivo .md com todo o seu caderno</small></span>
            <ChevronRight size={17} />
          </button>
        </section>
      )}

      {secao === 'assinatura' && (
        <section style={{ ...cardStyle, padding: '16px' }}>
          <Link className="study-settings-row" style={{ borderBottom: 0 }} to="/upgrade">
            <span><strong>Ver planos do StudyOS</strong><small>Compare recursos disponíveis</small></span>
            <ChevronRight size={17} />
          </Link>
        </section>
      )}

      {secao === 'sobre' && (
        <section className="study-about" style={{ ...cardStyle, padding: '20px' }}>
          <h2>Um espaço para aprender, no seu ritmo.</h2>
          <p>O StudyOS reúne caderno, tarefas, sessões de estudo e a Kira para ajudar você a organizar ideias e compreender o que está aprendendo.</p>
          <h2>Quem constrói o StudyOS</h2>
          <ul>{['Vitor', 'Ketlin', 'Maria Sara', 'Ana Marcela', 'Júlia', 'Pablo'].map(name => <li key={name}>{name}</li>)}</ul>
          <p>Desenvolvido pela equipe StudyOS · VZP Solutions.</p>
        </section>
      )}

      {notice && <p role="status" className="study-note" style={{ marginTop: '14px' }}>{notice}</p>}
    </main>
  )
}
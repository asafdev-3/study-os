import { useState } from 'react'
import { ArrowLeft, ChevronRight } from 'lucide-react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { readPreferences, updatePreferences } from '../lib/preferences'

const pages = {
  conta: ['Conta', 'Seu perfil e acesso'],
  aparencia: ['Aparência', 'Movimento e transições'],
  kira: ['Kira', 'Estilo das respostas'],
  notificacoes: ['Notificações', 'Avisos de sessão concluída'],
  entrada: ['Tela de bloqueio', 'Impressão digital na tela de retorno'],
  dados: ['Seus dados', 'Exportar suas anotações'],
  assinatura: ['Assinatura', 'Planos do StudyOS'],
  sobre: ['Sobre', 'StudyOS para o ENEM'],
}

export default function Configuracoes() {
  const { secao } = useParams()
  const navigate = useNavigate()
  const [preferences, setPreferences] = useState(readPreferences)
  const [notice, setNotice] = useState('')
  const [pending, setPending] = useState(false)

  function change(patch) {
    try { setPreferences(updatePreferences(patch)); setNotice('Preferência salva neste dispositivo.') }
    catch { setNotice('O dispositivo bloqueou o armazenamento das preferências.') }
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
    } catch { setNotice('Não foi possível solicitar a permissão neste dispositivo.') }
  }

  async function signOut() {
    setPending(true)
    try {
      const { error } = await supabase.auth.signOut({ scope: 'local' })
      if (error) throw error
      navigate('/login', { replace: true })
    } catch { setNotice('Não foi possível sair. Tente novamente.') }
    finally { setPending(false) }
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
    } catch { setNotice('Não foi possível exportar suas anotações.') }
    finally { setPending(false) }
  }

  if (secao && !Object.hasOwn(pages, secao)) return <Navigate to="/configuracoes" replace />

  return (
    <main className="study-page study-dashboard">
      <header className="study-home-header">
        {secao && <Link className="study-settings-row" to="/configuracoes"><ArrowLeft size={17} /> Configurações</Link>}
        <h1>{secao ? pages[secao][0] : 'Configurações'}</h1>
        {secao && <p>{pages[secao][1]}</p>}
      </header>
      {!secao && Object.entries(pages).map(([id, [name, subtitle]]) => (
        <Link key={id} className="study-settings-row" to={'/configuracoes/' + id}>
          <span><strong>{name}</strong><small>{subtitle}</small></span><ChevronRight size={17} aria-hidden="true" />
        </Link>
      ))}
      {secao === 'conta' && <>
        <Link className="study-settings-row" to="/perfil">Abrir perfil</Link>
        <button type="button" className="study-settings-row" disabled={pending} onClick={signOut}>Sair da conta neste dispositivo</button>
      </>}
      {secao === 'aparencia' && <label className="study-settings-row">Reduzir movimento
        <input type="checkbox" checked={preferences.reduceMotion} onChange={(event) => change({ reduceMotion: event.target.checked })} />
      </label>}
      {secao === 'kira' && <label className="study-settings-row">Tom das respostas
        <select value={preferences.kiraTone} onChange={(event) => change({ kiraTone: event.target.value })}>
          <option value="amigo">Amigável</option><option value="formal">Formal</option><option value="seco">Direto</option>
        </select>
      </label>}
      {secao === 'notificacoes' && <>
        <button type="button" className="study-settings-row" onClick={toggleAlerts}>
          {preferences.focusAlerts ? 'Desativar aviso de foco' : 'Ativar aviso de foco'}
        </button>
        <label className="study-settings-row">Silenciar entre 02h e 07h
          <input type="checkbox" checked={preferences.quiet} onChange={(event) => change({ quiet: event.target.checked })} />
        </label>
        <p className="study-note">O aviso aparece quando o app registra uma sessão. Lembretes agendados com o app fechado ainda não estão disponíveis.</p>
      </>}
      {secao === 'entrada' && <>
        <label className="study-settings-row">Mostrar lock ao voltar
          <input type="checkbox" checked={preferences.lock} onChange={(event) => change({ lock: event.target.checked })} />
        </label>
        <p className="study-note">A impressão digital é a animação de entrada do StudyOS. O acesso à conta continua protegido pelo login Google.</p>
      </>}
      {secao === 'dados' && <button type="button" className="study-settings-row" disabled={pending} onClick={exportNotes}>Baixar anotações em Markdown</button>}
      {secao === 'assinatura' && <Link className="study-settings-row" to="/upgrade">Ver planos</Link>}
      {secao === 'sobre' && <p className="study-note">StudyOS · VZP Solutions</p>}
      {notice && <p role="status" className="study-note">{notice}</p>}
    </main>
  )
}

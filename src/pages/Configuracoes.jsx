import { useState } from 'react'
import { ArrowLeft, ChevronRight } from 'lucide-react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { readPreferences, updatePreferences } from '../lib/preferences'

const pages = {
  conta: ['Conta', 'Seu perfil e acesso'],
  instalar: ['Instalar StudyOS', 'Acesse pela Tela de Início'],
  aparencia: ['Aparência', 'Movimento, transparência e leitura'],
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
      {!secao && <section className="study-settings-group" aria-label="Categorias das configurações">
        {Object.entries(pages).map(([id, [name, subtitle]]) => (
          <Link key={id} className="study-settings-row" to={'/configuracoes/' + id}>
            <span><strong>{name}</strong><small>{subtitle}</small></span><ChevronRight size={17} aria-hidden="true" />
          </Link>
        ))}
      </section>}
      {secao === 'instalar' && <div className="study-install-guide">
        <section className="study-install-card">
          <span className="study-install-kicker">IPHONE E IPAD</span>
          <h2>Adicione à Tela de Início</h2>
          <ol>
            <li>Abra o StudyOS no <strong>Safari</strong>.</li>
            <li>Toque no botão <strong>Compartilhar</strong>.</li>
            <li>Escolha <strong>Adicionar à Tela de Início</strong>.</li>
            <li>Confirme em <strong>Adicionar</strong>.</li>
          </ol>
        </section>
        <section className="study-install-card">
          <span className="study-install-kicker">ANDROID</span>
          <h2>Instale pelo navegador</h2>
          <ol>
            <li>Abra o StudyOS no <strong>Chrome</strong>.</li>
            <li>Abra o menu de três pontos.</li>
            <li>Toque em <strong>Instalar app</strong> ou <strong>Adicionar à tela inicial</strong>, se disponível.</li>
            <li>Confirme a instalação.</li>
          </ol>
        </section>
        <section className="study-install-card">
          <span className="study-install-kicker">COMPUTADOR</span>
          <h2>Instale no navegador</h2>
          <ol>
            <li>Abra o StudyOS no Chrome ou Edge.</li>
            <li>Use o ícone de instalação na barra de endereço ou o menu do navegador, se essa opção estiver disponível.</li>
            <li>Confirme em <strong>Instalar</strong>.</li>
          </ol>
        </section>
        <p className="study-note">O StudyOS é um aplicativo web instalável (PWA), não um aplicativo nativo. A instalação cria um atalho com janela própria; recursos offline e notificações dependem do suporte do navegador e não são garantidos.</p>
      </div>}
      {secao === 'conta' && <>
        <Link className="study-settings-row" to="/perfil">Abrir perfil</Link>
        <button type="button" className="study-settings-row" disabled={pending} onClick={signOut}>Sair da conta neste dispositivo</button>
      </>}
      {secao === 'aparencia' && <>
        <label className="study-settings-row">Reduzir movimento
          <input type="checkbox" checked={preferences.reduceMotion} onChange={(event) => change({ reduceMotion: event.target.checked })} />
        </label>
        <section className="study-appearance-slider">
          <div>
            <label htmlFor="study-glass-opacity">Intensidade do vidro</label>
            <output htmlFor="study-glass-opacity">{Math.round((preferences.glassOpacity ?? .67) * 100)}%</output>
          </div>
          <input id="study-glass-opacity" type="range" min="42" max="92" step="1"
            value={Math.round((preferences.glassOpacity ?? .67) * 100)}
            onChange={event => change({ glassOpacity: Number(event.target.value) / 100 })} />
          <div className="ios27-glass study-appearance-sample">Visualização do Liquid Glass</div>
          <p>O ajuste afeta barras e controles, sem diminuir o contraste dos textos e cadernos.</p>
        </section>
      </>}
      {secao === 'kira' && <fieldset className="study-tone-picker"><legend>Tom das respostas</legend>{[['amigo','Amigável','Uma conversa próxima e acolhedora.'],['formal','Formal','Explicações com linguagem mais formal.'],['seco','Direto','Respostas objetivas, sem rodeios.']].map(([value,label,description]) => <label key={value}><span><strong>{label}</strong><small>{description}</small></span><input type="radio" name="kira-tone" value={value} checked={preferences.kiraTone === value} onChange={() => change({ kiraTone:value })} /></label>)}</fieldset>}
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
      {secao === 'sobre' && <section className="study-about">
        <h2>Um espaço para aprender, no seu ritmo.</h2>
        <p>O StudyOS reúne caderno, tarefas, sessões de estudo e a Kira para ajudar você a organizar ideias e compreender o que está aprendendo.</p>
        <h2>Quem constrói o StudyOS</h2>
        <ul>{['Vitor', 'Ketlin', 'Maria Sara', 'Ana Marcela', 'Júlia', 'Pablo'].map(name => <li key={name}>{name}</li>)}</ul>
        <p>Desenvolvido pela equipe StudyOS · VZP Solutions.</p>
        <p>A Kira usa inteligência artificial e pode errar. Confira informações importantes e use as explicações para construir seu próprio raciocínio.</p>
      </section>}
      {notice && <p role="status" className="study-note">{notice}</p>}
    </main>
  )
}

import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { callCheckout } from '../lib/checkout'

export default function Sucesso() {
  const [params] = useSearchParams()
  const sessionId = params.get('session_id')
  const [state, setState] = useState(sessionId ? 'checking' : 'invalid')

  useEffect(() => {
    if (!sessionId) return
    let active = true
    callCheckout({ sessionId }).then(({ complete }) => {
      if (active) setState(complete ? 'complete' : 'pending')
    }).catch(() => { if (active) setState('invalid') })
    return () => { active = false }
  }, [sessionId])

  const title = {
    checking: 'Confirmando o checkout…', complete: 'Checkout de teste concluído',
    pending: 'Checkout ainda não confirmado', invalid: 'Checkout indisponível',
  }[state]

  return (
    <main className="study-entry">
      <section className="study-entry-panel">
        <h1 role="status">{title}</h1>
        {state === 'complete' && <p>Nenhuma cobrança real foi feita e o plano da sua conta não foi alterado.</p>}
        <Link className="study-primary" to="/dashboard">Voltar ao StudyOS</Link>
      </section>
    </main>
  )
}

import { supabase } from './supabase'
export const isDemo = session => session?.user?.app_metadata?.studyos_demo === true
export const demoExpiry = session => Date.parse(session?.user?.app_metadata?.studyos_demo_expires || '') || 0

export async function startDemo() {
  const {data,error} = await supabase.functions.invoke('studyos-demo', { body: {action:'start'} })
  if(error) {
    const detail = await error.context?.json?.().catch(()=>null)
    throw new Error(detail?.code === 'DEMO_BUSY' ? 'Já existe um visitante usando o StudyOS. Tente novamente quando a sessão terminar.' : 'A demonstração está indisponível. Tente novamente.')
  }
  if(!data?.access_token || !data?.refresh_token) throw new Error('Não foi possível iniciar a demonstração.')
  const result = await supabase.auth.setSession({access_token:data.access_token, refresh_token:data.refresh_token})
  if(result.error) throw result.error
  return result.data.session
}

export async function endDemo() {
  const {data:{session}} = await supabase.auth.getSession()
  if (!isDemo(session)) return
  try { await supabase.functions.invoke('studyos-demo',{body:{action:'release'},headers:{Authorization:'Bearer '+session.access_token}}) } catch { /* Server expiry still applies. */ }
  const {data:{session:current}} = await supabase.auth.getSession()
  if(current?.user?.id===session.user.id) await supabase.auth.signOut({scope:'local'})
}

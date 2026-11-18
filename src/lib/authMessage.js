/**
 * Messages shown after Supabase Auth errors.
 * Use stable codes first; avoid exposing internal stack traces or account existence.
 */
export function authMessage(error, action = 'login') {
  const code = String(error?.code || '').toLowerCase()
  const message = String(error?.message || '').toLowerCase()
  const status = Number(error?.status || 0)
  if (status === 429 || /rate.limit|too many requests|over_.*rate_limit/.test(code + ' ' + message)) {
    return 'Muitas tentativas em pouco tempo. Aguarde e tente novamente.'
  }
  if (code === 'email_not_confirmed' || message.includes('email not confirmed')) {
    return 'Confirme seu e-mail antes de entrar. Confira também o spam.'
  }
  if (code === 'invalid_credentials' || message.includes('invalid login credentials')) {
    return 'E-mail ou senha incorretos.'
  }
  if (['email_exists', 'user_already_exists', 'email_address_not_authorized'].includes(code)
    || message.includes('already registered') || message.includes('already been registered')) {
    return 'Não foi possível concluir o cadastro com este e-mail. Se já tem conta, entre ou recupere sua senha.'
  }
  if (code === 'weak_password' || message.includes('password should be at least')) {
    return 'Use uma senha mais forte, com pelo menos 8 caracteres.'
  }
  if (code === 'email_address_invalid' || message.includes('invalid email')) {
    return 'Informe um endereço de e-mail válido.'
  }
  if (code === 'signup_disabled' || message.includes('signups not allowed')) {
    return 'Novos cadastros estão temporariamente indisponíveis.'
  }
  if (code === 'email_provider_disabled') {
    return 'O acesso por e-mail está indisponível no momento.'
  }
  if (code === 'provider_disabled' || code === 'oauth_provider_not_supported') {
    return 'O acesso com Google não está disponível no momento.'
  }
  if (code === 'email_send_failure' || /error sending (confirmation|email)/.test(message)) {
    return 'Não foi possível enviar o e-mail de confirmação. Tente novamente mais tarde.'
  }
  if (code === 'unexpected_failure' || status >= 500) {
    return 'Serviço de autenticação indisponível no momento. Tente novamente.'
  }
  if (message.includes('failed to fetch') || message.includes('network') || message.includes('fetch failed')) {
    return 'Falha de conexão. Verifique a internet e tente novamente.'
  }
  if (action === 'signup') return 'Não foi possível concluir o cadastro agora. Tente novamente.'
  if (action === 'resend') return 'Não foi possível reenviar o e-mail agora. Tente novamente.'
  if (action === 'google') return 'Não foi possível entrar com Google. Tente novamente.'
  return 'Não foi possível entrar agora. Tente novamente.'
}

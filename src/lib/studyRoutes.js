export const loadStudyRoute = {
  '/dashboard': () => import('../pages/Dashboard'),
  '/chat': () => import('../pages/Chat'),
  '/anotacoes': () => import('../pages/Anotacoes'),
  '/enem': () => import('../pages/EnemScreen'),
  '/perfil': () => import('../pages/Perfil'),
  '/configuracoes': () => import('../pages/Configuracoes'),
}

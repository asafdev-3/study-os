# StudyOS nativo (Expo)

O login e a recuperação de acesso são React Native. Após entrar, as demais telas do StudyOS são carregadas no WebView da versão Vercel. A sessão do Supabase é transmitida dentro do aplicativo por evento JavaScript na rota /native-session, sem tokens em links.

## Execução

1. Copie `.env.example` para `.env.local` e preencha as chaves públicas do mesmo projeto Supabase do PWA.
2. `npm install`
3. `npx expo start` para desenvolvimento. Para autenticação Google no app instalado use um development build ou build distribuído, pois o retorno usa o esquema `studyos://auth`.
4. No Supabase, em Authentication → URL Configuration → Redirect URLs, autorize `studyos://auth`. Os URLs web existentes devem continuar autorizados.
5. Gere builds Android/iOS com EAS quando a conta Expo e a distribuição estiverem configuradas. Vercel publica somente a parte web, não o binário nativo.

A tela nativa usa desfoque em iOS. No Android, usa painel translúcido estático para evitar custo de blur em aparelhos antigos. Links externos no WebView abrem no navegador do sistema.

O login por e-mail, cadastro e recuperação usam o mesmo projeto Supabase e os redirecionamentos de confirmação/reset web já existentes.

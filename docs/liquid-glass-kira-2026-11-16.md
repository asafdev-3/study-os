# StudyOS — vidro, conversa e movimento · 16/11/2026

## Estrutura conferida antes da alteração
- App.jsx: rotas React Router, sessão e bloqueio; /chat já existia.
- useKira.js: store externo useSyncExternalStore por usuário e sessionStorage (últimas 30 mensagens); ENEM usava instância isolada.
- groq.js: todos os pedidos Kira, inclusive anotações, passam pela Edge Function kira.
- supabase/functions/kira/index.ts: autenticação, cota e chamada Groq; tom não integrava system prompt.
- Chat/EnemScreen: visualViewport, PromptField compartilhado, histórico e compositor.
- index.css/glass.css: estilos cumulativos com sobrescritas mobile; Lembretes mantém post-its locais por usuário.
- FoldableTransition: antigo overlay de blur simples; Navbar/StudyLink mantêm navegação.

## Alterações
Vidro compartilhado 20px/180%, sombras internas leves, cards 20px, modais 28px, pills 999px, fallback de contraste/transparência. Post-its coloridos translúcidos com cantos 16–22px e rotação -2 a +2 por índice original (estável ao filtrar).
ENEM e /chat compartilham a mesma chave/store; Expandir abre /chat sem perder mensagens ou requisição em andamento. Nenhuma nova dependência de estado.
Limpeza defensiva no retorno central, antes de atualizar o store e ao recuperar histórico antigo. Preserva números e operações; evita regex Emoji que remove dígitos. Texto renderizado pelo React, sem innerHTML.
Tom amigo/formal/seco enviado em cada requisição; servidor valida por allowlist e incorpora instrução obrigatória ao system prompt junto da proibição de markdown/emojis.
Teclado: duas motion values spring 300/30, sem render React por frame. Mensagens: usuário slide/fade, assistente fade com delay 150ms, histórico restaurado sem repetir animação.
Navegação: saída 180ms e camada direcional até 420ms totais; blur 28px, saída rotateY/scale/blur/brightness, will-change removido no fim. Não duplica telas com efeitos/API ativos. Reduzir movimento desativa transições; última navegação cancela a anterior. Cliques em links internos e abas ENEM cobertos; mudanças programáticas externas a esses fluxos preservam entrada existente.
CSS: declarações prefixed antes de unprefixed para impedir que otimização do build retenha apenas -webkit-backdrop-filter.

## Validação e limites
Build, ESLint direcionado e testes unitários de sanitização, prompt/tom, NFC e ingresso. Browser tests usam autenticação/API simuladas, não consomem IA nem alteram dados reais. Fluxos em 320/414/1024 e movimento/teclado em 320/414/430 reduzido/1024. Capturas em qa.local.
Release 16/11: frontend publicado em https://study-os-three-pearl.vercel.app (Vercel production READY). Verificados /, /login, /chat sem sessão, manifest, service worker e ícone em navegador móvel 390px sem erros JS. A Edge Function kira ainda não foi atualizada em produção: projeto Supabase oejjojxeqarhbuniukac ausente das contas conectadas. O prompt remoto não foi atualizado. Safari/PWA no iPhone XR e FPS reais não validados. CLAUDE.md já estava modificado e foi preservado.

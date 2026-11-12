# StudyOS — entrada para o Claude

## Leia primeiro
1. Este arquivo: estado atual e decisões que não devem ser perdidas.
2. `docs/motion-and-safari.md`: rodada atual de movimento e limite dos testes.
3. `docs/design-and-nfc.md`: identidade, NFC e destinos.
4. `docs/study-flow.md`: fluxo Kira → caderno → revisão, testes e limites.
5. Histórico completo local: `/home/vortex/Documentos/AI-BRAIN/02-PROJECTS/STUDYOS/STUDYOS__MASTER.md`.

## Projeto e execução
- Checkout: `/home/vortex/study-os`.
- GitHub: https://github.com/asafdev-3/study-os — branch main.
- Produção: https://study-os-three-pearl.vercel.app
- Vercel: equipe `asafdev-3s-projects`, projeto `study-os`; vínculo em `.vercel/project.json`.
- React 19, Vite 8, Tailwind 4, React Router 7, Framer Motion 13, Supabase.
- `npm run build`; lint direcionado aos arquivos editados; `node --test tests/nfc.test.mjs`.
- Configuração local em `.env.local`. Nunca imprimir ou versionar segredos.
- Publicação atual pelo Vercel CLI. Push no GitHub NÃO implica deploy automático; integração Git da Vercel ainda não conectada.
- Antes de editar, conferir `git status` e `git log -5 --oneline`. Não sobrescrever mudanças do usuário.

## Pedido atual, com prioridade
Vitor relata falta de fluidez no Safari do iPhone XR, iOS 18. Deseja animações como diferencial, com Framer Motion. A rodada atual reduz trabalho de pintura e carregamento e retoma movimento na navegação e nas mensagens. Ainda NÃO há validação física de FPS no aparelho. Não declarar a reclamação definitivamente resolvida sem testar nele.

## Decisões de produto e design
- Comunicação curta, direta, sem elogios. Menos é mais.
- Preservar a identidade escura azul/violeta StudyOS. FÔGO inspira composição e conforto; não copiar floresta/fogueira.
- Usuário rejeitou várias versões genéricas e mudanças arbitrárias do original. Não redesenhar novamente sem motivo concreto.
- Home atual (base `b420732`): sala de estudo noturna original, WebP 47 kB, última anotação real, foco compacto e Kira.
- “Efeito iPhone Duo” significa SOMENTE desfoque leve. Sem dobra, perspectiva, rotação ou zoom da página.
- Digital do Lock é importante e deve manter anel, pulso e confirmação. É bloqueio visual de sessão, NÃO biometria real.
- Não bloquear navegação esperando uma animação de saída; não animar todas as superfícies simultaneamente.
- NFC é prioridade da mostra. Não voltar a adiar com base em notas antigas do MASTER.

## Arquitetura atual
- `src/App.jsx`: autenticação, bloqueio, rotas lazy, retorno de destino NFC.
- `src/components/StudyMotion.jsx`: LazyMotion + MotionConfig e PageMotion.
- `src/lib/motion.js`: preferência reativa de movimento reduzido e curva compartilhada.
- `src/lib/motionFeatures.js`: domMax carregado separadamente; não substituir imports m por motion global sem medir bundle.
- `src/lib/studyRoutes.js`: cache de imports, prefetch por intenção e aquecimento ocioso após desbloqueio. Respeita Save-Data.
- `Navbar.jsx`: indicador compartilhado com layoutId/spring; barra permanece estável.
- `Chat.jsx`: viewport visual fixa para Safari/teclado, rolagem apenas nas mensagens, entrada Motion de mensagens.
- `src/lib/focus.js` + `EnemScreen.jsx`: timer com deadline absoluto e persistência por usuário; não usar contagem que para ao sair da aba.
- `Anotacoes.jsx`: caderno, filtros, criação/edição no Supabase, guardar resposta da Kira, revisão por pergunta e deep link. Ver limites em docs/study-flow.md.
- `NFC.jsx` + `src/lib/nfc.js`: URLs de foco/matéria/nota. A simulação aleatória foi removida.
- `src/lib/groq.js`, `useKira.js`, `PaywallModal.jsx`: envio autenticado, cota e modal global.

## Integrações e estado funcional
- Supabase: projeto `oejjojxeqarhbuniukac`. Auth Google; callback autorizado em produção /dashboard.
- Kira: Edge Function valida sessão via Auth; segredo `GROQ_API_KEY` configurado pelo usuário. Ele confirmou resposta boa.
- Cota: 10 mensagens/dia por usuário, fuso São Paulo. HTTP 429 DAILY_LIMIT abre o modal na primeira tentativa excedente (chat, ENEM, sugestões). Última resposta permitida continua visível.
- Lock na reabertura e retorno após 60 s em background; não substituir por nova tela de login.
- NFC: /nfc?acao=foco&area=mt prepara foco com confirmação; não substitui sessão existente. /anotacoes?area=cn filtra matéria. /anotacoes?nota=ID abre nota privada da conta.
- Login preserva destino permitido em sessionStorage por 30 minutos; Lock preserva query.
- iPhone: escrever URL na tag via aplicativo externo e abrir pela notificação do sistema. Android compatível: NDEFReader.write. NÃO há bloqueio de outros apps.
- Configurações têm páginas próprias. Preferências são locais.
- Notificação de foco depende de suporte/permissão e sessão registrada; não é push agendado com app fechado.
- Stripe apenas sandbox: API de checkout existe. Faltam segredos/preços de teste e validação ponta a ponta; webhook e sincronização de plano NÃO prontos. Não liberar cobrança real.
- Notas de corte/bolsas têm dados ilustrativos. Não apresentá-los como dados oficiais.

## Pendências para finalizar
1. Safari XR real: Lock, dez trocas rápidas entre abas, notas longas, abrir/fechar teclado, resposta longa, ENEM, retorno do background e movimento reduzido.
2. Conferir comportamento com rede lenta/cache frio e avaliar performance com gravação do Web Inspector. Testes desktop não provam FPS do XR.
3. Etiqueta NFC física no iPhone e Android; login e destinos; manter tag regravável para troca de domínio.
4. Revisão visual consistente das demais telas: perfil, ENEM, configurações e caderno sem novo redesign indiscriminado.
5. Stripe sandbox completo, webhook/entitlement antes de produção; OCR e demais funcionalidades ainda incompletas.
6. Verificar cadastro/onboarding/login OAuth reais, logout/troca de conta, notas persistidas e paywall real.
7. ~~Bundle~~ ✅ Resolvido em b27c891: manualChunks split react/router/supabase/motion — main chunk 22 kB (era 521 kB).
8. Offline integral e notificações agendadas não implementados.

## Evidência e continuidade
Os testes de navegador usam conta, respostas Supabase e NFC simulados. Não alteram dados reais.
Leia `tests/motion.browser.mjs` e `tests/nfc.test.mjs`. Relatório da rodada em `docs/motion-and-safari.md`.
O MASTER é histórico: instruções novas deste arquivo prevalecem sobre decisões antigas incompatíveis (NFC adiado, dobra 3D, desfoque na página inteira).

Atualização posterior: ler docs/continuacao-gpt.md (12/11/2026).

## Rodada de utilidade — 12/11/2026
Chat legível, copiar/guardar resposta, editar/revisar anotações, conversa por usuário entre abas e reload. Springs existentes preservados; will-change permanente removido; FAB/modal em portal. Build, lint, motion, NFC e novo teste study-flow aprovados. Backend real da edição e Safari XR pendentes; não afirmar ganho percentual ou FPS. Detalhes em docs/study-flow.md.


## Lock Hold-to-Scan — 12/11/2026
Digital preservada; pressão contínua de 2000 ms via Pointer Events, progresso por performance.now/rAF; toque curto, saída da área (inclusive captura touch), cancelamento, blur e background abortam. Teclado Espaço/Enter também exige 2 s. Movimento reduzido mantém requisito; confirmação visual 180 ms antes do onUnlock. user-select:none, touch-action:none e menu de contexto bloqueado. Testes de fluxo e lock adaptados; Safari físico pendente.


## Atualização 12/11: Lock e direção de produto
Lock agora exige 800 ms, substituindo os 2000 ms anteriores. Seleção/callout Safari bloqueados em toda a área e descendentes, inclusive status. Ver docs/product-direction.md: necessidades, prioridades e recursos propostos (não implementados).


## Kira livre e otimização — 12/11/2026
KiraAvatar reutiliza a arte RGBA original 420x280, inteira/object-fit contain, sem círculo ou fundo. Sombra de apoio e inclinação CSS apenas em hover com ponteiro fino, respeitando movimento reduzido. Presente no chat (cabeçalho e estado vazio), home e paywall. É apresentação com profundidade da arte existente, não modelo WebGL. Nenhuma imagem regenerada ou dependência adicionada.
Performance: FocusSummary isola ticks da home e suspende timer visual quando documento está oculto ou sessão concluída; deadline continua absoluto. Mensagens restauradas do chat não repetem animação. Entrada do chat começa quase opaca para evitar flash. Glass pesado fica opaco em telas touch; pulso decorativo de sombra desativado no touch; blur de 6px removido da entrada legada. Blur leve dos cabeçalhos e springs preservados. Prefetch ocioso limitado a Notas/Chat/ENEM, demais rotas continuam por intenção; pausa em background.
Validação: lint e build aprovados; motion 320/414/430 reduzido/1024 e fluxo de estudo 320/414 touch +1024 aprovados. Captura qa.local/kira-character.png inspecionada. Sem medição em XR/WebKit físico; NÃO prometer 120 FPS universal ou ganho percentual. PWA não passa a app nativo por essas mudanças.


12/11: modo Resolver atividade no chat. O cliente orienta Kira a explicar exercícios automaticamente com passos breves; a Edge Function e a cota continuam as mesmas. Entrada do chat limitada a 1600 caracteres para caber a instrução. Post-its do Lembretes restaurados na home e na aba padrão ENEM, persistidos por usuário neste navegador. Foco segue por NFC em /enem?modo=foco. Anotações com índice e papel pautado inspirados no notebook do FÔGO. FoldableTransition sobre a troca de rotas autenticadas: duas metades CSS 3D, mola 260/28, quatro máscaras de blur no vinco, reduzido desativa; superfície Liquid Glass adicional apenas com ponteiro fino. Sem medição em iPhone físico.


## Caderno confortável — 12/11/2026
Substitui a tentativa anterior de cartões sobre papel. Anotacoes agora exibe uma página por vez, índice com busca/área e paginação anterior/próxima. Desktop: livro aberto; mobile até 700px: uma folha e índice recolhível. Edição no próprio papel, sem modal; controles do índice ficam bloqueados durante edição. Cancelar descarta o rascunho; salvar mantém CRUD com ownership, UUID estável e recuperação de erro. Respostas guardadas da Kira abrem o editor inline. Papel quente, lombada azul StudyOS e marcador violeta; sem novas imagens/dependências/chamadas de IA.
Build e lint aprovados. Teste study-flow aprovado em 320/414 touch/1024: criar/erro/repetir, editar/erro/repetir, duas páginas/paginação/busca, revisão Kira e persistência do chat; screenshots mobile/desktop inspecionados. Backend real de edição e Safari XR físico ainda não verificados. Não prometer FPS. Referência: src/notebook.tsx do FÔGO v0.7.1 fornecido.

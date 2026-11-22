# StudyOS — handoff técnico completo para Claude

**Atualizado em:** 21/11/2026  
**Fonte de verdade do código:** GitHub main, commit e8f6f93a7be9b94ab1ce056a4d7ba4a0e8f7864d  
**Produção:** https://study-os-three-pearl.vercel.app

> Leia este documento antes de editar. Ele consolida o estado real do código publicado, as decisões de produto, os limites técnicos e as pendências. Quando este documento divergir de notas históricas, prevalecem o código atual de main e as evidências mais recentes.

---

## 1. Acesso ao projeto

- Repositório público: https://github.com/asafdev-3/study-os
- Download ZIP de main: https://github.com/asafdev-3/study-os/archive/refs/heads/main.zip
- Clone: git clone https://github.com/asafdev-3/study-os.git
- Branch principal: main
- Produção: https://study-os-three-pearl.vercel.app
- Dashboard: https://study-os-three-pearl.vercel.app/dashboard
- Onboarding: https://study-os-three-pearl.vercel.app/onboarding
- Vercel team: asafdev-3s-projects
- Vercel project: study-os
- Vercel project ID: prj_e6ksRI5ydnPrdDx3uo8hXLLxa4HM
- Último deployment de produção consultado: READY; deployment dpl_HKEdx5fYZN3UknzXktgyzRC2axf9.
- O repositório é público: não é necessário conceder permissão de leitura para abrir os arquivos. Para Claude.ai, conectar GitHub ou enviar o ZIP; para Claude Code, clonar/abrir a pasta local.

**Atenção à cópia Fedora:** /home/vortex/study-os estava na branch main, no commit local aab2ae2, oito commits atrás de origin/main. O arquivo local CLAUDE.md tinha uma alteração não commitada, adicionando a seção de refinamento Apple HIG/drawer. Não executar git reset --hard, git clean, git checkout -- CLAUDE.md ou qualquer ação que descarte esse trabalho. Primeiro inspecionar git status e git diff. O código atual é o main remoto, não essa cópia local desatualizada.

Histórico local complementar:
- /home/vortex/Documentos/AI-BRAIN/02-PROJECTS/STUDYOS/STUDYOS__MASTER.md
- /home/vortex/Documentos/AI-BRAIN/02-PROJECTS/STUDYOS/STUDYOS__HANDOFF_CLAUDE.md

Esses arquivos guardam histórico e decisões anteriores; o MASTER contém atualizações de 18/11 que ainda não estavam no handoff antigo. Não presumir que o histórico local está sincronizado com o repositório remoto.

---

## 2. O que é o StudyOS

StudyOS é um ambiente de estudo em português, com foco em ENEM, que reúne:
- início rápido de uma sessão de estudo;
- prática e revisão de questões;
- Kira, assistente de estudo;
- caderno de anotações;
- post-its e lembretes;
- timer de foco;
- atalhos NFC para abrir foco, matéria ou anotação;
- perfil e preferências do estudante;
- experiência PWA mobile-first, com uma camada Expo/React Native em desenvolvimento.

O ciclo de produto prioritário é: **começar → praticar → entender o erro → revisar**. Não transformar o app em um painel genérico nem adicionar complexidade sem necessidade.

### Público e contexto
Estudantes que se preparam para o ENEM. A primeira validação de uso deve ser feita com estudantes reais, observando se conseguem iniciar uma sessão, praticar, registrar dificuldades e retornar para revisar.

---

## 3. Direção visual e regras que não devem ser quebradas

- Identidade própria StudyOS: ambiente escuro, azul profundo, acentos azul/violeta, tipografia limpa e poucos elementos.
- A sala de estudo noturna e a chuva são parte da ambientação. Não substituir por floresta/fogueira ou estética genérica de dashboard.
- A referência Apple/iOS é funcional e contida: Liquid Glass em navegação, toolbar, seletores e controles; papel, texto, caderno e conteúdo de leitura permanecem legíveis e predominantemente opacos.
- Blur apenas onde há função. Evitar filtros grandes ou múltiplos backdrop-filter sobre a tela inteira, especialmente no Safari do iPhone XR.
- O usuário pediu “iPhone Duo” como **desfoque leve**, não dobra 3D. Não introduzir rotação, perspectiva, zoom de página, vinco ou espera artificial entre telas.
- Preservar os springs e transições existentes. Otimizar antes de acrescentar mais animações.
- Alvos de toque próximos de 44 px; campos móveis com fonte de pelo menos 16 px; respeitar safe areas.
- Sempre respeitar prefers-reduced-motion, redução de transparência e alto contraste.
- “Menos é mais”: não redesenhar telas que já foram aprovadas sem problema concreto e sem pedido.
- Kira deve manter aparência natural, sem elementos decorativos arbitrários. Há uma pendência de animação de anotação descrita na seção 11.

**Limite importante:** a produção atual é uma PWA web. CSS/blur não reproduzem a refração e o compositor nativo do SwiftUI. Não afirmar equivalência visual ou de FPS com um app nativo sem medir no dispositivo real.

---

## 4. Estado publicado mais recente

main e a produção foram verificados no commit:

e8f6f93a7be9b94ab1ce056a4d7ba4a0e8f7864d — “Add ambient rain and subtle glass to StudyOS dashboard”.

### Dashboard
Arquivos principais:
- src/pages/Dashboard.jsx
- src/pages/Dashboard.css
- src/components/RainWindow.jsx
- src/components/RainWindow.css
- src/components/WetGlass.jsx
- src/assets/autumn-rain.webp
- src/assets/autumn-rain-mobile.webp

O dashboard atual:
- reutiliza RainWindow para chuva animada e gotas no vidro;
- combina iluminação fria/azul com reflexos quentes;
- oferece botão para pausar/retomar a chuva;
- pausa a animação quando a aba fica em segundo plano;
- respeita movimento reduzido;
- usa Liquid Glass e blur moderado nos controles e superfícies funcionais, não no texto inteiro;
- mantém o conteúdo rolável no mobile, respeitando safe areas;
- apresenta saudação, início de sessão ENEM, caderno/última anotação, Kira, post-its, NFC e configurações.

A intensidade de blur do dashboard fica aproximadamente em 8 px no mobile e 10–12 px nas superfícies maiores/desktop. Isso é uma aproximação web, não o material nativo do Expo.

### Onboarding
Arquivos:
- src/pages/Onboarding.jsx
- src/pages/Onboarding.css

Onboarding em três etapas:
1. curso objetivo;
2. áreas/matérias em que o estudante tem dificuldade (inclui opção “Outro”);
3. nome.

Salva nome, curso_objetivo, area_dificuldade e onboarding_completo em profiles. O dashboard redireciona para onboarding quando o perfil ainda não está completo. O usuário validou a tela corrigida e aprovou a direção visual.

### Verificação da última entrega
- npm run build: passou.
- node --test tests/*.test.mjs: 9/9 testes aprovados na rodada do dashboard.
- ESLint direcionado para os componentes alterados: passou.
- Domínio oficial respondeu HTTP 200; bundle e CSS do dashboard foram inspecionados e confirmaram chuva, botão de pausa e blur mobile.
- Ainda falta validação visual/performance no iPhone XR físico. Testes desktop não comprovam FPS no Safari.

---

## 5. Stack e execução

### PWA/web — raiz do repositório
- React 19
- Vite 8
- Tailwind CSS 4
- React Router 7
- Framer Motion 13
- Supabase JS 2
- Lucide React

Scripts em package.json:
- npm run dev
- npm run build
- npm run lint
- npm run preview

Setup:
~~~bash
git clone https://github.com/asafdev-3/study-os.git
cd study-os
npm ci
# Criar .env.local localmente, sem versionar:
# VITE_SUPABASE_URL=
# VITE_SUPABASE_ANON_KEY=
npm run dev
~~~

O README.md da raiz ainda é o README genérico do template React/Vite; não o use como documentação do produto. Leia CLAUDE.md e os documentos listados na seção 13.

### Variáveis e segredos
- PWA: VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY em .env.local.
- Expo: EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_ANON_KEY em native/.env.local.
- Kira: GROQ_API_KEY é segredo da Supabase Edge Function, não variável do frontend.
- Edge Function usa SUPABASE_URL, SUPABASE_ANON_KEY e SUPABASE_SERVICE_ROLE_KEY no ambiente seguro do Supabase.
- Checkout de teste: variáveis Stripe server-side; nunca colocar STRIPE_SECRET_KEY no cliente.
- .gitignore exclui arquivos *.local, .vercel, node_modules, dist e artefatos locais Expo. O único arquivo de ambiente rastreado é native/.env.example, com placeholders.

**Nunca pedir, imprimir, colar em chat ou versionar** service_role, GROQ_API_KEY, STRIPE_SECRET_KEY ou conteúdo real de .env.local. A anon key do Supabase é pública por design, mas deve continuar configurada via ambiente.

---

## 6. Arquitetura e mapa dos arquivos

### Entrada, sessão e navegação
- src/main.jsx: inicialização React/Vite.
- src/App.jsx: autenticação, bloqueio, rotas, lazy loading, shell e destinos pendentes de NFC.
- src/lib/supabase.js: cliente Supabase.
- src/components/Navbar.jsx: navegação principal (Início, Notas, Kira, ENEM, Perfil e Config).
- src/components/TopBar.jsx: toolbar.
- src/components/StudyLink.jsx: links internos e transições.
- src/components/StudyMotion.jsx: LazyMotion, MotionConfig e PageMotion.
- src/lib/motion.js: preferência reativa de movimento reduzido.
- src/lib/motionFeatures.js: recursos Framer Motion carregados separadamente.
- src/lib/studyRoutes.js: lazy imports, prefetch e aquecimento de rotas.
- src/lib/routeTransition.js: navegação/transição.
- src/styles/ios27.css, src/styles/ios27-transitions.css, src/styles/apple-polish.css, src/components/glass.css: tokens, materiais e refinamento visual.

### Páginas
- src/pages/Splash.jsx: entrada.
- src/pages/Login.jsx: login/cadastro e OAuth.
- src/pages/Onboarding.jsx: configuração inicial.
- src/pages/Dashboard.jsx: sala de estudo.
- src/pages/Anotacoes.jsx: caderno, busca/filtros, criação, edição e revisão.
- src/pages/Chat.jsx: conversa com Kira.
- src/pages/EnemScreen.jsx: prática, redação, revisão e recursos ENEM.
- src/pages/Lembretes.jsx: post-its.
- src/pages/NFC.jsx: configuração e escrita/leitura de destinos NFC.
- src/pages/Lock.jsx: bloqueio visual de sessão.
- src/pages/Perfil.jsx: perfil.
- src/pages/Configuracoes.jsx: preferências.
- src/pages/Upgrade.jsx, src/pages/Sucesso.jsx: fluxo de upgrade/retorno de checkout.
- src/pages/NovaAnotacao.jsx: fluxo de anotação por imagem/OCR; revisar implementação antes de assumir que o salvamento OCR está integrado.

### Componentes relevantes
- src/components/KiraAvatar.jsx: personagem da Kira.
- src/components/KiraLoginScene.jsx: Kira na tela de autenticação.
- src/components/PromptField.jsx: compositor compartilhado.
- src/components/RainWindow.jsx e WetGlass.jsx: cenário de chuva e gotas.
- src/components/PaywallModal.jsx: limite/upgrade.
- src/components/ProgressiveBlur.jsx: blur contextual.
- src/components/FoldableTransition.jsx: nome legado; a direção vigente é blur/crossfade simples, sem dobra 3D.

### Lógica de domínio
- src/lib/focus.js: timer de foco com deadline absoluto.
- src/lib/nfc.js: destinos permitidos, validação e retorno após login.
- src/lib/groq.js: cliente de chamadas autenticadas da Kira e limite diário.
- src/lib/useKira.js: store compartilhado de conversa por usuário.
- src/lib/preferences.js: preferências locais.
- src/lib/admissions.js: cálculos/referência de ingresso.
- src/lib/checkout.js: chamada de checkout.

---

## 7. Funcionalidades e comportamento atual

### Kira
- Chamadas passam pela Supabase Edge Function supabase/functions/kira/index.ts.
- A função valida o bearer token consultando Supabase Auth.
- A cota é de 10 mensagens por usuário por dia, no fuso America/Sao_Paulo.
- A cota é consumida no backend por RPC kira_daily_quota; o service role fica apenas no servidor.
- O frontend recebe erro DAILY_LIMIT (HTTP 429) e abre o modal global.
- Chat e ENEM usam o mesmo store por usuário. Últimas 30 mensagens são guardadas em sessionStorage para a mesma aba; isso **não** é histórico persistente na nuvem nem sincronização entre dispositivos.
- Preferência de tom: formal, amigo ou seco.
- A Kira orienta a explicar exercícios com raciocínio e passos curtos, não entregar somente o gabarito.
- A função usa Groq; a chave fica em segredo no Supabase.

### Caderno
- Anotações são persistidas em annotations no Supabase.
- Operações devem filtrar por usuário autenticado e ID.
- Guardar uma resposta da Kira abre o editor com conteúdo preenchido; isso não significa que a nota já foi salva. O estudante confirma o salvamento no caderno.
- Revisão com Kira prepara uma pergunta a partir da anotação e só consome cota ao enviar.
- A tela usa gaveta de capas/títulos; uma capa representa uma anotação existente, não uma entidade nova de múltiplas páginas no banco.

### Post-its
- Persistência atual em localStorage, por usuário/navegador.
- Não há sincronização em nuvem entre dispositivos.

### Foco
- Timer padrão de 25 minutos.
- Usa deadline absoluto, não deve parar de contar ao trocar de rota ou aba.
- Estado local no navegador; testar retorno de background e sessão concluída.

### NFC
Destinos internos:
- Foco: /nfc?acao=foco&area=mt (ou outra área válida).
- Matéria: /anotacoes?area=cn.
- Anotação privada: /anotacoes?nota=ID.

src/lib/nfc.js valida os caminhos permitidos e guarda destino pendente por até 30 minutos durante login. A tela não deve gerar destinos externos arbitrários.

- iPhone/Safari: leitura em segundo plano depende do sistema/notificação; escrita é feita por aplicativo NFC externo, copiando a URL do StudyOS.
- Android compatível: NDEFReader.write pode gravar a URL com permissão e suporte do navegador.
- Não existe bloqueio de abertura de outros aplicativos.
- Teste obrigatório com etiqueta física em iPhone e Android; teste automatizado não comprova hardware.

### ENEM e ingresso
- Prática de questões autorais com Kira; o comportamento de esperar a tentativa depende da resposta/modelo.
- Redação guiada por tese, sem nota oficial.
- Diário de erros local, limitado a 50 registros por usuário neste navegador; não sincroniza.
- public/data/sisu-2025.json: 6.393 ofertas históricas, 124 instituições e 547 pares cidade/UF. É fotografia histórica do Sisu 2025, não vagas atuais nem garantia de aprovação. Não apresentar como dado ao vivo.
- Links externos para provas/gabaritos e materiais oficiais.
- Não há integração Gov.br/MEC nem banco de questões autenticado/licenciado.

### Lock
A digital é um gesto visual de desbloqueio por pressão contínua de 800 ms. Não é Touch ID, Face ID nem autenticação biométrica real. Preservar cancelamento por saída da área, blur e background, e respeitar movimento reduzido.

---

## 8. Backend, Supabase e dados

- Projeto Supabase de referência: oejjojxeqarhbuniukac.
- Auth: Google OAuth e login por e-mail/senha; confirmação de e-mail é exigida para novos cadastros.
- Produção tem retorno OAuth configurado para /dashboard, conforme CLAUDE.md. URLs dinâmicas de preview podem precisar de allowlist em Authentication → URL Configuration; verificar antes de testar OAuth em preview.
- Tabela profiles: nome, curso objetivo, áreas de dificuldade e flag de onboarding completo.
- Tabela annotations: anotações do usuário.
- study_sessions: sessões de foco.
- kira_daily_usage: cota diária da Kira.
- studyos_schema.sql contém o schema base (inclui goals e enem_scores); migrations incrementais em supabase/migrations/.
- Migrations versionadas atuais incluem 20261111110000_study_sessions.sql e 20261111120000_kira_daily_quota.sql.

**Cuidado:** schema versionado não prova que o estado real de produção é idêntico. Comparar migrations, tabelas e políticas reais antes de qualquer alteração. Histórico registra que algumas verificações de RLS/CRUD real não foram concluídas em todas as rodadas. Não executar SQL destrutivo nem aplicar migration sem aprovação explícita do usuário.

---

## 9. Expo / React Native

Existe um diretório native/, com Expo SDK 58 e React Native 0.88.1. Dependências incluem expo-glass-effect, expo-blur, expo-haptics, react-native-reanimated e react-native-webview.

**Não confundir com uma conversão completa do app para React Native:** segundo native/README.md, login e recuperação de acesso são telas React Native; depois do login, as demais telas carregam a versão Vercel dentro de um WebView. A sessão Supabase é transmitida por evento JavaScript na rota /native-session, sem tokens em URL.

- Vercel publica somente a versão web.
- Builds nativos iOS/Android exigem fluxo Expo/EAS separado.
- Para autenticação instalada, o esquema studyos://auth precisa estar autorizado no Supabase.
- A UI nativa usa blur no iOS e painel translúcido estático no Android para evitar custo de blur em aparelhos antigos.
- Antes de alterar APIs Expo, ler native/AGENTS.md e documentação da versão exata do SDK. Não usar instruções de outra versão do Expo.

---

## 10. Pagamentos e monetização

Stripe está **somente em sandbox/teste**. Não liberar cobrança real.

- api/checkout.js aceita apenas chave sk_test_.
- Preços esperados no código: mensal R$ 18,99 e anual R$ 189,90, sujeitos à configuração de Price IDs correspondentes.
- Variáveis server-side: STRIPE_SECRET_KEY, STRIPE_PRICE_MENSAL, STRIPE_PRICE_ANUAL, STUDYOS_SITE_URL.
- O endpoint valida sessão Supabase e checkout de teste.
- Webhook de confirmação e sincronização confiável de assinatura/entitlement não estão concluídos.
- Upgrade.jsx chama src/lib/checkout.js; o botão é identificado como checkout de teste.
- Não remover bloqueio sandbox nem prometer assinatura ativa antes de webhook, persistência de plano e testes ponta a ponta.

---

## 11. Pendências reais e branch em aberto

### Prioridade 1 — Kira e anotação salva
PR #1: https://github.com/asafdev-3/study-os/pull/1  
Branch: fix/kira-saved-notes-20261118  
Head registrado: 047e2b51fe9fb2ef525d09d0d416f16190fbd413  
Estado consultado: **open, draft, not merged, mergeable=false**. Base registrada: ebaad6f35ce8905229efce14532c2adb7ffae4af, anterior ao main atual.

O PR propõe:
- remover o círculo/orbita sob a Kira no login;
- aproximar o balão, aumentar variedade de falas e suavizar saturação;
- não disparar gesto de anotação aleatoriamente no login;
- animar a Kira somente após confirmação positiva de salvamento no Supabase;
- permitir guardar resposta da Kira na aba ENEM como rascunho e só celebrar depois do salvamento real.

**Verificação direta do main atual:** src/components/KiraLoginScene.jsx ainda contém noteClip e .kira-orbit; src/pages/Anotacoes.jsx não contém a confirmação KiraNoteSaved; src/pages/EnemScreen.jsx ainda não apresenta o botão de guardar resposta da Kira encontrado em Chat.jsx. Portanto, não afirmar que essas correções estão na produção. O PR está desatualizado e não mergeável; rebasear/revisar contra o main atual, resolver conflitos e testar antes de mesclar. Não mesclar o PR inteiro cegamente, pois há alterações que podem sobrepor onboarding/dashboard já publicados.

### Prioridade 2 — Safari/iPhone XR real
- Testar PWA instalado e Safari no iPhone XR, iOS 18.
- Trocar rapidamente entre Dashboard, Notas, Kira, ENEM e Perfil.
- Abrir/fechar teclado, rolar resposta longa, testar safe areas e retorno do background.
- Observar chuva, gotas, blur, navegação e long tasks pelo Web Inspector.
- Testar prefers-reduced-motion e redução de transparência.
- Medir FPS real. Não declarar 60/120 FPS nem equivalência nativa com base em desktop/Chromium.

### Outras pendências
- Autenticação real: validar signup com e-mail novo, confirmação, callback e Google OAuth; conferir allowlist de preview.
- Supabase: validar RLS, CRUD real e migrations no projeto correto antes de mudar backend.
- NFC: teste com etiquetas físicas iPhone e Android.
- Stripe: webhook, entitlement e sandbox ponta a ponta antes de qualquer cobrança real.
- ENEM: banco de questões licenciado, OCR de redação, correção calibrada, TRI e sincronização do diário ainda não implementados.
- Offline integral e notificações agendadas com app fechado não implementados.
- Revisar OCR em NovaAnotacao.jsx; não presumir que o botão atual conclui persistência real.

---

## 12. Testes e critérios de entrega

### Testes existentes
- Unitários: tests/nfc.test.mjs, tests/kira-output.test.mjs, tests/kira-prompt.test.mjs, tests/admissions.test.mjs.
- Browser: tests/motion.browser.mjs, tests/navigation-stability.browser.mjs, tests/study-flow.browser.mjs, tests/ios27.visual.browser.mjs.
- Testes de browser usam mocks/fixtures para Auth, Supabase, Kira e teclado. Eles não provam OAuth real, RLS de produção, NFC físico ou FPS no iPhone.

### Comandos mínimos
~~~bash
npm ci
npm run build
npm run lint
node --test tests/*.test.mjs
~~~

Para QA browser, ler primeiro o cabeçalho do teste e configurar o Playwright Core/browser conforme docs/motion-and-safari.md. O caminho temporário de Playwright citado em documentos antigos pode não existir mais.

**Antes de declarar pronto:** reportar exatamente quais comandos rodaram, resultado, arquivos alterados, ambiente testado e limitações. Não dizer “testado no iPhone” se só houve Chromium desktop.

---

## 13. Documentos que Claude deve ler

Ordem recomendada:
1. CLAUDE.md — regras de trabalho e arquitetura.
2. docs/CLAUDE-HANDOFF-2026-11-21.md — este estado consolidado.
3. docs/motion-and-safari.md — performance, transições e protocolo de teste no XR.
4. docs/design-and-nfc.md — identidade e comportamento NFC.
5. docs/study-flow.md — Kira, caderno e fluxo de estudo.
6. docs/apple-design-refinement.md — auditoria Apple HIG e acessibilidade.
7. docs/ios27-visual-architecture.md e docs/studyos-no-flash-ios-refinement.md — arquitetura visual e navegação.
8. docs/liquid-glass-kira-2026-11-16.md — vidro, conversa e movimento.
9. docs/admissions-and-ui-2026-11-13.md e docs/mec-enem-studyos.md — dados e limites do ENEM.
10. native/README.md e native/AGENTS.md — arquitetura Expo e regras específicas de SDK.

O README.md da raiz é um template e está desatualizado como documentação do produto.

---

## 14. Regras operacionais para Claude

1. Antes de editar: git status --short --branch, git log -5 --oneline, verificar origin/main e comparar a cópia local.
2. Preservar qualquer alteração local não commitada, especialmente CLAUDE.md na cópia Fedora.
3. Tratar main remoto como fonte do código atualmente publicado; deployment atual é e8f6f93.
4. Não substituir o design aprovado nem redesenhar tudo. Fazer alterações pequenas, com escopo definido.
5. Não mexer em Supabase Auth, RLS, migrations, Edge Functions, pagamentos ou secrets sem aprovação explícita do usuário.
6. Nunca mover chaves server-side para o frontend.
7. Não aplicar mudanças grandes de blur/animação sem medir o custo no iPhone XR.
8. Não mesclar PR #1 sem rebase e revisão do diff contra o main atual.
9. Após cada entrega: build, lint direcionado, testes relevantes, resumo do diff e limitações.
10. Atualizar este handoff e o histórico AI-BRAIN depois de uma entrega relevante.

**Objetivo imediato:** continuar a partir do main atual sem perder trabalho local; resolver a pendência da Kira em branch limpa e testar o dashboard/ambiente visual no iPhone XR real, mantendo a chuva e o Liquid Glass discretos.

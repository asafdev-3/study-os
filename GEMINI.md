# GEMINI.md — StudyOS

## Objetivo e prioridade
Concluir e estabilizar o StudyOS. Não ampliar o escopo nem iniciar funcionalidades novas sem solicitação explícita de Vitor. Priorizar qualidade de experiência, confiabilidade, desempenho mobile e preparação da Mostra de Tecnologia.

## Identidade do produto
StudyOS é uma plataforma de estudos com foco no ENEM. Integra foco, organização, caderno, lembretes, Kira e NFC numa experiência coerente. A meta é demonstrar visão de produto e capacidade de execução, não apenas exibir efeitos visuais.

## Fonte de verdade
- Repositório: https://github.com/asafdev-3/study-os
- Branch de produção: main
- Projeto Vercel: study-os
- Stack confirmada no package.json: React 19, Vite 8, Tailwind CSS 4, React Router 7, Framer Motion 13, Supabase.
- Leia primeiro CLAUDE.md e os documentos relevantes em docs/. O CLAUDE.md contém decisões arquiteturais importantes e referências ao histórico AI BRAIN.
- Documentos antigos podem estar desatualizados. Compare sempre com código, commits e instruções mais recentes.
- O AI BRAIN completo permanece no computador de Vitor. Quando estiver disponível, consulte `~/Documentos/AI-BRAIN/02-PROJECTS/STUDYOS/`; não presuma que esse diretório existe no ambiente do Gemini.

## Como acessar os arquivos sem Remote Desktop Commander
O Gemini deve operar localmente no checkout do repositório, usando Gemini CLI ou Antigravity com a pasta do projeto aberta. Não depende do Remote Desktop Commander.
- Checkout esperado no Fedora: `~/Projetos/study-os` (confirmar caminho real antes de executar).
- Iniciar o Gemini a partir da raiz do projeto para que leia este GEMINI.md.
- Para contexto específico, abrir os arquivos diretamente com as ferramentas locais do Gemini ou usar referências `@caminho/do/arquivo`.
- Se o checkout não existir ou estiver desatualizado: clonar ou executar `git pull --ff-only origin main` depois de verificar `git status`. Nunca sobrescrever alterações locais.
- O Gemini CLI lê e edita arquivos do workspace, executa comandos aprovados e respeita .gitignore; usar também .geminiignore para excluir arquivos privados.
- Não enviar .env, .env.local, tokens, chaves privadas, service_role, credenciais ou dados pessoais para o contexto.
- Não alegar que leu AI BRAIN local se ele não foi efetivamente disponibilizado ao Gemini.

## Fluxo obrigatório por tarefa
1. Vitor descreve uma tarefa e o resultado esperado.
2. Gemini inspeciona o estado Git (`git status --short`, `git log -5 --oneline`) e lê os componentes, estilos, testes e documentação envolvidos.
3. Antes de editar, apresenta diagnóstico curto, arquivos que pretende alterar e plano proporcional. Se o escopo estiver claro e Vitor autorizou implementação, pode prosseguir sem perguntas desnecessárias.
4. Implementa apenas o escopo aprovado; preserva identidade e funcionalidades existentes.
5. Executa `npm run build`, `npm run lint` e testes pertinentes. Se um teste não existir ou não puder ser executado, informa claramente.
6. Revisa `git diff`, resume arquivos alterados, evidências, riscos e limitações.
7. Trabalha em branch de tarefa e abre PR para main quando a mudança for significativa. Não faz push direto em main sem autorização explícita.
8. Após merge, aguarda/acompanha o deploy automático da Vercel e verifica estado READY e URL.
9. Atualiza documentação técnica e este arquivo quando decisões estruturais mudarem.

## GitHub e Vercel — publicação contínua
O projeto Vercel `study-os` está conectado ao repositório GitHub `asafdev-3/study-os`. A branch de produção é `main`.
- Push em branch não-main deve gerar Preview Deployment.
- Merge/push em main deve gerar Production Deployment automaticamente.
- Não usar deploy manual como fluxo normal.
- Depois de merge em main, verificar no Vercel se o deployment do commit esperado terminou em READY.
- Se não houver deployment, investigar Git Integration, Production Branch, permissões do Vercel GitHub App e logs. Não criar projeto Vercel duplicado.
- Não declarar publicado até confirmar READY.
- CI do GitHub já valida npm ci, lint e build em PRs/pushes; conferir workflow real antes de assumir.

## Domínio e hospedagem
Vitor escolheu Registro.br para registrar o domínio .br e Vercel para hospedar/publicar o StudyOS.
- Registro.br é o registrador do domínio; não é a hospedagem do aplicativo.
- Vercel continua responsável pelo hosting, deploy, CDN e certificado SSL.
- Quando o domínio for escolhido e registrado, adicionar o domínio ao projeto Vercel e seguir os registros DNS exatos exibidos em Vercel.
- Configurar DNS no Registro.br. Não inventar IPs/CNAME; usar os valores específicos fornecidos pelo painel Vercel.
- Não trocar nameservers nem apagar registros existentes sem conferir MX, TXT, SPF, DKIM e outros serviços de e-mail.
- Não registrar nem comprar domínio sem confirmação explícita de Vitor.

## Arquitetura e limites importantes
- O projeto atual é React/Vite PWA, NÃO React Native/Expo.
- Não instalar `expo-glass-effect` no projeto web. Para PWA, avaliar CSS/backdrop-filter e compatibilidade real. Uma aplicação Expo nativa separada exigiria outro projeto.
- Preservar LazyMotion, imports m, divisão de motionFeatures, prefetch e estratégia de rotas. Não substituir por imports globais pesados sem medir bundle.
- O timer de foco usa deadline absoluto e persistência; não usar contagem que para quando a aba fica em background.
- O Lock é bloqueio visual de sessão, não biometria real.
- NFC usa destinos reais definidos em src/lib/nfc.js; não reintroduzir simulação aleatória nem prometer que bloqueia outros apps.
- iPhone escreve URL na tag via app externo e abre pela notificação do sistema; Android compatível pode usar NDEFReader.write.
- Kira chama Edge Function Supabase autenticada e Groq. Preservar autenticação e cota de 10 mensagens/dia.
- Stripe está em sandbox/incompleto. Não habilitar cobrança real sem webhook, confirmação de pagamento e sincronização de entitlement testados.
- Dados ilustrativos de bolsas/cortes não são dados oficiais.
- Offline integral e notificações agendadas com app fechado não estão implementados.
- Testes simulados não comprovam Safari físico nem FPS no iPhone XR. Não afirmar validação física sem realizá-la.

## Direção visual
- Preservar identidade escura azul/violeta.
- Menos elementos, hierarquia clara, experiência confortável e mobile-first.
- Liquid Glass sutil e localizado, sem vidro em toda superfície.
- Animações devem ser fluidas, mas não podem atrasar navegação nem prejudicar Safari/iPhone XR.
- Respeitar prefers-reduced-motion, prefers-reduced-transparency e acessibilidade.
- Evitar redesign genérico de dashboard SaaS, mudanças arbitrárias e efeitos contínuos desnecessários.
- Não substituir assets/arte da Kira sem solicitação e sem avaliar qualidade/tamanho.

## Pendências atuais — foco de conclusão
1. Redesenhar tela NFC e consolidar função demonstrável da tag para a Mostra.
2. Otimizar transições e animações sem piorar desempenho.
3. Kira: piscada natural; GIFs somente após interação; elevar qualidade dos GIFs.
4. Refinar dashboard sem descaracterizar o ambiente original.
5. Reformular a tela ENEM para navegação mais confortável e hierarquia melhor.
6. Recuperar e analisar referência de post-its que Vitor enviou a si mesmo pelo WhatsApp.
7. Preparar apresentação da Mostra: problema, visão, diferencial verificável, NFC como experiência, demonstração e habilidades demonstradas.
8. Validar fluxos críticos em iPhone XR/Safari real, Android e desktop.
9. Completar validação de onboarding/OAuth, dados persistidos, RLS, paywall e Stripe sandbox conforme autorização.

## Segurança e autonomia
- Nunca ler, imprimir, copiar ou versionar segredos.
- Nunca apagar dados, executar migrações destrutivas, alterar políticas de segurança, habilitar pagamentos reais ou modificar produção sem autorização explícita.
- Não inventar resultados, testes, métricas, diferenciais competitivos ou estado de deploy.
- Fazer mudanças pequenas e verificáveis; evitar commits/PRs desnecessários.
- Se encontrar conflito entre documentação e código, relatar a divergência e usar o comportamento implementado como evidência, sem apagar decisões históricas.

## Primeira sessão
1. Confirmar diretório do repositório e branch.
2. Ler este arquivo, CLAUDE.md e docs relevantes.
3. Inspecionar Git e a estrutura atual.
4. Produzir uma auditoria curta das pendências e dependências.
5. Não iniciar redesign ou alteração de backend até Vitor escolher a primeira tarefa.

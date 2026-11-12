# Movimento — Safari/iPhone XR

## Relato
O usuário continua percebendo engasgos no Safari do iPhone XR com iOS 18. O aparelho não está disponível para medição direta. As causas abaixo são custos encontrados no código, não um perfil de CPU/GPU capturado no XR.

## Mudanças
- Entrada de rotas via Framer Motion, opacidade 0,88 → 1 em 220 ms.
- LazyMotion/m com domMax separado, para não incorporar todo o motor de layout ao JS inicial.
- Desfoque leve de 1,5 px / 200 ms SOMENTE nos cabeçalhos. Nenhum filter na página inteira, cenário ou conversa longa.
- Sem perspectiva, dobra, sombra de vinco ou escala na troca de página.
- Indicador ativo da navegação com layoutId e spring (420/38/0,7). Não move a barra.
- Mensagens da Kira entram com opacidade e deslocamento de 4 px / 180 ms.
- Preferências de movimento reduzido reativas ao sistema, ao evento de preferências e ao storage.
- Pré-carregamento de rotas em ociosidade após login/desbloqueio, cancelável, sem rede adicional quando Save-Data está ativo.
- Preload por toque/foco também funciona com query string e subpáginas de configurações. Imports deduplicados, falhas permitem nova tentativa.
- Chat agrupa eventos de viewport em requestAnimationFrame, só escreve altura/topo quando mudam, e só acompanha fim da conversa no redimensionamento.
- Listas de notas de corte não usam backdrop-filter no mobile; hover touch não deixa filtro brightness ativo.
- Digital e confirmações do Lock foram preservadas. Sem mudança do design nesta rodada.

## Medição de pacote
Build local: entrada 520,93 kB minificado / 153,82 kB gzip. Baseline anterior: 509,21 / 149,58. Há aumento pequeno, não redução do pacote inicial.
A tentativa inicial de importar motion completo na navegação gerou 633,65 / 189,71; foi substituída por LazyMotion antes da entrega.
Aviso Vite de chunk >500 kB continua e deve ser tratado separadamente.

## Validação
- Build e lint direcionado.
- Fluxos simulados de dashboard, NFC, filtros, nota privada e retorno após login/lock em 414 e 1440 px.
- Lock, transições, indicador, mensagens, teclado simulado e timer em 320/414/430/1024 px, incluindo movimento reduzido.
- VisualViewport: altura 320 px e offset 20 px; compositor fica dentro da área visível.
- Vinte eventos de scroll sem alteração geométrica geram zero mutações de estilo na página do chat após a animação terminar.
- Nenhum filter na raiz das páginas/chat; indicador termina alinhado à aba ativa.
- Estes testes usam Chromium/Brave e dados simulados. Não medem FPS em Safari/iPhone e não validam hardware NFC.

## Executar QA de navegador
Na máquina atual existe Playwright Core em /tmp/studyos-ui.eEDKgqhL/node_modules. O caminho temporário pode desaparecer; se necessário, instalar Playwright Core em um ambiente de testes e apontar STUDYOS_PLAYWRIGHT_MODULE para o entry point.
```sh
cd /home/vortex/study-os
STUDYOS_PLAYWRIGHT_MODULE=/tmp/studyos-ui.eEDKgqhL/node_modules/playwright-core/index.mjs STUDYOS_BROWSER_PATH=/opt/brave.com/brave/brave node --env-file=.env.local tests/motion.browser.mjs
node --test tests/nfc.test.mjs
```
O teste usa o dist atual: rodar npm run build antes. As variáveis VITE são lidas sem exibir valores. O navegador só acessa o preview e recebe fixtures locais para APIs.

## Teste obrigatório no XR
1. Safari e PWA: dez trocas Início → Notas → Kira → ENEM → Perfil.
2. Testar cache frio/rede lenta e segunda visita; observar tela vazia ou pausa no toque.
3. Abrir/fechar teclado; enviar e rolar resposta longa; compositor não deve saltar.
4. Timer continua após trocar aba e voltar do background.
5. Ativar movimento reduzido no iOS e no app, testar sem reload.
6. Usar Web Inspector para identificar long tasks e repaints antes de novos efeitos.
7. Não afirmar “60 fps garantidos” nem usar desktop throttling como prova do desempenho físico.

Referências de implementação:
https://motion.dev/docs/performance
https://motion.dev/docs/react-motion-component
https://react.dev/reference/react/Suspense


## Lock Hold-to-Scan — 12/11/2026
Digital preservada; pressão contínua de 2000 ms via Pointer Events, progresso por performance.now/rAF; toque curto, saída da área (inclusive captura touch), cancelamento, blur e background abortam. Teclado Espaço/Enter também exige 2 s. Movimento reduzido mantém requisito; confirmação visual 180 ms antes do onUnlock. user-select:none, touch-action:none e menu de contexto bloqueado. Testes de fluxo e lock adaptados; Safari físico pendente.


## Atualização 12/11: Lock e direção de produto
Lock agora exige 800 ms, substituindo os 2000 ms anteriores. Seleção/callout Safari bloqueados em toda a área e descendentes, inclusive status. Ver docs/product-direction.md: necessidades, prioridades e recursos propostos (não implementados).


## Kira livre e otimização — 12/11/2026
KiraAvatar reutiliza a arte RGBA original 420x280, inteira/object-fit contain, sem círculo ou fundo. Sombra de apoio e inclinação CSS apenas em hover com ponteiro fino, respeitando movimento reduzido. Presente no chat (cabeçalho e estado vazio), home e paywall. É apresentação com profundidade da arte existente, não modelo WebGL. Nenhuma imagem regenerada ou dependência adicionada.
Performance: FocusSummary isola ticks da home e suspende timer visual quando documento está oculto ou sessão concluída; deadline continua absoluto. Mensagens restauradas do chat não repetem animação. Entrada do chat começa quase opaca para evitar flash. Glass pesado fica opaco em telas touch; pulso decorativo de sombra desativado no touch; blur de 6px removido da entrada legada. Blur leve dos cabeçalhos e springs preservados. Prefetch ocioso limitado a Notas/Chat/ENEM, demais rotas continuam por intenção; pausa em background.
Validação: lint e build aprovados; motion 320/414/430 reduzido/1024 e fluxo de estudo 320/414 touch +1024 aprovados. Captura qa.local/kira-character.png inspecionada. Sem medição em XR/WebKit físico; NÃO prometer 120 FPS universal ou ganho percentual. PWA não passa a app nativo por essas mudanças.


Progressive Gaussian Blur Transition with Spring Animation: cabeçalhos entram com blur 3px → 0,65px → nenhum em 260ms; movimento de 6px com mola e opacidade independente. Chat usa os mesmos parâmetros. Movimento reduzido desliga a entrada. Fluidez física do Safari XR ainda não medida.

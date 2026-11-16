# StudyOS — Navegação sem piscada e refinamento iOS / 16 nov 2026

## Resultado
- A interface principal agora mantém o shell React: a `study-navigation`, a toolbar, o contêiner `study-route-stage` e o fundo do documento permanecem montados ao trocar de aba.
- Removida a chave `key={location.pathname}` de `<Routes>`, que forçava desmontagens desnecessárias.
- Removido o `PageMotion` de entrada e o `study-soft-focus` de cabeçalhos: não devem competir com o crossfade das capturas da rota.
- `transitionRoute` carrega a página lazy antes de navegar; a tela antiga fica visível durante a espera. Usa a View Transitions API só no grupo `study-screen`; navbar e topbar são grupos não animados. Se indisponível, troca instantânea e estável, sem desaparecer numa tela escura.
- `transitionTo` não anima a página para mudanças internas do ENEM: indicador `LayoutGroup` faz spring; apenas o painel entra suavemente.
- `StudyLink` marca explicitamente links navegáveis comuns e preserva o `state` do Router em links com dados (ex.: sugestão da Kira), que não são interceptados pelo crossfade.
- `/lembretes` entrou na estratégia de prefetch.
- `apple-polish.css`: material único na barra/nav/compositor; vidro de 18px em mobile e 24px no desktop, borda especular e reflexão sutil; cards e post-its não fazem blur; navegação, foco, cadernos, configurações e ENEM compartilham tipografia e tokens consistentes.
- Metadados iOS PWA anteriores foram preservados.

## Validação
- `tests/navigation-stability.browser.mjs`: navegação Início → Kira via sugestão com state → ENEM → Notas → Início. Exige navbar e stage sem remontar, ausência de `study-loading` durante abas e sem overflow em 320, 390, 414 e 1024 px.
- `tests/motion.browser.mjs`: lock, teclado, indicador, foco ENEM, animação local e redução de movimento em 320/414/430/1024 px.
- `tests/study-flow.browser.mjs`: anotações, Kira, fallback de copiar, ENEM, post-its e leitura móvel em 320/414/1024 px.
- `tests/ios27.visual.browser.mjs`: blur contextual, intensidade persistente e responsividade.
- `npm run lint`, `npm run build` e testes unitários.
- Testes são feitos no Chromium automatizado, NÃO comprovam 60fps no Safari do iPhone XR. Validar interação, teclado, rolagem e frames no dispositivo real.

## Limites técnicos
O Liquid Glass do SwiftUI possui refração, amostragem de fundo e integração com compositor nativo. Uma PWA no Safari não pode invocar esse material. Em vez de tentar reproduzir integralmente por filtros SVG/WebGL (custosos e incompatíveis em alguns dispositivos), StudyOS usa uma aproximação de alto contraste, blur limitado e borda iluminada. Respeita `prefers-reduced-transparency`, `prefers-reduced-motion` e a preferência explícita de reduzir movimento.

## Pendências separadas
O catálogo de capas colecionáveis continua em `feat/notebook-covers`, ainda dependente da migração SQL e da função de recompensas no Supabase correto. Não integrar a branch não implantada apenas por motivo visual.

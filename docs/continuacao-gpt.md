

## 12/11/2026 — Continuidade após Claude: lock e login PWA
- Base encontrada limpa: 872dd9b. Claude adicionou springs e separou vendors; não reverter essas mudanças inadvertidamente. Sua alegação sobre 120Hz não é evidência de fluidez no XR.
- Login retirado de PageMotion: estático. Login e Lock ancorados por position:fixed em display-mode:standalone, com safe-area existente, sem overscroll; overflow interno permitido para acessibilidade em telas pequenas.
- Lock mantém digital, anel e confirmação. Adicionados quatro cantos de enquadramento e linha de varredura em 440ms, acionados pelo toque. Não é Face ID real. Movimento reduzido preservado.
- Build e lint direcionado passaram. Validação física em iPhone XR/iOS18/PWA permanece pendente. Não prometer FPS ou equivalência a efeito nativo da Apple.
- Próximo GPT: ler CLAUDE.md, docs/motion-and-safari.md e este registro; verificar git status/log antes de editar. Testar PWA instalado (login sem deslocamento, sem rolagem externa, teclado/safe-area) e Lock no aparelho. Preservar NFC, Kira, timer, cota e mudanças do Claude. Atualizar AI BRAIN após cada entrega.

- Regressão de navegador antiga NÃO passou: timeout esperando `.study-message--assistant` após mudanças do Chat do Claude. Investigar seletor/fluxo antes de considerar QA completo. Build/lint passaram; teste Safari físico não executado.

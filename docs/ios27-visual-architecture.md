# StudyOS — Sistema visual iOS 27 · novembro de 2026

## Fonte de decisão
- Apple Design Resources: https://developer.apple.com/design/resources/
- HIG Materials: https://developer.apple.com/design/human-interface-guidelines/materials
- HIG Typography: https://developer.apple.com/design/human-interface-guidelines/typography
- HIG Tab bars: https://developer.apple.com/design/human-interface-guidelines/tab-bars

Liquid Glass na camada funcional: barra flutuante, botões da toolbar, seletores e compositor. Evitar transformar texto, cadernos, post-its e resultados de estudo em vidro. O material web aproxima cor, blur, saturação e reflexão; não reproduz a refração óptica nativa de SwiftUI.

## Implementação
- `src/styles/ios27.css`: tokens dark-first e estilos semânticos; transparência persistida em `studyos:preferences.glassOpacity`.
- `src/styles/ios27-transitions.css`: crossfade de snapshots nativos, escala e desfoque apenas na transição; sem filtros persistentes no conteúdo.
- `src/lib/routeTransition.js`: View Transitions API com fallback curto via WAAPI. `prefers-reduced-motion` e escolha do usuário desativam o efeito. A navegação não duplica árvores React.
- `src/lib/foldBlur.ts`: camada de desfoque progressivo apenas em redimensionamento relevante (largura >45px ou mudança de postura); usa Viewport Segments / Device Posture se disponíveis, remove elementos e GPU hints após 250ms.
- `src/pages/Configuracoes.jsx`: slider 42%-92% que altera somente o vidro, preservando opacidade dos cartões de leitura.
- `src/index.css`: removida regra global com `!important` que forçava blur em cartões e eliminava hierarquia.

## Tipografia e acessibilidade
Fonte de sistema no iOS via `-apple-system`, fallbacks disponíveis, sem redistribuir SF Pro. Tamanho 16px ou maior para campos móveis; alvos acionáveis de 44px; contraste estável em cartões. Fallback para transparência reduzida e alto contraste. Em telas não iOS, usar fontes equivalentes da stack.

## Limites
- Otimizado para compositing em transform + opacity, mas 60 fps não está garantido e só pode ser medido no iPhone XR real. `backdrop-filter` de 24px em múltiplas camadas móveis pode ter custo; apenas controles usam-no.
- Não criar um tema claro parcial sobre páginas escuras hard-coded. Esta entrega preserva tema escuro e prepara tokens para futura implementação completa de modo claro.
- Migrations e Edge Functions de capas não foram aplicadas: backend Supabase do StudyOS não está conectado. A edição visual pode ir para produção; o recurso de recompensas exige deploy separado.

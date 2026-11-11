# StudyOS — sala de estudo e NFC

## Direção visual
Sala de estudo noturna, azul profundo e acentos azul-violeta do StudyOS. O caderno mostra a última anotação real. Timer e Kira ficam numa faixa de ações, sem dominar a composição.
A transição pedida pelo usuário é somente desfoque leve. Atualização: cabeçalhos usam 1,5 px / 200 ms; rotas usam opacidade via Framer Motion. Ver docs/motion-and-safari.md. Sem dobra, perspectiva, escala ou sombra central. Lock com digital preservado. Respeita movimento reduzido.

## Asset
`public/images/study-room.webp` — 1536 × 1024, 47.494 bytes. Imagem original criada com a ferramenta de geração de imagens e convertida para WebP para uso no projeto.
Brief: sala de estudo ao anoitecer; janela à direita com montanhas distantes; parede azul-marinho em sombra à esquerda para texto real; mesa de madeira escura, luminária quente e caderno azul. Sem interface, texto, pessoas, floresta ou fogueira.

## NFC real
A tela anterior executava uma simulação com Math.random. Essa simulação foi removida.
- Foco: `/nfc?acao=foco&area=mt`. Confirmação inicia 25 minutos; sessão existente é preservada, inclusive pausada ou concluída.
- Matéria: `/anotacoes?area=cn`.
- Anotação: `/anotacoes?nota=ID`. Exige a conta proprietária. Não publica o conteúdo da anotação na tag.
- URLs usam a origem atual, sem domínio fictício.
- Safari/iPhone: copiar URL e gravar em aplicativo NFC externo; aproximar aparelho com tela ligada e tocar na notificação.
- Chrome Android compatível: NDEFReader.write grava um registro URL, com permissão, feedback de erro e cancelamento.
- Login preserva destino permitido por até 30 minutos em sessionStorage. O Lock preserva path e query.
- Deixar as etiquetas regraváveis permite trocar a URL após adquirir domínio próprio. O domínio Vercel deve permanecer acessível se tags antigas continuarem em circulação.
- Não há bloqueio de outros apps. PWA não implementa esse recurso.

Referências:
https://developer.apple.com/documentation/corenfc/adding-support-for-background-tag-reading
https://developer.mozilla.org/en-US/docs/Web/API/NDEFReader/write
https://developer.mozilla.org/en-US/docs/Web/API/Web_NFC_API

## Verificação
`node --test tests/nfc.test.mjs` valida destinos, restrição de retorno para URLs locais e expiração.
QA de navegador usa autenticação e banco simulados; não substitui validação de OAuth real, Safari no iPhone XR nem leitura/gravação com etiqueta física.

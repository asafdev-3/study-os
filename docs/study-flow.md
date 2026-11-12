# StudyOS — fluxo de estudo, 12/11/2026

Pedido: melhorar utilidade e apresentação com economia de créditos, preservando o trabalho existente.

## Entrega
- Chat: respostas preservam linhas e palavras longas; botões discretos Copiar e Guardar no caderno; compositor 16 px e alvo de envio 44 px.
- Guardar abre anotação preenchida e exige Salvar. Não dispara IA. Texto acima do limite é mantido e exige redução explícita.
- Caderno: editar título/texto/área; atualização filtrada por usuário + ID e confirmação da linha retornada. Falhas mantêm formulário e texto; criação mantém ID entre tentativas.
- Revisar com Kira prepara uma pergunta por vez a partir da anotação. Só consome cota após Enviar.
- Conversa: store compartilhado por usuário durante a aba, inclusive resposta em voo durante troca de tela; últimas 30 mensagens em sessionStorage para recarregar a mesma aba. Não é histórico na nuvem nem sincronização entre dispositivos.
- Modal e botão flutuante do caderno usam portal, evitando o containing block de transform. Foco inicial, retorno e ciclo de Tab no editor.
- PageMotion mantém spring de Claude; remove will-change permanente. Não confundir spring com garantia de 120 Hz ou de FPS. Nenhum novo pacote.
- Home: sessão de foco concluída mostra Ver sessão.

## Validação
- Build de produção e ESLint dos sete arquivos alterados: aprovados.
- tests/study-flow.browser.mjs: 320, 414 e 1024 px. Copiar/fallback, criar/repetir, editar/erro, nenhum envio automático, conversa em voo entre abas, recuperação após reload, nenhum overflow horizontal e FAB acima da navegação.
- tests/motion.browser.mjs: 320, 414, 430 com movimento reduzido, 1024 px. Lock, teclado, transições, indicador e timer: aprovados. A falha anterior no seletor do chat foi resolvida ao restaurar a classe semântica study-message--assistant.
- tests/nfc.test.mjs: 3/3.
- Capturas em qa.local/study-flow-chat.png e study-flow-notes.png (não versionadas).

## Limites reais
Testes de navegador usam Supabase/Auth/Kira simulados, sem consumir IA nem alterar dados reais. Não validam RLS, OAuth ou dispositivo físico.
Os conectores Supabase disponíveis não incluem o projeto oejjojxeqarhbuniukac: consulta administrativa negada na conta Primary; inventário confirmou ausência nas duas contas conectadas. Nenhuma política ou schema foi alterado. Edição exige política UPDATE da conta no backend; falta validação autenticada real.
Safari iPhone XR / iOS 18, escrita de tag NFC física e FPS continuam pendentes.
Stripe continua sandbox/incompleto; esta rodada não libera cobrança.

# StudyOS — Capas colecionáveis · arquitetura e implantação

## Objetivo e decisões
- Cada anotação existente em `annotations` continua funcionando como um caderno da gaveta; a capa é um metadado opcional (`cover_id`), sem migração destrutiva das notas.
- Meta: 30 minutos ativos de sessão de foco por dia, durante 7 dias consecutivos.
- Uma única tentativa de resposta aberta por semana (segunda 00h a domingo 23h59, horário de São Paulo). A Kira cria questão com base em anotação salva com ao menos 120 caracteres.
- O estudante seleciona uma das 3 capas da edição atual antes de iniciar. Uma resposta considerada correta concede essa capa permanentemente.
- Falha de rede na avaliação: resposta já enviada fica no estado `grading` e poderá ser avaliada novamente sem permitir trocar a resposta. Uma tentativa nunca é consumida apenas por abrir a questão.
- Catálogo original: 6 templates gráficos autorais em CSS, 3 por semana, com ID da edição no formato `AAAA-MM-DD_tema`. A arte é procedimental; ampliá-la futuramente com peças originais comissionadas. Não usar franquias, logotipos ou personagens reconhecíveis de terceiros.

## Fluxo
1. Timer de foco já existente inicia com UUID de sessão; enquanto visível e em execução, envia heartbeat a cada 30 segundos à RPC `cover_focus_ping`.
2. O Postgres soma diferenças de tempo do relógio do servidor, limitadas a 45 segundos por ping. Uma sessão ativa por usuário impede contagem paralela em várias abas.
3. Ao abrir a coleção, a Edge Function `cover-rewards` lê o progresso, a sequência e a edição de segunda-feira em São Paulo.
4. Ao completar 7 dias, o usuário escolhe a capa e uma anotação. A função gera uma única pergunta, grava critérios secretos e reaproveita a questão se a tela for reaberta.
5. No envio, a resposta é gravada atomicamente em `grading`. A IA avalia apenas uma resposta; o próprio backend grava o prêmio se aprovado.
6. A escolha de capa atualiza `annotations.cover_id`; trigger SQL nega aplicação de capas não conquistadas.
7. O acervo não expira, mesmo que o template deixe de participar das próximas edições.

## Modelo de dados
- `annotations.cover_id`: referência opcional a um item do acervo; nulo = capa padrão.
- `cover_focus_state`: último heartbeat / sessão ativa do usuário.
- `cover_study_days`: segundos de foco qualificados por dia (relógio SQL).
- `cover_challenges`: desafio único `(user_id,week_start)`, pergunta, rubrica (privada), resposta única, estado e feedback.
- `cover_unlocks`: `(user_id,cover_id)`, timestamp de desbloqueio; sem exclusão por expiração.
- Acesso: RLS e `GRANT SELECT` somente ao próprio usuário para dias e acervo; escrita da recompensa e dos desafios exclusivamente por `service_role` na Edge Function; a RPC de heartbeat usa `auth.uid()`.
- Não inserir `service_role` ou chave Groq no frontend.

## Regras de segurança e limites
- O heartbeat só conta tempo com a aba visível e o timer rodando; períodos em segundo plano não contam. Não retroativa histórico de `study_sessions` para evitar tempo potencialmente adulterado.
- O cronômetro antigo e XP permanecem intactos.
- Isso reduz fraude casual, mas não prova estudo genuíno contra usuários com scripts. O desafio conceitual serve como segundo sinal de aprendizado.
- A IA pode avaliar incorretamente. Antes de um lançamento amplo, adicionar caminho de revisão de falsos negativos e limites de custo.
- Não confiar na resposta da IA para autorização: somente a função de servidor concede a recompensa. Uma resposta já enviada não pode ser modificada.
- Uma anotação é enviada à Groq apenas ao iniciar o desafio. O texto é tratado como dado não confiável, não como comando.
- Não alterar/remover IDs ou semântica dos templates já lançados; novas capas devem ser acrescidas ao catálogo.
- Na primeira versão, todo o tempo elegível ocorre na aba de **Foco**. Mensagens na Kira e leitura de anotações fora da sessão não são somadas.
- É necessário o projeto Supabase da URL `oejjojxeqarhbuniukac.supabase.co`, indisponível nas contas atualmente conectadas; nenhum banco nem Edge Function de produção foi alterado.

## Implantação (não executada)
1. Confirmar acesso ao projeto Supabase correto e fazer backup lógico; aplicar `supabase/migrations/20261116182059_notebook_covers_rewards.sql`.
2. Publicar `supabase/functions/cover-rewards` com `verify_jwt=true`, preservando os segredos existentes `GROQ_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` no servidor.
3. Publicar e validar o frontend no Vercel somente após o backend. A nova UI mostra erro controlado até a etapa 2; a leitura antiga das notas permanece íntegra.
4. Fazer teste completo com conta autenticada: 7 dias distintos em horário de São Paulo, uma questão, uma resposta, concessão única e aplicação da capa; testar falha de rede durante a avaliação.
5. Validar Safari/PWA no iPhone XR, teclado e acessibilidade. Testes automatizados de navegador não equivalem à validação em aparelho real.

## Código
- Catálogo/temas: `supabase/functions/cover-rewards/catalog.json`.
- Cálculo e concessão: `supabase/functions/cover-rewards/index.ts`.
- Segurança/tabelas: migração SQL acima.
- Acesso cliente: `src/lib/coverRewards.js`.
- UI/arte original: `src/components/NotebookCovers.jsx`, `NotebookCoverArt.jsx`, `notebookCovers.css`.
- Integração: `src/pages/Anotacoes.jsx` e `src/pages/EnemScreen.jsx`.
- Testes: `tests/notebook-rewards.test.mjs` e `tests/notebook-covers.browser.mjs`.

## Próxima evolução arquitetural
O StudyOS hoje usa uma anotação como um caderno. Se o produto passar a conter **múltiplas páginas por caderno**, adicionar tabela `notebooks` e `annotations.notebook_id`, migrando capas para `notebooks.cover_id` sem perder registros. Evitar essa migração antes da mostra: aumenta o risco e não é necessária para o sistema de conquistas.

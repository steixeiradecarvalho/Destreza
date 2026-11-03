# Decisões

## 2026-11-03 — F0
1. **Hospedagem:** GitHub Pages no repositório `steixeiradecarvalho/Destreza`, conforme escolha de Sergio. GitHub Actions verificará PRs e publicará a branch `main` após testes. Caminho fixo `/Destreza/`; navegação interna em estado, sem rotas que causem 404 ao atualizar o Pages.
2. **Escopo:** F0 inclui boas-vindas, explicação e aceite do armazenamento, preferências, instalação, offline e documentação. Calibração de cinco toques entra na F1 com a captura de eventos. Não simular treinos ou resultados inexistentes.
3. **Persistência incremental:** a versão 1 do banco cria somente `config`; contém preferências e versão do consentimento. As demais tabelas entram com as fases que produzem dados, através de migrações. Não recriar o banco.
4. **Atualização:** service worker gerado pelo plugin, precache apenas de recursos locais, aviso de nova versão com atualização voluntária. Histórico fica no IndexedDB, separado dos caches.
5. **Privacidade:** não há requisições de aplicação para terceiros. A hospedagem recebe as requisições HTTP necessárias para servir o site; a interface explica essa distinção. Preferências e treinos não são transmitidos. Consentimento só persiste quando o usuário salva o preparo.
6. **Feedback:** som e vibração começam desligados e, na F0, só são preferências declaradas para os exercícios futuros. Não solicitar permissões desnecessárias.
7. **Dependências e acesso:** após a alteração de permissões pelo usuário e reinicialização do aplicativo, npm, GitHub e escrita no Git foram liberados. Dependências instaladas e `package-lock.json` gerado; o workflow usa `npm ci` e cache npm. A configuração de Pages como GitHub Actions foi confirmada pela API. O bloqueio inicial fica registrado como histórico, sem alterar a arquitetura.

## Questões já identificadas para as fases seguintes
- F1: dez teclas de 48 px não cabem em 360 px. Experimentar apresentação ampliada e validar no aparelho; registrar qualquer exceção explicitamente.
- F2: separar erros finais por caracteres no teclado nativo dos erros por toques instrumentados. Definir denominador de H1 sem apresentar estimativas como toques observados.
- F2/F4: teste de referência obrigatório no dia 1 e no dia 28, além de checkpoints semanais; versionar frases e protocolo.
- F1/F5: guardar pontaria em coordenadas e proporções da tecla; mm somente como estimativa calibrada.
- F4: curso guiado respeita desbloqueios; Biblioteca permite exploração e distingue prática livre.
- F5: exclusão com etapa reversível antes do ato definitivo; explicar os limites de desfazer.
- F4: lembretes dependem de suporte verificado no aparelho; não prometer agendamento em segundo plano sem suporte.

## 2026-11-03 — F1, após aprovação da F0 no celular
1. **Teclado e largura:** preservamos o QWERTY e a área mínima de 48 px. O teclado é mais largo que uma tela de 360 px; botões explícitos movem a janela, sem depender de deslizar. “Mostrar a tecla” centraliza o alvo como ajuda opcional. Espaço permanece visível. Em texto a 150% ou mais, os botões laterais ficam em coluna para não quebrar palavras. O conforto dessa solução é parte do portão no celular; não encolhemos teclas silenciosamente.
2. **Modos de mão:** a primeira posição da janela favorece o lado da mão dominante no modo polegar. Os modos indicador e duas mãos conservam a geometria. Não inferimos qual dedo tocou nem obrigamos a mudar de estilo.
3. **Instrumentação:** Pointer Events confirmam ao soltar, registrando coordenadas CSS, posição relativa ao centro do alvo, dimensões, duração, origem e pressão quando oferecida. Teclado físico e acionamento acessível não fabricam coordenadas. Repetições em menos de 150 ms a até 12 px são ignoradas; os eventos aceitos são gravados individualmente, com identificador idempotente para repetição em caso de erro de armazenamento. Pontaria é relativa à tecla, sem conversão enganosa para milímetros.
4. **Calibração:** cinco círculos, com coordenadas e duração por toque, separados dos dados de lição. É um registro inicial de alcance e pontaria, não uma estimativa clínica de tremor. Ações por leitor de tela são identificadas sem coordenadas inventadas.
5. **Lições:** aquecimento de dez caracteres, núcleo e desafio de conteúdo original. A quantidade é finita e não há cronômetro que imponha velocidade; seis minutos são uma orientação a validar. A estrutura temporal e a ponderação automática de teclas teimosas ficam no motor da F4. Nesta fase, repetir ou explorar é escolha do usuário.
6. **Conteúdo e acentos:** a F1 contém um conjunto inicial para os seis níveis, sem pretender completar as 300 palavras, 120 frases e 40 mensagens do piloto inteiro. Acentos e “não” entram com o toque longo na F2. O cedilha já tem tecla própria no layout.
7. **Persistência e interrupção:** banco v2 adiciona perfil, sessões, tentativas e toques; preserva config. Só finalizar as três etapas marca a lição como concluída. Ao pausar e sair, ou iniciar após uma interrupção, não há progresso de nível por sessão incompleta. Uma lição interrompida não retoma do ponto anterior nesta fase; os toques já gravados permanecem.
8. **Desbloqueio:** três tentativas guiadas concluídas com ≥85%, não necessariamente consecutivas, liberam o próximo nível. Prática livre é identificada e não altera o desbloqueio. O histórico inicial mostra as cinco sessões mais recentes; o painel completo fica na F5.
9. **Atualização segura:** a oferta de atualização fica oculta durante lições e reaparece no início, evitando recarregar um treino em andamento. O aceite da F0 já descrevia o armazenamento futuro de treinos; a tela Sobre passa a descrever os registros atuais.

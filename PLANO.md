# Plano de execução

Responsabilidade técnica: agente de desenvolvimento. Validação da experiência e coordenação com participantes: Sergio.

| Fase | Estado | Portão |
| --- | --- | --- |
| F0 Base | Concluída; Sergio confirmou abertura offline e preferências preservadas | Build/testes aprovados, publicação, instalação e abertura offline no celular |
| F1 Teclado 1–6 | Concluída; resultado salvo e conforto confirmados por Sergio | Lição completa com dados salvos e conforto validado |
| F2 Teclado nativo e níveis 7–12 | Concluída; teclado e exportação confirmados por Sergio | Referência repetível e exportável |
| F3 Mãos 1, 2, 3 e 8 | Concluída; instruções e conforto dos gestos confirmados por Sergio | Demonstração, ensaio, três dificuldades por exercício |
| F4 Adaptação e sessão | Concluída; sessão completa aprovada por Sergio | Sessão diária completa sem intervenção manual |
| F5 Painel, diário e demais exercícios | Publicada e verificada; aguarda teste de Sergio no celular | Quatro visões com dados reais e conferência de sete dias simulados |
| F6 Polimento e pessoas | Não iniciada | Sem bloqueios graves; acessibilidade manual; acompanhamento de quatro semanas |

## F0 — preparado
- [x] Preact + TypeScript + Vite, CSS e três temas.
- [x] Boas-vindas, transparência dos dados e aceite antes de salvar preferências.
- [x] Texto de 100 a 200%, mão dominante, modo de uso, opções de feedback.
- [x] Persistência Dexie, com tratamento visível de falha.
- [x] Manifesto, ícones, precache e atualização voluntária.
- [x] GitHub Actions para verificação e implantação em Pages.
- [x] Testes escritos para persistência, fluxo, escala, escopo, offline e ausência de terceiros.
- [x] Instalar dependências e gerar lockfile.
- [x] Aprovar TypeScript/build, Vitest e Playwright; revisar capturas de tela.
- [x] Confirmar Pages com origem GitHub Actions.
- [x] Commit/push da F0.
- [x] Confirmar implantação e abrir endereço público.
- [x] Sergio: instalar, fechar, ativar modo avião e reabrir no celular.
- [ ] Testar armazenamento após atualização, TalkBack/VoiceOver e desempenho no aparelho.

Portão F0 aprovado por Sergio em 2026-11-03: “Abriu e preservou minhas escolhas”. F1 autorizada pelo plano de execução.

## Histórico da primeira sessão (antes da liberação de acesso)
- Transpilação sintática com TypeScript 5.9.3 já disponível no cache: sete arquivos TS/TSX, nenhum erro de sintaxe. Não equivale à checagem de tipos com dependências.
- Cálculo estático de contraste: nove combinações de texto/fundo dos temas claro e escuro, todas acima de 7:1 após ajuste do texto secundário (menor razão verificada: 7,78:1). Não substitui revisão visual dos estados completos.
- JSON de package/tsconfig e dimensões dos ícones PNG conferidos.
- `git diff --check`: sem erros; arquivos ainda não versionados.
- Build, Vitest, Playwright, revisão visual no navegador e instalação real: não executados. Bloqueios: dependências não instaladas por falta de rede e `.git` somente leitura.

## Validação após liberação de acesso — 2026-11-03
- npm e GitHub acessíveis; Git gravável.
- Dependências instaladas, lockfile gerado, workflow com `npm ci` e cache npm.
- `npm test`: 2 testes de persistência aprovados.
- `npm run build`: TypeScript e produção aprovados; 14 recursos locais no precache (aproximadamente 146 KiB).
- `npm run test:e2e`: 3 fluxos aprovados em 360×640: preferências a 200%, reabertura offline com preferências, navegação sem terceiros.
- Capturas de boas-vindas e conforto a 200% revisadas; título de feedback encurtado para facilitar leitura ampliada.
- Teste no aparelho real, leitores de tela e comportamento após troca de versão seguem pendentes.
- Primeira execução remota: build e testes unitários aprovados; teste offline fechou a página antes da conclusão de `Salvar`. Corrigido para aguardar a confirmação de persistência antes de fechar. Três fluxos aprovados novamente com `CI=true` local.

## Publicação confirmada — 2026-11-03
- Aplicativo: https://steixeiradecarvalho.github.io/Destreza/
- GitHub Actions: https://github.com/steixeiradecarvalho/Destreza/actions/runs/41685423299 — verificação e implantação aprovadas, commit `5389f17`.
- Site público retornou HTTP 200; teste em Chromium com emulação móvel confirmou carregamento, gravação e reabertura offline em nova página. Nenhum erro JavaScript observado na página inicial.
- Na entrega da F0, faltava o teste no aparelho; Sergio confirmou depois a abertura offline e a preservação das escolhas, encerrando esse portão.

## F1 — teclado de treino
- [x] Níveis 1–6 em conteúdo JSON versionado, com aquecimento, prática e desafio.
- [x] Teclado QWERTY brasileiro com teclas de pelo menos 48 px, escala 100–160%, marca do toque e navegação lateral por botões.
- [x] Calibração de cinco toques antes do primeiro treino (repetida se mudar mão ou modo de segurar).
- [x] Gravação de sessões, tentativas e toques, com resultado e histórico recente.
- [x] Migração v1 → v2 sem apagar as preferências da F0.
- [x] Progresso após três conclusões guiadas com precisão ≥85%; prática livre dos seis níveis.
- [x] Som suave e vibração opcionais; erros recebem texto, sem punição.
- [x] Testes de métricas, filtro de repetição, desbloqueio, migração e fluxos no navegador.
- [x] Build e verificação final da versão 0.2.0.
- [x] Publicação da F1 pelo GitHub Actions e verificação do site público.
- [x] Sergio: concluir uma lição no celular e confirmar resultado, histórico e conforto do teclado.

Limites de fase: o teclado nativo, as lições 7–12 e o teste de referência pertencem à F2. Adaptação automática e agenda são F4. Painel e exportação completa são F5. Na entrega da F1, essas fases ainda não estavam iniciadas; a F2 foi liberada após a confirmação de Sergio.

## Evidências locais da F1 — 2026-11-03
- TypeScript estrito e build de produção aprovados; precache de aproximadamente 165 KiB.
- Vitest: 6 testes aprovados (persistência, migração, métricas, filtro de tremor e desbloqueio).
- Playwright: 6 testes aprovados em 360×640, incluindo lição completa com erro e acertos, contagem real de registros, reabertura offline, acionamento ao soltar, interrupção e escala de texto 200% com teclado 160%.
- Capturas de treino, ampliação e resultado revisadas. A tecla Espaço foi mantida visível e os botões laterais passaram a coluna em texto ampliado.
- Teste de digitação rápida revelou atraso de fechamento de handlers; os listeners passam a acompanhar o alvo em useLayoutEffect, antes do próximo evento. Fluxo completo passou após a correção.

## Publicação da F1 confirmada — 2026-11-03
- Versão 0.2.0, commit de aplicação `b4b556a`; https://github.com/steixeiradecarvalho/Destreza/actions/runs/41698134785 — verificação e implantação aprovadas.
- Build público corresponde ao build local (`index-BGoZ2pX_.js`).
- Teste no site público em Chromium com emulação 360×640: HTTP 200, calibração de cinco pontos, tecla por ponteiro, pausa com gravação e reabertura offline do histórico. Sem erros JavaScript observados.
- Na entrega da F1, faltava o portão no aparelho. Sergio confirmou depois o resultado salvo e o conforto das teclas e da navegação, liberando a F2.

## F2 — teclado nativo, referência e níveis 7–12
Portão anterior aprovado por Sergio: resultado da lição salvo; teclas e navegação confortáveis.

- [x] Nível 7: corrigir texto preparado, com apagar real no teclado de treino.
- [x] Nível 8: toque longo para acentos, com escolha por botão como alternativa acessível.
- [x] Nível 9: maiúsculas, números e pontuação em camadas.
- [x] Nível 10: completar palavra por sugestão local.
- [x] Níveis 11 e 12: três etapas no teclado nativo, com frases e mensagens originais.
- [x] Referência de 120 segundos desde a primeira letra, sem contagem regressiva.
- [x] Frases fixas e protocolo versionado; calendário de acompanhamento nos dias 1, 7, 14, 21 e 28.
- [x] Métricas por caracteres finais, separadas dos toques do teclado instrumentado.
- [x] Interrupção ao sair da página, bloqueio de colar e gravação local de rascunhos.
- [x] JSON com todos os registros atuais; CSV com referência e lições nativas, protegido contra fórmulas de planilha.
- [x] Migração v2 → v3 preservando sessões e preferências anteriores.
- [x] Testes de lógica, migração, exportação e fluxos dos seis novos níveis.
- [x] Verificação final de produção e revisão visual da versão 0.3.0.
- [x] Publicação pelo GitHub Actions e verificação do site público.
- [x] Sergio confirmou execução no celular, abertura do teclado e exportação JSON/CSV; a repetibilidade já foi verificada automaticamente.

O portão da F2 foi aprovado por Sergio: “Testei no celular. Ok. O teclado abriu e os arquivos JSON/CSV foram exportados”. A F3 foi iniciada após essa confirmação.

## Evidências locais da F2 — 2026-11-03
- TypeScript estrito e build 0.3.0 aprovados; precache de aproximadamente 186 KiB.
- Vitest: 13 testes aprovados, incluindo migração v2 → v3, alinhamento de caracteres, calendário e CSV seguro.
- Playwright: 14 testes aprovados em 360×640, incluindo correção, toque longo, camadas, sugestões, lições nativas 11/12, cronômetro controlado de 120 segundos, downloads JSON/CSV reais, bloqueio de colar, interrupção e histórico offline.
- Referência e resultados também verificados com texto a 200%; capturas revisadas visualmente.
- A regressão de Backspace no nível 7 foi corrigida preservando o nome da tecla física. Retry de gravação nativa conserva o rascunho e não reinicia o teste.
- Emulação valida o campo e a lógica; teclado visual do sistema e sugestões ainda precisam do teste no aparelho.
- Primeira execução remota da F2: 13 testes unitários e build aprovados; dois testes de navegador falharam por sincronização de entrada e navegação no cenário de relógio simulado a 200%. Os downloads e o prazo de 120 segundos já haviam passado. Ajustadas as esperas pela gravação e a navegação por teclado nesse cenário; foco de títulos nativos passa a ocorrer antes da pintura. `CI=true npm run test:e2e`: 14 aprovados após as correções.

## Publicação da F2 confirmada — 2026-11-03
- Versão 0.3.0, commit de aplicação `36267e1`; https://github.com/steixeiradecarvalho/Destreza/actions/runs/41725409332 — verificação e implantação aprovadas (13 unitários + 14 de navegador).
- Site público corresponde ao build local (`index-c_F_7ok8.js`), com HTTP 200.
- Conferência pública em Chromium com emulação 360×640 e relógio controlado: teste encerrou com 120.000 ms registrados, sem erros para texto correto; downloads JSON e CSV foram lidos e validados; histórico reapareceu offline. Nenhum erro JavaScript observado.
- Na entrega da F2 faltava o teste no aparelho. A confirmação posterior de Sergio sobre o teclado e a exportação encerrou esse portão.

## F3 — primeira leva de Mãos (versão 0.4.0)
- [x] Trilha: reta, onda, espiral e oito, com faixa em três larguras.
- [x] Alvos: dez círculos por prática, com três tamanhos (mínimo 48 px).
- [x] Sequência: três rodadas, com ordem de duas, três ou quatro peças.
- [x] Gestos do dia a dia: foto, lista e mapa locais para toque, rolagem, pinça, giro e toque longo.
- [x] Demonstração de cinco segundos, ensaio sem gravação e início explícito da prática.
- [x] Mão dominante, outra mão e duas mãos; configuração guardada em cada prática.
- [x] Pausa com preservação do progresso em tela; interrupção sem conclusão falsa.
- [x] Registro incremental de ações e pontos; recuperação de erro de gravação sem duplicação.
- [x] Contrato preparar/rodar/medir/parâmetros, sem acoplamento ao futuro motor de adaptação.
- [x] Migração v3 → v4 preservando referências anteriores; JSON inclui práticas e movimentos.
- [x] Build, 20 testes unitários e 19 de navegador aprovados; revisão visual em 360×640 e texto a 200%.
- [x] Publicação no GitHub Pages e conferência do endereço público.
- [x] Sergio validou: “as instruções ficaram claras e os gestos confortáveis”.

O portão da F3 foi aprovado por Sergio; a F4 foi iniciada após essa confirmação.

## Retomada após limite de uso — 2026-11-04
- Conferidos Git, relatórios locais e execuções no GitHub: nenhuma operação de teste ficou em andamento; build e 39 testes locais tinham concluído com sucesso.
- Os arquivos da F3 estavam íntegros, ainda sem commit. A versão publicada continuava sendo a F2, com Actions aprovado.
- Pendências encontradas: documentação, commit/push da F3, execução remota e conferência do site publicado. A retomada prossegue nessas etapas, sem repetir verificações já aprovadas.

## Evidências da F3
- Trilha e Sequência completadas em ensaio e prática; dados de ensaio ausentes do banco.
- Alvos verificados com mão não dominante e dificuldade 3; falha de armazenamento simulada e recuperada, com exatamente dez movimentos finais.
- Pinça e giro testados por eventos de dois pontos de toque no Chromium; toque longo validado após 600 ms. Alternativas por botões são identificadas, sem fabricar pontos de dedo.
- Histórico de Mãos reaparece offline, e o JSON exportado contém práticas e movimentos.
- Capturas da Trilha, Sequência, Gestos, resultados e biblioteca a 200% revisadas. Rótulos dos círculos e botão da biblioteca ajustados para leitura.
- Emulação não substitui a validação de alcance e conforto dos gestos no celular de Sergio.

## Publicação da F3 confirmada — 2026-11-04
- Versão 0.4.0, commit de aplicação `399b94f`; https://github.com/steixeiradecarvalho/Destreza/actions/runs/41859859797 — build, 20 testes unitários, 19 de navegador e implantação aprovados.
- Site público corresponde ao build local (`index-Cq-7PBoy.js`), com HTTP 200.
- Conferência pública em Chromium com emulação 360×640 e relógio controlado para a demonstração: quatro exercícios disponíveis; ensaio e prática de Alvos concluídos; JSON com uma prática e exatamente dez movimentos; histórico reaberto offline. Nenhum erro JavaScript observado.
- Retomada finalizada sem perda de arquivos. A validação posterior de Sergio encerrou a F3 e autorizou o início da F4.


## F4 — adaptação e sessão diária (0.5.0)
- [x] Ajuste de um degrau a cada dez ações: ≥90% sobe, <70% desce; aplicação entre blocos, alterando um parâmetro.
- [x] Recomendações separadas por exercício, mão solicitada e origem da interação; aquecimento e ensaio não ajustam dificuldade.
- [x] Domínio por tecla/par nas últimas trinta ocorrências, métricas ausentes preservadas como nulas; agenda 1/2/4/8 dias.
- [x] Revisão ponderada das teclas fracas e vencidas, restrita ao vocabulário da lição atual.
- [x] Sessão de 10/11/12 minutos planejados, leve de oito minutos; aquecimento, teclado, mãos e fecho.
- [x] Referência inicial/semanal dentro do orçamento; variedade A/B/C e alternância de mão entre sessões concluídas.
- [x] Retomada das etapas concluídas; checkpoints de tempo a cada cinco segundos e ao guardar/sair.
- [x] Fecho com nota opcional, desconforto e anotação local; sugestão de descanso no dia atual/seguinte.
- [x] Sugestão de dia leve após duas quedas consecutivas entre três dias de prática; aviso de pausa após quinze minutos em primeiro plano.
- [x] Migração v4 → v5, exportação JSON de adaptação, domínio, sessões diárias e diário.
- [x] Verificação final, revisão visual e publicação da F4.
- [x] Sergio: completar uma sessão no celular, avaliar a condução e conferir retomada e fecho.

**Limites conscientes:** duração é aproximada, sem encerrar um gesto/rodada em andamento; fecho não obriga esperar um minuto. Demonstração, ensaio e pausas não contam no orçamento. Fechar pode perder até cinco segundos do contador; o cursor da atividade atual recomeça, preservando seus registros anteriores. Referência interrompida sempre recomeça por inteiro. Lembrete fica na página inicial, sem prometer notificações em segundo plano. Painel e consulta completa do diário permanecem F5.


## Evidências locais da F4 — 2026-11-04
- TypeScript estrito e build 0.5.0 aprovados; precache de aproximadamente 238 KiB.
- Vitest: 27 testes aprovados (sete novos para adaptação, domínio, espaçamento, agenda, diário, idempotência e migração v4 → v5).
- Playwright: 21 testes aprovados em 360×640. Fluxo diário percorreu Alvos, retomada offline na etapa seguinte, referência de 120.000 ms, calibração, prática de teclado por tempo, três blocos de Sequência com dificuldades 1/1/2 e fecho com nota, desconforto e anotação.
- Tentativa de teclado encerrada pelo orçamento ficou salva com `completed=false`, sem desbloqueio indevido. Ensaio/aquecimento não alimentaram recomendação de dificuldade.
- Sessão leve e aviso de quinze minutos verificados a 200%, sem transbordamento horizontal; capturas do fecho e aviso/plano revisadas visualmente.
- Ajustadas as esperas dos testes para começar os relógios após a abertura efetiva da prática e instalação offline; registros conferidos em ordem temporal, não pela chave UUID.
- A regressão completa das fases anteriores continua aprovada. Teste de migração F4 repetido após explicitar todas as tabelas do esquema v4: sete testes do arquivo aprovados.
- Emulação usa relógio controlado e não comprova conforto físico, duração percebida ou teclado visual do sistema no aparelho. O portão de Sergio permanece necessário.


## Publicação da F4 confirmada — 2026-11-04
- Versão 0.5.0, commit de aplicação `f904fbc`; https://github.com/steixeiradecarvalho/Destreza/actions/runs/41896299861 — build, 27 testes unitários, 21 testes de navegador e implantação aprovados.
- Site público corresponde ao build local (`index-puGkiBiH.js`), com HTTP 200.
- Conferência pública em Chromium 360×640 com relógio controlado: sessão diária iniciada, ensaio e aquecimento Alvos concluídos; JSON esquema 5 contém uma sessão diária, uma etapa concluída e dez movimentos, sem adaptação indevida pelo aquecimento. Retomada offline reabriu a referência na etapa 2/5. Nenhum erro JavaScript observado.
- Documentação e roteiro de celular atualizados. F4 aguarda Sergio completar uma sessão e validar condução, duração e conforto; F5 não iniciada.

## Retomada após pane elétrica — 2026-11-05
- Repositório íntegro (`git fsck`), sem alterações pendentes na retomada; último commit `29044b5`.
- Sergio confirmou que concluiu os testes antes da pane: “Aprovado e encerrado F4”. Portão F4 encerrado; F5 autorizada.
- F5 em desenvolvimento: painel, consulta do diário, CSV completo, exclusão e exercícios Dedilhado, Ritmo, Classificar, Palavra no traço e Cópia de padrão. F6 não iniciada.

## F5 — painel, diário e demais exercícios (0.6.0)
- [x] Aprovação explícita da F4 por Sergio em 2026-11-05.
- [x] Linha semanal com precisão ponderada, erros por 100 toques, intervalos/variação e correções; origens separadas.
- [x] Mapa de domínio com estados textuais, precisão/desvio e destaques de teclas; referência nativa e comparação dia 1 × dia 28 por protocolo.
- [x] Hábito por datas locais, sem duplicar dias; consulta do diário, média das notas e resultado associado quando disponível.
- [x] Dedilhado, Ritmo, Classificar, Palavra no traço e Cópia de padrão pelo contrato comum, três degraus, demonstração e ensaio.
- [x] CSV de todas as coleções, com proteção contra fórmulas; JSON integral mantendo esquema v5 e tabelas existentes.
- [x] Exclusão preparada com desfazer e confirmação final; limpeza transacional sem apagar/recriar o banco.
- [x] Variação fina descritiva para traços com amostragem suficiente, sem misturar alternativas ou toques separados.
- [x] Verificações locais e revisão visual (detalhes abaixo); confirmação remota na publicação.
- [x] Publicar e conferir o site público.
- [ ] Sergio: conferir painel/diário, cinco exercícios, exportação e preservação do histórico no celular.

**Limites:** emulação não comprova conforto dos dedos, metrônomo percebido, precisão de traços ou leitor de tela real. A mão e o dedo são solicitados, não detectados. Ciclo diário F4 preservado; novos exercícios na biblioteca. Variação fina pode ficar sem medida por baixa frequência de eventos e não estima tremor clínico. Exclusão definitiva não tem restauração por importação. F6 não iniciada.

## Evidências locais da F5 — 2026-11-05
- TypeScript estrito e build 0.6.0 aprovados; 14 recursos locais, aproximadamente 269 KiB no precache.
- Vitest: 36 aprovados; novas verificações cobrem sete dias, precisão ponderada, origens, semanas locais, intervalos, protocolo dia 28, CSV completo, rollback da exclusão, variação fina e destinos do traço.
- Regressão Playwright completa: 29 fluxos aprovados em 360×640. Após os ajustes finais de traço/demonstração, oito fluxos da F5 aprovados novamente; execução remota completa ainda pendente.
- Novos fluxos comprovam ensaios sem registro, confirmação ao soltar, ponteiro versus alternativas sem pontos artificiais, apoio no Ritmo, troca de regra, traço físico da palavra, padrão por toques, diário e CSV com sete dias simulados, exclusão final e leitura offline a 200%.
- Capturas revisadas: exercícios, painel/mapa e texto a 200%. Ajustados título do ensaio, nomes dos dedos em uma coluna ampliada, contraste dos pontos do modelo e teclas cortadas nas bordas. Demonstrações incluem deslocamento de cartão, percurso sobre letras/pontos e pulso conforme o andamento.
- Falhas encontradas nos testes: indicação offline em recarga corrigida com `serviceWorker.ready`; verificação do Ritmo passou a ordenar os registros por instante, pois UUID não é ordem cronológica. Nenhuma dessas falhas é declarada como teste aprovado antes da correção.

## Publicação da F5 confirmada — 2026-11-05
- Versão 0.6.0, commit de aplicação `fabced1`; https://github.com/steixeiradecarvalho/Destreza/actions/runs/42038303430 — build, 36 testes unitários, 29 testes de navegador e implantação aprovados na versão final.
- Site público retorna HTTP 200 e corresponde ao build local (`index-CEJTg_az.js`).
- Conferência pública em Chromium 360×640: quatro visões e diário disponíveis, nenhum histórico simulado inserido; nove exercícios na biblioteca; ensaio e prática de Dedilhado concluídos. JSON esquema 5 contém uma prática e dez movimentos acessíveis sem pontos inventados; ensaio ausente. Painel reaberto offline. Nenhum erro JavaScript observado.
- O primeiro script de conferência pública acionou teclas sem aguardar a gravação e não concluiu a prática; corrigida a sincronização do script com os botões habilitados. A segunda execução completou a conferência acima, sem alteração do aplicativo.
- F5 pronta para validação de Sergio no aparelho pelo roteiro do README. F6 não iniciada. Aprovação de F4 registrada; histórico e preferências não foram apagados para a atualização.

# Plano de execução

Responsabilidade técnica: agente de desenvolvimento. Validação da experiência e coordenação com participantes: Sergio.

| Fase | Estado | Portão |
| --- | --- | --- |
| F0 Base | Concluída; Sergio confirmou abertura offline e preferências preservadas | Build/testes aprovados, publicação, instalação e abertura offline no celular |
| F1 Teclado 1–6 | Concluída; resultado salvo e conforto confirmados por Sergio | Lição completa com dados salvos e conforto validado |
| F2 Teclado nativo e níveis 7–12 | Implementada; publicação em preparação | Referência repetível e exportável |
| F3 Mãos 1, 2, 3 e 8 | Não iniciada | Demonstração, ensaio, três dificuldades por exercício |
| F4 Adaptação e sessão | Não iniciada | Sessão diária completa sem intervenção manual |
| F5 Painel, diário e demais exercícios | Não iniciada | Quatro visões com dados reais e conferência de sete dias simulados |
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
- [ ] Publicação pelo GitHub Actions e verificação do site público.
- [ ] Sergio: completar referência no teclado real, repetir com as mesmas frases e exportar os arquivos no celular.

Os exercícios de Mãos (F3) não foram iniciados. A F2 só encerra após o portão no celular.

## Evidências locais da F2 — 2026-11-03
- TypeScript estrito e build 0.3.0 aprovados; precache de aproximadamente 186 KiB.
- Vitest: 13 testes aprovados, incluindo migração v2 → v3, alinhamento de caracteres, calendário e CSV seguro.
- Playwright: 14 testes aprovados em 360×640, incluindo correção, toque longo, camadas, sugestões, lições nativas 11/12, cronômetro controlado de 120 segundos, downloads JSON/CSV reais, bloqueio de colar, interrupção e histórico offline.
- Referência e resultados também verificados com texto a 200%; capturas revisadas visualmente.
- A regressão de Backspace no nível 7 foi corrigida preservando o nome da tecla física. Retry de gravação nativa conserva o rascunho e não reinicia o teste.
- Emulação valida o campo e a lógica; teclado visual do sistema e sugestões ainda precisam do teste no aparelho.
- Primeira execução remota da F2: 13 testes unitários e build aprovados; dois testes de navegador falharam por sincronização de entrada e navegação no cenário de relógio simulado a 200%. Os downloads e o prazo de 120 segundos já haviam passado. Ajustadas as esperas pela gravação e a navegação por teclado nesse cenário; foco de títulos nativos passa a ocorrer antes da pintura. `CI=true npm run test:e2e`: 14 aprovados após as correções.

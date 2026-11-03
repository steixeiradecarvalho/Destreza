# Plano de execução

Responsabilidade técnica: agente de desenvolvimento. Validação da experiência e coordenação com participantes: Sergio.

| Fase | Estado | Portão |
| --- | --- | --- |
| F0 Base | Concluída; Sergio confirmou abertura offline e preferências preservadas | Build/testes aprovados, publicação, instalação e abertura offline no celular |
| F1 Teclado 1–6 | Implementada; validação e publicação em andamento | Lição completa com dados salvos e conforto validado |
| F2 Teclado nativo e níveis 7–12 | Não iniciada | Referência repetível e exportável |
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
- [ ] Publicação da F1 pelo GitHub Actions e verificação do site público.
- [ ] Sergio: concluir uma lição no celular e confirmar resultado, histórico e conforto do teclado.

Limites de fase: o teclado nativo, as lições 7–12 e o teste de referência pertencem à F2. Adaptação automática e agenda são F4. Painel e exportação completa são F5. Nenhuma dessas fases foi iniciada.

## Evidências locais da F1 — 2026-11-03
- TypeScript estrito e build de produção aprovados; precache de aproximadamente 165 KiB.
- Vitest: 6 testes aprovados (persistência, migração, métricas, filtro de tremor e desbloqueio).
- Playwright: 6 testes aprovados em 360×640, incluindo lição completa com erro e acertos, contagem real de registros, reabertura offline, acionamento ao soltar, interrupção e escala de texto 200% com teclado 160%.
- Capturas de treino, ampliação e resultado revisadas. A tecla Espaço foi mantida visível e os botões laterais passaram a coluna em texto ampliado.
- Teste de digitação rápida revelou atraso de fechamento de handlers; os listeners passam a acompanhar o alvo em useLayoutEffect, antes do próximo evento. Fluxo completo passou após a correção.

# Plano de execução

Responsabilidade técnica: agente de desenvolvimento. Validação da experiência e coordenação com participantes: Sergio.

| Fase | Estado | Portão |
| --- | --- | --- |
| F0 Base | Build e testes locais aprovados; publicação em preparação; aguarda teste no celular | Build/testes aprovados, publicação, instalação e abertura offline no celular |
| F1 Teclado 1–6 | Não iniciada | Lição completa com dados salvos e conforto validado |
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
- [ ] Commit/push da F0.
- [ ] Confirmar implantação e abrir endereço público.
- [ ] Sergio: instalar, fechar, ativar modo avião e reabrir no celular.
- [ ] Testar armazenamento após atualização, TalkBack/VoiceOver e desempenho no aparelho.

F0 permanece aberta. F1 só inicia após o portão, conforme a especificação.

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

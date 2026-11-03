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

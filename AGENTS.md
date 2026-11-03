# Destreza — instruções de desenvolvimento

## Fonte e fases
- Leia `Destreza — Especificação do Piloto.md` por inteiro antes de alterar o produto.
- Execute apenas uma fase por vez (F0–F6). A seguinte exige o portão anterior, inclusive teste de Sergio no celular.
- Registre ambiguidades e escolhas em `DECISOES.md`; atualize `PLANO.md` com evidências e pendências reais.
- Faça escolhas técnicas reversíveis autonomamente. Pergunte somente diante de impedimento, custo ou mudança relevante de escopo.

## Arquitetura
- TypeScript estrito, Preact, Vite, CSS puro, IndexedDB via Dexie, vite-plugin-pwa.
- `src/core`: lógica pura; `src/data`: persistência; `src/content`: currículo versionado; `src/modules/teclado` e `src/modules/maos`: módulos; `src/ui`: interface; `src/sw`: extensões futuras do service worker gerado.
- Todos os textos visíveis e nomes acessíveis ficam em `src/ui/textos.ts`.
- Site estático em https://steixeiradecarvalho.github.io/Destreza/; base, manifesto e escopo do SW devem respeitar `/Destreza/`.
- Nunca apagar ou recriar o banco para atualizar a aplicação. Evoluir o esquema com migrações Dexie e testes.
- Atualizações devem ser oferecidas ao usuário, sem recarregar automaticamente um treino em andamento.

## Interface e voz
- Português brasileiro, adulto, claro e caloroso. Sem infantilização, pressão, punição por erros ou alegações médicas/cognitivas.
- Corpo 20–40 px; títulos a partir de 28 px; alvos pelo menos 48 px, botões principais pelo menos 64 px.
- Contraste de pelo menos 7:1 no tema padrão. Claro, escuro e alto contraste. Nenhum estado só por cor.
- Compatibilidade com teclado físico, leitores de tela, foco visível e prefers-reduced-motion.
- Confirmar interações ao soltar, nunca em pointerdown. Exercícios deverão filtrar repetições de tremor (<150 ms no mesmo ponto).
- Navegação sem gestos ocultos. Exercícios demonstram e oferecem ensaio sem registro.
- Som e vibração opcionais; falhas de suporte não impedem o uso.

## Dados e qualidade
- Nenhum envio de perfil, toques, desempenho ou diário. Sem analytics, anúncios, fontes remotas ou sensores extras.
- Consentimento local explícito; exportação e exclusão conforme as fases. Explique a possível perda por limpeza do navegador.
- Vitest para persistência, métricas e adaptação; Playwright para fluxos principais em 360×640, offline e escala a 200%.
- Antes de entregar: build, testes pertinentes, revisão visual e relato de limitações. Nunca declarar como executado um teste não rodado.
- Ao fim de cada fase, entregar resumo curto, endereço publicado se houver e roteiro no celular. Publicação não substitui validação manual.

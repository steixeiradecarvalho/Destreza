# Destreza

*Devagar, o gesto aprende.*

PWA em português brasileiro para praticar digitação no celular. Piloto local, sem conta ou backend. A especificação está em [Destreza — Especificação do Piloto.md](<Destreza — Especificação do Piloto.md>).

Versão publicada: https://steixeiradecarvalho.github.io/Destreza/.

As **F0, F1 e F2** foram validadas por Sergio no celular. A versão **F3 (0.4.0)** acrescenta Trilha, Alvos, Sequência e Gestos do dia a dia, com demonstração, ensaio e três dificuldades. Consulte [PLANO.md](PLANO.md) e [DECISOES.md](DECISOES.md).

## Executar

Node.js 24 e npm. A primeira instalação precisa de internet.

```sh
npm ci
npm run dev
```

Desenvolvimento: `http://localhost:5173/Destreza/`. O service worker é gerado somente no build de produção.

```sh
npm test
npm run build
npx playwright install chromium
npm run test:e2e
npm run preview
```

Preview: `http://localhost:4173/Destreza/`. No Linux, dependências do navegador podem exigir `npx playwright install --with-deps chromium`.

As versões das dependências estão fixadas em `package-lock.json`. O workflow usa `npm ci` e publica somente após build, testes unitários e testes de navegador aprovados. Consulte `PLANO.md` para as verificações realizadas e a validação manual ainda pendente.

## Publicar no GitHub Pages

1. Enviar os arquivos para a branch `main` do repositório `steixeiradecarvalho/Destreza`.
2. Em **Settings → Pages → Build and deployment → Source**, selecionar **GitHub Actions**.
3. Acompanhar o workflow **Verificar e publicar Destreza** em Actions. A implantação só ocorre após testes e build aprovados.
4. Endereço esperado após sucesso: https://steixeiradecarvalho.github.io/Destreza/.

O workflow também aceita execução manual. Pull requests executam verificações sem publicar. O ambiente `github-pages` pode exigir liberação se houver regras de proteção configuradas na conta.

A configuração segue o [guia de implantação do Vite](https://vite.dev/guide/static-deploy#github-pages) e a [configuração de origem de publicação do GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

## Teste da F0 no celular

1. Abrir o endereço publicado, ler o aviso, preparar o espaço e salvar.
2. Experimentar texto a 200%, temas e seleção de mão. Verificar leitura e ausência de corte lateral.
3. Fechar e reabrir: as escolhas devem permanecer em **Ajustar meu conforto**.
4. Esperar **Pronto para abrir sem internet**. Instalar pelo menu do Chrome (Android) ou Compartilhar → Adicionar à Tela de Início no Safari (iPhone).
5. Fechar o aplicativo, ativar modo avião e reabrir pelo ícone. Confirmar que funciona e mantém as escolhas.
6. Informar modelo do celular, navegador e qualquer dificuldade. Instalação real, leitor de tela e tempo de abertura precisam de teste no aparelho; emulação não os comprova.

## Dados

Preferências, versão do aceite, calibração, sessões, tentativas, toques, resultados nativos, práticas de mãos e movimentos ficam no IndexedDB local. A migração da F0 preserva as preferências. Sem analytics, fontes externas ou envio de conteúdo pessoal. Arquivos do app são servidos pelo GitHub Pages. Limpar os dados do navegador pode apagar as preferências e o histórico futuro. O app não faz alegações médicas.

## Teste da F1 no celular

1. Abrir com internet e, se aparecer, tocar em **Atualizar agora**. Confirmar que existe **Treino de hoje**.
2. Em **Ajustar meu conforto**, escolher tamanho das teclas (100–160%) e marca do toque. Som e vibração são opcionais.
3. Tocar em **Treino de hoje → Começar a lição**; fazer os cinco toques de calibração e começar a lição.
4. Usar **Mais à esquerda**, **Mais à direita** e **Mostrar a tecla** para encontrar as letras. O espaço fica sempre visível. O treino também aceita teclado físico.
5. Concluir aquecimento, prática e desafio. Conferir **Lição e toques salvos neste aparelho**, voltar ao início e verificar **Últimas lições**.
6. Fechar, ativar modo avião e reabrir. O histórico deve continuar disponível.
7. Relatar se o teclado ficou confortável e se a navegação lateral dificultou encontrar letras. A F1 foi aprovada por Sergio; este roteiro continua útil para revisar a regressão do teclado de treino.

Uma pausa pode ser retomada enquanto a tela estiver aberta. **Guardar e sair** conserva os toques e marca a lição como interrompida. Fechar durante uma lição não a conclui; o próximo treino começa do início.

## Teste da F2 no celular

1. Abrir com internet e usar **Atualizar agora**, se aparecer.
2. Escolher **Teste de referência**. Ler o protocolo e, opcionalmente, anotar o teclado e seus ajustes.
3. Tocar em **Começar o teste** e depois no campo **Escreva aqui** para abrir o teclado do celular. O tempo começa na primeira letra. Copiar a frase; tocar **Próxima frase** ao terminar. O teste encerra após dois minutos, sem contagem regressiva.
4. Conferir caracteres corretos, palavras por minuto e **erros finais por 100 caracteres**. São medidas do texto final; não representam todos os erros de toque que o teclado pode ter corrigido.
5. Baixar **Exportar JSON** e **Exportar CSV**. Verificar que os arquivos abrem. Nenhum arquivo é enviado pelo aplicativo.
6. Voltar ao início, repetir o teste e confirmar que as frases começam na mesma ordem. Manter teclado e ajustes iguais para comparações úteis.
7. Em **Escolher uma lição**, experimentar os níveis 7–12 em **Prática livre**. O nível 8 ensina segurar a letra, soltar e escolher o acento; o botão **Escolher acento** oferece alternativa ao gesto.
8. Fechar e reabrir em modo avião: os testes anteriores devem aparecer em **Meus testes**.

Sair do aplicativo durante a referência interrompe o teste; o registro permanece, mas não entra como medição completa. A primeira medição válida inicia o dia 1 do acompanhamento. O aplicativo sugere novos testes nos dias 7, 14, 21 e 28. O CSV desta fase cobre os registros nativos; o JSON inclui todos os dados atuais.

## Teste da F3 no celular

1. Abrir com internet e escolher **Atualizar agora**, se aparecer. Entrar em **Exercícios de mãos**.
2. Escolher um exercício, a dificuldade e a mão. Na Trilha, também escolher o caminho.
3. Observar a demonstração (cinco segundos), fazer o **ensaio** e depois tocar **Começar exercício**. O ensaio não é gravado.
4. **Trilha:** começar no círculo 1, seguir a faixa e soltar no círculo 2. No oito, voltar ao círculo 1. São três traços. Há alternativa por setas/botões.
5. **Alvos:** tocar nos dez círculos, um de cada vez. **Sequência:** observar a ordem, tocar **Memorizei. Vou repetir** e repetir em três rodadas.
6. **Gestos:** tocar a foto; rolar a lista até alinhar Conversa com Ana à faixa; ampliar o mapa com dois dedos; girar a foto; segurar e soltar. Botões de apoio oferecem alternativa ao gesto e são identificados no registro.
7. Conferir o resultado e **Últimas práticas de mãos**. Testar a pausa e a reabertura offline. O JSON das configurações inclui práticas e pontos; o CSV continua dos registros no teclado nativo.
8. Relatar conforto, clareza da demonstração e qualquer dificuldade com os dois dedos. Essa validação encerra a F3 e libera a F4.

O aplicativo registra a mão solicitada; não detecta qual mão foi usada. A precisão descreve esta atividade. A figura é um mapa/foto de treino local, sem câmera ou localização. Se o aplicativo for fechado antes do fim, os movimentos já gravados permanecem, mas a prática não é marcada como concluída.

# Destreza

*Devagar, o gesto aprende.*

PWA em português brasileiro para praticar digitação no celular. Piloto local, sem conta ou backend. A especificação está em [Destreza — Especificação do Piloto.md](<Destreza — Especificação do Piloto.md>).

Versão publicada: https://steixeiradecarvalho.github.io/Destreza/.

As **F0 e F1** foram validadas por Sergio no celular. A versão **F2 (0.3.0)** acrescenta níveis 7–12, teclado nativo, referência de dois minutos e exportação JSON/CSV. Consulte [PLANO.md](PLANO.md) e [DECISOES.md](DECISOES.md).

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

Preferências, versão do aceite, calibração, sessões, tentativas, toques e resultados nativos ficam no IndexedDB local. A migração da F0 preserva as preferências. Sem analytics, fontes externas ou envio de conteúdo pessoal. Arquivos do app são servidos pelo GitHub Pages. Limpar os dados do navegador pode apagar as preferências e o histórico futuro. O app não faz alegações médicas.

## Teste da F1 no celular

1. Abrir com internet e, se aparecer, tocar em **Atualizar agora**. Confirmar que existe **Treino de hoje**.
2. Em **Ajustar meu conforto**, escolher tamanho das teclas (100–160%) e marca do toque. Som e vibração são opcionais.
3. Tocar em **Treino de hoje → Começar a lição**; fazer os cinco toques de calibração e começar a lição.
4. Usar **Mais à esquerda**, **Mais à direita** e **Mostrar a tecla** para encontrar as letras. O espaço fica sempre visível. O treino também aceita teclado físico.
5. Concluir aquecimento, prática e desafio. Conferir **Lição e toques salvos neste aparelho**, voltar ao início e verificar **Últimas lições**.
6. Fechar, ativar modo avião e reabrir. O histórico deve continuar disponível.
7. Relatar se o teclado ficou confortável e se a navegação lateral dificultou encontrar letras. Essa validação encerra o portão da F1; a F2 ainda não foi iniciada.

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

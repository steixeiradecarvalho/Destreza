# Destreza

*Devagar, o gesto aprende.*

PWA em português brasileiro para praticar digitação no celular. Piloto local, sem conta ou backend. A especificação está em [Destreza — Especificação do Piloto.md](<Destreza — Especificação do Piloto.md>).

Versão publicada: https://steixeiradecarvalho.github.io/Destreza/.

Esta versão é a **F0**, com preparação do espaço, preferências e infraestrutura PWA. As lições ainda não estão implementadas. Consulte [PLANO.md](PLANO.md) e [DECISOES.md](DECISOES.md).

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

Na F0, apenas preferências e versão do aceite são guardadas no IndexedDB. Sem analytics, fontes externas ou envio de conteúdo pessoal. Arquivos do app são servidos pelo GitHub Pages. Limpar os dados do navegador pode apagar as preferências e o histórico futuro. O app não faz alegações médicas.

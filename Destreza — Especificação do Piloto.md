# **Destreza — Especificação do Piloto**

Nov 3, 2026 · @Sergio Teixeira

## **1\. Visão, propósito e hipóteses**

**Destreza** (nome de trabalho) é um app web instalável (PWA), em português do Brasil, que ensina a digitar no celular e, a partir da digitação, treina o gesto fino das mãos. O piloto roda inteiro no aparelho, sem conta e sem servidor, e serve a um primeiro usuário real: pessoas com mais de 60 anos que não cresceram com o celular.

*Devagar, o gesto aprende.*

O piloto é amplo em funcionalidades de propósito: dois módulos, adaptação automática, painel de evolução e diário. Ele existe para provar três hipóteses, e todo o resto serve a elas.

| Hipótese | Como se mede no piloto | Meta |
| :---- | :---- | :---- |
| H1. O treino melhora a digitação real | Teste de referência de 2 minutos no teclado nativo, dia 1 versus dia 28 | Menos 30% de erros por 100 toques; mais 25% de palavras por minuto |
| H2. Pessoas 60+ mantêm o hábito | Sessões concluídas por semana, 4 semanas | Pelo menos 4 sessões por semana para 60% dos usuários |
| H3. Os exercícios são prazerosos | Nota de 1 a 5 ao fim de cada sessão | Média de 4 ou mais |

**Fora do escopo do piloto:** contas, nuvem, pagamentos, versão para lojas de aplicativos, qualquer alegação médica. O app promete autonomia digital e o prazer de dominar um gesto. O efeito sobre a cognição é uma hipótese a ser medida, não uma promessa.

## **2\. Princípios de design para mãos e mentes maduras**

O app falha se o idoso errar por culpa da interface. Estes princípios valem como regras de revisão: qualquer tela que os violar volta para correção.

| Princípio | Regra concreta |
| :---- | :---- |
| Alvos generosos | Área de toque mínima de 48 px (cerca de 9 mm); botões principais com 64 px ou mais, espaçados |
| Texto legível | Corpo a partir de 20 px, títulos a partir de 28 px, escala ajustável até 200% |
| Contraste alto | Razão mínima de 7:1 no tema padrão; tema de alto contraste incluído |
| Sem gestos escondidos | Nada depende de deslizar, de toque longo ou de toque duplo para navegar; só os exercícios pedem gestos, e ensinam cada um antes |
| Tolerância a tremor | Ignorar toques repetidos em menos de 150 ms no mesmo ponto; confirmar ação só ao soltar o dedo; ação destrutiva sempre com desfazer |
| Erro sem castigo | Errar nunca emite som áspero, nem cor vermelha agressiva, nem perda de pontos; o app registra o erro e segue |
| Um objetivo por tela | Uma pergunta, uma ação principal, um botão grande |
| Feedback triplo | Visual, sonoro e tátil (vibração onde o aparelho permite), cada um com chave própria nas configurações |
| Sessões curtas | Dia típico de 10 a 12 minutos; sugestão de pausa após 15 |
| Dignidade | Tom adulto e caloroso. Sem infantilizar, sem gamificação de cassino, sem relógios que pressionam |

**Usuário-guia:** o primeiro usuário é o próprio autor (66 anos). Cada fase termina com ele testando no seu celular, antes de qualquer outra pessoa.

## **3\. Arquitetura técnica**

Um PWA que funciona offline, hospedado como site estático com HTTPS, instalável na tela inicial do celular. Sem backend no piloto: tudo fica no aparelho.

| Camada | Escolha | Motivo |
| :---- | :---- | :---- |
| Linguagem | TypeScript | O agente de programação erra menos com tipos |
| Interface | Preact \+ Vite | Leve, rápido em celulares modestos |
| Estilo | CSS puro com variáveis (tokens de tema) | Troca de tema e escala de texto simples |
| Dados locais | IndexedDB via Dexie | Volume pequeno, consulta fácil, exportável |
| Offline e instalação | Service Worker e manifesto (vite-plugin-pwa) | Abre sem internet |
| Toques e traços | Pointer Events e Canvas 2D | Captura posição, pressão e tempo de cada toque |
| Som | Web Audio API, sons sintetizados | Sem arquivos de áudio nem direitos autorais |
| Vibração | Vibration API | Existe no Android, não no iPhone: degradar sem erro |
| Testes | Vitest (lógica) e Playwright (telas em 360 por 640 px) | Cobre o motor de adaptação e os fluxos |
| Hospedagem | Cloudflare Pages, Netlify ou GitHub Pages | Gratuito e com HTTPS, requisito de PWA |

**Decisão central: dois teclados.** O módulo de digitação usa (a) um *teclado de treino* desenhado dentro do app, instrumentado e com tamanho ajustável, e (b) o *teclado real* do sistema, num campo de texto comum, onde só se mede o resultado. O primeiro ensina com precisão; o segundo prova que o aprendizado chegou ao mundo real. Sem o segundo, a hipótese H1 não se mede.

destreza/  
  AGENTS.md              regras do projeto para o agente  
  src/  
    core/                motor de adaptação, métricas, agenda  
    data/                esquema Dexie, exportação  
    content/             palavras, frases, mensagens, lições (JSON)  
    modules/  
      teclado/           teclado de treino, teclado real, lições  
      maos/              exercícios psicomotores  
    ui/                  componentes, temas, textos do app  
    sw/                  service worker  
  tests/  
**Tabelas locais:** perfil (mão dominante, como segura o aparelho, tamanho de texto), sessoes, tentativas (uma por lição ou exercício), toques (um por toque: alvo, ponto atingido, tempo, duração, erro), teclas (estado de domínio por tecla), diario, config.

## **4\. Módulo Teclado: o curso de datilografia do celular**

O currículo tem 12 níveis, do reconhecimento das teclas à mensagem real. Cada nível se abre quando o anterior atinge 85% de precisão em três tentativas, mas o usuário pode revisitar qualquer um.

| Nível | Conteúdo | Habilidade treinada |
| :---- | :---- | :---- |
| 1 | Mapa do teclado: achar e tocar a letra pedida | Reconhecer o layout |
| 2 | Vogais e espaço | Ritmo básico |
| 3 | As 10 letras mais frequentes do português (a e o s r i n d m t) | Pontaria nas teclas de uso diário |
| 4 | Letras restantes, fileira por fileira | Cobertura do alfabeto |
| 5 | Pares frequentes (de, que, não, com, para) | Transição entre teclas |
| 6 | Palavras curtas e comuns | Fluência |
| 7 | Apagar e corrigir: perceber o erro e consertar | Autocorreção sem pânico |
| 8 | Acentos e cedilha (á, é, ã, ç): toque longo na letra base | O gesto mais difícil do teclado em português |
| 9 | Maiúsculas, números, pontuação | Trocar de camada do teclado |
| 10 | Barra de sugestões: aceitar a palavra prevista | Digitar menos |
| 11 | Frases completas | Resistência e continuidade |
| 12 | Mensagens reais: responder, cumprimentar, combinar horário | Transferência para a vida |

**Modos de mão.** Na primeira abertura o usuário diz como segura o aparelho: uma mão com o polegar, uma mão com o indicador da outra, duas mãos. O treino respeita o modo e o teclado de treino se adapta (por exemplo, teclado deslocado para o lado da mão dominante). O app nunca empurra o usuário para o estilo dos jovens; ele refina o estilo que a pessoa tem.

**Teclado de treino.** Layout QWERTY do português brasileiro, tamanho ajustável de 100% a 160%, teclas com realce suave de pouso, e um modo "fantasma" que mostra onde o dedo tocou em relação ao centro da tecla. Acentos entram por toque longo, como no teclado real.

**Teclado real.** Campo de texto do sistema com frase-modelo acima. Mede-se tempo total, caracteres corretos e erros finais. O teste de referência de 2 minutos (frases fixas) roda aqui no dia 1 e a cada 7 dias.

**Estrutura de uma lição (cerca de 6 minutos).**

1. Aquecimento de 1 minuto: 10 toques fáceis do nível anterior.  
2. Núcleo de 4 minutos: material novo, com mais peso nas teclas teimosas.  
3. Desafio de 1 minuto: uma frase curta sem pressão de tempo.  
4. Fecho: uma linha de resultado e uma de incentivo.

**Conteúdo.** Cerca de 300 palavras por frequência de uso, 120 frases e 40 mensagens de WhatsApp, em JSON versionado. Todo texto deve ser original ou de domínio público (provérbios, Machado de Assis); nada de trechos protegidos.

## **5\. Módulo Mãos: movimento dirigido e destreza mental**

Nove exercícios curtos de 1 a 3 minutos. Cada um junta um gesto das mãos a uma demanda mental (atenção, memória, regra, ritmo). Todos usam o mesmo contrato: parâmetros de dificuldade ajustáveis, métricas registradas por toque, sem castigo por erro.

| \# | Exercício | O que o usuário faz | Gesto | Demanda mental | Parâmetros de dificuldade |
| :---- | :---- | :---- | :---- | :---- | :---- |
| 1 | Trilha | Traça com o dedo um caminho (reta, onda, espiral, oito) sem sair da faixa | Traço contínuo | Controle fino e constância | Largura da faixa, curvatura, comprimento |
| 2 | Alvos | Toca círculos que surgem um de cada vez | Toque preciso | Atenção e tempo de reação | Tamanho do alvo, distância, intervalo |
| 3 | Sequência | Repete a ordem em que as peças acenderam | Toques em ordem | Memória de trabalho | Tamanho da sequência, velocidade |
| 4 | Dedilhado | Cinco zonas na tela; toca com o dedo indicado na ordem mostrada | Toque multitoque | Independência dos dedos | Número de zonas, ritmo |
| 5 | Ritmo a duas mãos | Aparelho apoiado na mesa; toca esquerda e direita alternando com o pulso mostrado | Bimanual | Ritmo e coordenação entre mãos | Andamento, padrão |
| 6 | Arrastar e classificar | Arrasta cartões para o grupo certo (frutas, ferramentas, cidades) e depois muda a regra | Arrastar | Categorização e troca de regra | Quantidade, tempo para a troca |
| 7 | Palavra no traço | Liga letras com um traço contínuo para formar a palavra pedida | Traço sobre o teclado | Preparo para a digitação por deslize | Tamanho da palavra, tamanho das teclas |
| 8 | Gestos do dia a dia | Toque, rolagem, pinça para ampliar, giro, toque longo, cada um num cenário real (foto, mapa, lista) | Gestos do sistema | Autonomia no aparelho | Precisão tolerada |
| 9 | Cópia de padrão | Observa um padrão de pontos e o reproduz de memória | Toques e traços | Memória visuoespacial | Pontos, tempo de exibição |

**Regras comuns.** Cada exercício abre com uma demonstração animada de 5 segundos e uma tentativa de ensaio sem registro. Cada exercício tem versão para mão dominante, mão não dominante e as duas, porque treinar a mão menos usada é parte da proposta. O exercício 5 só aparece se o usuário apoiar o aparelho; a tela pergunta antes.

**Extensibilidade.** Cada exercício é um módulo que implementa a mesma interface (preparar, rodar, medir, parametros). Novos exercícios entram sem tocar no motor de adaptação. É isso que torna o piloto o início de um sistema, e não um app isolado.

## **6\. Motor de adaptação e sessão diária**

O app mantém cada exercício num ponto de dificuldade em que o usuário acerta cerca de 80%: difícil o bastante para ensinar, fácil o bastante para animar.

**Regra de ajuste.** A cada bloco de 10 tentativas: precisão de 90% ou mais sobe um degrau de dificuldade; abaixo de 70% desce um degrau; entre os dois, fica. Um degrau muda um só parâmetro por vez (tamanho do alvo, ou ritmo, ou comprimento). Dois dias seguidos de queda sugerem um dia leve em vez de insistir.

**Domínio por tecla.** Cada tecla e cada par de teclas tem um estado: nova, em treino, dominada. O estado depende de precisão, desvio médio de pontaria e tempo de pouso nas últimas 30 ocorrências. Teclas teimosas voltam com mais frequência, em intervalos crescentes (repetição espaçada simples: 1, 2, 4, 8 dias).

**Sessão diária de 10 a 12 minutos.**

1. Aquecimento (1 minuto): um exercício de traço leve, o exercício 1 ou 2\.  
2. Teclado (6 minutos): a próxima lição, ou revisão se o dia pedir.  
3. Mãos (3 minutos): um exercício cognitivo-motor, alternando mão dominante e outra.  
4. Fecho (1 minuto): resultado do dia, nota de 1 a 5 e uma linha opcional no diário.

**Variedade semanal.** O exercício das Mãos gira em ciclo de três dias (A, B, C) para que nenhum canse. Ao fim de cada semana, a sessão inclui o teste de referência de 2 minutos no teclado real.

**Respeito ao corpo.** Após 15 minutos de uso contínuo o app sugere pausa com alongamento de punhos e dedos, em texto e figura simples. Se o usuário marcar "dor" no fecho, o app propõe um dia de descanso e não insiste.

**Lembrete.** Opcional, por notificação local onde o sistema permitir; onde não, uma tela inicial que mostra "o treino de hoje te espera" sem contador de dias perdidos.

## **7\. Interface, acessibilidade e voz do app**

**Telas do piloto.**

| Tela | Função |
| :---- | :---- |
| Boas-vindas e calibração | Escolha de tamanho de texto, mão dominante, como segura o aparelho; cinco toques em círculos para medir alcance do polegar e tremor de base |
| Início | Um botão grande, "Treino de hoje"; abaixo, "Escolher outro exercício" e "Minha evolução" |
| Sessão | Conduz aquecimento, teclado, mãos e fecho, com barra de progresso simples |
| Lição e exercício | Uma tarefa por tela, com demonstração e ensaio |
| Resultado | Uma frase sobre o que melhorou e uma sobre o que vem a seguir |
| Biblioteca | Todos os níveis e exercícios, livres, para quem quer treinar fora do plano |
| Evolução | Painel (seção 8\) |
| Diário | Notas e notas de 1 a 5 por sessão |
| Configurações | Tamanho de texto e de teclado, tema, som, vibração, duração da sessão, exportar e apagar dados |
| Sobre | O que o app é e não é; aviso de que não substitui orientação médica |

**Acessibilidade obrigatória.**

* Texto de 20 a 40 px por escala, sem quebra de layout.  
* Temas claro, escuro e de alto contraste, com contraste de 7:1 ou mais no padrão.  
* Respeito a prefers-reduced-motion: sem animações quando o sistema pedir.  
* Rótulos para leitores de tela (TalkBack e VoiceOver) em todos os controles.  
* Nunca usar só cor para indicar acerto ou erro: usar também forma e texto.  
* Navegação por teclado físico, para quem usa tablet com teclado.

**Voz do app.** Frases curtas, adultas e calorosas. Poucas máximas, memoráveis, repetíveis. Exemplos para o agente seguir como modelo de tom:

* Abertura: "Bom dia, Sergio. Dez minutos, e o gesto fica mais seu."  
* Acerto: "Firme."  
* Erro: "Sem pressa. A mão aprende errando."  
* Fecho: "Hoje a precisão subiu. Amanhã, o ritmo."  
* Pausa: "Solte os ombros. Abra e feche as mãos."

Todo texto do app fica num arquivo único de textos (ui/textos.ts), para ser revisado e traduzido de uma vez.

## **8\. Métricas, painel de evolução e diário**

O app registra cada toque e resume em poucas medidas que o usuário entende.

| Métrica | Definição | Onde aparece |
| :---- | :---- | :---- |
| Precisão | Toques corretos sobre toques totais, em % | Resultado, painel |
| Erros por 100 toques | Toques fora do alvo ou na tecla errada | Painel, teste de referência |
| Palavras por minuto | Caracteres corretos divididos por 5, por minuto | Teste de referência |
| Pontaria | Distância média do toque ao centro da tecla, em mm | Mapa de calor |
| Ritmo | Média e variação do intervalo entre toques | Painel |
| Reação | Tempo entre o aparecimento do alvo e o toque | Exercícios 2 e 3 |
| Firmeza do traço | Desvio do caminho e tremor (variação em alta frequência) | Exercícios 1 e 7 |
| Correções | Proporção de toques em apagar | Painel |
| Dias praticados | Dias com sessão concluída, por semana | Início, painel |

**Painel "Minha evolução".** Quatro blocos, todos com linguagem simples:

1. **Linha da semana:** precisão e erros por 100 toques ao longo das semanas.  
2. **Mapa do teclado:** cada tecla colorida pelo domínio, com o desvio de pontaria; mostra as "teclas de ouro" (as melhores) e as "teimosas".  
3. **Teste de referência:** a série semanal de palavras por minuto e erros no teclado real, a prova de transferência.  
4. **Hábito:** dias praticados na semana, sem sequência a manter e sem aviso de dias perdidos.

**Diário.** Opcional. Ao fim da sessão: uma nota de 1 a 5 (rostos) e uma linha livre, por texto ou ditado do sistema. O painel cruza as notas com os resultados: "Nos dias em que você dorme bem, a mão firma" só aparece se o usuário registrar sono, e nunca como conclusão, só como pergunta.

**Exportar.** Botão que gera um arquivo CSV e outro JSON com todas as sessões, para o usuário, um familiar ou um profissional de saúde analisar.

## **9\. Dados, privacidade e ética**

Os dados de desempenho motor e de humor são sensíveis, e o público é vulnerável. O piloto adota o mínimo possível de coleta.

* **Tudo local.** Nenhum dado sai do aparelho. Sem conta, sem servidor, sem análise de uso de terceiros, sem anúncios.  
* **Controle do usuário.** Exportar tudo e apagar tudo, cada um num botão com confirmação clara.  
* **Sem sensores além do toque.** O app não usa câmera, microfone (salvo o ditado do próprio sistema, por escolha do usuário), localização ou contatos.  
* **LGPD desde o início.** Texto de consentimento em linguagem simples na primeira abertura, dizendo o que é guardado, onde e como apagar.  
* **Sem alegação médica.** O app não diagnostica nem trata. A tela Sobre diz que o treino é prática de habilidade, e que tremor persistente, dor ou perda súbita de destreza merecem consulta com profissional de saúde.  
* **Evolução futura.** Sincronização, compartilhamento com familiares ou com profissionais só entra depois do piloto, com consentimento explícito e por escolha de quem usa.

As hipóteses de benefício cognitivo (seção 1\) só serão afirmadas depois de medidas em grupo, com acompanhamento adequado. Até lá, a linguagem do app permanece a de habilidade e de bem-estar.

## **10\. Plano de construção e prompt-mestre para o agente**

O piloto é construído em sete fases, cada uma terminando num site publicado que o usuário-guia testa no próprio celular. Uma fase só começa quando a anterior passa no seu portão.

| Fase | Entrega | Portão para seguir |
| :---- | :---- | :---- |
| F0. Base | Projeto, PWA instalável e offline, temas, escala de texto, banco local, AGENTS.md | Instala na tela inicial e abre sem internet |
| F1. Teclado de treino | Níveis 1 a 6, registro de cada toque, resultado da lição | Uma lição completa, com dados gravados |
| F2. Teclado real e teste de referência | Campo nativo, teste de 2 minutos, níveis 7 a 12 | Teste de referência repetível e exportável |
| F3. Mãos, primeira leva | Exercícios 1, 2, 3 e 8, com demonstração e ensaio | Cada exercício com 3 degraus de dificuldade |
| F4. Adaptação e sessão diária | Motor de ajuste, domínio por tecla, sessão de 10 a 12 minutos, pausas | Sessão diária completa sem intervenção manual |
| F5. Painel, diário e exportação | Seção 8 inteira; exercícios 4, 5, 6, 7 e 9 | Painel com dados de 7 dias simulados |
| F6. Polimento e teste com pessoas | Acessibilidade, textos, correções; teste com 5 pessoas de 60 anos ou mais | Nenhum bloqueio grave nos testes |

**Ordem de corte.** Se o tempo apertar, a fase F2 é o piso do piloto: sem teclado real não há como medir H1. Cortar nesta ordem: exercício 5, exercício 9, exercício 4, diário, exercício 6\.

**Como delegar.** Crie um repositório vazio, ponha este documento na raiz como ESPECIFICACAO.md e entregue o prompt abaixo ao agente (Claude Code, Qwen Code ou outro que leia arquivos e rode comandos). Peça uma fase por vez e teste cada uma no celular antes de liberar a seguinte.

Você é o desenvolvedor do app Destreza. Leia ESPECIFICACAO.md por inteiro.

Regras:  
1\. Trabalhe uma fase por vez, na ordem da seção 10\. Não comece a próxima sem o portão da atual passar.  
2\. Crie AGENTS.md com as decisões fixas (pilha, estrutura de pastas, princípios da seção 2, voz da seção 7\) e mantenha-o atualizado.  
3\. Escreva testes (Vitest) para o motor de adaptação e as métricas; escreva testes Playwright para os fluxos principais em 360x640.  
4\. Todo texto de interface vai em ui/textos.ts, em português do Brasil.  
5\. Nenhum dado sai do aparelho. Nenhuma dependência de rastreamento.  
6\. Ao fim de cada fase: rode os testes, publique o site, e me diga em 5 linhas o que ficou pronto, o que ficou de fora e como testar no celular.  
7\. Se a especificação for ambígua, escolha a opção mais simples, registre a escolha em DECISOES.md e siga; pergunte só se a dúvida impedir a fase.

Comece pela fase F0.  
**Publicação.** Peça ao agente que configure a implantação automática a cada commit na Cloudflare Pages, Netlify ou GitHub Pages. Assim o celular do usuário sempre abre a versão mais recente pelo mesmo endereço.

## **11\. Critérios de aceite, testes e riscos**

**O piloto está aceito quando:**

* Instala na tela inicial de um Android de gama média e de um iPhone, e abre sem internet em menos de 2 segundos.  
* Uma pessoa de 60 anos ou mais completa a primeira sessão sozinha, sem ajuda, em menos de 15 minutos, incluindo a calibração.  
* Todos os níveis e exercícios da seção 4 e 5 funcionam e registram dados.  
* O teste de referência de 2 minutos roda e se repete com as mesmas frases.  
* O painel mostra as quatro visões da seção 8 com dados reais.  
* Exportar e apagar dados funcionam e são confirmados na tela.  
* Todos os requisitos de acessibilidade da seção 7 passam numa revisão manual com TalkBack ou VoiceOver.  
* Testes automatizados passam, e a lógica do motor de adaptação e das métricas tem cobertura de testes unitários.

**Roteiro de teste com pessoas.** Cinco pessoas de 60 anos ou mais, quatro semanas, o aparelho delas. Registrar: sessões por semana (H2), nota média (H3), teste de referência no dia 1 e no dia 28 (H1), e dúvidas que surgiram sem ajuda. Uma conversa curta no fim de cada semana.

| Risco | Efeito | Resposta |
| :---- | :---- | :---- |
| Aprender só no teclado do app e não no real | H1 falha | Teste de referência no teclado nativo; nível 12 com campo real |
| iPhone sem vibração e com limites de notificação | Feedback e lembrete mais pobres | Degradar para som e visual; lembrete opcional |
| Estimativa de pontaria em mm varia por aparelho | Números pouco comparáveis | Calibrar pela densidade de pixels e comparar o usuário só consigo mesmo |
| Exercícios cansam | Abandono | Rodízio A, B, C; sessão curta; versão livre na Biblioteca |
| Crescimento de escopo | Piloto não termina | Ordem de corte da seção 10; F2 como piso; uma fase por vez |
| Benefício cognitivo afirmado sem prova | Risco ético e reputacional | Linguagem de habilidade; medição em grupo antes de qualquer alegação |
| Conteúdo de treino com direitos autorais | Problema jurídico | Textos originais ou de domínio público, conferidos por revisão |

**Próximo passo.** Quando decidir avançar, comece pela F0 e pelo primeiro teste no seu celular: o piloto nasce do seu gesto.
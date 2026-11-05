import { expect, test, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
async function setup(page: Page) {
  await page.goto("./");
  await page
    .getByRole("button", { name: "Entendi e quero preparar meu espaço" })
    .click();
  await page.getByRole("button", { name: "Salvar e continuar" }).click();
}
async function records(page: Page) {
  return page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve) => {
      const r = indexedDB.open("destreza");
      r.onsuccess = () => resolve(r.result);
    });
    const result = await Promise.all(
      ["exercicios", "movimentos"].map(
        (table) =>
          new Promise<any[]>((resolve) => {
            const r = db.transaction(table).objectStore(table).getAll();
            r.onsuccess = () => resolve(r.result);
          }),
      ),
    );
    db.close();
    result[1].sort((a, b) => a.at - b.at);
    return result;
  });
}
async function trial(page: Page, index: number) {
  await setup(page);
  await page
    .getByRole("button", { name: "Exercícios de mãos", exact: true })
    .click();
  await page
    .locator(".motor-library>li")
    .nth(index)
    .getByRole("button", { name: "Escolher", exact: true })
    .click();
  if (index === 5) {
    await expect(
      page.getByRole("button", { name: "Ver demonstração", exact: true }),
    ).toBeDisabled();
    await page.getByLabel("O celular está apoiado na mesa").check();
  }
  await page.clock.install();
  await page
    .getByRole("button", { name: "Ver demonstração", exact: true })
    .click();
  await page.clock.fastForward(2500);
  await page.screenshot({
    path: `test-results/f5-demonstracao-${index}.png`,
    fullPage: true,
  });
  await page.clock.fastForward(2501);
  await page.getByRole("button", { name: "Fazer ensaio", exact: true }).click();
  await page.screenshot({
    path: `test-results/f5-exercicio-${index}.png`,
    fullPage: true,
  });
}
async function enter(page: Page, name: string) {
  const b = page.getByRole("button", { name, exact: true });
  await expect(b).toBeEnabled();
  await b.press("Enter");
}
async function practice(page: Page) {
  await expect(
    page.getByRole("heading", { name: "Ensaio feito." }),
  ).toBeVisible();
  expect(await records(page)).toEqual([[], []]);
  await enter(page, "Começar exercício");
}
async function result(page: Page, count: number, exercise: string) {
  await expect(
    page.getByRole("heading", { name: "Mais um gesto praticado." }),
  ).toBeVisible();
  const [runs, moves] = await records(page);
  expect(runs).toHaveLength(1);
  expect(moves).toHaveLength(count);
  expect(runs[0]).toMatchObject({
    exercise,
    status: "completed",
    summary: { accuracy: 100 },
  });
  return moves;
}
test("dedilhado confirma ao soltar e separa pontos reais das alternativas", async ({
  page,
}) => {
  await trial(page, 4);
  for (const label of ["Polegar", "Indicador", "Médio"])
    await enter(page, label);
  await practice(page);
  const finger = page.getByRole("button", { name: "Polegar", exact: true });
  await finger.scrollIntoViewIfNeeded();
  const box = (await finger.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  expect((await records(page))[1]).toHaveLength(0);
  await page.mouse.up();
  await expect.poll(async () => (await records(page))[1].length).toBe(1);
  for (let i = 1; i < 10; i++)
    await enter(page, ["Polegar", "Indicador", "Médio"][i % 3]);
  const moves = await result(page, 10, "dedilhado");
  expect(
    moves
      .filter((m) => m.source === "accessible")
      .every((m) => m.points.length === 0),
  ).toBe(true);
  expect(moves.filter((m) => m.source === "pointer")[0].points).toHaveLength(2);
});
test("ritmo exige apoio e mede intervalos ao soltar", async ({ page }) => {
  await trial(page, 5);
  await enter(page, "Começar o pulso");
  for (let i = 0; i < 4; i++) {
    if (i) await page.clock.fastForward(1500);
    await enter(page, i % 2 ? "Direita" : "Esquerda");
  }
  await practice(page);
  await enter(page, "Começar o pulso");
  for (let i = 0; i < 12; i++) {
    if (i) await page.clock.fastForward(1500);
    await enter(page, i % 2 ? "Direita" : "Esquerda");
  }
  const moves = await result(page, 12, "ritmo");
  expect(moves[1].details.intervalMs).toBeGreaterThanOrEqual(1500);
  expect(moves[0].details.supported).toBe(true);
});
async function classify(
  page: Page,
  index: number,
  count: number,
  physical = false,
) {
  const rule = index >= count / 2 ? 1 : 0;
  const group =
    rule === 0 ? index % 3 : [0, 4, 5, 6, 9, 10, 11].includes(index) ? 0 : 1;
  const label =
    rule === 0
      ? ["Frutas", "Ferramentas", "Cidades"][group]
      : ["Começa com vogal", "Começa com consoante"][group];
  if (physical) {
    const card = page.locator(".drag-card"),
      target = page.getByRole("button", { name: label, exact: true });
    await target.scrollIntoViewIfNeeded();
    const a = (await card.boundingBox())!,
      b = (await target.boundingBox())!;
    await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
    await page.mouse.down();
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 10 });
    await page.mouse.up();
  } else {
    await enter(page, "Selecionar cartão");
    await enter(page, label);
  }
}
test("classificar troca regra e registra arrasto físico separado dos botões", async ({
  page,
}) => {
  await trial(page, 6);
  for (let i = 0; i < 4; i++) await classify(page, i, 4);
  await practice(page);
  for (let i = 0; i < 6; i++) {
    await classify(page, i, 6, i === 0);
    if (i < 5)
      await expect(page.locator(".drag-card")).not.toHaveText(
        ["Abacate", "Martelo", "Recife", "Banana", "Alicate", "Olinda"][i],
      );
  }
  const moves = await result(page, 6, "classificar");
  expect(
    moves.find((m) => m.source === "pointer")?.points.length,
  ).toBeGreaterThan(3);
  expect(moves.filter((m) => m.details.rule === 1)).toHaveLength(3);
});
async function word(page: Page, physical = false) {
  if (physical) {
    const area = page.locator(".word-trace-board");
    await area.scrollIntoViewIfNeeded();
    const a = (await area
        .getByRole("button", { name: "a", exact: true })
        .boundingBox())!,
      s = (await area
        .getByRole("button", { name: "s", exact: true })
        .boundingBox())!;
    await page.mouse.move(a.x + 24, a.y + 24);
    await page.mouse.down();
    await page.mouse.move(s.x + 24, s.y + 24, { steps: 12 });
    await page.mouse.move(a.x + 24, a.y + 24, { steps: 12 });
    await page.mouse.up();
  } else {
    await enter(page, "Formar palavra por botões");
    for (const letter of "asa")
      await page
        .locator(".word-trace-board")
        .getByRole("button", { name: letter, exact: true })
        .press("Enter");
    await enter(page, "Concluir palavra");
  }
}
test("palavra no traço mede o traço real e alternativas permanecem sem coordenadas", async ({
  page,
}) => {
  await trial(page, 7);
  await word(page);
  await practice(page);
  for (let i = 0; i < 3; i++) {
    await word(page, true);
    if (i < 2)
      await expect(
        page.getByText(`Rodada ${i + 2} / 3`, { exact: false }),
      ).toBeVisible();
  }
  const moves = await result(page, 3, "palavra");
  expect(
    moves.every((m) => m.source === "pointer" && m.points.length > 10),
  ).toBe(true);
});
async function pattern(page: Page, physical = false) {
  const text = (await page
    .getByText("Observe o caminho:", { exact: false })
    .textContent())!;
  const pattern = text.match(/[1-9]/g)!;
  await enter(page, "Esconder e reproduzir");
  for (let i = 0; i < pattern.length; i++) {
    const button = page.getByRole("button", {
      name: `Ponto ${pattern[i]}`,
      exact: true,
    });
    if (physical) await button.click();
    else await button.press("Enter");
  }
  await enter(page, "Conferir padrão");
}
test("padrão oculta modelo, aceita toques e preserva a origem", async ({
  page,
}) => {
  await trial(page, 8);
  await pattern(page);
  await practice(page);
  for (let i = 0; i < 3; i++) {
    await pattern(page, true);
    if (i < 2)
      await expect(
        page.getByText(`Rodada ${i + 2} / 3`, { exact: false }),
      ).toBeVisible();
  }
  const moves = await result(page, 3, "padrao");
  expect(
    moves.every((m) => m.source === "pointer" && m.points.length === 6),
  ).toBe(true);
});
test("sete dias simulados: quatro visões, diário, CSV completo e leitura offline a 200%", async ({
  page,
  context,
}) => {
  await setup(page);
  await expect(page.locator(".status")).toContainText(
    "Pronto para abrir sem internet",
  );
  await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve) => {
      const r = indexedDB.open("destreza");
      r.onsuccess = () => resolve(r.result);
    });
    const tx = db.transaction(
      ["config", "sessoes", "toques", "referencias", "diario", "teclas"],
      "readwrite",
    );
    const now = new Date();
    now.setHours(12, 0, 0, 0);
    for (let i = 0; i < 7; i++) {
      const at = new Date(now);
      at.setDate(at.getDate() - i);
      const day = `${at.getFullYear()}-${String(at.getMonth() + 1).padStart(2, "0")}-${String(at.getDate()).padStart(2, "0")}`;
      tx.objectStore("sessoes").put({
        id: `s${i}`,
        startedAt: +at,
        completedAt: +at,
        status: "completed",
        level: 1,
        free: false,
      });
      tx.objectStore("toques").put({
        id: `t${i}`,
        sessionId: `s${i}`,
        attemptId: `s${i}`,
        at: +at,
        elapsedMs: 100,
        durationMs: 80,
        source: "pointer",
        expected: "a",
        actual: "a",
        correct: true,
        dx: 0,
        dy: 0,
        targetWidth: 48,
        targetHeight: 48,
      });
      tx.objectStore("diario").put({
        id: `d${i}`,
        dailyId: `daily${i}`,
        at: +at,
        day,
        rating: 4,
        pain: false,
        note: i === 0 ? '=1+1\n"Nota local"' : `Dia ${i}`,
      });
    }
    tx.objectStore("teclas").put({
      id: "key-pointer-a",
      kind: "key",
      key: "a",
      source: "pointer",
      state: "training",
      accuracy: 90,
      meanOffset: 0.2,
      observations: [],
      dueAt: 0,
    });
    tx.objectStore("referencias").put({
      id: "r1",
      kind: "reference",
      status: "completed",
      entered: 10,
      startedAt: +now,
      durationMs: 120000,
      studyDay: 1,
      protocolVersion: 1,
      wpm: 1,
      errorsPer100Characters: 0,
      model: "bom dia",
      value: "bom dia",
    });
    const r = tx.objectStore("config").get("local");
    r.onsuccess = () =>
      tx.objectStore("config").put({ ...r.result, scale: 200 });
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  });
  await page.reload();
  await page
    .getByRole("button", { name: "Minha evolução", exact: true })
    .click();
  for (const title of [
    "Linha da semana",
    "Mapa do teclado",
    "Teste de referência",
    "Dias de prática",
    "Meu diário",
  ])
    await expect(
      page.getByRole("heading", { name: title, exact: true }),
    ).toBeVisible();
  await expect(page.locator(".diary-note")).toHaveCount(7);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/f5-evolucao-200.png",
    fullPage: true,
  });
  await page.evaluate(() =>
    document.documentElement.style.setProperty("--text-scale", "1"),
  );
  await page.screenshot({
    path: "test-results/f5-evolucao.png",
    fullPage: true,
  });
  await page
    .locator(".skill-map")
    .screenshot({ path: "test-results/f5-mapa.png" });
  await enter(page, "Voltar ao início");
  await enter(page, "Ajustar meu conforto");
  const ready = page.waitForEvent("download");
  await enter(page, "Exportar CSV");
  const csv = await readFile((await (await ready).path())!, "utf8");
  for (const collection of ["sessions", "taps", "native", "keySkills", "diary"])
    expect(csv).toContain(`"${collection}"`);
  expect(csv).toContain("'=1+1");
  await enter(page, "Salvar e continuar");
  await expect(page.locator(".status")).toContainText(
    "Pronto para abrir sem internet",
  );
  await context.setOffline(true);
  await page.reload();
  await enter(page, "Meu diário");
  await expect(page.locator(".diary-note")).toHaveCount(7);
});
test("exclusão só acontece na confirmação final, desfazer preserva registros", async ({
  page,
}) => {
  await setup(page);
  await enter(page, "Ajustar meu conforto");
  await enter(page, "Preparar exclusão");
  await expect(
    page.getByRole("button", { name: "Apagar definitivamente todos os dados" }),
  ).toBeDisabled();
  await enter(page, "Desfazer preparação");
  await enter(page, "Preparar exclusão");
  await page
    .getByLabel("Entendi que não poderei desfazer após a confirmação final")
    .check();
  await enter(page, "Apagar definitivamente todos os dados");
  await expect(
    page.getByRole("button", { name: "Entendi e quero preparar meu espaço" }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Entendi e quero preparar meu espaço" }),
  ).toBeVisible();
  expect(await records(page)).toEqual([[], []]);
});
test("novos exercícios a 200% e com movimento reduzido mantêm alvos e janela de teclado", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await setup(page);
  await enter(page, "Ajustar meu conforto");
  await page.getByLabel("Tamanho do texto").fill("200");
  await enter(page, "Salvar e continuar");
  await enter(page, "Exercícios de mãos");
  await page.clock.install();
  for (const index of [4, 5, 6, 7, 8]) {
    await page
      .locator(".motor-library>li")
      .nth(index)
      .getByRole("button", { name: "Escolher", exact: true })
      .click();
    await page.getByLabel("Mais desafiadora", { exact: true }).check();
    if (index === 5)
      await page.getByLabel("O celular está apoiado na mesa").check();
    await enter(page, "Ver demonstração");
    await page.clock.fastForward(5001);
    await enter(page, "Fazer ensaio");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    for (const b of await page
      .locator(".finger-zones button:visible,.trace-letter:visible")
      .all()) {
      const box = (await b.boundingBox())!;
      expect(box.width).toBeGreaterThanOrEqual(48);
      expect(box.height).toBeGreaterThanOrEqual(48);
    }
    await page.screenshot({
      path: `test-results/f5-exercicio-${index}-200.png`,
      fullPage: true,
    });
    await enter(page, "Fazer uma pausa");
    await enter(page, "Guardar e sair");
  }
  expect(await records(page)).toEqual([[], []]);
});

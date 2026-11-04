import { expect, test, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
async function setup(
  page: Page,
  index: number,
  difficulty = "Suave",
  hand = "Minha mão dominante",
) {
  await page.goto("./");
  await page
    .getByRole("button", { name: "Entendi e quero preparar meu espaço" })
    .click();
  await page.getByRole("button", { name: "Salvar e continuar" }).click();
  await page
    .getByRole("button", { name: "Exercícios de mãos", exact: true })
    .click();
  await page
    .locator(".motor-library>li")
    .nth(index)
    .getByRole("button", { name: "Escolher", exact: true })
    .click();
  await page.getByLabel(difficulty, { exact: true }).check();
  await page.getByLabel(hand, { exact: true }).check();
  await page.clock.install();
  await page
    .getByRole("button", { name: "Ver demonstração", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Fazer ensaio", exact: true }),
  ).toBeDisabled();
  await page.clock.fastForward(5001);
  await page.getByRole("button", { name: "Fazer ensaio", exact: true }).click();
}
async function records(page: Page) {
  return page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("destreza");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    return Promise.all(
      ["exercicios", "movimentos"].map(
        (table) =>
          new Promise<any[]>((resolve, reject) => {
            const request = db.transaction(table).objectStore(table).getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
          }),
      ),
    );
  });
}
async function target(page: Page) {
  const button = page.getByRole("button", {
    name: "Tocar no alvo",
    exact: true,
  });
  await expect(button).toBeEnabled();
  await button.click();
}
async function trace(page: Page) {
  const area = page.locator(".trace-board");
  await area.scrollIntoViewIfNeeded();
  const box = (await area.boundingBox())!;
  await page.mouse.move(box.x + box.width * 0.15, box.y + box.height * 0.5);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.85, box.y + box.height * 0.5, {
    steps: 30,
  });
  await page.mouse.up();
}
async function answerSequence(page: Page) {
  const text = (await page.locator(".sequence-pattern strong").textContent())!;
  const pattern = text.match(/[1-4]/g)!;
  await page.clock.fastForward(pattern.length * 1250 + 1);
  await page
    .getByRole("button", { name: "Memorizei. Vou repetir", exact: true })
    .click();
  for (let i = 0; i < pattern.length; i++) {
    const key = page.getByRole("button", {
      name: `Peça ${pattern[i]}`,
      exact: true,
    });
    await expect(key).toBeEnabled();
    await key.click();
    if (i + 1 < pattern.length)
      await expect(page.locator(".sequence-answer")).toContainText(
        `${i + 1} / ${pattern.length}`,
      );
  }
}
async function exportMotor(page: Page) {
  await page
    .getByRole("button", { name: "Voltar ao início", exact: true })
    .click();
  await page.getByRole("button", { name: "Ajustar meu conforto" }).click();
  const ready = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Exportar JSON", exact: true })
    .click();
  return JSON.parse(await readFile((await (await ready).path())!, "utf8"));
}
test("alvos: ensaio não grava, dificuldade e mão ficam no registro; histórico funciona offline", async ({
  page,
  context,
}) => {
  await setup(page, 1, "Mais desafiadora", "Minha outra mão");
  for (let i = 0; i < 3; i++) await target(page);
  await expect(
    page.getByRole("heading", { name: "Ensaio feito." }),
  ).toBeVisible();
  expect(await records(page)).toEqual([[], []]);
  await page
    .getByRole("button", { name: "Começar exercício", exact: true })
    .click();
  await page.evaluate(() => {
    const holder = window as typeof window & {
      motorPut?: typeof IDBObjectStore.prototype.put;
    };
    holder.motorPut = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (
      ...args: Parameters<IDBObjectStore["put"]>
    ) {
      if (this.name === "movimentos")
        throw new DOMException(
          "Teste de gravação interrompida",
          "QuotaExceededError",
        );
      return Reflect.apply(holder.motorPut!, this, args);
    };
  });
  await target(page);
  await expect(page.getByRole("alert")).toContainText(
    "Este movimento ainda não foi guardado.",
  );
  await page.evaluate(() => {
    const holder = window as typeof window & {
      motorPut?: typeof IDBObjectStore.prototype.put;
    };
    IDBObjectStore.prototype.put = holder.motorPut!;
  });
  await page
    .getByRole("button", { name: "Tentar novamente", exact: true })
    .click();
  await expect.poll(async () => (await records(page))[1].length).toBe(1);
  for (let i = 1; i < 10; i++) {
    const key = page.getByRole("button", {
      name: "Tocar no alvo",
      exact: true,
    });
    expect((await key.boundingBox())!.width).toBeGreaterThanOrEqual(48);
    await target(page);
  }
  await expect(
    page.getByRole("heading", { name: "Mais um gesto praticado." }),
  ).toBeVisible();
  const [runs, moves] = await records(page);
  expect(runs).toHaveLength(1);
  expect(moves).toHaveLength(10);
  expect(runs[0]).toMatchObject({
    exercise: "alvos",
    status: "completed",
    settings: { difficulty: 3, handMode: "other" },
    summary: { accuracy: 100 },
  });
  expect(
    moves.every(
      (item) =>
        item.requestedHand === "esquerda" &&
        item.source === "pointer" &&
        item.points.length === 2,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/maos-resultado.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Voltar aos exercícios", exact: true })
    .click();
  await expect(page.locator(".motor-history")).toContainText(
    "Alvos · Concluída",
  );
  const data = await exportMotor(page);
  expect(data.schemaVersion).toBe(4);
  expect(data.motorRuns).toHaveLength(1);
  expect(data.movements).toHaveLength(10);
  await page.getByRole("button", { name: "Salvar e continuar" }).click();
  await expect(
    page.getByRole("heading", { name: "Seu espaço está pronto." }),
  ).toBeVisible();
  await expect(page.locator(".status")).toContainText(
    "Pronto para abrir sem internet.",
  );
  await context.setOffline(true);
  await page.reload();
  await page
    .getByRole("button", { name: "Exercícios de mãos", exact: true })
    .click();
  await expect(page.locator(".motor-history")).toContainText(
    "Alvos · Concluída",
  );
});
test("trilha registra pontos e métricas por traço sem incluir o ensaio", async ({
  page,
}) => {
  await setup(page, 0);
  await trace(page);
  await expect(
    page.getByRole("heading", { name: "Ensaio feito." }),
  ).toBeVisible();
  expect(await records(page)).toEqual([[], []]);
  await page
    .getByRole("button", { name: "Começar exercício", exact: true })
    .click();
  await expect(page.locator(".trace-board")).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: "test-results/maos-trilha.png",
    fullPage: true,
  });
  for (let i = 0; i < 3; i++) {
    await expect(
      page.getByRole("button", { name: "Fazer uma pausa" }),
    ).toBeEnabled();
    await trace(page);
    if (i < 2)
      await expect(
        page.getByText(`Etapa ${i + 2} / 3`, { exact: false }),
      ).toBeVisible();
  }
  await expect(
    page.getByRole("heading", { name: "Mais um gesto praticado." }),
  ).toBeVisible();
  const [runs, events] = await records(page);
  expect(events).toHaveLength(3);
  expect(
    events.every(
      (item) =>
        item.kind === "trace" && item.points.length >= 25 && item.correct,
    ),
  ).toBe(true);
  expect(runs[0].summary.insidePercent).toBeGreaterThan(95);
});
test("sequência reproduz ordem em três rodadas e respeita pausa", async ({
  page,
}) => {
  await setup(page, 2, "Intermediária", "As duas mãos");
  await answerSequence(page);
  await expect(
    page.getByRole("heading", { name: "Ensaio feito." }),
  ).toBeVisible();
  expect(await records(page)).toEqual([[], []]);
  await page
    .getByRole("button", { name: "Começar exercício", exact: true })
    .click();
  await page.getByRole("button", { name: "Fazer uma pausa" }).click();
  await expect(
    page.getByRole("heading", { name: "Pode descansar as mãos." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Continuar exercício" }).click();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: "test-results/maos-sequencia.png",
    fullPage: true,
  });
  for (let i = 0; i < 3; i++) {
    await answerSequence(page);
    if (i < 2)
      await expect(
        page.getByText(`Rodada ${i + 2} / 3`, { exact: true }),
      ).toBeVisible();
  }
  await expect(
    page.getByRole("heading", { name: "Mais um gesto praticado." }),
  ).toBeVisible();
  const [runs, events] = await records(page);
  expect(events).toHaveLength(9);
  expect(runs[0].summary.accuracy).toBe(100);
  expect(new Set(events.map((item) => item.requestedHand))).toEqual(
    new Set(["direita", "esquerda"]),
  );
});
async function supportGestures(page: Page) {
  await page.getByText("Botões de apoio", { exact: true }).click();
  await page.getByRole("button", { name: "Abrir foto por botão" }).click();
  await page.getByRole("button", { name: "Descer lista" }).click();
  await page.getByRole("button", { name: "Descer lista" }).click();
  await page.getByRole("button", { name: "Conferir gesto" }).click();
  await page.getByText("Botões de apoio", { exact: true }).click();
  for (let i = 0; i < 5; i++)
    await page
      .getByRole("button", { name: "Ampliar mapa", exact: true })
      .click();
  await page.getByRole("button", { name: "Conferir gesto" }).click();
  await page.getByText("Botões de apoio", { exact: true }).click();
  for (let i = 0; i < 3; i++)
    await page
      .getByRole("button", { name: "Girar para a direita", exact: true })
      .click();
  await page.getByRole("button", { name: "Conferir gesto" }).click();
  await page.getByText("Botões de apoio", { exact: true }).click();
  await page.getByRole("button", { name: "Selecionar foto por botão" }).click();
}
test("gestos recebem dois toques para pinça e giro; alternativas não fabricam pontos", async ({
  page,
  context,
}) => {
  await setup(page, 3, "Suave", "As duas mãos");
  await supportGestures(page);
  await expect(
    page.getByRole("heading", { name: "Ensaio feito." }),
  ).toBeVisible();
  expect(await records(page)).toEqual([[], []]);
  await page
    .getByRole("button", { name: "Começar exercício", exact: true })
    .click();
  const cdp = await context.newCDPSession(page);
  const center = async () => {
    const b = page.locator(".gesture-board");
    await b.scrollIntoViewIfNeeded();
    const r = (await b.boundingBox())!;
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  };
  const touch = async (
    type: string,
    points: { x: number; y: number; id: number }[],
  ) =>
    cdp.send("Input.dispatchTouchEvent", {
      type: type as "touchStart" | "touchMove" | "touchEnd",
      touchPoints: points,
    });
  let p = await center();
  await page.touchscreen.tap(p.x, p.y);
  await expect(
    page.getByRole("heading", { name: "Rolagem", exact: true }),
  ).toBeVisible();
  const list = page.getByLabel("Lista para praticar rolagem", { exact: true });
  await list.hover();
  await page.mouse.wheel(0, 80);
  await expect
    .poll(() => list.evaluate((el) => el.scrollTop))
    .toBeGreaterThan(20);
  await page.getByRole("button", { name: "Conferir gesto" }).click();
  await expect(
    page.getByRole("heading", { name: "Ampliar", exact: true }),
  ).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: "test-results/maos-gestos.png",
    fullPage: true,
  });
  p = await center();
  await touch("touchStart", [
    { x: p.x - 30, y: p.y, id: 1 },
    { x: p.x + 30, y: p.y, id: 2 },
  ]);
  await touch("touchMove", [
    { x: p.x - 45, y: p.y, id: 1 },
    { x: p.x + 45, y: p.y, id: 2 },
  ]);
  await touch("touchEnd", []);
  await expect(
    page.getByRole("heading", { name: "Girar", exact: true }),
  ).toBeVisible();
  p = await center();
  await touch("touchStart", [
    { x: p.x - 30, y: p.y, id: 1 },
    { x: p.x + 30, y: p.y, id: 2 },
  ]);
  await touch("touchMove", [
    { x: p.x - 26, y: p.y - 15, id: 1 },
    { x: p.x + 26, y: p.y + 15, id: 2 },
  ]);
  await touch("touchEnd", []);
  await expect(
    page.getByRole("heading", { name: "Toque longo", exact: true }),
  ).toBeVisible();
  p = await center();
  await touch("touchStart", [{ x: p.x, y: p.y, id: 1 }]);
  await page.clock.runFor(600);
  await touch("touchEnd", []);
  await expect(
    page.getByRole("heading", { name: "Mais um gesto praticado." }),
  ).toBeVisible();
  const [runs, events] = await records(page);
  expect(events).toHaveLength(5);
  expect(runs[0].summary.accuracy).toBe(100);
  for (const gesture of ["pinch", "rotate"])
    expect(
      events.find((item) => item.details.gesture === gesture),
    ).toMatchObject({
      correct: true,
      source: "pointer",
      details: { twoPointers: true },
    });
});
test("demonstração sem animação e texto a 200%; pausa encerra sem conclusão falsa", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await setup(page, 1);
  for (let i = 0; i < 3; i++) await target(page);
  await page
    .getByRole("button", { name: "Começar exercício", exact: true })
    .click();
  await target(page);
  await page.getByRole("button", { name: "Fazer uma pausa" }).click();
  await page.getByRole("button", { name: "Guardar e sair" }).click();
  const [runs, events] = await records(page);
  expect(runs[0].status).toBe("interrupted");
  expect(events).toHaveLength(1);
  await page
    .getByRole("button", { name: "Voltar ao início", exact: true })
    .click();
  await page.getByRole("button", { name: "Ajustar meu conforto" }).click();
  await page.getByLabel("Tamanho do texto").fill("200");
  await page.getByRole("button", { name: "Salvar e continuar" }).click();
  await page
    .getByRole("button", { name: "Exercícios de mãos", exact: true })
    .click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: "test-results/maos-biblioteca-200.png",
    fullPage: true,
  });
});

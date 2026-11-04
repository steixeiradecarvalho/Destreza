import { test, expect, type Page } from "@playwright/test";
async function table(page: Page, name: string) {
  return page.evaluate(async (name) => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const r = indexedDB.open("destreza");
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
    return new Promise<any[]>((resolve, reject) => {
      const tx = db.transaction(name),
        r = tx.objectStore(name).getAll();
      r.onsuccess = () => {
        db.close();
        resolve(r.result);
      };
      r.onerror = () => reject(r.error);
    });
  }, name);
}
async function setup(page: Page) {
  await page.goto("./");
  await page
    .getByRole("button", { name: "Entendi e quero preparar meu espaço" })
    .click();
  await page.getByRole("button", { name: "Salvar e continuar" }).click();
  await expect(page.locator(".status")).toContainText(
    "Pronto para abrir sem internet.",
  );
  await page.clock.install();
  await page.getByRole("button", { name: "Treino de hoje" }).click();
  await page.getByRole("button", { name: "Começar sessão diária" }).click();
}
async function trialTargets(page: Page) {
  await page.clock.fastForward(5001);
  await page.getByRole("button", { name: "Fazer ensaio", exact: true }).click();
  for (let i = 0; i < 3; i++) {
    await page
      .getByRole("button", { name: "Tocar no alvo", exact: true })
      .click();
  }
  await page
    .getByRole("button", { name: "Começar exercício", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Prática", exact: true }),
  ).toBeVisible();
}
async function targets(page: Page) {
  for (let i = 0; i < 10; i++) {
    const button = page.getByRole("button", {
      name: "Tocar no alvo",
      exact: true,
    });
    await expect(button).toBeEnabled();
    await button.click();
  }
}
async function sequence(page: Page) {
  const pattern = (await page
    .locator(".sequence-pattern strong")
    .textContent())!.match(/[1-4]/g)!;
  await page.clock.fastForward(pattern.length * 1250 + 1);
  await page
    .getByRole("button", { name: "Memorizei. Vou repetir", exact: true })
    .click();
  for (let i = 0; i < pattern.length; i++) {
    const button = page.getByRole("button", {
      name: `Peça ${pattern[i]}`,
      exact: true,
    });
    await expect(button).toBeEnabled();
    await button.click();
    if (i + 1 < pattern.length)
      await expect(page.locator(".sequence-answer")).toContainText(
        `${i + 1} / ${pattern.length}`,
      );
  }
}
test("sessão diária percorre etapas, guarda referência e fecho, retoma offline sem repetir aquecimento", async ({
  page,
  context,
}) => {
  await setup(page);
  await trialTargets(page);
  await page.clock.fastForward(60001);
  await targets(page);
  await expect(page.locator(".daily-progress")).toContainText("2 / 5");
  expect((await table(page, "movimentos")).length).toBe(10);
  // Reload/offline preserves the completed stage, not an invented completion of the current one.
  await context.setOffline(true);
  await page.reload();
  await page.getByRole("button", { name: "Treino de hoje" }).click();
  await page
    .getByRole("button", { name: "Retomar sessão", exact: true })
    .click();
  await expect(page.locator(".daily-progress")).toContainText("2 / 5");
  await page
    .getByRole("button", { name: "Começar o teste", exact: true })
    .click();
  await page.locator("textarea").fill("Hoje");
  await page.clock.fastForward(120001);
  await expect(page.locator(".daily-progress")).toContainText("3 / 5");
  await page
    .getByRole("button", { name: "Começar a lição", exact: true })
    .click();
  for (let i = 1; i <= 5; i++)
    await page
      .getByRole("button", { name: `Círculo de calibração ${i}`, exact: true })
      .click();
  await page
    .getByRole("button", { name: "Começar a lição", exact: true })
    .click();
  await expect(page.locator(".target-letter strong")).toBeVisible();
  await page.clock.fastForward(240001);
  await page.locator(".lesson-target h2").focus();
  await page.keyboard.press("a");
  await expect(page.locator(".daily-progress")).toContainText("4 / 5");
  await page.clock.fastForward(5001);
  await page.getByRole("button", { name: "Fazer ensaio", exact: true }).click();
  await sequence(page);
  await page
    .getByRole("button", { name: "Começar exercício", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Prática", exact: true }),
  ).toBeVisible();
  for (let block = 0; block < 2; block++) {
    for (let round = 0; round < 3; round++) {
      await sequence(page);
      if (round < 2)
        await expect(
          page.getByText(`Rodada ${round + 2} / 3`, { exact: true }),
        ).toBeVisible();
    }
    await expect
      .poll(
        async () =>
          (await table(page, "exercicios")).filter(
            (row) => row.exercise === "sequencia",
          ).length,
      )
      .toBe(block + 2);
    await expect(page.locator(".sequence-pattern strong")).toBeVisible();
  }
  const handRuns = (await table(page, "exercicios")).filter(
    (row) => row.exercise === "sequencia",
  );
  handRuns.sort((a, b) => a.startedAt - b.startedAt);
  expect(handRuns.map((row) => row.settings.difficulty)).toEqual([1, 1, 2]);
  await expect(page.locator(".sequence-pattern strong")).toHaveText(
    /^[1-4] → [1-4] → [1-4]$/,
  );
  await page.clock.fastForward(180001);
  for (let i = 0; i < 3; i++) {
    await sequence(page);
    if (i < 2)
      await expect(
        page.getByText(`Rodada ${i + 2} / 3`, { exact: true }),
      ).toBeVisible();
  }
  await expect(page.locator(".daily-progress")).toHaveCount(0);
  await page.getByLabel("4", { exact: true }).check();
  await page.getByLabel("Senti dor ou desconforto", { exact: true }).check();
  await page
    .getByLabel("Uma observação", { exact: false })
    .fill("Confortável; fiz uma pausa.");
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: "test-results/diaria-fecho.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Salvar e encerrar sessão" }).click();
  await expect(
    page.getByRole("heading", { name: "Sessão encerrada", exact: true }),
  ).toBeVisible();
  expect((await table(page, "diarias"))[0]).toMatchObject({
    status: "completed",
    stageIndex: 4,
    completedStages: ["warmup", "reference", "typing", "hands", "closing"],
  });
  expect((await table(page, "diario"))[0]).toMatchObject({
    rating: 4,
    pain: true,
    note: "Confortável; fiz uma pausa.",
  });
  expect((await table(page, "tentativas"))[0]).toMatchObject({
    completed: false,
    total: 1,
  });
  expect((await table(page, "referencias"))[0]).toMatchObject({
    status: "completed",
    durationMs: 120000,
  });
  await page.getByRole("button", { name: "Voltar ao início" }).click();
  await page.getByRole("button", { name: "Treino de hoje" }).click();
  await expect(
    page.getByText("Você registrou desconforto recentemente.", {
      exact: false,
    }),
  ).toBeVisible();
});
test("sessão a 200% não transborda e oferece pausa após quinze minutos", async ({
  page,
}) => {
  await page.goto("./");
  await page
    .getByRole("button", { name: "Entendi e quero preparar meu espaço" })
    .click();
  await page.getByLabel("Tamanho do texto").fill("200");
  await page.getByRole("button", { name: "Salvar e continuar" }).click();
  await expect(page.locator(".status")).toContainText(
    "Pronto para abrir sem internet.",
  );
  await page.clock.install();
  await page.getByRole("button", { name: "Treino de hoje" }).click();
  await page.getByLabel("Sessão leve: cerca de 8 minutos").check();
  await expect(page.getByText("Duração planejada: 8 minutos")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.clock.fastForward(901000);
  await expect(
    page.getByRole("heading", {
      name: "Um momento para descansar",
      exact: true,
    }),
  ).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: "test-results/diaria-200.png",
    fullPage: true,
  });
});

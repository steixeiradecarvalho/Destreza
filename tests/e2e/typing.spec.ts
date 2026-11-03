import { expect, test, type Page } from "@playwright/test";
import content from "../../src/content/teclado.json" with { type: "json" };
async function prepare(page: Page) {
  await page.goto("./");
  await page
    .getByRole("button", { name: "Entendi e quero preparar meu espaço" })
    .click();
  await page.getByRole("button", { name: "Salvar e continuar" }).click();
  await expect(
    page.getByRole("heading", { name: "Seu espaço está pronto." }),
  ).toBeVisible();
}
async function begin(page: Page) {
  await page.getByRole("button", { name: "Treino de hoje" }).click();
  await page.getByRole("button", { name: "Começar a lição" }).click();
  for (let i = 1; i <= 5; i++)
    await page
      .getByRole("button", { name: `Círculo de calibração ${i}`, exact: true })
      .click();
  await page.getByRole("button", { name: "Começar a lição" }).click();
  await expect(
    page.getByRole("heading", { name: "Aquecimento", exact: true }),
  ).toBeVisible();
}
async function typeStage(page: Page, value: string) {
  for (let i = 0; i < value.length; i++) {
    // Focus stays outside the keys so Space is a physical keyboard character.
    await page.locator(".lesson-target h2").focus();
    if (value[i] === "ç")
      await page
        .getByRole("button", { name: "Letra ç", exact: true })
        .press("Enter");
    else await page.keyboard.press(value[i] === " " ? "Space" : value[i]);
    if (i + 1 < value.length)
      await expect(page.locator(".lesson-progress")).toHaveText(
        `Concluído: ${i + 1} / ${value.length}`,
      );
  }
}
test("lição completa registra erros e acertos, persiste e reabre offline", async ({
  page,
  context,
}) => {
  await prepare(page);
  await begin(page);
  await page.locator(".lesson-target h2").focus();
  await page.keyboard.press("b");
  await expect(page.getByRole("status")).toContainText("Sem pressa.");
  await expect(page.locator(".lesson-progress")).toHaveText(
    "Concluído: 0 / 10",
  );
  const lesson = content.levels[0];
  await typeStage(page, lesson.warmup);
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await typeStage(page, lesson.core);
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await typeStage(page, lesson.challenge);
  await expect(
    page.getByRole("heading", { name: "Cada toque conta." }),
  ).toBeVisible();
  await expect(page.getByRole("status")).toContainText("Lição e toques salvos");
  await page.screenshot({
    path: "test-results/licao-concluida.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Voltar ao início" }).click();
  await expect(page.locator(".history-list")).toContainText("Concluída");
  const rows = await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const r = indexedDB.open("destreza");
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
    const transaction = db.transaction(["toques", "tentativas"]);
    return Promise.all(
      ["toques", "tentativas"].map(
        (table) =>
          new Promise<unknown[]>((resolve, reject) => {
            const r = transaction.objectStore(table).getAll();
            r.onsuccess = () => resolve(r.result);
            r.onerror = () => reject(r.error);
          }),
      ),
    );
  });
  expect(rows[0]).toHaveLength(
    lesson.warmup.length + lesson.core.length + lesson.challenge.length + 1,
  );
  expect(rows[1][0]).toMatchObject({
    completed: true,
    correct: rows[0].length - 1,
  });
  await expect(page.getByRole("status")).toContainText(
    "Pronto para abrir sem internet.",
  );
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator(".history-list")).toContainText("Concluída");
});
test("teclas amplas funcionam por toque e só confirmam ao soltar", async ({
  page,
}) => {
  await prepare(page);
  await begin(page);
  await page
    .getByRole("button", { name: "Mostrar a tecla", exact: true })
    .click();
  const a = page.getByRole("button", { name: "Letra a", exact: true });
  await a.scrollIntoViewIfNeeded();
  const box = (await a.boundingBox())!;
  expect(box.width).toBeGreaterThanOrEqual(48);
  expect(box.height).toBeGreaterThanOrEqual(48);
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await expect(page.locator(".lesson-progress")).toHaveText(
    "Concluído: 0 / 10",
  );
  await page.mouse.up();
  await expect(page.locator(".lesson-progress")).toHaveText(
    "Concluído: 1 / 10",
  );
  await expect(page.locator(".touch-ghost")).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: "test-results/teclado-amplo.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Fazer uma pausa" }).click();
  await page.getByRole("button", { name: "Guardar e sair" }).click();
  await expect(page.locator(".history-list")).toContainText("Interrompida");
});
test("seis níveis livres e teclado a 160% com texto a 200% não vazam horizontalmente", async ({
  page,
}) => {
  await prepare(page);
  await page.getByRole("button", { name: "Ajustar meu conforto" }).click();
  await page.getByLabel("Tamanho do texto").fill("200");
  await page.getByLabel("Tamanho das teclas").fill("160");
  await page.getByRole("button", { name: "Salvar e continuar" }).click();
  await page.getByRole("button", { name: "Escolher uma lição" }).click();
  await expect(
    page.getByRole("button", { name: "Prática livre", exact: true }),
  ).toHaveCount(6);
  await page.getByRole("button", { name: "Voltar ao início" }).click();
  await begin(page);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page
    .getByRole("button", { name: "Mostrar a tecla", exact: true })
    .click();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: "test-results/teclado-200.png",
    fullPage: true,
  });
});

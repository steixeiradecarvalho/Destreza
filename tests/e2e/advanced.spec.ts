import { expect, test, type Page } from "@playwright/test";
async function begin(page: Page, level: number) {
  await page.goto("./");
  await page
    .getByRole("button", { name: "Entendi e quero preparar meu espaço" })
    .click();
  await page.getByRole("button", { name: "Salvar e continuar" }).click();
  await page.getByRole("button", { name: "Escolher uma lição" }).click();
  await page
    .locator(".lesson-list>li")
    .nth(level - 1)
    .getByRole("button", { name: "Prática livre", exact: true })
    .click();
  await page.getByRole("button", { name: "Começar a lição" }).click();
  for (let i = 1; i <= 5; i++)
    await page
      .getByRole("button", { name: `Círculo de calibração ${i}`, exact: true })
      .click();
  await page.getByRole("button", { name: "Começar a lição" }).click();
}
async function physical(page: Page, key: string, expected: string) {
  await page.locator(".lesson-target h2").focus();
  await page.keyboard.press(key);
  await expect(page.locator(".target-letter")).toContainText(expected);
}
test("nível 7 corrige textos com apagar e preserva eventos de correção", async ({
  page,
}) => {
  await begin(page, 7);
  await expect(page.locator(".typed-buffer")).toContainText("caxa");
  await page.getByRole("button", { name: "Apagar", exact: true }).click();
  await expect(page.locator(".typed-buffer")).toContainText("cax");
  await physical(page, "Backspace", "s");
  await physical(page, "s", "a");
  await page.locator(".lesson-target h2").focus();
  await page.keyboard.press("a");
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await expect(page.locator(".typed-buffer")).toContainText("bom diaa");
  await page.locator(".lesson-target h2").focus();
  await page.keyboard.press("Backspace");
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await expect(page.locator(".typed-buffer")).toContainText("ate logoo");
  await page.locator(".lesson-target h2").focus();
  await page.keyboard.press("Backspace");
  await expect(
    page.getByRole("heading", { name: "Cada toque conta." }),
  ).toBeVisible();
});
test("nível 8 abre acentos por toque longo sem inserir a letra base", async ({
  page,
}) => {
  await begin(page, 8);
  await page.clock.install();
  await page.getByRole("button", { name: "Mostrar a tecla" }).click();
  const key = page.getByRole("button", { name: "Letra a", exact: true });
  await key.scrollIntoViewIfNeeded();
  const box = (await key.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.clock.runFor(550);
  await page.mouse.up();
  await expect(
    page.getByRole("group", { name: "Escolha o acento" }),
  ).toBeVisible();
  await expect(page.locator(".lesson-progress")).toContainText("0 /");
  await page
    .getByRole("group", { name: "Escolha o acento" })
    .getByRole("button", { name: "Letra á", exact: true })
    .click();
  await expect(page.locator(".lesson-progress")).toContainText("1 /");
  await page.screenshot({ path: "test-results/acentos.png", fullPage: true });
});
test("nível 9 muda maiúsculas e camada numérica", async ({ page }) => {
  await begin(page, 9);
  await page.getByRole("button", { name: "Maiúsculas", exact: true }).click();
  await page.getByRole("button", { name: "Mostrar a tecla" }).click();
  await page.getByRole("button", { name: "Letra A", exact: true }).click();
  await physical(page, "Space", "B");
  await physical(page, "B", "Espaço");
  await physical(page, "Space", "C");
  await physical(page, "C", "Espaço");
  await physical(page, "Space", "1");
  await page
    .getByRole("button", { name: "Números e sinais", exact: true })
    .click();
  await page.getByRole("button", { name: "Mostrar a tecla" }).click();
  await page.getByRole("button", { name: "Letra 1", exact: true }).click();
  await expect(page.locator(".target-letter")).toContainText("Espaço");
});
test("nível 10 aceita uma sugestão e avança vários caracteres com um toque", async ({
  page,
}) => {
  await begin(page, 10);
  await physical(page, "c", "a");
  await page
    .getByRole("button", { name: "Sugestão casa", exact: true })
    .click();
  await expect(page.locator(".lesson-progress")).toHaveText("Concluído: 4 / 9");
  await expect(page.locator(".target-letter")).toContainText("Espaço");
});

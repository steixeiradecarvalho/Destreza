import { expect, test, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import reference from "../../src/content/referencia.json" with { type: "json" };
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
async function openReference(page: Page) {
  await page
    .getByRole("button", { name: "Teste de referência", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Começar o teste", exact: true })
    .click();
  await expect(page.getByLabel("Escreva aqui", { exact: true })).toBeVisible();
}
async function jsonDownload(page: Page) {
  const promise = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Exportar JSON", exact: true })
    .click();
  const download = await promise;
  return JSON.parse(await readFile((await download.path())!, "utf8"));
}
test("referência dura 120 segundos, exporta resultado e repete as mesmas frases", async ({
  page,
  context,
}) => {
  await prepare(page);
  await page.getByRole("button", { name: "Ajustar meu conforto" }).click();
  await page.getByLabel("Tamanho do texto").fill("200");
  await page.getByRole("button", { name: "Salvar e continuar" }).click();
  await page.clock.install();
  await openReference(page);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await expect(page.locator(".native-model p")).toHaveText(
    reference.phrases[0],
  );
  await page
    .getByLabel("Escreva aqui", { exact: true })
    .fill(reference.phrases[0]);
  await page.getByRole("button", { name: "Próxima frase" }).click();
  await expect(page.locator(".native-model p")).toHaveText(
    reference.phrases[1],
  );
  await page.getByLabel("Escreva aqui", { exact: true }).fill("Vamos tomar");
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: "test-results/referencia-em-andamento.png",
    fullPage: true,
  });
  await page.clock.fastForward(120001);
  await expect(
    page.getByRole("heading", { name: "Seu teste ficou registrado." }),
  ).toBeVisible();
  const data = await jsonDownload(page);
  expect(data.schemaVersion).toBe(3);
  expect(data.native).toHaveLength(1);
  expect(data.native[0]).toMatchObject({
    durationMs: 120000,
    status: "completed",
    protocolVersion: 1,
    errors: 0,
    correct: reference.phrases[0].length + "Vamos tomar".length,
    studyDay: 1,
  });
  expect(data.taps).toHaveLength(0);
  const csvPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Exportar CSV", exact: true }).click();
  const csv = await readFile((await (await csvPromise).path())!, "utf8");
  expect(csv).toContain("errorsPer100Characters");
  expect(csv).toContain("120000");
  expect(csv).toContain(reference.phrases[0]);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: "test-results/referencia-concluida.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Voltar ao início" }).click();
  await openReference(page);
  await expect(page.locator(".native-model p")).toHaveText(
    reference.phrases[0],
  );
  await page.getByRole("button", { name: "Fazer uma pausa" }).click();
  await expect(
    page.getByRole("heading", { name: "O teste foi interrompido." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Voltar ao início" }).click();
  await expect(page.getByRole("status")).toContainText(
    "Pronto para abrir sem internet.",
  );
  await context.setOffline(true);
  await page.reload();
  await page
    .getByRole("button", { name: "Teste de referência", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Meus testes" }),
  ).toBeVisible();
  await expect(page.locator(".history-list")).toContainText("Concluída");
});
test("não inicia o relógio antes da escrita, bloqueia colar e marca saída como interrupção", async ({
  page,
}) => {
  await prepare(page);
  await page.clock.install();
  await openReference(page);
  await page.clock.fastForward(130000);
  await expect(page.getByLabel("Escreva aqui", { exact: true })).toBeVisible();
  await page
    .getByLabel("Escreva aqui", { exact: true })
    .dispatchEvent("paste", {});
  await expect(page.getByRole("status")).toContainText(
    "digite o texto em vez de colar",
  );
  await expect(page.getByLabel("Escreva aqui", { exact: true })).toHaveValue(
    "",
  );
  await page.getByLabel("Escreva aqui", { exact: true }).fill("Bom dia");
  await page.clock.fastForward(10000);
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(
    page.getByRole("heading", { name: "O teste foi interrompido." }),
  ).toBeVisible();
  const data = await jsonDownload(page);
  expect(data.native[0]).toMatchObject({
    status: "interrupted",
    pasteBlocked: true,
  });
  expect(data.native[0].durationMs).toBeLessThan(120000);
});
for (const level of [11, 12])
  test(`nível ${level} conclui três etapas no campo nativo e registra a lição`, async ({
    page,
  }) => {
    await prepare(page);
    await page.getByRole("button", { name: "Escolher uma lição" }).click();
    await page
      .locator(".lesson-list>li")
      .nth(level - 1)
      .getByRole("button", { name: "Prática livre", exact: true })
      .click();
    await page.getByRole("button", { name: "Começar a lição" }).click();
    for (let stage = 0; stage < 3; stage++) {
      const model = (await page.locator(".native-model p").textContent())!;
      await page.getByLabel("Escreva aqui", { exact: true }).fill(model);
      await page.getByRole("button", { name: "Concluir esta etapa" }).click();
      if (stage < 2)
        await page
          .getByRole("button", { name: "Continuar", exact: true })
          .click();
    }
    await expect(
      page.getByRole("heading", { name: "Cada toque conta." }),
    ).toBeVisible();
    const data = await jsonDownload(page);
    expect(data.sessions[0]).toMatchObject({
      level,
      status: "completed",
      inputMode: "native",
    });
    expect(data.attempts[0]).toMatchObject({ completed: true, accuracy: 100 });
    expect(data.native).toHaveLength(3);
    expect(data.taps).toHaveLength(0);
    await page.getByRole("button", { name: "Voltar ao início" }).click();
    await expect(page.locator(".history-list")).toContainText(
      `Nível ${level} · Concluída`,
    );
  });

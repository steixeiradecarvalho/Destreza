import { afterEach, expect, test } from "vitest";
import { DestrezaDB, defaults } from "../src/data/db";
const database = new DestrezaDB("destreza-test");
afterEach(async () => {
  await database.config.clear();
});
test("preferências sobrevivem ao fechamento e à reabertura do banco", async () => {
  await database.config.put({
    ...defaults,
    hand: "esquerda",
    scale: 200,
    theme: "contraste",
  });
  database.close();
  await database.open();
  expect(await database.config.get("local")).toMatchObject({
    hand: "esquerda",
    scale: 200,
    theme: "contraste",
    consentVersion: 1,
  });
});
test("a primeira abertura não cria consentimento ou preferências implicitamente", async () => {
  expect(await database.config.get("local")).toBeUndefined();
});

test("migração da F0 preserva preferências e cria tabelas de treino", async () => {
  const { default: Dexie } = await import("dexie");
  const old = new Dexie("destreza-upgrade-test");
  old.version(1).stores({ config: "&id" });
  await old.table("config").put({ ...defaults, scale: 200, hand: "esquerda" });
  old.close();
  const current = new DestrezaDB("destreza-upgrade-test");
  expect(await current.config.get("local")).toMatchObject({
    scale: 200,
    hand: "esquerda",
  });
  expect(await current.toques.count()).toBe(0);
  expect(await current.sessoes.count()).toBe(0);
  await current.delete();
});

test("migração da F1 preserva sessões e cria registros nativos separados", async () => {
  const { default: Dexie } = await import("dexie");
  const old = new Dexie("destreza-upgrade-v3-test");
  old.version(2).stores({
    config: "&id",
    perfil: "&id",
    sessoes: "&id, startedAt, status",
    tentativas: "&id, sessionId, level",
    toques: "&id, sessionId, attemptId",
  });
  await old.table("config").put({ ...defaults, hand: "esquerda" });
  await old.table("sessoes").put({
    id: "f1",
    startedAt: 1,
    level: 1,
    status: "completed",
    free: false,
  });
  old.close();
  const current = new DestrezaDB("destreza-upgrade-v3-test");
  expect(await current.sessoes.get("f1")).toMatchObject({
    status: "completed",
  });
  expect(await current.config.get("local")).toMatchObject({ hand: "esquerda" });
  expect(await current.referencias.count()).toBe(0);
  await current.delete();
});

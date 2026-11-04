import { expect, test, afterEach } from "vitest";
import {
  adaptBlock,
  observeAction,
  updateSkill,
  addDays,
  reviewKeys,
  type KeySkill,
} from "../src/core/adaptation";
import { dailyPlan, decliningDays } from "../src/core/daily";
import { db, defaults, DestrezaDB } from "../src/data/db";
import { saveTypingTap, saveMotorAction, motorKey } from "../src/data/learning";
import { prepareDaily, closeDaily, startDaily } from "../src/data/daily";
import type { Tap } from "../src/core/typing";
import Dexie from "dexie";
afterEach(async () => {
  await db.transaction("rw", db.tables, async () => {
    for (const table of db.tables) await table.clear();
  });
});
test("ajuste respeita 70/90%, limites e dez ações, sem acumular níveis incompatíveis", () => {
  expect(adaptBlock(2, 9, 10)).toBe(3);
  expect(adaptBlock(2, 7, 10)).toBe(2);
  expect(adaptBlock(2, 6, 10)).toBe(1);
  expect(adaptBlock(1, 0, 10)).toBe(1);
  expect(adaptBlock(3, 10, 10)).toBe(3);
  expect(adaptBlock(2, 8, 9)).toBe(2);
  let state;
  for (let i = 0; i < 9; i++) state = observeAction(state, "a", 1, true, i);
  expect(state?.recommendation).toBe(1);
  state = observeAction(state, "a", 1, true, 10);
  expect(state).toMatchObject({ recommendation: 2, count: 0 });
  expect(observeAction(state, "a", 2, false, 11)).toMatchObject({
    observedLevel: 2,
    count: 1,
    correct: 0,
  });
});
test("domínio usa janela de trinta e agenda 1,2,4,8 dias sem adiantar no mesmo dia", () => {
  const now = new Date(2026, 10, 4, 12).getTime();
  let skill: KeySkill | undefined;
  for (let i = 0; i < 30; i++)
    skill = updateSkill(skill, "a", "key", "a", "pointer", {
      id: String(i),
      at: now,
      correct: true,
      offset: 0.1,
      durationMs: 60,
    });
  expect(skill).toMatchObject({ state: "mastered", dueAt: addDays(now, 1) });
  const unchanged = updateSkill(
    skill,
    "a",
    "key",
    "a",
    "pointer",
    skill!.observations[0],
  );
  expect(unchanged).toBe(skill);
  for (const [index, days] of [2, 4, 8].entries()) {
    const at = skill!.dueAt;
    skill = updateSkill(skill, "a", "key", "a", "pointer", {
      id: `later${index}`,
      at,
      correct: true,
      offset: null,
      durationMs: null,
    });
    expect(skill.dueAt).toBe(addDays(at, days));
  }
  expect(skill!.observations).toHaveLength(30);
  for (let i = 0; i < 4; i++)
    skill = updateSkill(skill, "a", "key", "a", "pointer", {
      id: `error${i}`,
      at: now,
      correct: false,
      offset: 0.8,
      durationMs: 1000,
    });
  expect(skill!.state).toBe("training");
  expect(reviewKeys([skill!], "ab", now)).toBe("aaaaaaaaaa");
});
test("plano soma onze minutos, reserva referência e alterna exercício e mão; queda exige dias consecutivos", () => {
  const now = new Date(2026, 10, 4, 12).getTime();
  const base = {
    now,
    level: 1,
    review: "a",
    completedCount: 0,
    referenceDue: true,
  };
  const plan = dailyPlan(base);
  expect(Object.values(plan.budgets).reduce((a, b) => a + b, 0)).toBe(660000);
  expect(plan.budgets.typing).toBe(240000);
  expect(plan.stages).toContain("reference");
  expect(dailyPlan({ ...base, completedCount: 1, light: true })).toMatchObject({
    minutes: 8,
    motor: "gestos",
    handMode: "other",
  });
  expect(
    decliningDays(
      [
        { day: "2026-11-01", accuracy: 95 },
        { day: "2026-11-02", accuracy: 85 },
        { day: "2026-11-03", accuracy: 75 },
      ],
      now,
    ),
  ).toBe(true);
  expect(
    decliningDays(
      [
        { day: "2026-11-01", accuracy: 95 },
        { day: "2026-11-03", accuracy: 75 },
      ],
      now,
    ),
  ).toBe(false);
});
test("toque salvo uma vez atualiza tecla e par por origem sem criar pontaria de teclado físico", async () => {
  function tap(id: string, key: string): Tap & { id: string } {
    return {
      id,
      sessionId: "s",
      attemptId: "s",
      expected: key,
      actual: key,
      at: Date.now(),
      elapsedMs: Number(id),
      durationMs: 0,
      source: "keyboard",
      x: null,
      y: null,
      dx: null,
      dy: null,
      targetWidth: null,
      targetHeight: null,
      pressure: null,
      correct: true,
    };
  }
  await saveTypingTap(tap("1", "a"));
  await saveTypingTap(tap("1", "a"));
  await saveTypingTap(tap("2", "b"));
  expect(await db.toques.count()).toBe(2);
  expect(await db.teclas.get("keyboard:pair:ab")).toMatchObject({
    meanOffset: null,
    meanDurationMs: null,
    accuracy: 100,
  });
  expect((await db.teclas.get("keyboard:key:a"))?.observations).toHaveLength(1);
});
test("dez movimentos adaptam uma vez; ensaio e aquecimento não alimentam recomendação", async () => {
  const settings = {
    difficulty: 1 as const,
    handMode: "dominant" as const,
    dominant: "direita" as const,
    shape: "reta" as const,
  };
  for (let i = 0; i < 10; i++) {
    const row = {
      id: String(i),
      runId: "s",
      exercise: "alvos",
      kind: "tap" as const,
      correct: true,
      source: "pointer" as const,
      at: i,
      durationMs: 50,
      requestedHand: "direita" as const,
      width: 300,
      height: 300,
      points: [],
      details: {},
    };
    await saveMotorAction(row, settings);
    await saveMotorAction(row, settings);
  }
  expect(await db.movimentos.count()).toBe(10);
  expect(
    await db.adaptacao.get(motorKey("alvos", settings, "pointer")),
  ).toMatchObject({ recommendation: 2, count: 0 });
  await saveMotorAction(
    {
      id: "warm",
      runId: "w",
      exercise: "alvos",
      kind: "tap",
      correct: false,
      source: "accessible",
      at: 11,
      durationMs: 0,
      requestedHand: "direita",
      width: 300,
      height: 300,
      points: [],
      details: {},
    },
    settings,
    false,
  );
  expect(await db.adaptacao.count()).toBe(1);
});
test("fecho é atômico, preserva diário e sugere descanso no dia seguinte", async () => {
  const now = Date.now(),
    prepared = await prepareDaily(defaults, false, now),
    run = await startDaily(prepared.plan);
  await closeDaily(run, { rating: 4, pain: true, note: "Teste" });
  expect(await db.diarias.get(run.id)).toMatchObject({ status: "completed" });
  expect(await db.diario.get(run.id)).toMatchObject({
    rating: 4,
    note: "Teste",
  });
  expect((await prepareDaily(defaults, false, addDays(now, 1))).rest).toBe(
    true,
  );
  expect((await prepareDaily(defaults, false, addDays(now, 2))).rest).toBe(
    false,
  );
});
test("migração v4 preserva movimentos e configurações, criando tabelas F4 vazias", async () => {
  const old = new Dexie("migration-f4");
  old
    .version(4)
    .stores({
      config: "&id",
      perfil: "&id",
      sessoes: "&id, startedAt, status",
      tentativas: "&id, sessionId, level",
      toques: "&id, sessionId, attemptId",
      referencias: "&id, kind, status, startedAt, sessionId",
      exercicios: "&id, exercise, startedAt, status",
      movimentos: "&id, runId, exercise",
    });
  await old.table("config").put({ ...defaults, scale: 200 });
  await old
    .table("movimentos")
    .put({
      id: "old",
      runId: "r",
      exercise: "alvos",
      points: [{ x: 1, y: 2, t: 3 }],
    });
  old.close();
  const current = new DestrezaDB("migration-f4");
  expect(await current.config.get("local")).toMatchObject({ scale: 200 });
  expect(await current.movimentos.get("old")).toMatchObject({
    points: [{ x: 1, y: 2, t: 3 }],
  });
  expect(await current.diarias.count()).toBe(0);
  await current.delete();
});

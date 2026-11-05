import { expect, test, afterEach } from "vitest";
import {
  weekKey,
  practicedDays,
  weeklyTyping,
  referenceComparison,
} from "../src/core/evolution";
import {
  rhythmScore,
  classification,
  pathDeviation,
} from "../src/core/extendedMotor";
import { csvAll } from "../src/data/export";
import { clearLocalData } from "../src/data/history";
import {
  db,
  defaults,
  type DailyRun,
  type Session,
  type NativeRun,
} from "../src/data/db";
import type { Tap } from "../src/core/typing";
afterEach(async () => {
  for (const table of db.tables) await table.clear();
});
test("sete dias: precisão ponderada por toques, separação de origem e semana local", () => {
  const monday = new Date(2026, 10, 2, 12).getTime();
  const taps = Array.from(
    { length: 7 },
    (_, i) =>
      ({
        source: "pointer",
        at: monday + i * 86400000,
        attemptId: `a${i}`,
        elapsedMs: 100,
        correct: i !== 0,
      }) as Tap,
  );
  taps.push({ ...taps[0], source: "accessible", correct: false });
  const [row] = weeklyTyping(taps, "pointer");
  expect(row.total).toBe(7);
  expect(row.accuracy).toBeCloseTo(600 / 7);
  expect(row.errorsPer100).toBeCloseTo(100 / 7);
  expect(weekKey(new Date(2026, 10, 8, 23, 59).getTime())).toBe("2026-11-02");
  expect(weekKey(new Date(2026, 10, 9, 0, 1).getTime())).toBe("2026-11-09");
  expect(
    practicedDays(
      [{ status: "completed", startedAt: monday } as DailyRun],
      [
        { status: "completed", startedAt: monday } as Session,
        { status: "interrupted", startedAt: monday + 86400000 } as Session,
      ],
      [],
    ),
  ).toEqual(["2026-11-02"]);
});
test("ritmo não cruza tentativas, origens ou pausas longas", () => {
  const base = {
    source: "pointer",
    at: Date.now(),
    attemptId: "a",
    correct: true,
  };
  const taps = [
    { ...base, elapsedMs: 0 },
    { ...base, at: base.at + 100, elapsedMs: 100 },
    { ...base, at: base.at + 300, elapsedMs: 300 },
    { ...base, at: base.at + 20000, elapsedMs: 20000 },
    { ...base, attemptId: "b", elapsedMs: 20100 },
  ] as Tap[];
  expect(weeklyTyping(taps, "pointer")[0]).toMatchObject({
    rhythmMs: 150,
    variationMs: 50,
  });
});
test("comparação dia 28 exige referência completa e mesmo protocolo", () => {
  const first = {
    kind: "reference",
    status: "completed",
    entered: 20,
    startedAt: 1,
    studyDay: 1,
    protocolVersion: 1,
  } as NativeRun;
  expect(
    referenceComparison([
      first,
      { ...first, studyDay: 28, protocolVersion: 2 },
    ]),
  ).toBeNull();
  expect(
    referenceComparison([first, { ...first, studyDay: 28, startedAt: 2 }])
      ?.final.studyDay,
  ).toBe(28);
});
test("regras de classificação, precisão espacial e tolerância do ritmo", () => {
  expect(classification(1, 0)).toBe(1);
  expect(classification(1, 1)).toBe(1);
  expect(classification(4, 1)).toBe(0);
  expect(rhythmScore(0, 0, null, 1000).correct).toBe(true);
  expect(rhythmScore(0, 1, 1000, 1000).correct).toBe(false);
  expect(rhythmScore(0, 0, 1500, 1000).correct).toBe(false);
  expect(
    pathDeviation(
      [{ x: 5, y: 0 }],
      [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
      ],
    ),
  ).toEqual({ deviationPx: 0, insidePercent: 100 });
});
test("CSV completo preserva todas as coleções, objetos e texto livre com escape", () => {
  const csv = csvAll({
    schemaVersion: 5,
    sessions: [{ id: "s", level: 1 }],
    diary: [{ id: "d", note: '=SUM(1,2)\n"teste"' }],
    movements: [{ id: "m", points: [{ x: 1, y: 2 }], durationMs: 20 }],
  });
  expect(csv).toContain('"sessions"');
  expect(csv).toContain('"diary"');
  expect(csv).toContain('"movements"');
  expect(csv).toContain("\"'=SUM(1,2)");
  expect(csv).toContain('""x"":1');
});
test("exclusão é atômica em falha e mantém o mesmo banco/esquema após sucesso", async () => {
  await db.config.put(defaults);
  await db.diario.put({
    id: "d",
    dailyId: "s",
    day: "2026-11-05",
    at: 1,
    rating: 4,
    pain: false,
    note: "Registro",
  });
  const clear = IDBObjectStore.prototype.clear;
  IDBObjectStore.prototype.clear = function () {
    if (this.name === "diario") throw new Error("Falha simulada");
    return clear.call(this);
  };
  await expect(clearLocalData()).rejects.toThrow();
  IDBObjectStore.prototype.clear = clear;
  expect(await db.config.count()).toBe(1);
  expect(await db.diario.count()).toBe(1);
  await clearLocalData();
  expect(await Promise.all(db.tables.map((t) => t.count()))).toEqual(
    db.tables.map(() => 0),
  );
  expect(db.verno).toBe(5);
});

test("variação fina exige amostragem suficiente e distingue linha e oscilação", async () => {
  const { traceVariation } = await import("../src/core/traceVariation");
  const line = Array.from({ length: 31 }, (_, i) => ({
    x: i,
    y: 0,
    t: i * 20,
    pressure: null,
  }));
  expect(traceVariation(line)).toBeCloseTo(0);
  expect(
    traceVariation(line.map((p, i) => ({ ...p, y: i % 2 ? 4 : -4 }))),
  ).toBeGreaterThan(2);
  expect(traceVariation([line[0], line[30]])).toBeNull();
  expect(traceVariation(line.map((p) => ({ ...p, t: p.t * 4 })))).toBeNull();
});
test("novos módulos oferecem três degraus mudando só um parâmetro", async () => {
  const { exercises } = await import("../src/modules/maos/registry");
  for (const id of [
    "dedilhado",
    "ritmo",
    "classificar",
    "palavra",
    "padrao",
  ] as const) {
    const module = exercises[id],
      first = module.parametros(1),
      second = module.parametros(2),
      third = module.parametros(3);
    expect(
      Object.keys(first).filter((k) => first[k] !== second[k]),
    ).toHaveLength(1);
    expect(
      Object.keys(second).filter((k) => second[k] !== third[k]),
    ).toHaveLength(1);
  }
});

test("traço de palavra permite cruzar teclas intermediárias sem contá-las como destinos", async () => {
  const { appendExpectedZone } = await import("../src/core/extendedMotor");
  const expected = Array.from("casas"),
    values: string[] = [];
  for (const key of "csasasas") appendExpectedZone(values, key, expected);
  expect(values.join("")).toBe("casas");
  const incomplete: string[] = [];
  for (const key of "cs") appendExpectedZone(incomplete, key, expected);
  expect(incomplete.join("")).toBe("c");
});

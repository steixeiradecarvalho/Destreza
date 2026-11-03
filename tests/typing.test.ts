import { expect, test } from "vitest";
import {
  metrics,
  repeatedTap,
  unlockedLevel,
  type Tap,
} from "../src/core/typing";
function tap(correct: boolean, pointer = true): Tap {
  return {
    sessionId: "s",
    attemptId: "s",
    expected: "a",
    actual: correct ? "a" : "b",
    at: 0,
    elapsedMs: 0,
    durationMs: 20,
    source: pointer ? "touch" : "keyboard",
    x: pointer ? 0 : null,
    y: pointer ? 0 : null,
    dx: pointer ? 3 : null,
    dy: pointer ? 4 : null,
    targetWidth: pointer ? 50 : null,
    targetHeight: pointer ? 50 : null,
    pressure: null,
    correct,
  };
}
test("métricas usam todos os toques e excluem teclado físico da pontaria", () => {
  expect(metrics([tap(true), tap(false, false)])).toEqual({
    total: 2,
    correct: 1,
    accuracy: 50,
    errorsPer100: 50,
    meanOffsetInKeys: 0.1,
  });
  expect(metrics([]).accuracy).toBe(0);
  expect(metrics([tap(true, false)]).meanOffsetInKeys).toBeNull();
});
test("filtro de tremor respeita tempo e proximidade sem impedir outras teclas", () => {
  const previous = { at: 100, x: 20, y: 20 };
  expect(repeatedTap(previous, { at: 249, x: 25, y: 25 })).toBe(true);
  expect(repeatedTap(previous, { at: 250, x: 20, y: 20 })).toBe(false);
  expect(repeatedTap(previous, { at: 120, x: 70, y: 20 })).toBe(false);
});
test("três conclusões guiadas a 85% liberam um nível, prática livre e interrupção não", () => {
  const good = { level: 1, completed: true, free: false, accuracy: 85 };
  expect(unlockedLevel([good, good])).toBe(1);
  expect(
    unlockedLevel([
      good,
      good,
      { ...good, free: true },
      { ...good, completed: false },
    ]),
  ).toBe(1);
  expect(unlockedLevel([good, good, good])).toBe(2);
  expect(unlockedLevel([good, good, { ...good, accuracy: 84.9 }])).toBe(1);
});

test("curso chega ao nível 12 sem pular pré-requisitos ou criar nível 13", () => {
  const attempts = Array.from({ length: 12 }, (_, index) =>
    Array.from({ length: 3 }, () => ({
      level: index + 1,
      completed: true,
      free: false,
      accuracy: 100,
    })),
  ).flat();
  expect(unlockedLevel(attempts)).toBe(12);
  expect(unlockedLevel(attempts.filter((item) => item.level !== 7))).toBe(7);
});

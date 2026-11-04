import { expect, test } from "vitest";
import {
  gestureCorrect,
  motorSummary,
  pathPoints,
  requestedHand,
  sequenceFor,
  targetPoint,
  traceQuality,
  withinTarget,
  type MotorEvent,
  type MotorSettings,
} from "../src/core/motor";
const settings: MotorSettings = {
  difficulty: 1,
  handMode: "dominant",
  dominant: "direita",
  shape: "reta",
};
test("mãos escolhidas e alternância não são inferidas do dedo observado", () => {
  expect(requestedHand(settings, 0)).toBe("direita");
  expect(requestedHand({ ...settings, handMode: "other" }, 0)).toBe("esquerda");
  expect(
    [0, 1, 2].map((i) => requestedHand({ ...settings, handMode: "both" }, i)),
  ).toEqual(["direita", "esquerda", "direita"]);
});
test("trilhas seguem a faixa em ordem e não aceitam atalho ou ponto parado", () => {
  for (const shape of ["reta", "onda", "espiral", "oito"] as const) {
    const path = pathPoints(shape, 320, 280);
    const result = traceQuality(path, path, 48);
    expect(result.correct, shape).toBe(true);
    expect(result.coverage).toBeGreaterThan(0.92);
  }
  const path = pathPoints("oito", 320, 280);
  expect(traceQuality([path[0], path[0]], path, 64).correct).toBe(false);
  expect(
    traceQuality(
      [
        { x: 0, y: 0 },
        { x: 320, y: 0 },
      ],
      path,
      48,
    ).correct,
  ).toBe(false);
});
test("posição de alvo mantém margem e exige toque dentro do círculo", () => {
  const center = targetPoint([0, 1], 48, 300, 280);
  expect(center).toEqual({ x: 32, y: 248 });
  expect(withinTarget({ x: center.x + 24, y: center.y }, center, 48)).toBe(
    true,
  );
  expect(withinTarget({ x: center.x + 25, y: center.y }, center, 48)).toBe(
    false,
  );
});
test("sequências são reproduzíveis e não repetem a mesma peça adjacente", () => {
  expect(sequenceFor(123, 1, 4)).toEqual(sequenceFor(123, 1, 4));
  for (let seed = 1; seed < 10; seed++) {
    const values = sequenceFor(seed, 0, 4);
    expect(
      values.every(
        (value, i) =>
          value >= 1 && value <= 4 && (i === 0 || value !== values[i - 1]),
      ),
    ).toBe(true);
  }
});
test("dificuldades de gesto apertam a tolerância sem inventar acerto", () => {
  expect(gestureCorrect("pinch", 1.8, 0.35)).toBe(true);
  expect(gestureCorrect("pinch", 1.8, 0.15)).toBe(false);
  expect(gestureCorrect("rotate", 30, 0.15)).toBe(true);
  expect(gestureCorrect("rotate", 0, 0.15)).toBe(false);
  expect(gestureCorrect("scroll", 0, 0.15)).toBe(true);
  expect(gestureCorrect("scroll", 60, 0.35)).toBe(false);
});
test("resumo não mistura pontaria virtual com medidas por ponteiro", () => {
  const common: MotorEvent = {
    kind: "trace",
    correct: true,
    source: "pointer",
    at: 0,
    durationMs: 100,
    requestedHand: "direita",
    width: 320,
    height: 280,
    points: [],
    details: { deviationPx: 4, insidePercent: 80 },
  };
  const summary = motorSummary([
    common,
    {
      ...common,
      source: "accessible",
      correct: false,
      details: { deviationPx: 100, insidePercent: 0 },
    },
  ]);
  expect(summary).toMatchObject({
    total: 2,
    accuracy: 50,
    meanDeviationPx: 4,
    insidePercent: 80,
    meanReactionMs: null,
  });
});

import { expect, test } from "vitest";
import {
  scoreNative,
  scoreComplete,
  wordsPerMinute,
  referenceDay,
  referenceDue,
} from "../src/core/native";
import { csvNative } from "../src/data/export";
test("texto parcial não conta o final ainda não digitado, mas lição completa conta", () => {
  expect(scoreNative("bom dia", "bom")).toMatchObject({
    correct: 3,
    errors: 0,
    evaluated: 3,
  });
  expect(scoreComplete("bom dia", "bom")).toMatchObject({
    correct: 3,
    errors: 4,
    evaluated: 7,
  });
});
test("alinhamento recupera correspondências após omissão e inserção", () => {
  expect(scoreNative("abcd", "acd")).toMatchObject({
    correct: 3,
    errors: 1,
    omissions: 1,
    evaluated: 4,
  });
  expect(scoreNative("casa", "cxasa")).toMatchObject({
    correct: 4,
    errors: 1,
    insertions: 1,
    evaluated: 5,
  });
  expect(scoreNative("casa", "caxa")).toMatchObject({
    correct: 3,
    errors: 1,
    substitutions: 1,
    evaluated: 4,
  });
  expect(scoreNative("olá", "ola")).toMatchObject({ correct: 2, errors: 1 });
});
test("normalização Unicode mantém acentos equivalentes sem apagá-los", () => {
  expect(scoreComplete("café", "cafe\u0301")).toMatchObject({
    correct: 4,
    errors: 0,
    evaluated: 4,
  });
  expect(scoreNative("abc", "")).toMatchObject({
    correct: 0,
    errors: 0,
    evaluated: 0,
    accuracy: 0,
  });
  expect(wordsPerMinute(50, 120000)).toBe(5);
  expect(wordsPerMinute(50, 0)).toBe(0);
});
test("agenda marca dia 28 e não pede reposição de um marco já ultrapassado", () => {
  expect(referenceDue([])).toBe(1);
  expect(referenceDue([1])).toBe(7);
  expect(referenceDue([1, 8])).toBe(14);
  expect(referenceDue([1, 7, 14, 21])).toBe(28);
  expect(referenceDue([1, 28])).toBeNull();
  expect(
    referenceDay(
      new Date(2026, 10, 1, 23, 50).getTime(),
      new Date(2026, 10, 2, 0, 10).getTime(),
    ),
  ).toBe(2);
});
test("CSV preserva texto, escapa aspas e neutraliza fórmulas em planilhas", () => {
  const csv = csvNative([
    {
      id: "x",
      keyboardNote: "=1+1",
      model: 'café "bom"',
      value: "café",
      segments: [{ model: "bom dia", value: "bom dia" }],
    },
  ]);
  expect(csv.startsWith("\uFEFF")).toBe(true);
  expect(csv).toContain('"\'=1+1"');
  expect(csv).toContain('bom dia\ncafé ""bom""');
});

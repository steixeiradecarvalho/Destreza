import { db, type StoredMotorEvent } from "./db";
import {
  observeAction,
  updateSkill,
  type KeyObservation,
} from "../core/adaptation";
import type { Tap } from "../core/typing";
import type { MotorSettings } from "../core/motor";
export function motorKey(
  exercise: string,
  settings: MotorSettings,
  source: string,
) {
  return `${exercise}:${settings.handMode}:${settings.dominant}:${source}`;
}
export async function saveMotorAction(
  row: StoredMotorEvent,
  settings: MotorSettings,
  adapt = true,
) {
  await db.transaction("rw", db.movimentos, db.adaptacao, async () => {
    if (await db.movimentos.get(row.id)) return;
    await db.movimentos.put({
      ...row,
      difficulty: settings.difficulty,
      handMode: settings.handMode,
    });
    if (adapt) {
      const id = motorKey(row.exercise, settings, row.source);
      await db.adaptacao.put(
        observeAction(
          await db.adaptacao.get(id),
          id,
          settings.difficulty,
          row.correct,
          row.at,
        ),
      );
    }
  });
}
export async function recommendedLevel(
  exercise: string,
  settings: MotorSettings,
  source?: string,
) {
  if (source)
    return (
      (await db.adaptacao.get(motorKey(exercise, settings, source)))
        ?.recommendation ?? 1
    );
  const prefix = motorKey(exercise, settings, "");
  const recent = (await db.adaptacao.toArray())
    .filter((row) => row.id.startsWith(prefix))
    .sort((a, b) => b.updatedAt - a.updatedAt)[0];
  return recent?.recommendation ?? 1;
}

function inputSource(tap: Tap) {
  return ["keyboard", "accessible"].includes(tap.source)
    ? tap.source
    : "pointer";
}
function eligible(tap: Tap) {
  return (
    (!tap.operation || tap.operation === "character") &&
    Array.from(tap.expected.normalize("NFC")).length === 1
  );
}
export async function saveTypingTap(tap: Tap & { id: string }) {
  await db.transaction("rw", db.toques, db.teclas, async () => {
    if (await db.toques.get(tap.id)) return;
    const prior = eligible(tap)
      ? (await db.toques.where("attemptId").equals(tap.attemptId).toArray())
          .filter(
            (row) =>
              eligible(row) &&
              row.correct &&
              inputSource(row) === inputSource(tap),
          )
          .sort((a, b) => a.elapsedMs - b.elapsedMs)
          .at(-1)
      : undefined;
    await db.toques.put(tap);
    if (!eligible(tap)) return;
    const key = tap.expected.normalize("NFC").toLocaleLowerCase("pt-BR"),
      source = inputSource(tap);
    const observation: KeyObservation = {
      id: tap.id,
      at: tap.at,
      correct: tap.correct,
      offset:
        source === "pointer" &&
        tap.dx !== null &&
        tap.dy !== null &&
        tap.targetWidth &&
        tap.targetHeight
          ? Math.hypot(tap.dx / tap.targetWidth, tap.dy / tap.targetHeight)
          : null,
      durationMs: tap.durationMs > 0 ? tap.durationMs : null,
    };
    async function update(kind: "key" | "pair", value: string) {
      const id = `${source}:${kind}:${value}`;
      await db.teclas.put(
        updateSkill(
          await db.teclas.get(id),
          id,
          kind,
          value,
          source,
          observation,
        ),
      );
    }
    await update("key", key);
    if (prior)
      await update(
        "pair",
        prior.expected.normalize("NFC").toLocaleLowerCase("pt-BR") + key,
      );
  });
}

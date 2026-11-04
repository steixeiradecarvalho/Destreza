import { db, type MotorRun } from "./db";
import {
  motorSummary,
  type MotorEvent,
  type MotorSettings,
  type MotorSummary,
} from "../core/motor";
export async function beginMotor(
  exercise: string,
  settings: MotorSettings,
  parameters: Record<string, number | string>,
) {
  const run: MotorRun = {
    id: crypto.randomUUID(),
    exercise,
    settings,
    parameters,
    contentVersion: 1,
    startedAt: Date.now(),
    status: "active",
  };
  await db.exercicios.add(run);
  return run.id;
}
export async function finishMotor(
  id: string,
  completed: boolean,
  measure: (events: MotorEvent[]) => MotorSummary = motorSummary,
) {
  return db.transaction("rw", db.exercicios, db.movimentos, async () => {
    const events = await db.movimentos.where("runId").equals(id).toArray();
    const summary = measure(events);
    await db.exercicios.update(id, {
      status: completed ? "completed" : "interrupted",
      summary,
      ...(completed ? { completedAt: Date.now() } : {}),
    });
    return summary;
  });
}

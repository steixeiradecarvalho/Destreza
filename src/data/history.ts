import { db } from "./db";
export function readHistory() {
  return db.transaction("r", db.tables, async () => ({
    taps: await db.toques.toArray(),
    skills: await db.teclas.toArray(),
    native: await db.referencias.toArray(),
    daily: await db.diarias.toArray(),
    sessions: await db.sessoes.toArray(),
    motors: await db.exercicios.toArray(),
    diary: await db.diario.toArray(),
    movements: await db.movimentos.toArray(),
  }));
}
export type History = Awaited<ReturnType<typeof readHistory>>;
export function clearLocalData() {
  return db.transaction("rw", db.tables, async () => {
    for (const table of db.tables) await table.clear();
  });
}

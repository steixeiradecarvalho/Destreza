import Dexie, { type Table } from "dexie";
import { metrics, type Tap } from "../core/typing";
export interface Preferences {
  id: "local";
  consentVersion: number;
  theme: "claro" | "escuro" | "contraste";
  scale: number;
  hand: "direita" | "esquerda";
  grip: "polegar" | "indicador" | "duas";
  sound: boolean;
  vibration: boolean;
  keyboardSize?: number;
  ghost?: boolean;
}
export const defaults: Preferences = {
  id: "local",
  consentVersion: 1,
  theme: "claro",
  scale: 100,
  hand: "direita",
  grip: "polegar",
  sound: false,
  vibration: false,
  keyboardSize: 100,
  ghost: true,
};
export interface Session {
  id: string;
  startedAt: number;
  completedAt?: number;
  level: number;
  status: "active" | "completed" | "interrupted";
  free: boolean;
}
export interface Attempt {
  id: string;
  sessionId: string;
  level: number;
  contentVersion: number;
  completed: boolean;
  free: boolean;
  accuracy: number;
  total: number;
  correct: number;
}
export interface CalibrationPoint {
  x: number | null;
  y: number | null;
  dx: number | null;
  dy: number | null;
  at: number;
  durationMs: number;
  source: string;
}
export interface Profile {
  id: "local";
  calibratedAt: number;
  hand: Preferences["hand"];
  grip: Preferences["grip"];
  points: CalibrationPoint[];
}
export class DestrezaDB extends Dexie {
  config!: Table<Preferences, string>;
  perfil!: Table<Profile, string>;
  sessoes!: Table<Session, string>;
  tentativas!: Table<Attempt, string>;
  toques!: Table<Tap & { id: string }, string>;
  constructor(name = "destreza") {
    super(name);
    this.version(1).stores({ config: "&id" });
    this.version(2).stores({
      config: "&id",
      perfil: "&id",
      sessoes: "&id, startedAt, status",
      tentativas: "&id, sessionId, level",
      toques: "&id, sessionId, attemptId",
    });
  }
}
export const db = new DestrezaDB();
export async function savePreferences(value: Preferences) {
  await db.config.put(value);
}
export async function beginLesson(level: number, free: boolean) {
  const id = crypto.randomUUID();
  await db.transaction("rw", db.sessoes, db.tentativas, async () => {
    // A closed or reloaded lesson remains in the history, but never counts as completed.
    await db.sessoes
      .where("status")
      .equals("active")
      .modify({ status: "interrupted" });
    await db.sessoes.add({
      id,
      startedAt: Date.now(),
      level,
      status: "active",
      free,
    });
    await db.tentativas.add({
      id,
      sessionId: id,
      level,
      contentVersion: 1,
      completed: false,
      free,
      accuracy: 0,
      total: 0,
      correct: 0,
    });
  });
  return id;
}
export async function finishLesson(id: string, complete: boolean) {
  return db.transaction(
    "rw",
    db.sessoes,
    db.tentativas,
    db.toques,
    async () => {
      const taps = await db.toques.where("sessionId").equals(id).toArray();
      const result = metrics(taps);
      await db.tentativas.update(id, {
        completed: complete,
        accuracy: result.accuracy,
        total: result.total,
        correct: result.correct,
      });
      await db.sessoes.update(id, {
        status: complete ? "completed" : "interrupted",
        ...(complete ? { completedAt: Date.now() } : {}),
      });
      return result;
    },
  );
}

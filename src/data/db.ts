import type { AdaptiveState, KeySkill } from "../core/adaptation";
import type { DailyPlan } from "../core/daily";
import Dexie, { type Table } from "dexie";
import type { MotorEvent, MotorSettings, MotorSummary } from "../core/motor";
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
  sessionMinutes?: number;
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
  inputMode?: "training" | "native";
  dailyId?: string;
  endReason?: "timebox" | "abandoned";
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
export interface NativeRun {
  id: string;
  sessionId?: string;
  level?: number;
  kind: "reference" | "lesson";
  status: "active" | "completed" | "interrupted";
  protocolVersion: number;
  startedAt: number;
  finishedAt?: number;
  durationMs: number;
  model: string;
  value: string;
  keyboardNote: string;
  correct: number;
  errors: number;
  evaluated: number;
  entered: number;
  accuracy: number;
  errorsPer100Characters: number;
  wpm: number;
  studyDay?: number;
  pasteBlocked: boolean;
  dailyId?: string;
  segments?: { model: string; value: string; complete: boolean }[];
}
export interface MotorRun {
  id: string;
  exercise: string;
  contentVersion: number;
  dailyId?: string;
  dailyRole?: "warmup" | "hands";
  activeMs?: number;
  settings: MotorSettings;
  parameters: Record<string, number | string>;
  startedAt: number;
  completedAt?: number;
  status: "active" | "completed" | "interrupted";
  summary?: MotorSummary;
}
export interface StoredMotorEvent extends MotorEvent {
  id: string;
  runId: string;
  exercise: string;
  difficulty?: 1 | 2 | 3;
  handMode?: string;
}
export interface DailyRun {
  id: string;
  day: string;
  startedAt: number;
  completedAt?: number;
  status: "active" | "paused" | "completed" | "interrupted";
  plan: DailyPlan;
  stageIndex: number;
  stageElapsedMs: number;
  activeMs: number;
  completedStages: string[];
}
export interface DiaryEntry {
  id: string;
  dailyId: string;
  day: string;
  at: number;
  rating: number | null;
  pain: boolean;
  note: string;
}
export class DestrezaDB extends Dexie {
  adaptacao!: Table<AdaptiveState, string>;
  teclas!: Table<KeySkill, string>;
  diarias!: Table<DailyRun, string>;
  diario!: Table<DiaryEntry, string>;
  exercicios!: Table<MotorRun, string>;
  movimentos!: Table<StoredMotorEvent, string>;
  referencias!: Table<NativeRun, string>;
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
    this.version(3).stores({
      referencias: "&id, kind, status, startedAt, sessionId",
    });
    this.version(4).stores({
      exercicios: "&id, exercise, startedAt, status",
      movimentos: "&id, runId, exercise",
    });
    this.version(5).stores({
      adaptacao: "&id",
      teclas: "&id, kind, dueAt",
      diarias: "&id, day, status, startedAt",
      diario: "&id, dailyId, day",
    });
  }
}
export const db = new DestrezaDB();
export async function savePreferences(value: Preferences) {
  await db.config.put(value);
}
export async function beginLesson(
  level: number,
  free: boolean,
  inputMode: "training" | "native" = "training",
  dailyId?: string,
) {
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
      inputMode,
      dailyId,
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
export async function finishLesson(
  id: string,
  complete: boolean,
  endReason?: "timebox" | "abandoned",
) {
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
        ...(endReason ? { endReason } : {}),
        ...(complete ? { completedAt: Date.now() } : {}),
      });
      return result;
    },
  );
}

export async function finishNativeLesson(
  id: string,
  complete: boolean,
  endReason?: "timebox" | "abandoned",
) {
  return db.transaction(
    "rw",
    db.sessoes,
    db.tentativas,
    db.referencias,
    async () => {
      const runs = await db.referencias.where("sessionId").equals(id).toArray();
      const total = runs.reduce((sum, run) => sum + run.evaluated, 0);
      const correct = runs.reduce((sum, run) => sum + run.correct, 0);
      await db.tentativas.update(id, {
        completed: complete,
        total,
        correct,
        accuracy: total ? (correct / total) * 100 : 0,
      });
      await db.sessoes.update(id, {
        status: complete ? "completed" : "interrupted",
        ...(endReason ? { endReason } : {}),
        ...(complete ? { completedAt: Date.now() } : {}),
      });
    },
  );
}

import { db, type DailyRun, type Preferences, type DiaryEntry } from "./db";
import { dailyPlan, decliningDays } from "../core/daily";
import { dayKey, addDays, reviewKeys } from "../core/adaptation";
import { unlockedLevel } from "../core/typing";
import { referenceDay, referenceDue } from "../core/native";
import content from "../content/teclado.json";
export async function prepareDaily(
  prefs: Preferences,
  light = false,
  now = Date.now(),
) {
  const [attempts, keys, references, runs, diary, sessions] = await Promise.all(
    [
      db.tentativas.toArray(),
      db.teclas.toArray(),
      db.referencias.toArray(),
      db.diarias.toArray(),
      db.diario.toArray(),
      db.sessoes.toArray(),
    ],
  );
  const active = runs
    .filter((row) => row.status === "active" || row.status === "paused")
    .sort((a, b) => b.startedAt - a.startedAt)[0];
  const level = unlockedLevel(attempts),
    lesson = content.levels.find((row) => row.id === Math.min(10, level))!;
  const completed = references.filter(
    (row) =>
      row.kind === "reference" && row.status === "completed" && row.entered > 0,
  );
  const due = referenceDue(completed.map((row) => row.studyDay ?? 1));
  const first = completed.length
    ? Math.min(...completed.map((row) => row.startedAt))
    : now;
  const history = new Map<string, { correct: number; total: number }>();
  for (const attempt of attempts) {
    const session = sessions.find((row) => row.id === attempt.sessionId);
    if (!session || session.inputMode === "native" || !attempt.total) continue;
    const day = dayKey(session.startedAt),
      value = history.get(day) ?? { correct: 0, total: 0 };
    value.correct += attempt.correct;
    value.total += attempt.total;
    history.set(day, value);
  }
  const decline = decliningDays(
    [...history].map(([day, value]) => ({
      day,
      accuracy: (value.correct / value.total) * 100,
    })),
    now,
  );
  const rest = diary.some(
    (row) =>
      row.pain &&
      (row.day === dayKey(now) || row.day === dayKey(addDays(now, -1))),
  );
  const plan = dailyPlan({
    now,
    minutes: prefs.sessionMinutes,
    light,
    level,
    review: reviewKeys(
      keys,
      lesson.warmup + lesson.core + lesson.challenge,
      now,
    ),
    completedCount: runs.filter((row) => row.status === "completed").length,
    referenceDue:
      !completed.length || (!!due && referenceDay(first, now) >= due),
  });
  return { active, plan, decline, rest };
}
export async function startDaily(plan: DailyRun["plan"]): Promise<DailyRun> {
  const row: DailyRun = {
    id: crypto.randomUUID(),
    day: plan.day,
    startedAt: Date.now(),
    status: "active",
    plan,
    stageIndex: 0,
    stageElapsedMs: 0,
    activeMs: 0,
    completedStages: [],
  };
  await db.diarias.add(row);
  return row;
}
export async function closeDaily(
  run: DailyRun,
  entry: Omit<DiaryEntry, "id" | "dailyId" | "day" | "at">,
) {
  await db.transaction("rw", db.diarias, db.diario, async () => {
    await db.diario.put({
      ...entry,
      id: run.id,
      dailyId: run.id,
      day: dayKey(Date.now()),
      at: Date.now(),
    });
    await db.diarias.update(run.id, {
      status: "completed",
      completedAt: Date.now(),
      completedStages: run.plan.stages,
    });
  });
}
export async function resumeDaily(row: DailyRun) {
  // An interrupted leaf is retained; the new activity uses the remaining stage budget.
  await db.transaction(
    "rw",
    db.diarias,
    db.sessoes,
    db.exercicios,
    db.referencias,
    async () => {
      await db.sessoes
        .where("status")
        .equals("active")
        .filter((value) => value.dailyId === row.id)
        .modify({ status: "interrupted" });
      await db.exercicios
        .where("status")
        .equals("active")
        .filter((value) => value.dailyId === row.id)
        .modify({ status: "interrupted" });
      await db.referencias
        .where("status")
        .equals("active")
        .filter((value) => value.dailyId === row.id)
        .modify({ status: "interrupted" });
      await db.diarias.update(row.id, { status: "active" });
    },
  );
  return { ...row, status: "active" as const };
}

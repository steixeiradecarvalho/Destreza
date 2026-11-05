import { addDays, dayKey, type KeySkill } from "./adaptation";
import type { Tap } from "./typing";
import type { DailyRun, Session, MotorRun, NativeRun } from "../data/db";
export function weekKey(at: number) {
  const date = new Date(at);
  return dayKey(addDays(at, -((date.getDay() + 6) % 7)));
}
export function weeklyTyping(taps: Tap[], source: string) {
  const weeks = new Map<string, Tap[]>();
  for (const tap of taps.filter((t) => t.source === source)) {
    const key = weekKey(tap.at);
    weeks.set(key, [...(weeks.get(key) ?? []), tap]);
  }
  return [...weeks]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, rows]) => {
      const correct = rows.filter((t) => t.correct).length;
      const intervals: number[] = [];
      const last = new Map<string, number>();
      for (const row of [...rows].sort((a, b) => a.at - b.at)) {
        const before = last.get(row.attemptId);
        // Long reading breaks and pauses are not rhythm samples.
        if (
          before !== undefined &&
          row.elapsedMs >= before &&
          row.elapsedMs - before <= 10000
        )
          intervals.push(row.elapsedMs - before);
        last.set(row.attemptId, row.elapsedMs);
      }
      const mean = intervals.length
        ? intervals.reduce((a, b) => a + b, 0) / intervals.length
        : null;
      return {
        week,
        total: rows.length,
        accuracy: (correct / rows.length) * 100,
        errorsPer100: ((rows.length - correct) / rows.length) * 100,
        corrections:
          (rows.filter((t) => t.operation === "delete").length / rows.length) *
          100,
        rhythmMs: mean,
        variationMs:
          mean === null
            ? null
            : Math.sqrt(
                intervals.reduce((sum, n) => sum + (n - mean) ** 2, 0) /
                  intervals.length,
              ),
      };
    });
}
export function practicedDays(
  daily: DailyRun[],
  sessions: Session[],
  motors: MotorRun[],
) {
  return [
    ...new Set(
      [...daily, ...sessions, ...motors]
        .filter((r) => r.status === "completed")
        .map((r) => dayKey(r.completedAt ?? r.startedAt)),
    ),
  ].sort();
}
export function rankedKeys(skills: KeySkill[], source: string) {
  const rows = skills.filter((k) => k.kind === "key" && k.source === source);
  return {
    best: [...rows].sort((a, b) => b.accuracy - a.accuracy).slice(0, 3),
    practice: [...rows]
      .filter((k) => k.state !== "mastered")
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 3),
  };
}
export function referenceComparison(rows: NativeRun[]) {
  const valid = rows
    .filter(
      (r) =>
        r.kind === "reference" && r.status === "completed" && r.entered > 0,
    )
    .sort((a, b) => a.startedAt - b.startedAt);
  const first = valid.find((r) => r.studyDay === 1);
  const final = valid.find(
    (r) => r.studyDay === 28 && r.protocolVersion === first?.protocolVersion,
  );
  return first && final ? { first, final } : null;
}

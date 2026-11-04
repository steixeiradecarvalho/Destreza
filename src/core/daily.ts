import { addDays, dayKey } from "./adaptation";
export type DailyStage =
  "warmup" | "reference" | "typing" | "hands" | "closing";
export interface DailyPlan {
  version: 1;
  day: string;
  minutes: number;
  light: boolean;
  level: number;
  review: string;
  motor: string;
  handMode: "dominant" | "other";
  budgets: Record<DailyStage, number>;
  stages: DailyStage[];
  referenceDue: boolean;
}
export interface DailyPerformance {
  day: string;
  accuracy: number;
}
export function decliningDays(history: DailyPerformance[], now: number) {
  const days = [-3, -2, -1].map((offset) => dayKey(addDays(now, offset)));
  const values = days.map(
    (day) => history.find((row) => row.day === day)?.accuracy,
  );
  return (
    values.every((value) => value !== undefined) &&
    values[0]! > values[1]! &&
    values[1]! > values[2]!
  );
}
export function dailyPlan({
  now,
  minutes = 11,
  light = false,
  level,
  review,
  completedCount,
  referenceDue,
}: {
  now: number;
  minutes?: number;
  light?: boolean;
  level: number;
  review: string;
  completedCount: number;
  referenceDue: boolean;
}): DailyPlan {
  const duration = light ? 8 : Math.max(10, Math.min(12, minutes));
  const motor = ["sequencia", "gestos", "alvos"][completedCount % 3];
  const warmup = 60000,
    hands = (light ? 2 : 3) * 60000,
    closing = 60000,
    reference = referenceDue ? 120000 : 0;
  const typing = duration * 60000 - warmup - hands - closing - reference;
  return {
    version: 1,
    day: dayKey(now),
    minutes: duration,
    light,
    level,
    review,
    motor,
    handMode: completedCount % 2 ? "other" : "dominant",
    referenceDue,
    budgets: { warmup, reference, typing, hands, closing },
    stages: referenceDue
      ? ["warmup", "reference", "typing", "hands", "closing"]
      : ["warmup", "typing", "hands", "closing"],
  };
}

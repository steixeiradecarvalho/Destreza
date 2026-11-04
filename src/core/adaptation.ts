export interface AdaptiveState {
  id: string;
  observedLevel: 1 | 2 | 3;
  recommendation: 1 | 2 | 3;
  count: number;
  correct: number;
  updatedAt: number;
}
export function adaptBlock(
  level: 1 | 2 | 3,
  correct: number,
  total: number,
): 1 | 2 | 3 {
  if (total < 10) return level;
  const ratio = correct / total;
  return Math.max(
    1,
    Math.min(3, level + (ratio >= 0.9 ? 1 : ratio < 0.7 ? -1 : 0)),
  ) as 1 | 2 | 3;
}
export function observeAction(
  previous: AdaptiveState | undefined,
  id: string,
  level: 1 | 2 | 3,
  correct: boolean,
  now: number,
): AdaptiveState {
  const state =
    previous?.observedLevel === level
      ? { ...previous }
      : {
          id,
          observedLevel: level,
          recommendation: level,
          count: 0,
          correct: 0,
          updatedAt: now,
        };
  state.count++;
  state.correct += Number(correct);
  state.updatedAt = now;
  if (state.count === 10) {
    state.recommendation = adaptBlock(level, state.correct, 10);
    state.count = 0;
    state.correct = 0;
  }
  return state;
}
export interface KeyObservation {
  id: string;
  at: number;
  correct: boolean;
  offset: number | null;
  durationMs: number | null;
}
export interface KeySkill {
  id: string;
  kind: "key" | "pair";
  key: string;
  source: string;
  state: "new" | "training" | "mastered";
  observations: KeyObservation[];
  accuracy: number;
  meanOffset: number | null;
  meanDurationMs: number | null;
  interval: 0 | 1 | 2 | 3;
  dueAt: number;
}
export function addDays(at: number, days: number) {
  const date = new Date(at);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return date.getTime();
}
export function dayKey(at: number) {
  const d = new Date(at);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function updateSkill(
  previous: KeySkill | undefined,
  id: string,
  kind: KeySkill["kind"],
  key: string,
  source: string,
  observation: KeyObservation,
): KeySkill {
  if (previous?.observations.some((item) => item.id === observation.id))
    return previous;
  const observations = [...(previous?.observations ?? []), observation].slice(
    -30,
  );
  const accuracy =
    (observations.filter((item) => item.correct).length / observations.length) *
    100;
  const offsets = observations.flatMap((item) =>
    item.offset === null ? [] : [item.offset],
  );
  const times = observations.flatMap((item) =>
    item.durationMs === null ? [] : [item.durationMs],
  );
  const meanOffset = offsets.length
    ? offsets.reduce((a, b) => a + b, 0) / offsets.length
    : null;
  const meanDurationMs = times.length
    ? times.reduce((a, b) => a + b, 0) / times.length
    : null;
  const mastered =
    observations.length === 30 &&
    accuracy >= 90 &&
    (meanOffset === null || meanOffset <= 0.35) &&
    (meanDurationMs === null || meanDurationMs <= 800);
  let interval: KeySkill["interval"] = previous?.interval ?? 0,
    dueAt = previous?.dueAt ?? observation.at;
  if (!mastered) {
    interval = 0;
    dueAt = observation.at;
  } else if (previous?.state !== "mastered") {
    interval = 0;
    dueAt = addDays(observation.at, 1);
  } else if (observation.at >= dueAt) {
    interval = Math.min(3, interval + 1) as KeySkill["interval"];
    dueAt = addDays(observation.at, [1, 2, 4, 8][interval]);
  }
  return {
    id,
    kind,
    key,
    source,
    state: mastered ? "mastered" : observations.length < 3 ? "new" : "training",
    observations,
    accuracy,
    meanOffset,
    meanDurationMs,
    interval,
    dueAt,
  };
}
export function reviewKeys(
  skills: KeySkill[],
  allowed: string,
  now: number,
  length = 10,
) {
  const characters = new Set(
    Array.from(allowed.normalize("NFC").toLocaleLowerCase("pt-BR")),
  );
  const candidates = skills.filter(
    (skill) =>
      Array.from(skill.key).every((key) => characters.has(key)) &&
      (skill.state !== "mastered" || skill.dueAt <= now),
  );
  const ranked = candidates.sort(
    (a, b) =>
      (b.state !== "mastered" ? 100 : 0) +
      (100 - b.accuracy) -
      (a.state !== "mastered" ? 100 : 0) -
      (100 - a.accuracy),
  );
  const pieces = ranked
    .slice(0, 5)
    .flatMap((skill) =>
      Array(Math.max(1, Math.ceil((100 - skill.accuracy) / 25))).fill(
        skill.key,
      ),
    );
  const pool =
    pieces.join("") ||
    Array.from(allowed)
      .filter((key) => key !== " ")
      .slice(0, 10)
      .join("") ||
    "aeiou";
  return Array.from({ length }, (_, i) => pool[i % pool.length]).join("");
}

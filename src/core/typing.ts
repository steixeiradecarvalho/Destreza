export interface Tap {
  sessionId: string;
  attemptId: string;
  expected: string;
  actual: string | null;
  at: number;
  elapsedMs: number;
  durationMs: number;
  source: string;
  x: number | null;
  y: number | null;
  dx: number | null;
  dy: number | null;
  targetWidth: number | null;
  targetHeight: number | null;
  pressure: number | null;
  correct: boolean;
}
export function metrics(taps: Tap[]) {
  const correct = taps.filter((t) => t.correct).length;
  const pointer = taps.filter(
    (t) => t.dx !== null && t.dy !== null && t.targetWidth && t.targetHeight,
  );
  return {
    total: taps.length,
    correct,
    accuracy: taps.length ? (correct / taps.length) * 100 : 0,
    errorsPer100: taps.length
      ? ((taps.length - correct) / taps.length) * 100
      : 0,
    meanOffsetInKeys: pointer.length
      ? pointer.reduce(
          (sum, t) =>
            sum + Math.hypot(t.dx! / t.targetWidth!, t.dy! / t.targetHeight!),
          0,
        ) / pointer.length
      : null,
  };
}
// Only pointer events can have a location. Keyboard input is never treated as tremor.
export function repeatedTap(
  previous: { at: number; x: number; y: number } | null,
  current: { at: number; x: number; y: number },
) {
  return (
    !!previous &&
    current.at >= previous.at &&
    current.at - previous.at < 150 &&
    Math.hypot(current.x - previous.x, current.y - previous.y) <= 12
  );
}
export function unlockedLevel(
  attempts: {
    level: number;
    completed: boolean;
    free: boolean;
    accuracy: number;
  }[],
) {
  let level = 1;
  while (
    level < 6 &&
    attempts.filter(
      (a) => a.level === level && a.completed && !a.free && a.accuracy >= 85,
    ).length >= 3
  )
    level++;
  return level;
}

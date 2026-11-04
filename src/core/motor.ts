export type HandMode = "dominant" | "other" | "both";
export type TraceShape = "reta" | "onda" | "espiral" | "oito";
export interface MotorSettings {
  difficulty: 1 | 2 | 3;
  handMode: HandMode;
  dominant: "direita" | "esquerda";
  shape: TraceShape;
}
export interface MotorPoint {
  x: number;
  y: number;
  t: number;
  pressure: number | null;
  pointerId?: number;
  pointerType?: string;
}
export interface MotorEvent {
  kind: "tap" | "trace" | "sequence" | "gesture";
  correct: boolean;
  source: "pointer" | "accessible";
  at: number;
  durationMs: number;
  requestedHand: string;
  width: number;
  height: number;
  points: MotorPoint[];
  reactionMs?: number;
  expected?: string;
  actual?: string;
  details: Record<string, number | string | boolean | null>;
}
export interface MotorSummary {
  total: number;
  correct: number;
  accuracy: number;
  meanReactionMs: number | null;
  meanDeviationPx: number | null;
  insidePercent: number | null;
}
export function motorSummary(events: MotorEvent[]): MotorSummary {
  const reaction = events.filter(
    (e) => e.source === "pointer" && e.reactionMs !== undefined,
  );
  const traces = events.filter(
    (e) => e.kind === "trace" && e.source === "pointer",
  );
  const correct = events.filter((e) => e.correct).length;
  return {
    total: events.length,
    correct,
    accuracy: events.length ? (correct / events.length) * 100 : 0,
    meanReactionMs: reaction.length
      ? reaction.reduce((sum, e) => sum + e.reactionMs!, 0) / reaction.length
      : null,
    meanDeviationPx: traces.length
      ? traces.reduce((sum, e) => sum + Number(e.details.deviationPx), 0) /
        traces.length
      : null,
    insidePercent: traces.length
      ? traces.reduce((sum, e) => sum + Number(e.details.insidePercent), 0) /
        traces.length
      : null,
  };
}
export function requestedHand(settings: MotorSettings, index: number) {
  const other = settings.dominant === "direita" ? "esquerda" : "direita";
  return settings.handMode === "other"
    ? other
    : settings.handMode === "both" && index % 2
      ? other
      : settings.dominant;
}
export function pathPoints(shape: TraceShape, width: number, height: number) {
  return Array.from({ length: 101 }, (_, i) => {
    const t = i / 100;
    if (shape === "reta") return { x: width * (0.15 + 0.7 * t), y: height / 2 };
    if (shape === "onda")
      return {
        x: width * (0.15 + 0.7 * t),
        y: height * (0.5 + 0.22 * Math.sin(t * Math.PI * 2)),
      };
    if (shape === "oito")
      return {
        x: width * (0.5 + 0.32 * Math.sin(t * Math.PI * 2)),
        y: height * (0.5 + 0.27 * Math.sin(t * Math.PI * 4)),
      };
    const r = 0.32 * (1 - t) + 0.035;
    return {
      x: width * (0.5 + r * Math.cos(Math.PI + t * 4 * Math.PI)),
      y: height * (0.5 + r * Math.sin(Math.PI + t * 4 * Math.PI)),
    };
  });
}
export function traceQuality(
  points: Pick<MotorPoint, "x" | "y">[],
  path: { x: number; y: number }[],
  bandWidth: number,
) {
  if (!points.length || !path.length)
    return { correct: false, deviationPx: 0, insidePercent: 0, coverage: 0 };
  const samples: { x: number; y: number }[] = [points[0]];
  // Geometric resampling prevents a sparse/faster stroke from skipping an entire path.
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1],
      b = points[i],
      steps = Math.min(
        200,
        Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 4)),
      );
    for (let j = 1; j <= steps; j++)
      samples.push({
        x: a.x + ((b.x - a.x) * j) / steps,
        y: a.y + ((b.y - a.y) * j) / steps,
      });
  }
  let cursor = 0,
    inside = 0,
    totalDeviation = 0;
  for (const p of samples) {
    let nearest = cursor,
      distance = Infinity;
    for (
      let j = Math.max(0, cursor - 4);
      j <= Math.min(path.length - 1, cursor + 10);
      j++
    ) {
      const d = Math.hypot(p.x - path[j].x, p.y - path[j].y);
      if (d < distance) {
        distance = d;
        nearest = j;
      }
    }
    cursor = Math.max(cursor, nearest);
    if (distance <= bandWidth / 2) inside++;
    totalDeviation += distance;
  }
  const start =
    Math.hypot(points[0].x - path[0].x, points[0].y - path[0].y) <= 32;
  const end = path[path.length - 1],
    last = points[points.length - 1];
  const coverage = cursor / (path.length - 1);
  const insidePercent = (inside / samples.length) * 100;
  return {
    correct:
      start &&
      coverage >= 0.92 &&
      Math.hypot(last.x - end.x, last.y - end.y) <= 32 &&
      insidePercent >= 70,
    deviationPx: totalDeviation / samples.length,
    insidePercent,
    coverage,
  };
}
export function targetPoint(
  position: number[],
  size: number,
  width: number,
  height: number,
) {
  const margin = size / 2 + 8;
  return {
    x: margin + (width - 2 * margin) * position[0],
    y: margin + (height - 2 * margin) * position[1],
  };
}
export function withinTarget(
  point: { x: number; y: number },
  center: { x: number; y: number },
  diameter: number,
) {
  return Math.hypot(point.x - center.x, point.y - center.y) <= diameter / 2;
}
export function gestureCorrect(
  gesture: string,
  value: number,
  tolerance: number,
) {
  if (gesture === "pinch") return Math.abs(value - 1.5) <= tolerance;
  if (gesture === "rotate") return Math.abs(value - 30) <= tolerance * 80;
  if (gesture === "scroll") return Math.abs(value) <= tolerance * 140;
  return value >= 1;
}
export function sequenceFor(seed: number, round: number, length: number) {
  let value = (seed + round * 104729) >>> 0;
  const pattern: number[] = [];
  for (let i = 0; i < length; i++) {
    value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
    let next = ((value >>> 16) % 4) + 1;
    if (next === pattern.at(-1)) next = (next % 4) + 1;
    pattern.push(next);
  }
  return pattern;
}

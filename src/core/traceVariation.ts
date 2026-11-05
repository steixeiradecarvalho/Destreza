import type { MotorPoint } from "./motor";
// Descriptive high-pass residual at a common 50 Hz sampling grid, in CSS pixels.
// Sparse event streams cannot support this calculation; no physical/medical inference.
export function traceVariation(points: MotorPoint[]): number | null {
  if (points.length < 6) return null;
  const duration = points.at(-1)!.t - points[0].t;
  if (duration < 120 || duration > 120000) return null;
  for (let i = 1; i < points.length; i++)
    if (points[i].t - points[i - 1].t > 50 || points[i].t < points[i - 1].t)
      return null;
  const samples: { x: number; y: number }[] = [];
  let cursor = 1;
  for (let at = points[0].t; at <= points.at(-1)!.t; at += 20) {
    while (cursor < points.length - 1 && points[cursor].t < at) cursor++;
    const a = points[cursor - 1],
      b = points[cursor],
      ratio = (at - a.t) / (b.t - a.t || 1);
    samples.push({
      x: a.x + (b.x - a.x) * ratio,
      y: a.y + (b.y - a.y) * ratio,
    });
  }
  let sum = 0,
    count = 0;
  for (let i = 2; i < samples.length - 2; i++) {
    const window = samples.slice(i - 2, i + 3),
      x = window.reduce((s, p) => s + p.x, 0) / 5,
      y = window.reduce((s, p) => s + p.y, 0) / 5;
    sum += (samples[i].x - x) ** 2 + (samples[i].y - y) ** 2;
    count++;
  }
  return count ? Math.sqrt(sum / count) : null;
}

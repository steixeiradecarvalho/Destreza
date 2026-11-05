export function rhythmScore(
  expectedSide: number,
  actualSide: number,
  elapsed: number | null,
  interval: number,
) {
  return {
    correct:
      expectedSide === actualSide &&
      (elapsed === null || Math.abs(elapsed - interval) <= interval * 0.4),
    offsetMs: elapsed === null ? null : elapsed - interval,
  };
}
export function classification(index: number, rule: number) {
  // Content order is versioned with the original labels in textos.ts.
  return rule === 0
    ? index % 3
    : [0, 4, 5, 6, 9, 10, 11].includes(index)
      ? 0
      : 1;
}
export function appendZone(values: string[], zone: string | null) {
  if (zone !== null && values.at(-1) !== zone) values.push(zone);
}
export function patternFor(length: number) {
  return [1, 5, 3, 6, 8].slice(0, length);
}
export function pathDeviation(
  points: { x: number; y: number }[],
  path: { x: number; y: number }[],
) {
  if (!points.length || path.length < 2)
    return { deviationPx: 0, insidePercent: 0 };
  const distances = points.map((p) =>
    Math.min(
      ...path.slice(1).map((b, i) => {
        const a = path[i],
          dx = b.x - a.x,
          dy = b.y - a.y;
        const t = Math.max(
          0,
          Math.min(
            1,
            ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy || 1),
          ),
        );
        return Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy);
      }),
    ),
  );
  return {
    deviationPx: distances.reduce((a, b) => a + b, 0) / distances.length,
    insidePercent:
      (distances.filter((d) => d <= 24).length / distances.length) * 100,
  };
}

// In a swipe, intermediate keys may lie between the requested waypoints.
export function appendExpectedZone(
  values: string[],
  zone: string | null,
  expected: string[],
) {
  if (zone !== null && zone === expected[values.length]) values.push(zone);
}

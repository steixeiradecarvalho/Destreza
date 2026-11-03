export function scoreNative(model: string, value: string, complete = false) {
  const expected = Array.from(model.normalize("NFC").replace(/\r\n/g, "\n"));
  const entered = Array.from(value.normalize("NFC").replace(/\r\n/g, "\n"));
  const rows = Array.from(
    { length: entered.length + 1 },
    () => new Uint32Array(expected.length + 1),
  );
  for (let j = 0; j <= expected.length; j++) rows[0][j] = j;
  for (let i = 1; i <= entered.length; i++) {
    rows[i][0] = i;
    for (let j = 1; j <= expected.length; j++)
      rows[i][j] = Math.min(
        rows[i - 1][j] + 1,
        rows[i][j - 1] + 1,
        rows[i - 1][j - 1] + (entered[i - 1] === expected[j - 1] ? 0 : 1),
      );
  }
  // A timed test does not count the untouched suffix of its model as omissions.
  let end = 0;
  for (let j = 1; j <= expected.length; j++) {
    const cost = rows[entered.length][j];
    const best = rows[entered.length][end];
    if (
      cost < best ||
      (cost === best &&
        Math.abs(j - entered.length) <= Math.abs(end - entered.length))
    )
      end = j;
  }
  if (complete) end = expected.length;
  let i = entered.length,
    j = end,
    correct = 0,
    substitutions = 0,
    insertions = 0,
    omissions = 0;
  while (i || j) {
    if (
      i &&
      j &&
      entered[i - 1] === expected[j - 1] &&
      rows[i][j] === rows[i - 1][j - 1]
    ) {
      correct++;
      i--;
      j--;
    } else if (i && j && rows[i][j] === rows[i - 1][j - 1] + 1) {
      substitutions++;
      i--;
      j--;
    } else if (i && rows[i][j] === rows[i - 1][j] + 1) {
      insertions++;
      i--;
    } else {
      omissions++;
      j--;
    }
  }
  const errors = substitutions + insertions + omissions;
  const evaluated = Math.max(end, entered.length);
  return {
    correct,
    errors,
    substitutions,
    insertions,
    omissions,
    evaluated,
    entered: entered.length,
    accuracy: evaluated ? (correct / evaluated) * 100 : 0,
    errorsPer100Characters: evaluated ? (errors / evaluated) * 100 : 0,
  };
}
export function scoreComplete(model: string, value: string) {
  return scoreNative(model, value, true);
}
export function wordsPerMinute(correct: number, durationMs: number) {
  return durationMs > 0 ? correct / 5 / (durationMs / 60000) : 0;
}
export function referenceDay(firstAt: number, now: number) {
  // Calendar days in the local timezone, independent of 23/25-hour DST days.
  const day = (stamp: number) => {
    const d = new Date(stamp);
    return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000;
  };
  return Math.max(1, day(now) - day(firstAt) + 1);
}
export function referenceDue(days: number[]) {
  return [1, 7, 14, 21, 28].find((day) => day > Math.max(0, ...days)) ?? null;
}

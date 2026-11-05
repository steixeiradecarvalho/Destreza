import { db } from "./db";
const columns = [
  "id",
  "kind",
  "level",
  "status",
  "protocolVersion",
  "startedAt",
  "finishedAt",
  "durationMs",
  "studyDay",
  "correct",
  "errors",
  "evaluated",
  "entered",
  "accuracy",
  "errorsPer100Characters",
  "wpm",
  "keyboardNote",
  "pasteBlocked",
  "model",
  "value",
] as const;
function cell(value: unknown) {
  let text = value == null ? "" : String(value);
  // Quoting alone does not prevent spreadsheet formula execution.
  if (/^[\s]*[=+@-]/.test(text)) text = "'" + text;
  return '"' + text.replaceAll('"', '""') + '"';
}
export function csvNative(rows: Record<string, unknown>[]) {
  return (
    "\uFEFF" +
    [
      columns.join(","),
      ...rows.map((row) =>
        columns
          .map((key) =>
            cell(
              (key === "model" || key === "value") &&
                Array.isArray(row.segments)
                ? [
                    ...row.segments.map((part) =>
                      String((part as Record<string, unknown>)[key] ?? ""),
                    ),
                    row[key],
                  ].join("\n")
                : row[key],
            ),
          )
          .join(","),
      ),
    ].join("\r\n")
  );
}
export function csvAll(data: Record<string, unknown>) {
  const records = Object.entries(data).flatMap(([collection, rows]) =>
    Array.isArray(rows)
      ? rows.map((row) => ({ collection, ...row }) as Record<string, unknown>)
      : [],
  );
  const keys = [
    ...new Set([
      "collection",
      "id",
      ...records.flatMap((row) => Object.keys(row)),
    ]),
  ];
  return (
    "\uFEFF" +
    [
      keys.join(","),
      ...records.map((row) =>
        keys
          .map((key) =>
            cell(
              typeof row[key] === "object" && row[key] !== null
                ? JSON.stringify(row[key])
                : row[key],
            ),
          )
          .join(","),
      ),
    ].join("\r\n")
  );
}
export async function exportData(format: "json" | "csv") {
  const result = await db.transaction("r", db.tables, async () => {
    const [
      preferences,
      profiles,
      sessions,
      attempts,
      taps,
      native,
      motorRuns,
      movements,
      adaptation,
      keySkills,
      dailyRuns,
      diary,
    ] = await Promise.all([
      db.config.toArray(),
      db.perfil.toArray(),
      db.sessoes.toArray(),
      db.tentativas.toArray(),
      db.toques.toArray(),
      db.referencias.toArray(),
      db.exercicios.toArray(),
      db.movimentos.toArray(),
      db.adaptacao.toArray(),
      db.teclas.toArray(),
      db.diarias.toArray(),
      db.diario.toArray(),
    ]);
    return {
      schemaVersion: 5,
      exportedAt: new Date().toISOString(),
      preferences,
      profiles,
      sessions,
      attempts,
      taps,
      native,
      motorRuns,
      movements,
      adaptation,
      keySkills,
      dailyRuns,
      diary,
    };
  });
  const body =
    format === "json" ? JSON.stringify(result, null, 2) : csvAll(result);
  const blob = new Blob([body], {
    type:
      format === "json"
        ? "application/json;charset=utf-8"
        : "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `destreza-${new Date().toISOString().slice(0, 10)}.${format}`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}

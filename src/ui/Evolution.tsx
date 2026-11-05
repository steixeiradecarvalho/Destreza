import { useEffect, useState } from "preact/hooks";
import { readHistory, type History } from "../data/history";
import { dayKey, addDays } from "../core/adaptation";
import {
  weeklyTyping,
  practicedDays,
  rankedKeys,
  referenceComparison,
  weekKey,
} from "../core/evolution";
import { exercises, type ExerciseId } from "../modules/maos/registry";
import { motorSummary } from "../core/motor";
import { textos as t } from "./textos";
const number = (value: number | null) =>
  value === null
    ? t.unavailable
    : new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(
        value,
      );
const date = (value: number) => new Date(value).toLocaleDateString("pt-BR");
const localDate = (key: string) => date(new Date(key + "T12:00:00").getTime());
export function Evolution({
  diaryOnly = false,
  onExit,
}: {
  diaryOnly?: boolean;
  onExit: () => void;
}) {
  const [data, setData] = useState<History | null>(null),
    [error, setError] = useState(false);
  const [motorId, setMotorId] = useState<ExerciseId>("trilha");
  const [source, setSource] = useState<keyof typeof t.sources>("pointer");
  async function load() {
    setError(false);
    try {
      setData(await readHistory());
    } catch {
      setError(true);
    }
  }
  useEffect(() => {
    void load();
  }, []);
  const weekly = data ? weeklyTyping(data.taps, source) : [];
  const days = data
    ? practicedDays(data.daily, data.sessions, data.motors)
    : [];
  const monday = weekKey(Date.now());
  const rank = data
    ? rankedKeys(data.skills, source)
    : { best: [], practice: [] };
  const reference =
    data?.native
      .filter(
        (r) =>
          r.kind === "reference" && r.status === "completed" && r.entered > 0,
      )
      .sort((a, b) => a.startedAt - b.startedAt) ?? [];
  const comparison = referenceComparison(reference);
  const fine =
    data?.movements
      .filter(
        (m) =>
          m.exercise === motorId &&
          m.source === "pointer" &&
          typeof m.details.fineVariationPx === "number",
      )
      .map((m) => Number(m.details.fineVariationPx)) ?? [];
  const hands = motorSummary(
    data?.movements.filter(
      (m) => m.exercise === motorId && m.source === source,
    ) ?? [],
  );
  return (
    <>
      {error && (
        <div role="alert">
          <p>{t.lessonError}</p>
          <button onClick={() => void load()}>{t.retry}</button>
        </div>
      )}
      {!data && !error && <p role="status">{t.loading}</p>}
      {data && (
        <>
          {!diaryOnly && (
            <>
              <p>{t.evolutionHelp}</p>
              <fieldset>
                <legend>{t.inputSource}</legend>
                {(Object.keys(t.sources) as (keyof typeof t.sources)[]).map(
                  (key) => (
                    <label class="choice">
                      <input
                        type="radio"
                        name="history-source"
                        checked={source === key}
                        onChange={() => setSource(key)}
                      />
                      {t.sources[key]}
                    </label>
                  ),
                )}
              </fieldset>
              <section class="card">
                <h2>{t.weekly}</h2>
                {!weekly.length && <p>{t.noData}</p>}
                {weekly.length > 1 && <p>{t.chartLegend}</p>}
                {weekly.length > 1 && (
                  <svg
                    viewBox="0 0 300 130"
                    class="weekly-chart"
                    role="img"
                    aria-label={t.weekly}
                  >
                    <path d="M10 10V110H290" />
                    <polyline
                      class="accuracy-line"
                      points={weekly
                        .map(
                          (r, i) =>
                            `${10 + (i * 280) / (weekly.length - 1)},${110 - r.accuracy}`,
                        )
                        .join(" ")}
                    />
                    <polyline
                      class="errors-line"
                      points={weekly
                        .map(
                          (r, i) =>
                            `${10 + (i * 280) / (weekly.length - 1)},${110 - r.errorsPer100}`,
                        )
                        .join(" ")}
                    />
                  </svg>
                )}
                {weekly.map((row) => (
                  <article class="history-block">
                    <h3>
                      {t.weekOf} {localDate(row.week)}
                    </h3>
                    <div class="history-bar" aria-hidden="true">
                      <span style={{ width: `${row.accuracy}%` }} />
                    </div>
                    <dl>
                      {[
                        [t.accuracyLabel, number(row.accuracy) + "%"],
                        [t.errorsLabel, number(row.errorsPer100)],
                        [t.totalLabel, row.total],
                        [t.rhythmLabel, number(row.rhythmMs)],
                        [t.variationLabel, number(row.variationMs)],
                        [t.correctionsLabel, number(row.corrections)],
                      ].map(([label, value]) => (
                        <div>
                          <dt>{label}</dt>
                          <dd>{value}</dd>
                        </div>
                      ))}
                    </dl>
                  </article>
                ))}
              </section>
              <section class="card">
                <h2>{t.keyboardMap}</h2>
                <p>{t.keyHelp}</p>
                <p>
                  {t.keyGold}:{" "}
                  {rank.best
                    .map((k) => (k.key === " " ? t.space : k.key))
                    .join(", ") || t.unavailable}
                </p>
                <p>
                  {t.keyPractice}:{" "}
                  {rank.practice
                    .map((k) => (k.key === " " ? t.space : k.key))
                    .join(", ") || t.unavailable}
                </p>
                <div class="skill-map">
                  {Array.from("qwertyuiopasdfghjklçzxcvbnm ").map((key) => {
                    const skill = data.skills.find(
                      (s) =>
                        s.kind === "key" &&
                        s.key === key &&
                        s.source === source,
                    );
                    return (
                      <details class={`skill ${skill?.state ?? "empty"}`}>
                        <summary>
                          {key === " " ? t.space : key}
                          <span>
                            {skill ? t.skillStates[skill.state] : t.unavailable}
                          </span>
                        </summary>
                        {skill && (
                          <dl>
                            <dt>{t.accuracyLabel}</dt>
                            <dd>{number(skill.accuracy)}%</dd>
                            <dt>{t.offsetLabel}</dt>
                            <dd>{number(skill.meanOffset)}</dd>
                          </dl>
                        )}
                      </details>
                    );
                  })}
                </div>
              </section>
              <section class="card">
                <h2>{t.nativeSeries}</h2>
                <p>{t.nativeSeriesHelp}</p>
                {!reference.length && <p>{t.noData}</p>}
                {reference.map((row) => (
                  <article class="history-block">
                    <h3>
                      {date(row.startedAt)} · {t.studyDay} {row.studyDay ?? "—"}
                    </h3>
                    <dl>
                      <dt>{t.ppm}</dt>
                      <dd>{number(row.wpm)}</dd>
                      <dt>{t.finalErrors}</dt>
                      <dd>{number(row.errorsPer100Characters)}</dd>
                    </dl>
                    {row.keyboardNote && <p>{row.keyboardNote}</p>}
                  </article>
                ))}
                <h3>{t.comparison28}</h3>
                {comparison ? (
                  <dl>
                    {[comparison.first, comparison.final].map((row) => (
                      <div>
                        <dt>
                          {t.studyDay} {row.studyDay}
                        </dt>
                        <dd>
                          {t.ppm}: {number(row.wpm)} · {t.finalErrors}:{" "}
                          {number(row.errorsPer100Characters)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                ) : (
                  <p>{t.comparisonPending}</p>
                )}
              </section>
              <section class="card">
                <h2>{t.habit}</h2>
                <p>{t.habitHelp}</p>
                <p>
                  {t.practiced}:{" "}
                  <strong>
                    {
                      days.filter((d) => d >= monday && d <= dayKey(Date.now()))
                        .length
                    }
                  </strong>
                </p>
                <ul class="practice-days">
                  {Array.from({ length: 7 }, (_, i) =>
                    dayKey(
                      addDays(new Date(monday + "T12:00:00").getTime(), i),
                    ),
                  ).map((day) => (
                    <li>
                      {localDate(day)} ·{" "}
                      {days.includes(day) ? t.dayPracticed : t.dayOpen}
                    </li>
                  ))}
                </ul>
                {Array.from(
                  new Set(
                    days.map((d) =>
                      weekKey(new Date(d + "T12:00:00").getTime()),
                    ),
                  ),
                )
                  .filter((w) => w !== monday)
                  .map((w) => (
                    <p>
                      {t.weekOf} {localDate(w)}:{" "}
                      {
                        days.filter(
                          (d) =>
                            weekKey(new Date(d + "T12:00:00").getTime()) === w,
                        ).length
                      }
                    </p>
                  ))}
              </section>
              {data.movements.length > 0 && (
                <section class="card">
                  <h2>{t.handSummary}</h2>
                  <label for="history-exercise">
                    {t.chooseHistoryExercise}
                  </label>
                  <select
                    id="history-exercise"
                    value={motorId}
                    onChange={(e) =>
                      setMotorId(e.currentTarget.value as ExerciseId)
                    }
                  >
                    {(Object.keys(exercises) as ExerciseId[]).map((id) => (
                      <option value={id}>{t.motorNames[id]}</option>
                    ))}
                  </select>
                  <p>{t.sources[source]}</p>
                  {hands.total === 0 && <p>{t.noData}</p>}
                  <dl>
                    <dt>{t.motorActions}</dt>
                    <dd>{hands.total}</dd>
                    <dt>{t.motorSummary}</dt>
                    <dd>{number(hands.total ? hands.accuracy : null)}%</dd>
                    <dt>{t.motorReaction}</dt>
                    <dd>{number(hands.meanReactionMs)}</dd>
                    <dt>{t.motorDeviation}</dt>
                    <dd>{number(hands.meanDeviationPx)}</dd>
                    <dt>{t.motorInside}</dt>
                    <dd>{number(hands.insidePercent)}</dd>
                    {source === "pointer" && (
                      <>
                        <dt>{t.traceFine}</dt>
                        <dd>
                          {number(
                            fine.length
                              ? fine.reduce((a, b) => a + b, 0) / fine.length
                              : null,
                          )}
                        </dd>
                      </>
                    )}
                  </dl>
                  {source === "pointer" && <p>{t.traceFineHelp}</p>}
                </section>
              )}
            </>
          )}
          <section class="card">
            <h2>{t.diaryTitle}</h2>
            <p>{t.diaryHelp}</p>
            {!data.diary.length && <p>{t.noData}</p>}
            <p>
              {t.diaryMean}:{" "}
              {number(
                data.diary.some((d) => d.rating !== null)
                  ? data.diary.reduce((s, d) => s + (d.rating ?? 0), 0) /
                      data.diary.filter((d) => d.rating !== null).length
                  : null,
              )}
            </p>
            {[...data.diary]
              .sort((a, b) => b.at - a.at)
              .map((entry) => {
                const sessionIds = new Set(
                  data.sessions
                    .filter((s) => s.dailyId === entry.dailyId)
                    .map((s) => s.id),
                );
                const taps = data.taps.filter(
                  (tap) =>
                    sessionIds.has(tap.sessionId) && tap.source === source,
                );
                return (
                  <article class="history-block">
                    <h3>{date(entry.at)}</h3>
                    <p>
                      {t.diaryRating}: {entry.rating ?? t.diaryNoRating}
                    </p>
                    {entry.pain && <p>{t.diaryPain}</p>}
                    <p class="diary-note">{entry.note || t.diaryNoNote}</p>
                    {taps.length > 0 && (
                      <p>
                        {t.diaryPrecision} ({t.sources[source]}):{" "}
                        {number(
                          (taps.filter((tap) => tap.correct).length /
                            taps.length) *
                            100,
                        )}
                        %
                      </p>
                    )}
                  </article>
                );
              })}
          </section>
        </>
      )}
      <button onClick={onExit}>{t.back}</button>
    </>
  );
}

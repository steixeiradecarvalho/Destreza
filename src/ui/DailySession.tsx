import { useEffect, useLayoutEffect, useRef, useState } from "preact/hooks";
import { db, type DailyRun, type Preferences } from "../data/db";
import {
  prepareDaily,
  startDaily,
  closeDaily,
  resumeDaily,
} from "../data/daily";
import { ExerciseShell } from "../modules/maos/ExerciseShell";
import type { ExerciseId } from "../modules/maos/registry";
import { Lesson } from "../modules/teclado/Lesson";
import { NativePractice } from "../modules/teclado/NativePractice";
import { useActiveClock } from "./useActiveClock";
import { textos as t } from "./textos";
import type { NativeRun } from "../data/db";
type Prepared = Awaited<ReturnType<typeof prepareDaily>>;
export function DailySession({
  prefs,
  onExit,
  onSaved,
  history,
}: {
  prefs: Preferences;
  onExit: () => void;
  onSaved: () => void;
  history: NativeRun[];
}) {
  const [prepared, setPrepared] = useState<Prepared | null>(null),
    [run, setRun] = useState<DailyRun | null>(null),
    [error, setError] = useState(false),
    [busy, setBusy] = useState(false),
    [done, setDone] = useState(false),
    [rating, setRating] = useState<number | null>(null),
    [pain, setPain] = useState(false),
    [note, setNote] = useState("");
  const [light, setLight] = useState(false);
  async function load() {
    try {
      setError(false);
      setPrepared(await prepareDaily(prefs, light));
    } catch {
      setError(true);
    }
  }
  useEffect(() => {
    void load();
  }, [light]);
  async function start(resume = false) {
    if (!prepared) return;
    setBusy(true);
    try {
      setError(false);
      const current = await prepareDaily(prefs, light);
      const row =
        resume && current.active
          ? await resumeDaily(current.active)
          : await startDaily(current.plan);
      await db.diarias.update(row.id, { status: "active" });
      setRun({ ...row, status: "active" });
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }
  async function advance(elapsed: number) {
    if (!run) return;
    const stage = run.plan.stages[run.stageIndex];
    const next = {
      ...run,
      stageIndex: run.stageIndex + 1,
      stageElapsedMs: 0,
      activeMs: run.activeMs + elapsed,
      completedStages: [...run.completedStages, stage],
    };
    await db.diarias.put(next);
    setRun(next);
    onSaved();
  }
  async function finish() {
    if (!run) return;
    setBusy(true);
    try {
      await closeDaily(run, { rating, pain, note: note.trim() });
      setDone(true);
      onSaved();
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }
  const stage = run?.plan.stages[run.stageIndex];
  const section = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    if (stage === "closing" || done) {
      const heading = section.current?.querySelector("h2");
      if (heading) {
        heading.tabIndex = -1;
        heading.focus();
        window.scrollTo(0, 0);
      }
    }
  }, [stage, done]);
  return (
    <section class="daily-session" ref={section}>
      {error && (
        <div class="notice" role="alert">
          <p>{t.lessonError}</p>
          <button
            disabled={busy}
            onClick={() => {
              if (run && stage === "closing") void finish();
              else void load();
            }}
          >
            {t.retry}
          </button>
        </div>
      )}
      {!run && !done && (
        <>
          <h2>{t.dailyPlanTitle}</h2>
          <p>{t.dailyHelp}</p>
          {!prepared ? (
            <p>{t.loading}</p>
          ) : (
            <>
              {prepared.rest && (
                <aside class="notice">
                  <p>{t.dailyRest}</p>
                </aside>
              )}
              {prepared.decline && <p>{t.dailyLightSuggestion}</p>}
              <label class="choice">
                <input
                  type="checkbox"
                  checked={light}
                  onChange={(e) => setLight(e.currentTarget.checked)}
                />
                {t.dailyLight}
              </label>
              <p>
                {t.dailyDuration} {prepared.plan.minutes} {t.dailyMinutes}
              </p>
              <ol>
                {prepared.plan.stages.map((key) => (
                  <li>{t.dailyStages[key]}</li>
                ))}
              </ol>
              {prepared.active && (
                <>
                  <p>{t.dailyResumeHelp}</p>
                  <button
                    class="primary"
                    disabled={busy}
                    onClick={() => void start(true)}
                  >
                    {t.dailyResume}
                  </button>
                </>
              )}
              <button
                class="primary"
                disabled={busy || !!prepared.active}
                onClick={() => void start()}
              >
                {t.dailyStart}
              </button>
            </>
          )}
          <button disabled={busy} onClick={onExit}>
            {t.back}
          </button>
        </>
      )}
      {run && stage !== "closing" && !done && (
        <DailyStage
          key={run.stageIndex}
          run={run}
          prefs={prefs}
          onComplete={advance}
          onExit={onExit}
          onSaved={onSaved}
          history={history}
        />
      )}
      {run && stage === "closing" && !done && (
        <>
          <h2>{t.dailyStages.closing}</h2>
          <p>{t.dailyClosingHelp}</p>
          <fieldset>
            <legend>{t.dailyRating}</legend>
            {[1, 2, 3, 4, 5].map((value) => (
              <label class="choice">
                <input
                  type="radio"
                  name="daily-rating"
                  checked={rating === value}
                  onChange={() => setRating(value)}
                />
                {value}
              </label>
            ))}
            <label class="choice">
              <input
                type="radio"
                name="daily-rating"
                checked={rating === null}
                onChange={() => setRating(null)}
              />
              {t.dailySkipRating}
            </label>
          </fieldset>
          <label class="choice">
            <input
              type="checkbox"
              checked={pain}
              onChange={(e) => setPain(e.currentTarget.checked)}
            />
            {t.dailyPain}
          </label>
          {pain && <p class="notice">{t.dailyPainHelp}</p>}
          <label for="daily-note">{t.dailyNote}</label>
          <textarea
            id="daily-note"
            rows={2}
            maxLength={300}
            value={note}
            onInput={(e) => setNote(e.currentTarget.value)}
          />
          <button class="primary" disabled={busy} onClick={() => void finish()}>
            {t.dailyFinish}
          </button>
        </>
      )}
      {done && (
        <>
          <h2>{t.dailyDone}</h2>
          <p role="status">{t.dailySaved}</p>
          {pain && <p>{t.dailyPainHelp}</p>}
          <button class="primary" onClick={onExit}>
            {t.back}
          </button>
        </>
      )}
    </section>
  );
}
function DailyStage({
  run,
  prefs,
  onComplete,
  onExit,
  onSaved,
  history,
}: {
  run: DailyRun;
  prefs: Preferences;
  onComplete: (elapsed: number) => Promise<void>;
  onExit: () => void;
  onSaved: () => void;
  history: NativeRun[];
}) {
  const stage = run.plan.stages[run.stageIndex],
    budget = run.plan.budgets[stage];
  const [running, setRunning] = useState(false),
    [cycle, setCycle] = useState(0),
    [error, setError] = useState(false);
  const clock = useActiveClock(running, run.stageElapsedMs),
    completed = useRef(false),
    transition = useRef(false);
  const snapshot = useRef(() => clock.read());
  snapshot.current = clock.read;
  useEffect(() => {
    const timer = setInterval(() => {
      void db
        .transaction("rw", db.diarias, async () => {
          const current = await db.diarias.get(run.id);
          if (current?.stageIndex === run.stageIndex)
            await db.diarias.update(run.id, {
              stageElapsedMs: snapshot.current(),
            });
        })
        .catch(() => setError(true));
    }, 5000);
    return () => clearInterval(timer);
  }, [run.id]);
  async function persistExit() {
    try {
      await db.diarias.update(run.id, {
        stageElapsedMs: clock.read(),
        status: "paused",
      });
      onExit();
    } catch {
      setError(true);
    }
  }
  async function next() {
    if (transition.current) return;
    transition.current = true;
    setRunning(false);
    try {
      if (clock.read() >= budget || stage === "reference") {
        await onComplete(clock.read());
      } else {
        completed.current = false;
        setCycle((value) => value + 1);
      }
    } catch {
      setError(true);
    } finally {
      transition.current = false;
    }
  }
  function complete() {
    completed.current = true;
    setRunning(false);
    void next();
  }
  const guided = {
    dailyId: run.id,
    onRunning: setRunning,
    onComplete: complete,
    autoStart: cycle > 0,
  };
  return (
    <>
      <p class="daily-progress">
        {t.dailyStep} {run.stageIndex + 1} / {run.plan.stages.length} ·{" "}
        {t.dailyStages[stage]}
      </p>
      <p>
        {t.dailyTime} {Math.max(0, Math.ceil((budget - clock.elapsed) / 60000))}{" "}
        {t.dailyMinutes}
      </p>
      {error && (
        <div class="notice" role="alert">
          <p>{t.lessonError}</p>
          <button
            onClick={() => {
              setError(false);
              if (completed.current) void next();
              else void persistExit();
            }}
          >
            {t.retry}
          </button>
        </div>
      )}
      {stage === "warmup" || stage === "hands" ? (
        <ExerciseShell
          key={cycle}
          id={stage === "warmup" ? "alvos" : (run.plan.motor as ExerciseId)}
          prefs={prefs}
          onExit={() => void persistExit()}
          onSaved={onSaved}
          guided={{
            ...guided,
            warmup: stage === "warmup",
            settings: {
              difficulty: 1,
              handMode: stage === "warmup" ? "dominant" : run.plan.handMode,
              dominant: prefs.hand,
              shape: "reta",
            },
          }}
        />
      ) : stage === "reference" || run.plan.level >= 11 ? (
        <NativePractice
          key={cycle}
          level={stage === "reference" ? undefined : run.plan.level}
          onExit={() => void persistExit()}
          onSaved={onSaved}
          history={history}
          guided={guided}
        />
      ) : (
        <Lesson
          key={cycle}
          level={run.plan.level}
          free={false}
          prefs={prefs}
          onExit={() => void persistExit()}
          onSaved={onSaved}
          guided={{
            ...guided,
            review: run.plan.review,
            shouldFinish: () => clock.read() >= budget,
          }}
        />
      )}
    </>
  );
}

import { saveMotorAction, recommendedLevel } from "../../data/learning";
import { useEffect, useLayoutEffect, useRef, useState } from "preact/hooks";
import { db, type Preferences, type StoredMotorEvent } from "../../data/db";
import { beginMotor, finishMotor } from "../../data/motor";
import type {
  HandMode,
  MotorEvent,
  MotorSettings,
  MotorSummary,
  TraceShape,
} from "../../core/motor";
import { textos as t } from "../../ui/textos";
import { feedback } from "../../ui/feedback";
import { exercises, type ExerciseId } from "./registry";
import type { ExercisePlan } from "./types";
import { Demo } from "./Demo";
interface Props {
  id: ExerciseId;
  prefs: Preferences;
  onExit: () => void;
  onSaved: () => void;
  guided?: {
    settings: MotorSettings;
    dailyId: string;
    warmup: boolean;
    onComplete: () => void;
    onRunning: (running: boolean) => void;
    autoStart?: boolean;
  };
}
export function ExerciseShell({ id, prefs, onExit, onSaved, guided }: Props) {
  const module = exercises[id];
  const [supported, setSupported] = useState(false);
  const [mode, setMode] = useState<
    | "settings"
    | "demo"
    | "trial"
    | "trialDone"
    | "active"
    | "finishing"
    | "result"
  >(guided ? "demo" : "settings");
  const [settings, setSettings] = useState<MotorSettings>(
    guided?.settings ?? {
      difficulty: 1,
      handMode: "dominant",
      dominant: prefs.hand,
      shape: "reta",
    },
  );
  const [plan, setPlan] = useState<ExercisePlan>(() =>
    module.preparar(settings),
  );
  const [demoKey, setDemoKey] = useState(0),
    [ready, setReady] = useState(false),
    [paused, setPaused] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(false),
    [message, setMessage] = useState("");
  const [result, setResult] = useState<MotorSummary | null>(null),
    [reduced, setReduced] = useState(
      () => matchMedia("(prefers-reduced-motion: reduce)").matches,
    );
  const runId = useRef(""),
    heading = useRef<HTMLHeadingElement>(null);
  const pending = useRef<{ row: StoredMotorEvent; resolve: () => void } | null>(
      null,
    ),
    retry = useRef<() => void>(() => {});
  useEffect(() => {
    const query = matchMedia("(prefers-reduced-motion: reduce)");
    const change = () => setReduced(query.matches);
    query.addEventListener("change", change);
    return () => query.removeEventListener("change", change);
  }, []);
  useLayoutEffect(() => {
    heading.current?.focus();
    window.scrollTo(0, 0);
  }, [mode, paused]);
  useLayoutEffect(() => {
    if (mode !== "demo") return;
    setReady(false);
    const timer = setTimeout(() => setReady(true), 5000);
    return () => clearTimeout(timer);
  }, [mode, demoKey]);
  useEffect(() => {
    const hide = () => {
      if (document.hidden && (mode === "active" || mode === "trial"))
        setPaused(true);
    };
    document.addEventListener("visibilitychange", hide);
    return () => document.removeEventListener("visibilitychange", hide);
  }, [mode]);
  useLayoutEffect(() => {
    guided?.onRunning(mode === "active" && !paused && !error);
  }, [mode, paused, error]);
  useEffect(() => {
    if (guided?.autoStart) void start();
  }, []);
  async function start() {
    setBusy(true);
    setError(false);
    retry.current = () => {
      void start();
    };
    try {
      const selected =
        guided && !guided.warmup
          ? { ...settings, difficulty: await recommendedLevel(id, settings) }
          : settings;
      setSettings(selected);
      const prepared = module.preparar(selected);
      setSettings(prepared.settings);
      runId.current = await beginMotor(
        id,
        prepared.settings,
        prepared.parameters,
      );
      if (guided)
        await db.exercicios.update(runId.current, {
          dailyId: guided.dailyId,
          dailyRole: guided.warmup ? "warmup" : "hands",
        });
      setPlan(prepared);
      setMessage("");
      setMode("active");
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }
  async function persist() {
    const item = pending.current;
    if (!item) return;
    setBusy(true);
    setError(false);
    try {
      await saveMotorAction(item.row, settings, !guided?.warmup);
      pending.current = null;
      feedback(prefs, item.row.correct);
      setMessage(item.row.correct ? t.motorGood : t.motorTryAgain);
      setBusy(false);
      item.resolve();
    } catch {
      setError(true);
      retry.current = () => {
        void persist();
      };
    }
  }
  function onEvent(event: MotorEvent): Promise<void> {
    if (mode === "trial") {
      feedback(prefs, event.correct);
      setMessage(event.correct ? t.motorGood : t.motorTryAgain);
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      pending.current = {
        row: {
          ...event,
          id: crypto.randomUUID(),
          runId: runId.current,
          exercise: id,
        },
        resolve,
      };
      void persist();
    });
  }
  async function finish(completed: boolean) {
    if (pending.current) return;
    setMode("finishing");
    setBusy(true);
    setError(false);
    retry.current = () => {
      void finish(completed);
    };
    try {
      const summary = await finishMotor(runId.current, completed, module.medir);
      onSaved();
      if (completed) {
        if (guided) {
          guided.onComplete();
          return;
        }
        setResult(summary);
        setMode("result");
      } else onExit();
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }
  const View = module.rodar,
    number = (n: number) =>
      new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(n);
  return (
    <section class="exercise-shell">
      {error && (
        <div class="notice" role="alert">
          <p>{t.motorSaveError}</p>
          <button onClick={() => retry.current()}>{t.retry}</button>
        </div>
      )}
      {mode === "settings" && (
        <>
          <h2 ref={heading} tabIndex={-1}>
            {t.motorNames[id]}
          </h2>
          <p>{t.motorDescriptions[id]}</p>
          <fieldset>
            <legend>{t.difficulty}</legend>
            {([1, 2, 3] as const).map((value) => (
              <label class="choice">
                <input
                  type="radio"
                  name="motor-difficulty"
                  checked={settings.difficulty === value}
                  onChange={() =>
                    setSettings({ ...settings, difficulty: value })
                  }
                />
                {t.difficultyNames[value - 1]}
              </label>
            ))}
          </fieldset>
          {id !== "ritmo" && (
            <fieldset>
              <legend>{t.motorHand}</legend>
              {(["dominant", "other", "both"] as HandMode[]).map((value) => (
                <label class="choice">
                  <input
                    type="radio"
                    name="motor-hand"
                    checked={settings.handMode === value}
                    onChange={() =>
                      setSettings({ ...settings, handMode: value })
                    }
                  />
                  {t.motorHandNames[value]}
                </label>
              ))}
            </fieldset>
          )}
          {id === "ritmo" && (
            <>
              <p>{t.supportedHelp}</p>
              <label class="choice">
                <input
                  type="checkbox"
                  checked={supported}
                  onChange={(e) => setSupported(e.currentTarget.checked)}
                />
                {t.supported}
              </label>
            </>
          )}
          {settings.handMode === "both" && <p>{t.motorBothHelp}</p>}
          {id === "trilha" && (
            <fieldset>
              <legend>{t.traceShape}</legend>
              {(["reta", "onda", "espiral", "oito"] as TraceShape[]).map(
                (value) => (
                  <label class="choice">
                    <input
                      type="radio"
                      name="trace-shape"
                      checked={settings.shape === value}
                      onChange={() =>
                        setSettings({ ...settings, shape: value })
                      }
                    />
                    {t.traceShapeNames[value]}
                  </label>
                ),
              )}
            </fieldset>
          )}
          <button
            class="primary"
            disabled={id === "ritmo" && !supported}
            onClick={() => {
              setPlan(module.preparar(settings));
              setMode("demo");
            }}
          >
            {t.showDemo}
          </button>
          <button onClick={onExit}>{t.motorBack}</button>
        </>
      )}
      {mode === "demo" && (
        <>
          <h2 ref={heading} tabIndex={-1}>
            {t.demoTitle}
          </h2>
          <p>{t.motorDescriptions[id]}</p>
          <Demo key={demoKey} id={id} plan={plan} reducedMotion={reduced} />
          <p role="status">{ready ? t.demoReady : t.demoWait}</p>
          <button
            class="primary"
            disabled={!ready}
            onClick={() => {
              setMode("trial");
              setMessage("");
            }}
          >
            {t.startTrial}
          </button>
          <button
            onClick={() => {
              setReady(false);
              setDemoKey(demoKey + 1);
            }}
          >
            {t.demoAgain}
          </button>
          <button onClick={onExit}>{t.motorBack}</button>
        </>
      )}
      {(mode === "trial" || mode === "active") && (
        <>
          <div hidden={paused}>
            <h2 ref={paused ? undefined : heading} tabIndex={-1}>
              {mode === "trial" ? t.trialTitle : t.motorActive}
            </h2>
            {mode === "trial" && <p>{t.trialHelp}</p>}
            <p class="motor-feedback" role="status">
              {message || t.motto}
            </p>
            <View
              key={mode === "trial" ? "trial" : runId.current}
              plan={plan}
              trial={mode === "trial"}
              paused={paused}
              disabled={busy}
              reducedMotion={reduced}
              onEvent={onEvent}
              onFinish={() => {
                if (mode === "trial") setMode("trialDone");
                else void finish(true);
              }}
            />
            <button
              disabled={busy}
              onClick={() => {
                if (!pending.current) setPaused(true);
              }}
            >
              {t.stop}
            </button>
          </div>
          {paused && (
            <>
              <h2 ref={heading} tabIndex={-1}>
                {t.motorPause}
              </h2>
              <p>{t.motorPauseHelp}</p>
              <button
                class="primary"
                disabled={busy}
                onClick={() => setPaused(false)}
              >
                {t.motorResume}
              </button>
              <button
                disabled={busy}
                onClick={() => {
                  if (mode === "trial") onExit();
                  else void finish(false);
                }}
              >
                {t.motorFinish}
              </button>
            </>
          )}
        </>
      )}
      {mode === "trialDone" && (
        <>
          <h2 ref={heading} tabIndex={-1}>
            {t.trialDone}
          </h2>
          <p>{t.trialDoneHelp}</p>
          <button class="primary" disabled={busy} onClick={() => void start()}>
            {t.startMotor}
          </button>
          <button
            disabled={busy}
            onClick={() => {
              setMode("trial");
              setMessage("");
            }}
          >
            {t.startTrial}
          </button>
          <button disabled={busy} onClick={onExit}>
            {t.motorBack}
          </button>
        </>
      )}
      {mode === "finishing" && !error && <p role="status">{t.lessonSaving}</p>}
      {mode === "result" && result && (
        <>
          <h2 ref={heading} tabIndex={-1}>
            {t.motorResult}
          </h2>
          <p role="status">{t.motorSaved}</p>
          <dl class="lesson-metrics">
            <div>
              <dt>{t.motorSummary}</dt>
              <dd>{number(result.accuracy)}%</dd>
            </div>
            <div>
              <dt>{t.motorActions}</dt>
              <dd>{result.total}</dd>
            </div>
            {result.meanReactionMs !== null && (
              <div>
                <dt>{t.motorReaction}</dt>
                <dd>{number(result.meanReactionMs)}</dd>
              </div>
            )}
            {result.meanDeviationPx !== null && (
              <div>
                <dt>{t.motorDeviation}</dt>
                <dd>{number(result.meanDeviationPx)}</dd>
              </div>
            )}
            {result.insidePercent !== null && (
              <div>
                <dt>{t.motorInside}</dt>
                <dd>{number(result.insidePercent)}%</dd>
              </div>
            )}
          </dl>
          <p>{t.nextHint}</p>
          <button class="primary" onClick={onExit}>
            {t.motorBack}
          </button>
        </>
      )}
    </section>
  );
}

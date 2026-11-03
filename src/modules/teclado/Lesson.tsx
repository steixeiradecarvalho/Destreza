import { useEffect, useRef, useState } from "preact/hooks";
import content from "../../content/teclado.json";
import {
  db,
  beginLesson,
  finishLesson,
  type CalibrationPoint,
  type Preferences,
} from "../../data/db";
import { metrics, type Tap } from "../../core/typing";
import { textos as t } from "../../ui/textos";
import { feedback } from "../../ui/feedback";
import { Keyboard, type Hit } from "./Keyboard";
interface Props {
  level: number;
  free: boolean;
  prefs: Preferences;
  onExit: () => void;
  onSaved: () => void;
}
export function Lesson({ level, free, prefs, onExit, onSaved }: Props) {
  const lesson = content.levels.find((item) => item.id === level)!;
  const stages = [lesson.warmup, lesson.core, lesson.challenge];
  const [mode, setMode] = useState<
    "intro" | "calibration" | "practice" | "break" | "result" | "pause"
  >("intro");
  const [stage, setStage] = useState(0);
  const [index, setIndex] = useState(0);
  const [buffer, setBuffer] = useState(lesson.initial?.[0] ?? "");
  const correcting = level === 7;
  const expectedKey = correcting
    ? stages[stage].startsWith(buffer)
      ? stages[stage][buffer.length]
      : "Backspace"
    : stages[stage][index];
  const wordStart = stages[stage].lastIndexOf(" ", index - 1) + 1;
  const wordEnd = stages[stage].indexOf(" ", index);
  const fullWord = stages[stage].slice(
    wordStart,
    wordEnd < 0 ? undefined : wordEnd,
  );
  const prefix = stages[stage].slice(wordStart, index);
  const suggestions =
    level === 10 && prefix && fullWord.length > prefix.length
      ? [{ word: fullWord, tail: fullWord.slice(prefix.length) }]
      : [];
  const [sessionId, setSessionId] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [points, setPoints] = useState<CalibrationPoint[]>([]);
  const [result, setResult] = useState<ReturnType<typeof metrics> | null>(null);
  const pointsRef = useRef<CalibrationPoint[]>([]);
  const pointDown = useRef<{ at: number } | null>(null);
  const lock = useRef(false);
  const began = useRef(0);
  const pending = useRef<{ tap: Tap & { id: string }; hit: Hit } | null>(null);
  const retry = useRef<() => void>(() => {});
  const title = useRef<HTMLHeadingElement>(null);
  const formatter = new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 1,
  });
  useEffect(() => {
    title.current?.focus();
    window.scrollTo(0, 0);
  }, [mode, stage]);
  function task(action: () => Promise<void>) {
    retry.current = () => {
      void run();
    };
    async function run() {
      lock.current = true;
      setBusy(true);
      setError(false);
      try {
        await action();
      } catch {
        setError(true);
      } finally {
        lock.current = false;
        setBusy(false);
      }
    }
    void run();
  }
  function createSession() {
    task(async () => {
      const id = await beginLesson(level, free);
      setSessionId(id);
      began.current = performance.now();
      setMode("practice");
      setMessage("");
    });
  }
  function start() {
    task(async () => {
      const profile = await db.perfil.get("local");
      if (
        profile &&
        profile.hand === prefs.hand &&
        profile.grip === prefs.grip
      ) {
        const id = await beginLesson(level, free);
        setSessionId(id);
        began.current = performance.now();
        setMode("practice");
      } else setMode("calibration");
    });
  }
  function calibrate(e: MouseEvent) {
    if (lock.current) return;
    const target = e.currentTarget as HTMLButtonElement;
    const rect = target.getBoundingClientRect();
    const pointer = e.detail > 0;
    const point: CalibrationPoint = {
      x: pointer ? e.clientX : null,
      y: pointer ? e.clientY : null,
      dx: pointer ? e.clientX - rect.left - rect.width / 2 : null,
      dy: pointer ? e.clientY - rect.top - rect.height / 2 : null,
      at: Date.now(),
      durationMs: pointDown.current
        ? performance.now() - pointDown.current.at
        : 0,
      source: pointer ? "pointer" : "accessible",
    };
    pointDown.current = null;
    const next = [...pointsRef.current, point];
    pointsRef.current = next;
    setPoints(next);
    if (next.length === 5)
      task(async () => {
        await db.perfil.put({
          id: "local",
          calibratedAt: Date.now(),
          hand: prefs.hand,
          grip: prefs.grip,
          points: next,
        });
        setMessage(t.calibrationDone);
        setMode("intro");
      });
  }
  function writeHit(hit: Hit) {
    if (lock.current || mode !== "practice") return;
    const modifier = hit.operation === "modifier";
    const expected = modifier
      ? hit.actual!
      : correcting
        ? expectedKey
        : hit.operation === "suggestion"
          ? stages[stage].slice(index, index + (hit.actual?.length ?? 1))
          : expectedKey;
    const nextBuffer = correcting
      ? hit.actual === "Backspace"
        ? buffer.slice(0, -1)
        : buffer + (hit.actual ?? "")
      : buffer;
    const tap = {
      ...hit,
      id: crypto.randomUUID(),
      sessionId,
      attemptId: sessionId,
      expected,
      correct: hit.actual === expected,
      at: Date.now(),
      elapsedMs: performance.now() - began.current,
    };
    pending.current = { tap, hit };
    task(async () => {
      const value = pending.current!;
      await db.toques.put(value.tap);
      feedback(prefs, value.tap.correct);
      setMessage(value.tap.correct ? t.correct : t.mistake);
      if (modifier) return;
      if (correcting) setBuffer(nextBuffer);
      const nextIndex = correcting
        ? nextBuffer.length
        : index + (hit.actual?.length ?? 1);
      const completeStage = correcting
        ? nextBuffer === stages[stage]
        : nextIndex >= stages[stage].length;
      if ((correcting && completeStage) || (!correcting && value.tap.correct)) {
        if (!completeStage) setIndex(nextIndex);
        else if (stage < 2) setMode("break");
        else {
          const summary = await finishLesson(sessionId, true);
          setResult(summary);
          setMode("result");
          onSaved();
        }
      }
    });
  }
  function leave() {
    task(async () => {
      if (sessionId) await finishLesson(sessionId, false);
      onSaved();
      onExit();
    });
  }
  const stageNames = [t.warmup, t.core, t.challenge];
  return (
    <div class="lesson">
      {error && (
        <div class="notice" role="alert">
          <p>{t.lessonError}</p>
          <button onClick={() => retry.current()} disabled={busy}>
            {t.retry}
          </button>
        </div>
      )}
      {mode === "intro" && (
        <>
          <h2 ref={title} tabIndex={-1}>
            {t.levels[level - 1]}
          </h2>
          <p>{t.descriptions[level - 1]}</p>
          {level === 8 && <p>{t.accentHelp}</p>}
          {correcting && <p>{t.correctionHelp}</p>}
          <p>{t.lessonIntro}</p>
          <details>
            <summary>{t.keyboardLabel}</summary>
            <p>{t.keyboardHelp}</p>
          </details>
          <p role="status">{message}</p>
          <button
            class="primary"
            onClick={points.length === 5 ? createSession : start}
            disabled={busy}
          >
            {busy ? t.lessonSaving : t.start}
          </button>
          <button onClick={onExit} disabled={busy}>
            {t.back}
          </button>
        </>
      )}
      {mode === "calibration" && (
        <>
          <h2 ref={title} tabIndex={-1}>
            {t.calibrationTitle}
          </h2>
          <p>{t.calibrationHelp}</p>
          <p role="status">
            {t.calibrationProgress} {Math.min(5, points.length + 1)} / 5
          </p>
          <div class="calibration-area">
            {points.length < 5 && (
              <button
                class={`calibration-dot point-${points.length}`}
                aria-label={`${t.calibrationTarget} ${points.length + 1}`}
                onPointerDown={() => {
                  pointDown.current = { at: performance.now() };
                }}
                onPointerCancel={() => {
                  pointDown.current = null;
                }}
                onClick={calibrate}
                disabled={busy}
              >
                <span aria-hidden="true">{points.length + 1}</span>
              </button>
            )}
          </div>
          <button onClick={onExit} disabled={busy}>
            {t.back}
          </button>
        </>
      )}
      {mode === "practice" && (
        <>
          <div class="lesson-target">
            <h2 ref={title} tabIndex={-1}>
              {stageNames[stage]}
            </h2>
            <p class="target-letter" aria-live="polite" aria-atomic="true">
              {t.target}{" "}
              <strong>
                {expectedKey === "Backspace"
                  ? t.deleteKey
                  : expectedKey === " "
                    ? t.space
                    : expectedKey}
              </strong>
            </p>
            <p class="lesson-progress">
              {t.progress}: {correcting ? stage : index} /{" "}
              {correcting ? 3 : stages[stage].length}
            </p>
          </div>
          {correcting && (
            <>
              <p>
                {t.word}: {stages[stage]}
              </p>
              <p class="typed-buffer" aria-live="polite">
                {t.typedText}: <strong>{buffer || "·"}</strong>
              </p>
            </>
          )}
          <p class="word-model" aria-label={t.word}>
            {Array.from(
              stages[stage].slice(Math.max(0, index - 5), index + 10),
            ).map((letter, relativeIndex) => {
              const i = relativeIndex + Math.max(0, index - 5);
              return (
                <span
                  class={
                    i === index
                      ? "current-letter"
                      : i < index
                        ? "done-letter"
                        : ""
                  }
                  aria-current={i === index ? "step" : undefined}
                >
                  {letter === " " ? "·" : letter}
                </span>
              );
            })}
          </p>
          <p class="tap-feedback" role="status">
            {message || t.stageHints[stage]}
          </p>
          <Keyboard
            expected={expectedKey}
            level={level}
            suggestions={suggestions}
            prefs={prefs}
            onHit={writeHit}
            disabled={busy || error}
          />
          <button onClick={() => setMode("pause")} disabled={busy}>
            {t.stop}
          </button>
        </>
      )}
      {mode === "break" && (
        <>
          <h2 ref={title} tabIndex={-1}>
            {stageNames[stage + 1]}
          </h2>
          <p>{t.stageHints[stage + 1]}</p>
          <button
            class="primary"
            onClick={() => {
              setStage(stage + 1);
              setBuffer(lesson.initial?.[stage + 1] ?? "");
              setIndex(0);
              setMessage("");
              setMode("practice");
            }}
          >
            {t.continue}
          </button>
          <button onClick={() => setMode("pause")}>{t.stop}</button>
        </>
      )}
      {mode === "pause" && (
        <>
          <h2 ref={title} tabIndex={-1}>
            {t.stopTitle}
          </h2>
          <p>{t.stopHelp}</p>
          <button
            class="primary"
            onClick={() =>
              setMode(
                index + 1 === stages[stage].length && stage < 2
                  ? "break"
                  : "practice",
              )
            }
          >
            {t.resume}
          </button>
          <button onClick={leave} disabled={busy}>
            {t.leave}
          </button>
        </>
      )}
      {mode === "result" && result && (
        <>
          <h2 ref={title} tabIndex={-1}>
            {t.lessonResult}
          </h2>
          <p role="status">{t.resultSaved}</p>
          <dl class="lesson-metrics">
            <div>
              <dt>{t.accuracy}</dt>
              <dd>{formatter.format(result.accuracy)}%</dd>
            </div>
            <div>
              <dt>{t.touches}</dt>
              <dd>{result.total}</dd>
            </div>
            <div>
              <dt>{t.errors}</dt>
              <dd>{formatter.format(result.errorsPer100)}</dd>
            </div>
          </dl>
          <p>{t.nextHint}</p>
          <button class="primary" onClick={onExit}>
            {t.back}
          </button>
        </>
      )}
    </div>
  );
}

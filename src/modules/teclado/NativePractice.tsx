import { useEffect, useLayoutEffect, useRef, useState } from "preact/hooks";
import reference from "../../content/referencia.json";
import nativeLessons from "../../content/native-lessons.json";
import {
  scoreComplete,
  scoreNative,
  referenceDay,
  wordsPerMinute,
} from "../../core/native";
import {
  db,
  beginLesson,
  finishNativeLesson,
  type NativeRun,
} from "../../data/db";
import { exportData } from "../../data/export";
import { textos as t } from "../../ui/textos";
interface Props {
  level?: number;
  free?: boolean;
  onExit: () => void;
  onSaved: () => void;
  history?: NativeRun[];
  guided?: {
    dailyId: string;
    onComplete: () => void;
    onRunning: (running: boolean) => void;
    autoStart?: boolean;
  };
}
export function NativePractice({
  level,
  free = false,
  onExit,
  onSaved,
  history = [],
  guided,
}: Props) {
  const isReference = !level;
  const [mode, setMode] = useState<"intro" | "active" | "between" | "result">(
    "intro",
  );
  const [stage, setStage] = useState(0);
  const [phrase, setPhrase] = useState(0);
  const [value, setValue] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<NativeRun | null>(null);
  const textarea = useRef<HTMLTextAreaElement>(null);
  const run = useRef<NativeRun | null>(null);
  const session = useRef<string | undefined>();
  const started = useRef<number | null>(null);
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const finalizing = useRef(false);
  const retry = useRef<() => void>(() => {});
  const heading = useRef<HTMLHeadingElement>(null);
  const model = isReference
    ? reference.phrases[phrase % reference.phrases.length]
    : nativeLessons[String(level) as keyof typeof nativeLessons][stage];
  useLayoutEffect(() => {
    heading.current?.focus();
    window.scrollTo(0, 0);
  }, [mode, stage]);
  useLayoutEffect(() => {
    guided?.onRunning(mode === "active" && !error);
  }, [mode, error]);
  useEffect(() => {
    if (guided?.autoStart) void start();
  }, []);
  function checkpoint() {
    const snapshot = structuredClone(run.current!);
    queue.current = queue.current
      .catch(() => {})
      .then(() => db.referencias.put(snapshot))
      .catch(() => {
        setError(true);
        if (!finalizing.current)
          retry.current = () => {
            void retryCheckpoint();
          };
      });
  }
  async function retryCheckpoint() {
    setBusy(true);
    try {
      await queue.current;
      await db.referencias.put(structuredClone(run.current!));
      setError(false);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }
  async function start() {
    setBusy(true);
    setError(false);
    retry.current = () => {
      void start();
    };
    try {
      if (!isReference && !session.current)
        session.current = await beginLesson(
          level!,
          free,
          "native",
          guided?.dailyId,
        );
      started.current = null;
      finalizing.current = false;
      run.current = {
        id: crypto.randomUUID(),
        dailyId: guided?.dailyId,
        sessionId: session.current,
        level,
        kind: isReference ? "reference" : "lesson",
        status: "active",
        protocolVersion: reference.version,
        startedAt: Date.now(),
        durationMs: 0,
        model,
        value: "",
        keyboardNote: note,
        correct: 0,
        errors: 0,
        evaluated: 0,
        entered: 0,
        accuracy: 0,
        errorsPer100Characters: 0,
        wpm: 0,
        pasteBlocked: false,
        segments: [],
      };
      await db.referencias.put(run.current);
      setValue("");
      setMessage("");
      setMode("active");
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }
  function score(run: NativeRun) {
    const all = [
      ...(run.segments ?? []),
      { model: run.model, value: run.value, complete: !isReference },
    ];
    const values = all.map((part) =>
      part.complete
        ? scoreComplete(part.model, part.value)
        : scoreNative(part.model, part.value),
    );
    const correct = values.reduce((sum, part) => sum + part.correct, 0);
    const errors = values.reduce((sum, part) => sum + part.errors, 0);
    const evaluated = values.reduce((sum, part) => sum + part.evaluated, 0);
    const entered = values.reduce((sum, part) => sum + part.entered, 0);
    return {
      correct,
      errors,
      evaluated,
      entered,
      accuracy: evaluated ? (correct / evaluated) * 100 : 0,
      errorsPer100Characters: evaluated ? (errors / evaluated) * 100 : 0,
      wpm: wordsPerMinute(correct, run.durationMs),
    };
  }
  async function finish(complete: boolean) {
    if (finalizing.current || !run.current) return;
    finalizing.current = true;
    setBusy(true);
    setError(false);
    const elapsed =
      started.current === null ? 0 : performance.now() - started.current;
    const duration = isReference
      ? Math.min(reference.durationMs, Math.max(0, elapsed))
      : Math.max(0, elapsed);
    const finished = {
      ...run.current,
      durationMs: duration,
      status: complete ? ("completed" as const) : ("interrupted" as const),
      finishedAt: run.current.startedAt + duration,
    };
    Object.assign(finished, score(finished));
    retry.current = () => {
      void persist();
    };
    async function persist() {
      setBusy(true);
      setError(false);
      try {
        await queue.current;
        if (isReference) {
          const first = await db.referencias
            .where("kind")
            .equals("reference")
            .filter((item) => item.status === "completed" && item.entered > 0)
            .sortBy("startedAt");
          finished.studyDay = referenceDay(
            first[0]?.startedAt ?? finished.startedAt,
            finished.startedAt,
          );
        }
        await db.referencias.put(finished);
        setError(false);
        if (!isReference && (!complete || stage === 2))
          await finishNativeLesson(session.current!, complete);
        run.current = finished;
        if (!isReference && complete && stage < 2) {
          setStage(stage + 1);
          setMode("between");
        } else {
          let summary = finished;
          if (!isReference && complete) {
            const runs = await db.referencias
              .where("sessionId")
              .equals(session.current!)
              .toArray();
            const total = runs.reduce((sum, item) => sum + item.evaluated, 0);
            const correct = runs.reduce((sum, item) => sum + item.correct, 0);
            const errors = runs.reduce((sum, item) => sum + item.errors, 0);
            const durationMs = runs.reduce(
              (sum, item) => sum + item.durationMs,
              0,
            );
            summary = {
              ...finished,
              correct,
              errors,
              evaluated: total,
              entered: runs.reduce((sum, item) => sum + item.entered, 0),
              durationMs,
              accuracy: total ? (correct / total) * 100 : 0,
              errorsPer100Characters: total ? (errors / total) * 100 : 0,
              wpm: wordsPerMinute(correct, durationMs),
            };
          }
          setResult(summary);
          setMessage("");
          setMode("result");
          onSaved();
          if (guided && complete) guided.onComplete();
        }
      } catch {
        setError(true);
      } finally {
        setBusy(false);
      }
    }
    await persist();
  }
  useEffect(() => {
    if (mode !== "active") return;
    const timer = setInterval(() => {
      if (
        isReference &&
        started.current !== null &&
        performance.now() - started.current >= reference.durationMs
      )
        void finish(true);
    }, 250);
    const hide = () => {
      if (document.hidden)
        void finish(
          isReference &&
            started.current !== null &&
            performance.now() - started.current >= reference.durationMs,
        );
    };
    document.addEventListener("visibilitychange", hide);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", hide);
    };
  }, [mode, stage]);
  function input(next: string) {
    if (finalizing.current || !run.current) return;
    if (
      isReference &&
      started.current !== null &&
      performance.now() - started.current >= reference.durationMs
    ) {
      if (textarea.current) textarea.current.value = run.current.value;
      void finish(true);
      return;
    }
    if (started.current === null && next.length) {
      started.current = performance.now();
      run.current.startedAt = Date.now();
    }
    setMessage("");
    setValue(next);
    run.current.value = next;
    run.current.durationMs =
      started.current === null ? 0 : performance.now() - started.current;
    checkpoint();
  }
  function nextPhrase() {
    if (!run.current || !value || finalizing.current) return;
    if (
      started.current !== null &&
      performance.now() - started.current >= reference.durationMs
    ) {
      void finish(true);
      return;
    }
    run.current.segments!.push({
      model: run.current.model,
      value: run.current.value,
      complete: true,
    });
    const next = phrase + 1;
    setPhrase(next);
    setValue("");
    run.current.model = reference.phrases[next % reference.phrases.length];
    run.current.value = "";
    checkpoint();
    if (textarea.current) {
      textarea.current.value = "";
      textarea.current.focus();
    }
  }
  function blockPaste(e: Event) {
    e.preventDefault();
    setMessage(t.pasteBlocked);
    if (run.current && !finalizing.current) {
      run.current.pasteBlocked = true;
      checkpoint();
    }
  }
  async function download(format: "json" | "csv") {
    try {
      await exportData(format);
      setMessage(t.exportDone);
    } catch {
      setMessage(t.exportError);
    }
  }
  async function leave() {
    if (session.current && mode === "between") {
      setBusy(true);
      try {
        await finishNativeLesson(session.current, false);
        onSaved();
        onExit();
      } catch {
        setError(true);
        retry.current = () => {
          void leave();
        };
      } finally {
        setBusy(false);
      }
    } else onExit();
  }
  const fmt = (n: number) =>
    new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(n);
  return (
    <section class="native-practice">
      {error && (
        <div role="alert" class="notice">
          <p>{t.lessonError}</p>
          <button onClick={() => retry.current()} disabled={busy}>
            {t.retry}
          </button>
        </div>
      )}
      {(mode === "intro" || mode === "between") && (
        <>
          <h2 ref={heading} tabIndex={-1}>
            {isReference ? t.referenceTitle : t.levels[level! - 1]}
          </h2>
          <p>{isReference ? t.referenceIntro : t.nativeLessonIntro}</p>
          {isReference && (
            <>
              <p>{t.referenceProtocol}</p>
              <p>{t.referencePartial}</p>
              <label for="keyboard-note">{t.keyboardNote}</label>
              <input
                id="keyboard-note"
                type="text"
                maxLength={160}
                value={note}
                onInput={(e) => setNote(e.currentTarget.value)}
              />
              <p class="field-hint">{t.keyboardNoteHint}</p>
            </>
          )}
          <button class="primary" onClick={() => void start()} disabled={busy}>
            {mode === "between"
              ? t.continue
              : isReference
                ? t.startReference
                : t.start}
          </button>
          <button onClick={() => void leave()} disabled={busy}>
            {t.back}
          </button>
          {isReference && history.length > 0 && (
            <section class="card">
              <h3>{t.referenceHistory}</h3>
              <ol class="history-list">
                {history.slice(0, 5).map((item) => (
                  <li>
                    {new Date(item.startedAt).toLocaleDateString("pt-BR")} ·{" "}
                    {item.status === "completed" ? t.completed : t.interrupted}{" "}
                    · {t.studyDay} {item.studyDay ?? "—"} · {fmt(item.wpm)}{" "}
                    {t.wpm} · {fmt(item.errorsPer100Characters)} {t.finalErrors}
                  </li>
                ))}
              </ol>
              <p>{t.exportHelp}</p>
              <button onClick={() => void download("json")}>
                {t.exportJson}
              </button>
              <button onClick={() => void download("csv")}>
                {t.exportCsv}
              </button>
              <p role="status">{message}</p>
            </section>
          )}
        </>
      )}
      {mode === "active" && (
        <>
          <div class="native-model">
            <h2 ref={heading} tabIndex={-1}>
              {t.word}
            </h2>
            <p aria-live="polite" aria-atomic="true">
              {model}
            </p>
          </div>
          <label for="native-input">{t.nativeField}</label>
          <textarea
            id="native-input"
            ref={textarea}
            value={value}
            rows={3}
            maxLength={1000}
            autoComplete="off"
            autoCapitalize="sentences"
            readOnly={busy || error}
            onInput={(e) => input(e.currentTarget.value)}
            onPaste={blockPaste}
            onDrop={blockPaste}
            onBeforeInput={(e) => {
              if (
                ["insertFromPaste", "insertFromDrop"].includes(
                  (e as InputEvent).inputType,
                )
              )
                blockPaste(e);
            }}
          />
          <p role="status">
            {message ||
              (value || started.current !== null
                ? t.nativeRunning
                : t.nativeReady)}
          </p>
          {isReference ? (
            <button
              class="primary"
              disabled={!value || busy || error}
              onClick={nextPhrase}
            >
              {t.nextPhrase}
            </button>
          ) : (
            <button
              class="primary"
              disabled={!value || busy || error}
              onClick={() => void finish(true)}
            >
              {t.nativeFinish}
            </button>
          )}
          <button disabled={busy} onClick={() => void finish(false)}>
            {t.stop}
          </button>
        </>
      )}
      {mode === "result" && result && (
        <>
          <h2 ref={heading} tabIndex={-1}>
            {result.status === "completed"
              ? isReference
                ? t.nativeResult
                : t.lessonResult
              : t.nativeInterrupted}
          </h2>
          <p role="status">
            {message ||
              (result.status === "completed" && isReference
                ? t.nativeEnd
                : t.nativeSaved)}
          </p>
          {result.status !== "completed" && (
            <p>{isReference ? t.nativeInterruptedHelp : t.stopHelp}</p>
          )}
          {!result.entered && <p>{t.nativeEmpty}</p>}
          <dl class="lesson-metrics">
            <div>
              <dt>{t.accuracy}</dt>
              <dd>{fmt(result.accuracy)}%</dd>
            </div>
            {isReference && (
              <div>
                <dt>{t.wpm}</dt>
                <dd>{fmt(result.wpm)}</dd>
              </div>
            )}
            <div>
              <dt>{t.finalErrors}</dt>
              <dd>{fmt(result.errorsPer100Characters)}</dd>
            </div>
            <div>
              <dt>{t.correctCharacters}</dt>
              <dd>{result.correct}</dd>
            </div>
          </dl>
          <p>{t.nativeMetricHelp}</p>
          <h3>{t.exportTitle}</h3>
          <p>{t.exportHelp}</p>
          <button onClick={() => void download("json")}>{t.exportJson}</button>
          <button onClick={() => void download("csv")}>{t.exportCsv}</button>
          <button class="primary" onClick={onExit}>
            {t.back}
          </button>
        </>
      )}
    </section>
  );
}

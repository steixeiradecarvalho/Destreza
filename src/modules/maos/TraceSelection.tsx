import { traceVariation } from "../../core/traceVariation";
import { useLayoutEffect, useRef, useState } from "preact/hooks";
import { motorSummary, requestedHand, type MotorPoint } from "../../core/motor";
import {
  appendZone,
  appendExpectedZone,
  pathDeviation,
  patternFor,
} from "../../core/extendedMotor";
import { repeatedTap } from "../../core/typing";
import { textos as t } from "../../ui/textos";
import { useBoard } from "./useBoard";
import type { ExerciseModule, ExerciseProps } from "./types";
const keys = ["qwertyuiop", "asdfghjklç", "zxcvbnm"];
export function TraceSelection({
  plan,
  trial,
  paused,
  disabled,
  onEvent,
  onFinish,
}: ExerciseProps) {
  const word = plan.exercise === "palavra";
  const [round, setRound] = useState(0),
    [present, setPresent] = useState(!word),
    [answer, setAnswer] = useState<string[]>([]),
    [stroke, setStroke] = useState<MotorPoint[]>([]),
    [support, setSupport] = useState(false);
  const viewport = useRef<HTMLDivElement>(null),
    active = useRef<MotorPoint[] | null>(null),
    zones = useRef<string[]>([]),
    lock = useRef(false),
    truncated = useRef(false);
  const pointerTaps = useRef<MotorPoint[]>([]),
    tapAnswers = useRef<string[]>([]);
  const [windowSize, setWindowSize] = useState({ left: 0, width: 320 });
  const previous = useRef<{ at: number; x: number; y: number } | null>(null);
  const { board, size, point } = useBoard(word);
  const length = Number(plan.parameters.length),
    count = trial ? 1 : 3;
  const expected = word
    ? Array.from(t.wordTraceWords[length - 3])
    : patternFor(length).map((n) => String(((n - 1 + round) % 9) + 1));
  const letters = word
    ? keys.flatMap((row, y) =>
        Array.from(row).map((label, x) => ({
          label,
          x: 28 + x * 52 + (y === 1 ? 13 : y === 2 ? 26 : 0),
          y: 32 + y * 64,
        })),
      )
    : Array.from({ length: 9 }, (_, i) => ({
        label: String(i + 1),
        x: (((i % 3) + 0.5) * size.width) / 3,
        y: ((Math.floor(i / 3) + 0.5) * size.height) / 3,
      }));
  useLayoutEffect(() => {
    const element = viewport.current;
    if (!element || !word) return;
    const update = () =>
      setWindowSize({ left: element.scrollLeft, width: element.clientWidth });
    const observer = new ResizeObserver(update);
    observer.observe(element);
    element.addEventListener("scroll", update);
    update();
    return () => {
      observer.disconnect();
      element.removeEventListener("scroll", update);
    };
  }, [word]);
  const visible = (x: number) =>
    !word ||
    (x - 24 >= windowSize.left && x + 24 <= windowSize.left + windowSize.width);
  useLayoutEffect(() => {
    active.current = null;
    setStroke([]);
    setAnswer([]);
    zones.current = [];
    pointerTaps.current = [];
    tapAnswers.current = [];
  }, [paused, round]);
  function hit(p: MotorPoint) {
    return (
      letters.find(
        (l) =>
          visible(l.x) &&
          Math.abs(p.x - l.x) <= 24 &&
          Math.abs(p.y - l.y) <= 24,
      )?.label ?? null
    );
  }
  function append(p: MotorPoint) {
    if (!active.current) return;
    if (active.current.length < 6000) active.current.push(p);
    else {
      active.current[5999] = p;
      truncated.current = true;
    }
    if (word) appendExpectedZone(zones.current, hit(p), expected);
    else appendZone(zones.current, hit(p));
    setStroke([...active.current]);
    setAnswer([...zones.current]);
  }
  async function finish(
    source: "pointer" | "accessible",
    points: MotorPoint[] = [],
    continuous = false,
  ) {
    if (paused || disabled || present || lock.current) return;
    lock.current = true;
    const values = [...zones.current],
      path = expected.map((label) => letters.find((l) => l.label === label)!);
    const quality = continuous
      ? pathDeviation(points, path)
      : { deviationPx: null, insidePercent: null };
    const correct =
      values.join("|") === expected.join("|") &&
      (source === "accessible" ||
        (hit(points[0]) === expected[0] &&
          hit(points.at(-1)!) === expected.at(-1)));
    try {
      await onEvent({
        kind: continuous ? "trace" : "sequence",
        correct,
        source,
        at: Date.now(),
        durationMs: points.length ? points.at(-1)!.t - points[0].t : 0,
        requestedHand: requestedHand(plan.settings, round),
        width: size.width,
        height: size.height,
        points,
        expected: expected.join("|"),
        actual: values.join("|"),
        details: {
          ...quality,
          fineVariationPx:
            source === "pointer" && continuous ? traceVariation(points) : null,
          round: round + 1,
          length,
          truncated: truncated.current,
          task: plan.exercise,
        },
      });
      active.current = null;
      zones.current = [];
      setAnswer([]);
      setStroke([]);
      if (round + 1 === count) onFinish();
      else {
        setRound(round + 1);
        setPresent(!word);
      }
    } finally {
      lock.current = false;
    }
  }
  return (
    <>
      <p>{word ? t.wordTraceHelp : t.patternHelp}</p>
      <p>
        {t.motorHandNow} {requestedHand(plan.settings, round)}.{" "}
        {t.sequenceRound} {round + 1} / {count}
      </p>
      {word ? (
        <p class="word-trace-model">
          {t.wordTracePrompt} <strong>{expected.join("")}</strong>
        </p>
      ) : present ? (
        <>
          <p>
            {t.patternObserve} <strong>{expected.join(" → ")}</strong>
          </p>
          <button
            class="primary"
            disabled={disabled || paused}
            onClick={() => setPresent(false)}
          >
            {t.patternHide}
          </button>
        </>
      ) : (
        <button
          disabled={disabled || paused}
          onClick={() => {
            setPresent(true);
            zones.current = [];
            setAnswer([]);
          }}
        >
          {t.patternReplay}
        </button>
      )}
      <div class={word ? "word-trace-window" : "pattern-window"} ref={viewport}>
        <div
          class={
            word
              ? "trace-selection word-trace-board"
              : "trace-selection pattern-board"
          }
          ref={board}
          aria-label={word ? t.wordTraceArea : t.patternArea}
          onPointerDown={(e) => {
            if (
              present ||
              paused ||
              disabled ||
              !e.isPrimary ||
              e.button !== 0 ||
              support
            )
              return;
            truncated.current = false;
            active.current = [];
            zones.current = word ? [] : [...tapAnswers.current];
            append(point(e));
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => {
            if (active.current && !paused && !disabled) append(point(e));
          }}
          onPointerCancel={() => {
            active.current = null;
            zones.current = [];
            setStroke([]);
            setAnswer([]);
          }}
          onPointerUp={(e) => {
            if (!active.current) return;
            const p = point(e),
              current = { at: performance.now(), x: e.clientX, y: e.clientY };
            if (repeatedTap(previous.current, current)) {
              active.current = null;
              return;
            }
            previous.current = current;
            append(p);
            const points = [...active.current];
            active.current = null;
            if (word) void finish("pointer", points, true);
            else {
              // A released trace evaluates the full pattern; individual taps accumulate.
              if (
                points.some(
                  (v) => Math.hypot(v.x - points[0].x, v.y - points[0].y) > 24,
                )
              )
                void finish("pointer", points, true);
              else {
                tapAnswers.current = [...zones.current];
                setAnswer([...zones.current]);
                setStroke([]);
                pointerTaps.current.push(...points);
              }
            }
          }}
        >
          <svg
            class="trace-selection-lines"
            width="100%"
            height="100%"
            aria-hidden="true"
          >
            {present && (
              <polyline
                points={expected
                  .map((label) => {
                    const p = letters.find((l) => l.label === label)!;
                    return `${p.x},${p.y}`;
                  })
                  .join(" ")}
              />
            )}
            <polyline points={stroke.map((p) => `${p.x},${p.y}`).join(" ")} />
          </svg>
          {letters.map((l) => (
            <button
              class="trace-letter"
              style={{
                left: l.x,
                top: l.y,
                visibility: visible(l.x) ? "visible" : "hidden",
              }}
              disabled={present || paused || disabled}
              aria-label={word ? l.label : `${t.patternPoint} ${l.label}`}
              onClick={(e) => {
                if (e.detail === 0 || support) {
                  pointerTaps.current = [];
                  appendZone(zones.current, l.label);
                  setAnswer([...zones.current]);
                  setSupport(true);
                }
              }}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>
      {word && (
        <div class="keyboard-nav">
          <button
            disabled={disabled || paused}
            onClick={() => viewport.current?.scrollBy({ left: -160 })}
          >
            {t.leftward}
          </button>
          <button
            disabled={disabled || paused}
            onClick={() => viewport.current?.scrollBy({ left: 160 })}
          >
            {t.rightward}
          </button>
        </div>
      )}
      {!present && (
        <>
          <p role="status">
            {t.wordTraceAnswer} {answer.join(word ? "" : " → ") || "—"}
          </p>
          {word && !support && (
            <button
              disabled={disabled || paused}
              onClick={() => {
                active.current = null;
                zones.current = [];
                setAnswer([]);
                setSupport(true);
              }}
            >
              {t.wordTraceAlternative}
            </button>
          )}
          {(!word || support) && (
            <button
              class="primary"
              disabled={disabled || paused || !answer.length}
              onClick={() =>
                void finish(
                  support ? "accessible" : "pointer",
                  support ? [] : pointerTaps.current,
                )
              }
            >
              {word ? t.wordTraceFinish : t.patternFinish}
            </button>
          )}
          <button
            disabled={disabled || paused}
            onClick={() => {
              active.current = null;
              zones.current = [];
              pointerTaps.current = [];
              tapAnswers.current = [];
              setAnswer([]);
              setStroke([]);
            }}
          >
            {word ? t.wordTraceClear : t.patternClear}
          </button>
          {support && <p>{t.accessibleHelp}</p>}
        </>
      )}
    </>
  );
}

export const palavra: ExerciseModule = {
  id: "palavra",
  parametros: (d) => ({ length: [3, 4, 5][d - 1] }),
  preparar: (settings) => ({
    exercise: "palavra",
    settings,
    parameters: palavra.parametros(settings.difficulty),
  }),
  rodar: TraceSelection,
  medir: motorSummary,
};
export const padrao: ExerciseModule = {
  id: "padrao",
  parametros: (d) => ({ length: [3, 4, 5][d - 1] }),
  preparar: (settings) => ({
    exercise: "padrao",
    settings,
    parameters: padrao.parametros(settings.difficulty),
  }),
  rodar: TraceSelection,
  medir: motorSummary,
};

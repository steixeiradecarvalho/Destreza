import { useEffect, useLayoutEffect, useRef, useState } from "preact/hooks";
import content from "../../content/maos.json";
import {
  motorSummary,
  requestedHand,
  sequenceFor,
  type MotorPoint,
} from "../../core/motor";
import { repeatedTap } from "../../core/typing";
import { textos as t } from "../../ui/textos";
import { useBoard } from "./useBoard";
import type { ExerciseModule, ExerciseProps } from "./types";
export function Sequencia({
  plan,
  trial,
  paused,
  disabled,
  reducedMotion,
  onEvent,
  onFinish,
}: ExerciseProps) {
  const { board, size, point } = useBoard();
  const [round, setRound] = useState(0),
    [answer, setAnswer] = useState(0),
    [present, setPresent] = useState(true),
    [lit, setLit] = useState<number | null>(null),
    [ready, setReady] = useState(false),
    [replay, setReplay] = useState(0);
  const down = useRef<MotorPoint | null>(null),
    lock = useRef(false),
    shown = useRef(performance.now());
  const previous = useRef<{ at: number; x: number; y: number } | null>(null);
  const pattern = sequenceFor(
    Number(plan.parameters.seed),
    round,
    Number(plan.parameters.length),
  );
  const rounds = trial ? 1 : Number(plan.parameters.rounds);
  useLayoutEffect(() => {
    if (!present || paused) return;
    setReady(false);
    setLit(reducedMotion ? null : pattern[0]);
    const timers: ReturnType<typeof setTimeout>[] = [];
    if (!reducedMotion)
      for (let i = 0; i < pattern.length; i++) {
        timers.push(
          setTimeout(
            () => setLit(pattern[i]),
            i * (content.sequencia.pulseMs + content.sequencia.gapMs),
          ),
        );
        timers.push(
          setTimeout(
            () => setLit(null),
            i * (content.sequencia.pulseMs + content.sequencia.gapMs) +
              content.sequencia.pulseMs,
          ),
        );
      }
    timers.push(
      setTimeout(
        () => setReady(true),
        reducedMotion
          ? 0
          : pattern.length *
              (content.sequencia.pulseMs + content.sequencia.gapMs),
      ),
    );
    return () => timers.forEach(clearTimeout);
  }, [present, round, replay, paused, reducedMotion]);
  useLayoutEffect(() => {
    shown.current = performance.now();
    down.current = null;
  }, [answer, present, paused]);
  async function accept(
    actual: number | null,
    points: MotorPoint[],
    source: "pointer" | "accessible",
  ) {
    if (present || disabled || paused || lock.current) return;
    lock.current = true;
    try {
      await onEvent({
        kind: "sequence",
        correct: actual === pattern[answer],
        source,
        at: Date.now(),
        durationMs: points.length > 1 ? points.at(-1)!.t - points[0].t : 0,
        reactionMs: performance.now() - shown.current,
        requestedHand: requestedHand(
          plan.settings,
          round * pattern.length + answer,
        ),
        width: size.width,
        height: size.height,
        points,
        expected: String(pattern[answer]),
        actual: actual === null ? "outside" : String(actual),
        details: {
          round: round + 1,
          position: answer + 1,
          length: pattern.length,
          replays: replay,
        },
      });
      if (answer + 1 < pattern.length) setAnswer(answer + 1);
      else if (round + 1 >= rounds) onFinish();
      else {
        setRound(round + 1);
        setAnswer(0);
        setPresent(true);
      }
    } finally {
      lock.current = false;
    }
  }
  return (
    <>
      <p>
        {t.sequenceRound} {round + 1} / {rounds}
      </p>
      {present ? (
        <>
          <p class="sequence-pattern" aria-live="polite">
            {t.sequenceObserve} <strong>{pattern.join(" → ")}</strong>
          </p>
          <button
            class="primary"
            disabled={!ready || disabled || paused}
            onClick={() => {
              setPresent(false);
              setAnswer(0);
              shown.current = performance.now();
            }}
          >
            {t.sequenceRemembered}
          </button>
        </>
      ) : (
        <p class="sequence-answer" aria-live="polite">
          {t.sequenceRepeat} {t.motorHandNow}{" "}
          {requestedHand(plan.settings, round * pattern.length + answer)}.{" "}
          {answer} / {pattern.length}
        </p>
      )}
      <div
        class="sequence-board"
        ref={board}
        aria-label={t.sequenceArea}
        onPointerDown={(e) => {
          if (present || paused || disabled || !e.isPrimary || e.button !== 0)
            return;
          down.current = point(e);
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerCancel={() => {
          down.current = null;
        }}
        onPointerUp={(e) => {
          const start = down.current;
          down.current = null;
          if (!start) return;
          const last = point(e),
            current = { at: last.t, x: last.x, y: last.y };
          if (repeatedTap(previous.current, current)) return;
          previous.current = current;
          const element = document
            .elementFromPoint(e.clientX, e.clientY)
            ?.closest<HTMLElement>("[data-zone]");
          const actual =
            element && board.current?.contains(element)
              ? Number(element.dataset.zone)
              : null;
          void accept(actual, [start, last], "pointer");
        }}
      >
        {[1, 2, 3, 4].map((zone) => (
          <button
            data-zone={zone}
            class={
              present && lit === zone ? "sequence-piece lit" : "sequence-piece"
            }
            disabled={present || disabled || paused}
            aria-label={`${t.sequencePiece} ${zone}`}
            onClick={(e) => {
              if (e.detail === 0) void accept(zone, [], "accessible");
            }}
          >
            {zone}
            {present && lit === zone && <span aria-hidden="true"> ●</span>}
          </button>
        ))}
      </div>
      {!present && (
        <button
          disabled={disabled || paused}
          onClick={() => {
            setPresent(true);
            setAnswer(0);
            setReplay(replay + 1);
          }}
        >
          {t.sequenceReplay}
        </button>
      )}
    </>
  );
}
export const sequencia: ExerciseModule = {
  id: "sequencia",
  parametros: (d) => ({
    length: content.sequencia.lengths[d - 1],
    rounds: content.sequencia.rounds,
    seed: crypto.getRandomValues(new Uint32Array(1))[0],
  }),
  preparar: (settings) => ({
    exercise: "sequencia",
    settings,
    parameters: sequencia.parametros(settings.difficulty),
  }),
  rodar: Sequencia,
  medir: motorSummary,
};

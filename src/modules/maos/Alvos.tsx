import { useLayoutEffect, useRef, useState } from "preact/hooks";
import content from "../../content/maos.json";
import {
  motorSummary,
  requestedHand,
  targetPoint,
  withinTarget,
  type MotorPoint,
} from "../../core/motor";
import { repeatedTap } from "../../core/typing";
import { textos as t } from "../../ui/textos";
import { useBoard } from "./useBoard";
import type { ExerciseModule, ExerciseProps } from "./types";
export function Alvos({
  plan,
  trial,
  paused,
  disabled,
  onEvent,
  onFinish,
}: ExerciseProps) {
  const { board, size, point } = useBoard();
  const [index, setIndex] = useState(0);
  const started = useRef<MotorPoint | null>(null),
    shown = useRef(performance.now()),
    lock = useRef(false);
  const previous = useRef<{ at: number; x: number; y: number } | null>(null);
  const diameter = Number(plan.parameters.size),
    count = trial ? 3 : Number(plan.parameters.count);
  const target = targetPoint(
    content.alvos.positions[index % content.alvos.positions.length],
    diameter,
    size.width,
    size.height,
  );
  useLayoutEffect(() => {
    shown.current = performance.now();
    started.current = null;
  }, [index, paused]);
  async function accept(
    points: MotorPoint[],
    source: "pointer" | "accessible",
  ) {
    if (paused || disabled || lock.current) return;
    lock.current = true;
    const last = points.at(-1);
    const correct =
      source === "accessible" ||
      (!!last && withinTarget(last, target, diameter));
    try {
      await onEvent({
        kind: "tap",
        correct,
        source,
        at: Date.now(),
        durationMs: points.length > 1 ? last!.t - points[0].t : 0,
        reactionMs: performance.now() - shown.current,
        requestedHand: requestedHand(plan.settings, index),
        width: size.width,
        height: size.height,
        points,
        expected: "target",
        actual: correct ? "target" : "outside",
        details: { x: target.x, y: target.y, diameter },
      });
      if (index + 1 >= count) onFinish();
      else setIndex(index + 1);
    } finally {
      lock.current = false;
    }
  }
  return (
    <>
      <p>
        {t.motorHandNow} {requestedHand(plan.settings, index)}.{" "}
        {t.motorProgress} {index + 1} / {count}
      </p>
      <div
        class="motor-board target-board"
        ref={board}
        aria-label={t.targetArea}
        onPointerDown={(e) => {
          if (paused || disabled || !e.isPrimary || e.button !== 0) return;
          started.current = point(e);
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerCancel={() => {
          started.current = null;
        }}
        onPointerUp={(e) => {
          const first = started.current;
          started.current = null;
          if (!first || paused || disabled) return;
          const last = point(e),
            current = { at: last.t, x: last.x, y: last.y };
          if (repeatedTap(previous.current, current)) return;
          previous.current = current;
          void accept([first, last], "pointer");
        }}
      >
        <button
          class="motor-target"
          aria-label={t.targetButton}
          disabled={disabled || paused}
          style={{
            left: target.x,
            top: target.y,
            width: diameter,
            height: diameter,
            minHeight: diameter,
          }}
          onClick={(e) => {
            if (e.detail === 0) void accept([], "accessible");
          }}
        >
          <span aria-hidden="true">●</span>
        </button>
      </div>
    </>
  );
}
export const alvos: ExerciseModule = {
  id: "alvos",
  parametros: (d) => ({
    size: content.alvos.sizes[d - 1],
    count: content.alvos.count,
  }),
  preparar: (settings) => ({
    exercise: "alvos",
    settings,
    parameters: alvos.parametros(settings.difficulty),
  }),
  rodar: Alvos,
  medir: motorSummary,
};

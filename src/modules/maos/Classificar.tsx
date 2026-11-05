import { useLayoutEffect, useRef, useState } from "preact/hooks";
import { motorSummary, requestedHand, type MotorPoint } from "../../core/motor";
import { classification } from "../../core/extendedMotor";
import { repeatedTap } from "../../core/typing";
import { textos as t } from "../../ui/textos";
import { useBoard } from "./useBoard";
import type { ExerciseModule, ExerciseProps } from "./types";
export function Classificar({
  plan,
  trial,
  paused,
  disabled,
  onEvent,
  onFinish,
}: ExerciseProps) {
  const [index, setIndex] = useState(0),
    [selected, setSelected] = useState(false),
    [drag, setDrag] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const { board, size, point } = useBoard();
  const active = useRef<MotorPoint[] | null>(null),
    lock = useRef(false),
    previous = useRef<{ at: number; x: number; y: number } | null>(null);
  const count = trial ? 4 : Number(plan.parameters.count),
    rule = index >= count / 2 ? 1 : 0;
  useLayoutEffect(() => {
    active.current = null;
    setDrag(false);
    setSelected(false);
  }, [paused, index]);
  async function accept(
    group: number,
    points: MotorPoint[],
    source: "pointer" | "accessible",
  ) {
    if (paused || disabled || lock.current) return;
    lock.current = true;
    try {
      await onEvent({
        kind: "gesture",
        correct: group === classification(index, rule),
        source,
        at: Date.now(),
        durationMs: points.length ? points.at(-1)!.t - points[0].t : 0,
        requestedHand: requestedHand(plan.settings, index),
        width: size.width,
        height: size.height,
        points,
        expected: String(classification(index, rule)),
        actual: String(group),
        details: { rule, card: index, truncated: points.length >= 6000 },
      });
      if (index + 1 === count) onFinish();
      else setIndex(index + 1);
    } finally {
      lock.current = false;
    }
  }
  return (
    <>
      <p>{t.classifyHelp}</p>
      <h3 aria-live="polite">{t.classifyRules[rule]}</h3>
      <p>
        {t.motorHandNow} {requestedHand(plan.settings, index)}. {index + 1} /{" "}
        {count}
      </p>
      <div ref={board} class="classify-board" aria-label={t.classifyArea}>
        <button
          style={
            drag
              ? {
                  transform: `translate(${position.x}px, ${position.y}px)`,
                  pointerEvents: "none",
                }
              : undefined
          }
          class={drag ? "drag-card dragging" : "drag-card"}
          disabled={paused || disabled}
          onPointerDown={(e) => {
            if (paused || disabled || !e.isPrimary || e.button !== 0) return;
            active.current = [point(e)];
            setPosition({ x: 0, y: 0 });
            setDrag(true);
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => {
            if (active.current) {
              const p = point(e);
              setPosition({
                x: p.x - active.current[0].x,
                y: p.y - active.current[0].y,
              });
              if (active.current.length < 6000) active.current.push(p);
            }
          }}
          onPointerCancel={() => {
            active.current = null;
            setDrag(false);
          }}
          onPointerUp={(e) => {
            const points = active.current;
            active.current = null;
            setDrag(false);
            if (!points) return;
            points.push(point(e));
            const now = { at: performance.now(), x: e.clientX, y: e.clientY };
            if (repeatedTap(previous.current, now)) return;
            previous.current = now;
            const el = document
              .elementFromPoint(e.clientX, e.clientY)
              ?.closest<HTMLElement>("[data-group]");
            if (el && board.current?.contains(el))
              void accept(Number(el.dataset.group), points, "pointer");
          }}
          onClick={(e) => {
            if (e.detail === 0) setSelected(true);
          }}
        >
          {t.classifyCards[index]}
        </button>
        <button disabled={paused || disabled} onClick={() => setSelected(true)}>
          {t.classifySelect}
        </button>
        {selected && <p role="status">{t.classifySelected}</p>}
        <div class="classify-groups">
          {t.classifyGroups[rule].map((label, group) => (
            <button
              data-group={group}
              disabled={paused || disabled}
              onClick={() => {
                if (selected) void accept(group, [], "accessible");
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
export const classificar: ExerciseModule = {
  id: "classificar",
  parametros: (d) => ({ count: [6, 9, 12][d - 1] }),
  preparar: (settings) => ({
    exercise: "classificar",
    settings,
    parameters: classificar.parametros(settings.difficulty),
  }),
  rodar: Classificar,
  medir: motorSummary,
};

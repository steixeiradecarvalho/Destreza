import { useLayoutEffect, useRef, useState } from "preact/hooks";
import content from "../../content/maos.json";
import {
  motorSummary,
  pathPoints,
  requestedHand,
  traceQuality,
  type MotorPoint,
} from "../../core/motor";
import { repeatedTap } from "../../core/typing";
import { textos as t } from "../../ui/textos";
import { useBoard } from "./useBoard";
import type { ExerciseModule, ExerciseProps } from "./types";
export function Trilha({
  plan,
  trial,
  paused,
  disabled,
  onEvent,
  onFinish,
}: ExerciseProps) {
  const { board, size, point } = useBoard();
  const canvas = useRef<HTMLCanvasElement>(null);
  const [index, setIndex] = useState(0),
    [stroke, setStroke] = useState<MotorPoint[]>([]),
    [virtual, setVirtual] = useState(false);
  const previous = useRef<{ at: number; x: number; y: number } | null>(null);
  const active = useRef<MotorPoint[] | null>(null),
    lock = useRef(false),
    truncated = useRef(false);
  const path = pathPoints(plan.settings.shape, size.width, size.height),
    width = Number(plan.parameters.width),
    count = trial ? 1 : Number(plan.parameters.traces);
  function append(p: MotorPoint) {
    const values = active.current;
    if (!values) return;
    if (values.length < 6000) values.push(p);
    else {
      values[values.length - 1] = p;
      truncated.current = true;
    }
    setStroke([...values]);
  }
  useLayoutEffect(() => {
    if (paused) {
      active.current = null;
      setVirtual(false);
      setStroke([]);
    }
  }, [paused]);
  useLayoutEffect(() => {
    const element = canvas.current;
    if (!element) return;
    const ratio = window.devicePixelRatio || 1;
    element.width = Math.round(size.width * ratio);
    element.height = Math.round(size.height * ratio);
    const c = element.getContext("2d");
    if (!c) return;
    c.scale(ratio, ratio);
    const css = getComputedStyle(document.documentElement),
      accent = css.getPropertyValue("--accent").trim(),
      soft = css.getPropertyValue("--soft").trim();
    c.lineCap = "round";
    c.lineJoin = "round";
    const draw = (
      points: { x: number; y: number }[],
      color: string,
      lineWidth: number,
    ) => {
      if (!points.length) return;
      c.strokeStyle = color;
      c.lineWidth = lineWidth;
      c.beginPath();
      c.moveTo(points[0].x, points[0].y);
      for (const p of points.slice(1)) c.lineTo(p.x, p.y);
      c.stroke();
    };
    draw(path, soft, width);
    c.setLineDash([5, 7]);
    draw(path, accent, 2);
    c.setLineDash([]);
    draw(stroke, accent, 4);
    for (const [i, p] of (plan.settings.shape === "oito"
      ? [[0, path[0]]]
      : [
          [0, path[0]],
          [1, path.at(-1)!],
        ]) as [number, { x: number; y: number }][]) {
      c.beginPath();
      c.arc(p.x, p.y, 30, 0, Math.PI * 2);
      c.strokeStyle = accent;
      c.lineWidth = 3;
      c.stroke();
      c.fillStyle = accent;
      c.font = `bold ${parseFloat(css.fontSize)}px system-ui`;
      c.textAlign = "center";
      c.fillText(String(i + 1), p.x, p.y + 7);
    }
  }, [stroke, size.width, size.height, plan.settings.shape, width]);
  async function finish(source: "pointer" | "accessible") {
    if (!active.current || paused || disabled || lock.current) return;
    lock.current = true;
    const points = [...active.current];
    active.current = null;
    setVirtual(false);
    const quality = traceQuality(points, path, width);
    try {
      await onEvent({
        kind: "trace",
        correct: quality.correct,
        source,
        at: Date.now(),
        durationMs: points.length ? points.at(-1)!.t - points[0].t : 0,
        requestedHand: requestedHand(plan.settings, index),
        width: size.width,
        height: size.height,
        points,
        details: {
          ...quality,
          shape: plan.settings.shape,
          bandWidth: width,
          truncated: truncated.current,
        },
      });
      setStroke([]);
      if (index + 1 >= count) onFinish();
      else setIndex(index + 1);
    } finally {
      lock.current = false;
    }
  }
  function move(dx: number, dy: number) {
    if (!virtual || disabled || paused || !active.current) return;
    const p = active.current.at(-1)!;
    append({
      x: Math.max(0, Math.min(size.width, p.x + dx)),
      y: Math.max(0, Math.min(size.height, p.y + dy)),
      t: performance.now(),
      pressure: null,
    });
  }
  return (
    <>
      <p>{plan.settings.shape === "oito" ? t.traceLoopHelp : t.traceHelp}</p>
      <p>
        {t.motorHandNow} {requestedHand(plan.settings, index)}.{" "}
        {t.motorProgress} {index + 1} / {count}
      </p>
      <div
        class="motor-board trace-board"
        ref={board}
        aria-label={t.traceArea}
        tabIndex={0}
        onKeyDown={(e) => {
          if (!virtual) return;
          const delta: Record<string, number[]> = {
            ArrowUp: [0, -8],
            ArrowDown: [0, 8],
            ArrowLeft: [-8, 0],
            ArrowRight: [8, 0],
          };
          if (delta[e.key]) {
            e.preventDefault();
            move(delta[e.key][0], delta[e.key][1]);
          }
        }}
        onPointerDown={(e) => {
          if (disabled || paused || !e.isPrimary || e.button !== 0) return;
          truncated.current = false;
          setVirtual(false);
          active.current = [point(e)];
          setStroke([...active.current]);
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (active.current && !virtual && !disabled && !paused)
            append(point(e));
        }}
        onPointerCancel={() => {
          active.current = null;
          setStroke([]);
        }}
        onPointerUp={(e) => {
          if (!active.current || virtual) return;
          const p = point(e),
            current = { at: p.t, x: p.x, y: p.y };
          const still = active.current.every(
            (sample) => Math.hypot(sample.x - p.x, sample.y - p.y) <= 12,
          );
          if (still && repeatedTap(previous.current, current)) {
            active.current = null;
            setStroke([]);
            return;
          }
          previous.current = current;
          append(p);
          void finish("pointer");
        }}
      >
        <canvas
          ref={canvas}
          aria-label={
            plan.settings.shape === "oito"
              ? t.traceLoopHelp
              : `${t.traceStart}: 1. ${t.traceEnd}: 2.`
          }
          role="img"
        />
      </div>
      <details>
        <summary>{t.traceAccessible}</summary>
        <p>{t.accessibleHelp}</p>
        <button
          disabled={disabled || paused}
          onClick={() => {
            truncated.current = false;
            active.current = [
              { ...path[0], t: performance.now(), pressure: null },
            ];
            setStroke([...active.current]);
            setVirtual(true);
          }}
        >
          {t.traceAccessible}
        </button>
        {virtual && (
          <>
            <div class="motor-direction">
              <button disabled={disabled || paused} onClick={() => move(0, -8)}>
                {t.up}
              </button>
              <button disabled={disabled || paused} onClick={() => move(0, 8)}>
                {t.down}
              </button>
              <button disabled={disabled || paused} onClick={() => move(-8, 0)}>
                {t.leftward}
              </button>
              <button disabled={disabled || paused} onClick={() => move(8, 0)}>
                {t.rightward}
              </button>
            </div>
            <button
              disabled={disabled || paused}
              onClick={() => void finish("accessible")}
            >
              {t.traceFinish}
            </button>
          </>
        )}
      </details>
    </>
  );
}
export const trilha: ExerciseModule = {
  id: "trilha",
  parametros: (d) => ({
    width: content.trilha.widths[d - 1],
    traces: content.trilha.traces,
  }),
  preparar: (settings) => ({
    exercise: "trilha",
    settings,
    parameters: trilha.parametros(settings.difficulty),
  }),
  rodar: Trilha,
  medir: motorSummary,
};

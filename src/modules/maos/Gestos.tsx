import { useLayoutEffect, useRef, useState } from "preact/hooks";
import content from "../../content/maos.json";
import {
  gestureCorrect,
  motorSummary,
  requestedHand,
  type MotorPoint,
} from "../../core/motor";
import { textos as t } from "../../ui/textos";
import { useBoard } from "./useBoard";
import type { ExerciseModule, ExerciseProps } from "./types";
type Gesture = keyof typeof t.gestureNames;
export function Gestos({
  plan,
  paused,
  disabled,
  onEvent,
  onFinish,
}: ExerciseProps) {
  const [step, setStep] = useState(0);
  const { board, size, point } = useBoard(step);
  const [zoom, setZoom] = useState(1),
    [angle, setAngle] = useState(0),
    [support, setSupport] = useState(false);
  const scrollLastAt = useRef(0);
  const list = useRef<HTMLDivElement>(null),
    wanted = useRef<HTMLDivElement>(null);
  const contacts = useRef(new Map<number, MotorPoint>()),
    samples = useRef<MotorPoint[]>([]),
    two = useRef(false),
    twoInside = useRef(false),
    base = useRef({ distance: 1, angle: 0 }),
    value = useRef(1),
    maxDrift = useRef(0),
    lock = useRef(false),
    source = useRef<"pointer" | "accessible">("pointer");
  const gesture = content.gestos.steps[step] as Gesture,
    tolerance = Number(plan.parameters.tolerance);
  function reset() {
    contacts.current.clear();
    samples.current = [];
    two.current = false;
    maxDrift.current = 0;
    value.current = gesture === "rotate" ? 0 : 1;
    setZoom(1);
    setAngle(0);
    setSupport(false);
    source.current = "pointer";
  }
  useLayoutEffect(() => {
    reset();
  }, [step]);
  useLayoutEffect(() => {
    if (paused) reset();
  }, [paused]);
  function photoContains(p: MotorPoint) {
    return (
      Math.abs(p.x - size.width / 2) <= 72 &&
      Math.abs(p.y - size.height / 2) <= 50
    );
  }
  async function submit(
    correct: boolean,
    points: MotorPoint[],
    mode: "pointer" | "accessible",
    details: Record<string, number | string | boolean | null>,
  ) {
    if (disabled || paused || lock.current) return;
    lock.current = true;
    try {
      await onEvent({
        kind: "gesture",
        correct,
        source: mode,
        at: Date.now(),
        durationMs:
          gesture === "scroll" && mode === "pointer" && points.length
            ? Math.max(0, scrollLastAt.current - points[0].t)
            : points.length
              ? points.at(-1)!.t - points[0].t
              : 0,
        requestedHand:
          plan.settings.handMode === "both" &&
          (gesture === "pinch" || gesture === "rotate")
            ? "both"
            : requestedHand(plan.settings, step),
        width:
          gesture === "scroll"
            ? (list.current?.clientWidth ?? size.width)
            : size.width,
        height:
          gesture === "scroll"
            ? (list.current?.clientHeight ?? size.height)
            : size.height,
        points,
        expected: gesture,
        actual: gesture,
        details: { gesture, ...details },
      });
      if (step + 1 >= content.gestos.steps.length) onFinish();
      else setStep(step + 1);
    } finally {
      lock.current = false;
    }
  }
  function down(e: PointerEvent) {
    if (disabled || paused || e.button !== 0) return;
    const p = point(e);
    contacts.current.set(e.pointerId, p);
    if (samples.current.length === 0) {
      samples.current = [p];
      maxDrift.current = 0;
      source.current = "pointer";
    } else samples.current.push(p);
    if (contacts.current.size === 2) {
      const [a, b] = [...contacts.current.values()];
      base.current = {
        distance: Math.max(1, Math.hypot(b.x - a.x, b.y - a.y)),
        angle: (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI,
      };
      two.current = true;
      twoInside.current = [a, b].every(photoContains);
    }
    board.current?.setPointerCapture(e.pointerId);
  }
  function move(e: PointerEvent) {
    if (!contacts.current.has(e.pointerId) || disabled || paused) return;
    const p = point(e);
    contacts.current.set(e.pointerId, p);
    if (samples.current.length < 6000) samples.current.push(p);
    const first = samples.current[0];
    maxDrift.current = Math.max(
      maxDrift.current,
      Math.hypot(p.x - first.x, p.y - first.y),
    );
    if (contacts.current.size === 2) {
      const [a, b] = [...contacts.current.values()];
      if (gesture === "pinch") {
        value.current = Math.max(
          0.6,
          Math.min(
            2.5,
            Math.hypot(b.x - a.x, b.y - a.y) / base.current.distance,
          ),
        );
        setZoom(value.current);
      }
      if (gesture === "rotate") {
        let delta =
          (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI -
          base.current.angle;
        delta = ((delta + 540) % 360) - 180;
        value.current = Math.max(-90, Math.min(90, delta));
        setAngle(value.current);
      }
    }
  }
  function up(e: PointerEvent) {
    if (!contacts.current.has(e.pointerId)) return;
    const p = point(e);
    samples.current.push(p);
    contacts.current.delete(e.pointerId);
    if (contacts.current.size) return;
    const values = [...samples.current];
    samples.current = [];
    const start = values[0];
    let correct = false;
    if (gesture === "tap")
      correct = !two.current && photoContains(start) && photoContains(p);
    if (gesture === "hold")
      correct =
        !two.current &&
        photoContains(start) &&
        photoContains(p) &&
        p.t - start.t >= content.gestos.holdMs &&
        maxDrift.current <= tolerance * 100;
    if (gesture === "pinch" || gesture === "rotate")
      correct =
        two.current &&
        twoInside.current &&
        gestureCorrect(gesture, value.current, tolerance);
    void submit(correct, values, "pointer", {
      value: value.current,
      twoPointers: two.current,
      maxDrift: maxDrift.current,
    });
  }
  function check() {
    if (gesture === "scroll") {
      const container = list.current,
        target = wanted.current;
      if (!container || !target) return;
      const c = container.getBoundingClientRect(),
        r = target.getBoundingClientRect(),
        error = r.top + r.height / 2 - (c.top + c.height / 2);
      void submit(
        gestureCorrect(gesture, error, tolerance),
        source.current === "pointer" ? [...samples.current] : [],
        source.current,
        {
          offsetPx: error,
          scrollTop: container.scrollTop,
          pointerSamplesPartial: true,
        },
      );
    } else
      void submit(
        gestureCorrect(gesture, value.current, tolerance),
        [],
        "accessible",
        { value: value.current, twoPointers: false },
      );
  }
  return (
    <>
      <h3>{t.gestureNames[gesture]}</h3>
      <p>{t.gestureInstructions[gesture]}</p>
      <p>
        {t.motorProgress} {step + 1} / {content.gestos.steps.length}.{" "}
        {plan.settings.handMode === "both" &&
        (gesture === "pinch" || gesture === "rotate")
          ? t.motorBothNow
          : `${t.motorHandNow} ${requestedHand(plan.settings, step)}`}
      </p>
      {gesture === "scroll" ? (
        <>
          <div class="scroll-practice">
            <div class="scroll-guide" aria-hidden="true" />
            <div
              class="gesture-list"
              ref={list}
              aria-label={t.gestureList}
              tabIndex={0}
              onPointerDown={(e) => {
                source.current = "pointer";
                const r = e.currentTarget.getBoundingClientRect();
                samples.current = [
                  {
                    x: e.clientX - r.left,
                    y: e.clientY - r.top,
                    t: performance.now(),
                    pressure: e.pressure,
                    pointerId: e.pointerId,
                    pointerType: e.pointerType,
                  },
                ];
                scrollLastAt.current = performance.now();
              }}
              onWheel={(e) => {
                source.current = "pointer";
                const r = e.currentTarget.getBoundingClientRect();
                samples.current = [
                  {
                    x: e.clientX - r.left,
                    y: e.clientY - r.top,
                    t: performance.now(),
                    pressure: null,
                    pointerType: "mouse",
                  },
                ];
                scrollLastAt.current = performance.now();
              }}
              onScroll={() => {
                scrollLastAt.current = performance.now();
              }}
              onKeyDown={() => {
                source.current = "accessible";
              }}
            >
              {t.gestureItems.map((item, i) => (
                <div
                  class="gesture-list-item"
                  ref={i === 2 ? wanted : undefined}
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
          <div class="motor-direction">
            <button
              disabled={disabled || paused}
              onClick={() => {
                source.current = "accessible";
                list.current?.scrollBy(0, -40);
              }}
            >
              {t.scrollUp}
            </button>
            <button
              disabled={disabled || paused}
              onClick={() => {
                source.current = "accessible";
                list.current?.scrollBy(0, 40);
              }}
            >
              {t.scrollDown}
            </button>
          </div>
          <button class="primary" disabled={disabled || paused} onClick={check}>
            {t.gestureCheck}
          </button>
        </>
      ) : (
        <>
          <div
            class="motor-board gesture-board"
            ref={board}
            aria-label={t.gestureArea}
            onContextMenu={(e) => e.preventDefault()}
            onPointerDown={down}
            onPointerMove={move}
            onPointerUp={up}
            onPointerCancel={() => {
              contacts.current.clear();
              samples.current = [];
              two.current = false;
            }}
          >
            {(gesture === "pinch" || gesture === "rotate") && (
              <div
                class="gesture-outline"
                aria-hidden="true"
                style={{
                  transform: `translate(-50%,-50%) scale(${gesture === "pinch" ? 1.5 : 1}) rotate(${gesture === "rotate" ? 30 : 0}deg)`,
                }}
              />
            )}
            <div
              class="gesture-picture"
              style={{
                transform: `translate(-50%,-50%) scale(${zoom}) rotate(${angle}deg)`,
              }}
              role="img"
              aria-label={gesture === "pinch" ? t.gestureMap : t.gesturePhoto}
            >
              {gesture === "pinch" ? (
                <svg viewBox="0 0 144 100" aria-hidden="true">
                  <path d="M10 20H130M10 50H130M10 80H130M35 5V95M80 5V95M120 5V95" />
                  <circle cx="80" cy="50" r="10" />
                </svg>
              ) : (
                <svg viewBox="0 0 144 100" aria-hidden="true">
                  <circle cx="110" cy="22" r="10" />
                  <path d="M5 90L45 35L85 90M55 90L95 48L135 90" />
                </svg>
              )}
            </div>
          </div>
          {(gesture === "pinch" || gesture === "rotate") && (
            <p aria-live="polite">
              {gesture === "pinch"
                ? `${t.gestureZoom}: ${Math.round(zoom * 100)}%`
                : `${t.gestureRotation}: ${Math.round(angle)}°`}
            </p>
          )}
          <details
            open={support}
            onToggle={(e) => setSupport(e.currentTarget.open)}
          >
            <summary>{t.gestureSupport}</summary>
            <p>{t.accessibleHelp}</p>
            {gesture === "tap" && (
              <button
                disabled={disabled || paused}
                onClick={() =>
                  void submit(true, [], "accessible", { button: true })
                }
              >
                {t.tapAlternative}
              </button>
            )}
            {gesture === "hold" && (
              <button
                disabled={disabled || paused}
                onClick={() =>
                  void submit(true, [], "accessible", { button: true })
                }
              >
                {t.holdAlternative}
              </button>
            )}
            {gesture === "pinch" && (
              <div class="motor-direction">
                <button
                  disabled={disabled || paused}
                  onClick={() => {
                    value.current = Math.min(2.5, value.current + 0.1);
                    setZoom(value.current);
                  }}
                >
                  {t.zoomIn}
                </button>
                <button
                  disabled={disabled || paused}
                  onClick={() => {
                    value.current = Math.max(0.6, value.current - 0.1);
                    setZoom(value.current);
                  }}
                >
                  {t.zoomOut}
                </button>
              </div>
            )}
            {gesture === "rotate" && (
              <div class="motor-direction">
                <button
                  disabled={disabled || paused}
                  onClick={() => {
                    value.current += 10;
                    setAngle(value.current);
                  }}
                >
                  {t.rotateRight}
                </button>
                <button
                  disabled={disabled || paused}
                  onClick={() => {
                    value.current -= 10;
                    setAngle(value.current);
                  }}
                >
                  {t.rotateLeft}
                </button>
              </div>
            )}
            {support && (gesture === "pinch" || gesture === "rotate") && (
              <button
                class="primary"
                disabled={disabled || paused}
                onClick={check}
              >
                {t.gestureCheck}
              </button>
            )}
          </details>
        </>
      )}
    </>
  );
}
export const gestos: ExerciseModule = {
  id: "gestos",
  parametros: (d) => ({ tolerance: content.gestos.tolerances[d - 1] }),
  preparar: (settings) => ({
    exercise: "gestos",
    settings,
    parameters: gestos.parametros(settings.difficulty),
  }),
  rodar: Gestos,
  medir: motorSummary,
};

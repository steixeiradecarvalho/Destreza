import { useLayoutEffect, useRef } from "preact/hooks";
import type { MotorPoint } from "../../core/motor";
import { repeatedTap } from "../../core/typing";
// Coordinates remain local to the actual target; accessible activation has no points.
export function useActions(paused: boolean, disabled: boolean) {
  const down = useRef(new Map<number, MotorPoint>());
  const last = useRef<{ at: number; x: number; y: number } | null>(null);
  useLayoutEffect(() => {
    down.current.clear();
  }, [paused]);
  function sample(e: PointerEvent): MotorPoint {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      t: performance.now(),
      pressure: e.pressure,
      pointerId: e.pointerId,
      pointerType: e.pointerType,
    };
  }
  return (
    accept: (
      points: MotorPoint[],
      source: "pointer" | "accessible",
      width: number,
      height: number,
    ) => void,
  ) => ({
    onPointerDown: (e: PointerEvent) => {
      if (paused || disabled || e.button !== 0) return;
      down.current.set(e.pointerId, sample(e));
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    },
    onPointerCancel: (e: PointerEvent) => {
      down.current.delete(e.pointerId);
    },
    onPointerUp: (e: PointerEvent) => {
      const start = down.current.get(e.pointerId);
      down.current.delete(e.pointerId);
      if (!start || paused || disabled) return;
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      if (
        e.clientX < rect.left ||
        e.clientX > rect.right ||
        e.clientY < rect.top ||
        e.clientY > rect.bottom
      )
        return;
      const current = { at: performance.now(), x: e.clientX, y: e.clientY };
      if (repeatedTap(last.current, current)) return;
      last.current = current;
      accept([start, sample(e)], "pointer", rect.width, rect.height);
    },
    onClick: (e: MouseEvent) => {
      if (e.detail === 0 && !paused && !disabled)
        accept([], "accessible", 0, 0);
    },
  });
}

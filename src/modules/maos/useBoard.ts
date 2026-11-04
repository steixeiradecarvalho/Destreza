import { useLayoutEffect, useRef, useState } from "preact/hooks";
import type { MotorPoint } from "../../core/motor";
export function useBoard(key: unknown = null) {
  const board = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 320, height: 280 });
  useLayoutEffect(() => {
    const element = board.current;
    if (!element) return;
    const update = () => {
      const width = element.clientWidth,
        height = element.clientHeight;
      if (width > 0 && height > 0)
        setSize((previous) =>
          previous.width === width && previous.height === height
            ? previous
            : { width, height },
        );
    };
    const observer = new ResizeObserver(update);
    observer.observe(element);
    update();
    return () => observer.disconnect();
  }, [key]);
  function point(e: PointerEvent): MotorPoint {
    const rect = board.current!.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) * size.width) / rect.width,
      y: ((e.clientY - rect.top) * size.height) / rect.height,
      t: performance.now(),
      pressure: e.pressure,
      pointerId: e.pointerId,
      pointerType: e.pointerType,
    };
  }
  return { board, size, point };
}

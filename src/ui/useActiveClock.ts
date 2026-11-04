import { useLayoutEffect, useRef, useState } from "preact/hooks";
export function useActiveClock(running: boolean, initial = 0) {
  const total = useRef(initial),
    anchor = useRef<number | null>(null),
    [elapsed, setElapsed] = useState(initial);
  function read() {
    return (
      total.current +
      (anchor.current === null ? 0 : performance.now() - anchor.current)
    );
  }
  useLayoutEffect(() => {
    if (!running) {
      setElapsed(total.current);
      return;
    }
    anchor.current = performance.now();
    const timer = setInterval(() => setElapsed(read()), 500);
    return () => {
      total.current = read();
      anchor.current = null;
      clearInterval(timer);
    };
  }, [running]);
  return { elapsed, read };
}

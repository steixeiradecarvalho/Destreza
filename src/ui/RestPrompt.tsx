import { useEffect, useState } from "preact/hooks";
import { textos as t } from "./textos";
export function RestPrompt() {
  const [due, setDue] = useState(false);
  useEffect(() => {
    let start = performance.now(),
      pointers = new Set<number>();
    const timer = setInterval(() => {
      if (
        !document.hidden &&
        pointers.size === 0 &&
        performance.now() - start >= 900000
      )
        setDue(true);
    }, 1000);
    const down = (event: PointerEvent) => {
        pointers.add(event.pointerId);
      },
      up = (event: PointerEvent) => {
        pointers.delete(event.pointerId);
      },
      hide = () => {
        start = performance.now();
        pointers.clear();
        setDue(false);
      };
    document.addEventListener("pointerdown", down);
    document.addEventListener("pointerup", up);
    document.addEventListener("pointercancel", up);
    document.addEventListener("visibilitychange", hide);
    return () => {
      clearInterval(timer);
      document.removeEventListener("pointerdown", down);
      document.removeEventListener("pointerup", up);
      document.removeEventListener("pointercancel", up);
      document.removeEventListener("visibilitychange", hide);
    };
  }, [due]);
  return due ? (
    <aside class="notice" role="status">
      <h2>{t.dailyPauseTitle}</h2>
      <svg class="rest-hands" viewBox="0 0 160 90" aria-hidden="true">
        <path d="M20 70V30q8-16 16 0v22-34q8-16 16 0v34-27q8-16 16 0v35q0 20-24 20z M92 70V30q8-16 16 0v22-34q8-16 16 0v34-27q8-16 16 0v35q0 20-24 20z" />
      </svg>
      <p>{t.dailyPauseHelp}</p>
      <button onClick={() => setDue(false)}>{t.continue}</button>
    </aside>
  ) : null;
}

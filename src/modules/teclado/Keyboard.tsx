import { useEffect, useLayoutEffect, useRef, useState } from "preact/hooks";
import type { JSX } from "preact";
import type { Preferences } from "../../data/db";
import { repeatedTap } from "../../core/typing";
import { textos as t } from "../../ui/textos";
export interface Hit {
  actual: string | null;
  source: string;
  durationMs: number;
  pressure: number | null;
  x: number | null;
  y: number | null;
  dx: number | null;
  dy: number | null;
  targetWidth: number | null;
  targetHeight: number | null;
}
interface Props {
  expected: string;
  prefs: Preferences;
  onHit: (hit: Hit) => void;
  disabled: boolean;
}
const rows = ["qwertyuiop", "asdfghjklç", "zxcvbnm"];
export function Keyboard({ expected, prefs, onHit, disabled }: Props) {
  const viewport = useRef<HTMLDivElement>(null);
  const grid = useRef<HTMLDivElement>(null);
  const down = useRef<{ id: number; at: number; pressure: number } | null>(
    null,
  );
  const previous = useRef<{ at: number; x: number; y: number } | null>(null);
  const physicalDown = useRef(new Map<string, number>());
  const [ghost, setGhost] = useState<{ x: number; y: number } | null>(null);
  const [side, setSide] = useState({ left: false, right: true });
  const size = prefs.keyboardSize ?? 100;
  function updateSides() {
    const v = viewport.current;
    if (v) {
      grid.current?.style.setProperty(
        "--window-width",
        `${v.clientWidth - 16}px`,
      );
      setSide({
        left: v.scrollLeft > 1,
        right: v.scrollLeft < v.scrollWidth - v.clientWidth - 1,
      });
    }
  }
  useEffect(() => {
    const v = viewport.current;
    if (!v) return;
    v.scrollLeft =
      prefs.hand === "direita" && prefs.grip === "polegar" ? v.scrollWidth : 0;
    const observer = new ResizeObserver(updateSides);
    observer.observe(v);
    updateSides();
    return () => observer.disconnect();
  }, [size, prefs.hand, prefs.grip]);
  function hit(
    actual: string | null,
    source: string,
    x: number | null,
    y: number | null,
    durationMs: number,
    pressure: number | null,
  ) {
    if (disabled) return;
    const target = Array.from(
      grid.current?.querySelectorAll<HTMLButtonElement>("[data-key]") ?? [],
    ).find((el) => el.dataset.key === expected);
    const rect = target?.getBoundingClientRect();
    if (x !== null && y !== null && viewport.current) {
      const box = grid.current!.getBoundingClientRect();
      setGhost({ x: x - box.left, y: y - box.top });
    }
    onHit({
      actual,
      source,
      durationMs,
      pressure,
      x,
      y,
      dx: rect && x !== null ? x - rect.left - rect.width / 2 : null,
      dy: rect && y !== null ? y - rect.top - rect.height / 2 : null,
      targetWidth: rect?.width ?? null,
      targetHeight: rect?.height ?? null,
    });
  }
  useLayoutEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      if (
        disabled ||
        e.altKey ||
        e.ctrlKey ||
        e.metaKey ||
        e.repeat ||
        e.key.length !== 1
      )
        return;
      if (e.key !== " " && !/^[a-zç]$/i.test(e.key)) return;
      // Space on a focused button must retain its native activation behavior.
      if (e.key === " " && document.activeElement instanceof HTMLButtonElement)
        return;
      e.preventDefault();
      physicalDown.current.set(e.code, performance.now());
    };
    const onUp = (e: KeyboardEvent) => {
      const started = physicalDown.current.get(e.code);
      if (started === undefined) return;
      physicalDown.current.delete(e.code);
      e.preventDefault();
      hit(
        e.key.toLocaleLowerCase("pt-BR"),
        "keyboard",
        null,
        null,
        performance.now() - started,
        null,
      );
    };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
  }, [expected, disabled, onHit]);
  function pointerDown(e: JSX.TargetedPointerEvent<HTMLDivElement>) {
    if (disabled || !e.isPrimary || e.button !== 0) return;
    down.current = {
      id: e.pointerId,
      at: performance.now(),
      pressure: e.pressure,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function pointerUp(e: JSX.TargetedPointerEvent<HTMLDivElement>) {
    const start = down.current;
    if (!start || start.id !== e.pointerId) return;
    down.current = null;
    const current = { at: performance.now(), x: e.clientX, y: e.clientY };
    if (repeatedTap(previous.current, current)) return;
    previous.current = current;
    const element = document
      .elementFromPoint(e.clientX, e.clientY)
      ?.closest<HTMLButtonElement>("[data-key]");
    hit(
      element && grid.current?.contains(element) ? element.dataset.key! : null,
      e.pointerType,
      e.clientX,
      e.clientY,
      current.at - start.at,
      start.pressure,
    );
  }
  function shift(direction: number) {
    const v = viewport.current;
    if (v) {
      v.scrollLeft += direction * Math.max(48, v.clientWidth - 60);
      updateSides();
    }
  }
  function reveal() {
    const key = Array.from(
      grid.current?.querySelectorAll<HTMLButtonElement>("[data-key]") ?? [],
    ).find((el) => el.dataset.key === expected);
    if (key && viewport.current) {
      viewport.current.scrollLeft =
        key.offsetLeft - viewport.current.clientWidth / 2 + key.offsetWidth / 2;
      updateSides();
    }
  }
  const keyButton = (letter: string) => (
    <button
      type="button"
      data-key={letter}
      aria-label={letter === " " ? t.space : `${t.key} ${letter}`}
      disabled={disabled}
      onClick={(e) => {
        if (e.detail === 0) hit(letter, "accessible", null, null, 0, null);
      }}
    >
      {letter === " " ? t.space : letter}
    </button>
  );
  return (
    <section
      class={prefs.scale >= 150 ? "keyboard large-labels" : "keyboard"}
      aria-label={t.keyboardLabel}
    >
      <div class="keyboard-window" ref={viewport} onScroll={updateSides}>
        <div
          class="key-grid"
          ref={grid}
          style={{ "--key-size": `${(48 * size) / 100}px` }}
          onPointerDown={pointerDown}
          onPointerUp={pointerUp}
          onPointerCancel={() => {
            down.current = null;
          }}
        >
          {rows.map((row, index) => (
            <div class={`key-row row-${index}`}>
              {Array.from(row).map(keyButton)}
            </div>
          ))}
          <div class="space-row">{keyButton(" ")}</div>
          {prefs.ghost && ghost && (
            <span
              class="touch-ghost"
              aria-hidden="true"
              style={{ left: ghost.x, top: ghost.y }}
            />
          )}
        </div>
      </div>
      <div class="keyboard-nav">
        <button type="button" onClick={() => shift(-1)} disabled={!side.left}>
          {t.left}
        </button>
        <button type="button" onClick={() => shift(1)} disabled={!side.right}>
          {t.right}
        </button>
      </div>
      <button type="button" onClick={reveal}>
        {t.reveal}
      </button>
    </section>
  );
}

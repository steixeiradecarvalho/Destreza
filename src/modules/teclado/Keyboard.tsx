import { useEffect, useLayoutEffect, useRef, useState } from "preact/hooks";
import type { JSX } from "preact";
import type { Preferences } from "../../data/db";
import { repeatedTap } from "../../core/typing";
import { textos as t } from "../../ui/textos";
export interface Hit {
  operation?: "character" | "delete" | "suggestion" | "modifier";
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
  level?: number;
  suggestions?: { word: string; tail: string }[];
}
const letters = ["qwertyuiop", "asdfghjklç", "zxcvbnm"];
const accents: Record<string, string[]> = {
  a: ["á", "à", "â", "ã"],
  e: ["é", "ê"],
  i: ["í"],
  o: ["ó", "ô", "õ"],
  u: ["ú", "ü"],
  c: ["ç"],
};
export function Keyboard({
  expected,
  prefs,
  onHit,
  disabled,
  level = 1,
  suggestions = [],
}: Props) {
  const root = useRef<HTMLElement>(null);
  const [upper, setUpper] = useState(false);
  const [numbers, setNumbers] = useState(false);
  const [palette, setPalette] = useState<string | null>(null);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | undefined>();
  const held = useRef(false);
  const rows = numbers
    ? ["1234567890", ".,!?@:;-()", '"/+=%&*#']
    : letters.map((row) => (upper ? row.toLocaleUpperCase("pt-BR") : row));
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
  useEffect(() => () => clearTimeout(holdTimer.current), []);
  useLayoutEffect(updateSides, [upper, numbers, disabled]);
  function updateSides() {
    const v = viewport.current;
    if (v) {
      grid.current?.style.setProperty(
        "--window-width",
        `${v.clientWidth - 16}px`,
      );
      const windowRect = v.getBoundingClientRect();
      for (const key of grid.current?.querySelectorAll<HTMLButtonElement>(
        ".key-row button",
      ) ?? []) {
        const rect = key.getBoundingClientRect();
        // Do not present a clipped fragment as a small, interactive target.
        key.style.visibility =
          rect.left >= windowRect.left + 1 && rect.right <= windowRect.right - 1
            ? "visible"
            : "hidden";
      }
      setSide({
        left: v.scrollLeft > 1,
        right: v.scrollLeft < v.scrollWidth - v.clientWidth - 1,
      });
    }
  }
  useLayoutEffect(() => {
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
    operation: Hit["operation"] = "character",
    overrideRect?: DOMRect,
  ) {
    if (disabled) return;
    const target = Array.from(
      root.current?.querySelectorAll<HTMLButtonElement>("[data-key]") ?? [],
    ).find((el) => el.dataset.key === expected);
    const rect =
      operation === "modifier"
        ? undefined
        : (overrideRect ?? target?.getBoundingClientRect());
    if (
      operation === "character" &&
      x !== null &&
      y !== null &&
      viewport.current
    ) {
      const box = grid.current!.getBoundingClientRect();
      setGhost({ x: x - box.left, y: y - box.top });
    }
    if (operation === "character" && actual && upper) setUpper(false);
    onHit({
      operation,
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
        (e.key.length !== 1 && e.key !== "Backspace")
      )
        return;
      if (
        e.key !== "Backspace" &&
        (e.key.length !== 1 || /[\u0000-\u001f]/.test(e.key))
      )
        return;
      if (e.key === "Backspace" && level < 7) return;
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
        level >= 8 || e.key === "Backspace"
          ? e.key
          : e.key.toLocaleLowerCase("pt-BR"),
        "keyboard",
        null,
        null,
        performance.now() - started,
        null,
        e.key === "Backspace" ? "delete" : "character",
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
    held.current = false;
    const base = (e.target as HTMLElement)
      .closest<HTMLButtonElement>("[data-key]")
      ?.dataset.key?.toLocaleLowerCase("pt-BR");
    clearTimeout(holdTimer.current);
    if (level >= 8 && base && accents[base])
      holdTimer.current = setTimeout(() => {
        held.current = true;
        setPalette(base);
      }, 500);
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function pointerUp(e: JSX.TargetedPointerEvent<HTMLDivElement>) {
    const start = down.current;
    if (!start || start.id !== e.pointerId) return;
    down.current = null;
    clearTimeout(holdTimer.current);
    if (held.current) {
      hit(
        "Accent",
        e.pointerType,
        e.clientX,
        e.clientY,
        performance.now() - start.at,
        start.pressure,
        "modifier",
      );
      return;
    }
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
      element?.dataset.key === "Backspace" ? "delete" : "character",
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
    const keys = Array.from(
      grid.current?.querySelectorAll<HTMLButtonElement>("[data-key]") ?? [],
    );
    const key =
      keys.find((el) => el.dataset.key === expected) ??
      keys.find(
        (el) =>
          el.dataset.key ===
          expected.normalize("NFD")[0]?.toLocaleLowerCase("pt-BR"),
      );
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
      aria-label={
        letter === " "
          ? t.space
          : letter === "Backspace"
            ? t.deleteKey
            : `${t.key} ${letter}`
      }
      disabled={disabled}
      onClick={(e) => {
        if (e.detail === 0)
          hit(
            letter,
            "accessible",
            null,
            null,
            0,
            null,
            letter === "Backspace" ? "delete" : "character",
          );
      }}
    >
      {letter === " " ? t.space : letter === "Backspace" ? t.deleteKey : letter}
    </button>
  );
  return (
    <section
      class={prefs.scale >= 150 ? "keyboard large-labels" : "keyboard"}
      aria-label={t.keyboardLabel}
      ref={root}
    >
      {suggestions.length > 0 && (
        <div class="suggestion-bar">
          {suggestions.map((item) => (
            <button
              disabled={disabled}
              aria-label={`${t.suggestion} ${item.word}`}
              onClick={(e) => {
                hit(
                  item.tail,
                  e.detail ? "pointer" : "accessible",
                  e.detail ? e.clientX : null,
                  e.detail ? e.clientY : null,
                  0,
                  null,
                  "suggestion",
                  e.currentTarget.getBoundingClientRect(),
                );
              }}
            >
              {item.word}
            </button>
          ))}
        </div>
      )}
      {level >= 9 && (
        <div class="keyboard-tools">
          <button
            disabled={disabled}
            aria-pressed={upper}
            onClick={() => {
              setUpper(!upper);
              hit("Shift", "accessible", null, null, 0, null, "modifier");
            }}
          >
            {t.shiftKey}
          </button>
          <button
            disabled={disabled}
            aria-pressed={numbers}
            onClick={() => {
              setNumbers(!numbers);
              hit("Layer", "accessible", null, null, 0, null, "modifier");
            }}
          >
            {numbers ? t.lettersKey : t.numbersKey}
          </button>
        </div>
      )}
      {palette && (
        <div class="accent-palette" role="group" aria-label={t.accentOptions}>
          {accents[palette].map((letter) => (
            <button
              data-key={letter}
              aria-label={`${t.key} ${letter}`}
              disabled={disabled}
              onClick={(e) => {
                hit(
                  letter,
                  e.detail ? "pointer" : "accessible",
                  e.detail ? e.clientX : null,
                  e.detail ? e.clientY : null,
                  0,
                  null,
                  "character",
                  e.currentTarget.getBoundingClientRect(),
                );
                setPalette(null);
              }}
            >
              {letter}
            </button>
          ))}
          <button onClick={() => setPalette(null)}>{t.closeAccents}</button>
        </div>
      )}
      <div class="keyboard-window" ref={viewport} onScroll={updateSides}>
        <div
          class="key-grid"
          ref={grid}
          style={{ "--key-size": `${(48 * size) / 100}px` }}
          onPointerDown={pointerDown}
          onPointerUp={pointerUp}
          onPointerCancel={() => {
            down.current = null;
            clearTimeout(holdTimer.current);
            held.current = false;
          }}
        >
          {rows.map((row, index) => (
            <div class={`key-row row-${index}`}>
              {Array.from(row).map(keyButton)}
            </div>
          ))}
          <div class="space-row">
            {keyButton(" ")}
            {level >= 7 && keyButton("Backspace")}
          </div>
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
      {level >= 8 && (
        <button
          disabled={disabled}
          onClick={() => {
            const base = expected
              .normalize("NFD")[0]
              ?.toLocaleLowerCase("pt-BR");
            setPalette(accents[base] ? base : "a");
          }}
        >
          {t.accentKey}
        </button>
      )}
      <button type="button" onClick={reveal}>
        {t.reveal}
      </button>
    </section>
  );
}

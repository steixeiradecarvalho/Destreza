import { useEffect, useLayoutEffect, useRef, useState } from "preact/hooks";
import { motorSummary } from "../../core/motor";
import { rhythmScore } from "../../core/extendedMotor";
import { textos as t } from "../../ui/textos";
import { useActions } from "./useActions";
import type { ExerciseModule, ExerciseProps } from "./types";
export function Ritmo({
  plan,
  trial,
  paused,
  disabled,
  reducedMotion,
  onEvent,
  onFinish,
}: ExerciseProps) {
  const [running, setRunning] = useState(false),
    [index, setIndex] = useState(0),
    [pulse, setPulse] = useState(0);
  const last = useRef<number | null>(null),
    lock = useRef(false);
  const bpm = Number(plan.parameters.bpm),
    interval = 60000 / bpm,
    count = trial ? 4 : 12,
    side = index % 2;
  const handlers = useActions(paused, disabled);
  useLayoutEffect(() => {
    last.current = null;
  }, [paused]);
  useEffect(() => {
    if (!running || paused) return;
    const timer = setInterval(() => setPulse((p) => p + 1), interval);
    return () => clearInterval(timer);
  }, [running, paused, interval]);
  return (
    <>
      <p>{t.rhythmHelp}</p>
      <p>
        {t.rhythmTempo} {bpm}
      </p>
      {!running ? (
        <button
          class="primary"
          disabled={disabled || paused}
          onClick={() => setRunning(true)}
        >
          {t.rhythmStart}
        </button>
      ) : (
        <>
          <p class="rhythm-pulse" aria-hidden="true">
            {t.rhythmPulse} {reducedMotion ? "●" : pulse % 2 ? "● ○" : "○ ●"}
          </p>
          <p role="status">
            {t.rhythmTarget} <strong>{t.rhythmSides[side]}</strong>. {index + 1}{" "}
            / {count}
          </p>
          <div class="rhythm-zones" aria-label={t.rhythmArea}>
            {t.rhythmSides.map((label, actual) => (
              <button
                disabled={disabled || paused}
                {...handlers(async (points, source, width, height) => {
                  if (lock.current) return;
                  lock.current = true;
                  const now = performance.now(),
                    elapsed = last.current === null ? null : now - last.current;
                  const score = rhythmScore(side, actual, elapsed, interval);
                  try {
                    await onEvent({
                      kind: "tap",
                      correct: score.correct,
                      source,
                      at: Date.now(),
                      durationMs: points.length
                        ? points.at(-1)!.t - points[0].t
                        : 0,
                      requestedHand: side === 0 ? "esquerda" : "direita",
                      width,
                      height,
                      points,
                      expected: String(side),
                      actual: String(actual),
                      details: {
                        bpm,
                        intervalMs: elapsed,
                        offsetMs: score.offsetMs,
                        supported: true,
                      },
                    });
                    last.current = now;
                    if (index + 1 === count) onFinish();
                    else setIndex(index + 1);
                  } finally {
                    lock.current = false;
                  }
                })}
              >
                {label}
              </button>
            ))}
          </div>
        </>
      )}
    </>
  );
}
export const ritmo: ExerciseModule = {
  id: "ritmo",
  parametros: (d) => ({ bpm: [40, 50, 60][d - 1] }),
  preparar: (settings) => ({
    exercise: "ritmo",
    settings: { ...settings, handMode: "both" },
    parameters: ritmo.parametros(settings.difficulty),
  }),
  rodar: Ritmo,
  medir: motorSummary,
};

import { useRef, useState } from "preact/hooks";
import { motorSummary, requestedHand } from "../../core/motor";
import { textos as t } from "../../ui/textos";
import { useActions } from "./useActions";
import type { ExerciseModule, ExerciseProps } from "./types";
export function Dedilhado({
  plan,
  trial,
  paused,
  disabled,
  onEvent,
  onFinish,
}: ExerciseProps) {
  const [index, setIndex] = useState(0),
    lock = useRef(false);
  const zones = Number(plan.parameters.zones),
    count = trial ? 3 : 10,
    finger = index % zones;
  const handlers = useActions(paused, disabled);
  return (
    <>
      <p>{t.fingerHelp}</p>
      <p role="status">
        {t.fingerPrompt} <strong>{t.fingerNames[finger]}</strong>.{" "}
        {t.motorHandNow} {requestedHand(plan.settings, index)}. {index + 1} /{" "}
        {count}
      </p>
      <div class="finger-zones">
        {Array.from({ length: zones }, (_, zone) => (
          <button
            disabled={disabled || paused}
            {...handlers(async (points, source, width, height) => {
              if (lock.current) return;
              lock.current = true;
              try {
                await onEvent({
                  kind: "tap",
                  correct: zone === finger,
                  source,
                  at: Date.now(),
                  durationMs: points.length
                    ? points.at(-1)!.t - points[0].t
                    : 0,
                  requestedHand: requestedHand(plan.settings, index),
                  width,
                  height,
                  points,
                  expected: String(finger),
                  actual: String(zone),
                  details: { finger: t.fingerNames[finger], zones },
                });
                if (index + 1 === count) onFinish();
                else setIndex(index + 1);
              } finally {
                lock.current = false;
              }
            })}
          >
            {t.fingerNames[zone]}
          </button>
        ))}
      </div>
    </>
  );
}
export const dedilhado: ExerciseModule = {
  id: "dedilhado",
  parametros: (d) => ({ zones: [3, 4, 5][d - 1] }),
  preparar: (settings) => ({
    exercise: "dedilhado",
    settings,
    parameters: dedilhado.parametros(settings.difficulty),
  }),
  rodar: Dedilhado,
  medir: motorSummary,
};

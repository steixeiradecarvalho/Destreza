import { useEffect, useState } from "preact/hooks";
import { pathPoints } from "../../core/motor";
import { textos as t } from "../../ui/textos";
import type { ExercisePlan } from "./types";
import type { ExerciseId } from "./registry";
export function Demo({
  id,
  plan,
  reducedMotion,
}: {
  id: ExerciseId;
  plan: ExercisePlan;
  reducedMotion: boolean;
}) {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    setFrame(0);
    if (reducedMotion) return;
    let tick = 0;
    const timer = setInterval(() => {
      setFrame(++tick);
      if (tick >= 100) clearInterval(timer);
    }, 50);
    return () => clearInterval(timer);
  }, [reducedMotion]);
  const path = pathPoints(plan.settings.shape, 300, 180),
    cursor = path[Math.min(100, frame)];
  const target = [
    [70, 50],
    [220, 125],
    [150, 80],
  ][Math.min(2, Math.floor(frame / 34))];
  const seq = [1, 3, 2],
    current = seq[Math.min(2, Math.floor(frame / 34))];
  const gestures = ["tap", "scroll", "pinch", "rotate", "hold"] as const,
    gesture = gestures[Math.min(4, Math.floor(frame / 20))];
  return (
    <div class="motor-demo" role="img" aria-label={t.motorDescriptions[id]}>
      {id === "trilha" && (
        <svg viewBox="0 0 300 180" aria-hidden="true">
          <polyline
            points={path.map((p) => `${p.x},${p.y}`).join(" ")}
            class="demo-path"
          />
          <polyline
            points={path.map((p) => `${p.x},${p.y}`).join(" ")}
            class="demo-line"
          />
          <circle cx={cursor.x} cy={cursor.y} r="12" class="demo-finger" />
          <circle cx={path[0].x} cy={path[0].y} r="22" class="demo-start" />
        </svg>
      )}
      {id === "alvos" && (
        <svg viewBox="0 0 300 180" aria-hidden="true">
          {reducedMotion ? (
            [
              [70, 50],
              [220, 125],
              [150, 80],
            ].map(([x, y], i) => (
              <g>
                <circle cx={x} cy={y} r="25" class="demo-start" />
                <text x={x} y={y + 7} text-anchor="middle">
                  {i + 1}
                </text>
              </g>
            ))
          ) : (
            <>
              <circle cx={target[0]} cy={target[1]} r="28" class="demo-start" />
              <circle
                cx={target[0]}
                cy={target[1]}
                r="10"
                class="demo-finger"
              />
            </>
          )}
        </svg>
      )}
      {id === "sequencia" && (
        <>
          <p>{t.sequenceObserve} 1 → 3 → 2</p>
          <div class="demo-sequence">
            {[1, 2, 3, 4].map((zone) => (
              <span class={!reducedMotion && zone === current ? "lit" : ""}>
                {zone}
              </span>
            ))}
          </div>
        </>
      )}
      {id === "gestos" &&
        (reducedMotion ? (
          <ol>
            {gestures.map((item) => (
              <li>{t.gestureNames[item]}</li>
            ))}
          </ol>
        ) : (
          <>
            <p>{t.gestureNames[gesture]}</p>
            <svg viewBox="0 0 300 180" aria-hidden="true">
              <g
                transform={`translate(150 90) scale(${gesture === "pinch" ? 1 + (frame % 20) / 40 : 1}) rotate(${gesture === "rotate" ? (frame % 20) * 1.5 : 0})`}
              >
                <rect
                  x="-50"
                  y="-35"
                  width="100"
                  height="70"
                  rx="8"
                  class="demo-start"
                />
                <path d="M-40 25L-15-15L15 25L35 0" class="demo-line" />
              </g>
              <circle
                cx={gesture === "scroll" ? 220 : 150}
                cy={gesture === "scroll" ? 140 - (frame % 20) * 4 : 90}
                r="12"
                class="demo-finger"
              />
              {gesture === "pinch" && (
                <circle cx="100" cy="90" r="12" class="demo-finger" />
              )}
            </svg>
          </>
        ))}
    </div>
  );
}

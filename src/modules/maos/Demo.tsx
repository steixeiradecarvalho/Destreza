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
  const wordLabels = Array.from(
    t.wordTraceWords[Number(plan.parameters.length) - 3] ?? "asa",
  );
  const positions: Record<string, { x: number; y: number }> = {
    a: { x: 60, y: 90 },
    s: { x: 125, y: 90 },
    d: { x: 190, y: 90 },
    e: { x: 190, y: 30 },
    c: { x: 210, y: 150 },
  };
  const demoNodes =
    id === "palavra"
      ? [...new Set(wordLabels)].map((label) => ({
          label,
          ...positions[label],
        }))
      : Array.from({ length: 9 }, (_, i) => ({
          label: String(i + 1),
          x: 50 + (i % 3) * 100,
          y: 30 + Math.floor(i / 3) * 60,
        }));
  const demoPath =
    id === "palavra"
      ? wordLabels.map((label) => positions[label])
      : [demoNodes[0], demoNodes[4], demoNodes[2]];
  const progress = Math.min(0.999, frame / 100) * (demoPath.length - 1),
    segment = Math.floor(progress),
    fraction = progress - segment;
  const demoCursor = {
    x:
      demoPath[segment].x +
      (demoPath[segment + 1].x - demoPath[segment].x) * fraction,
    y:
      demoPath[segment].y +
      (demoPath[segment + 1].y - demoPath[segment].y) * fraction,
  };
  return (
    <div class="motor-demo" role="img" aria-label={t.motorDescriptions[id]}>
      {(id === "dedilhado" || id === "ritmo") && (
        <>
          <p>{id === "dedilhado" ? t.fingerHelp : t.rhythmHelp}</p>
          <div class="demo-sequence">
            {(id === "dedilhado"
              ? t.fingerNames.slice(0, Number(plan.parameters.zones))
              : t.rhythmSides
            ).map((label, i) => (
              <span
                class={
                  !reducedMotion &&
                  (id === "ritmo"
                    ? Math.floor(frame / (1200 / Number(plan.parameters.bpm))) %
                      2
                    : Math.floor(frame / 20) %
                      Number(plan.parameters.zones)) === i
                    ? "lit"
                    : ""
                }
              >
                {label}
              </span>
            ))}
          </div>
        </>
      )}
      {id === "classificar" && (
        <>
          <p>{t.classifyHelp}</p>
          <svg viewBox="0 0 300 210" aria-hidden="true">
            <rect
              x="55"
              y="100"
              width="190"
              height="100"
              rx="12"
              class="demo-start"
            />
            <text x="150" y="182" text-anchor="middle">
              {t.classifyGroups[0][0]}
            </text>
            <path d="M150 65V110" class="demo-line" stroke-dasharray="5 5" />
            <g
              transform={`translate(0 ${reducedMotion ? 0 : Math.min(85, frame * 1.2)})`}
            >
              <rect
                x="80"
                y="10"
                width="140"
                height="45"
                rx="8"
                class="demo-start"
              />
              <text x="150" y="40" text-anchor="middle">
                {t.classifyCards[0]}
              </text>
              {!reducedMotion && (
                <circle cx="180" cy="48" r="9" class="demo-finger" />
              )}
            </g>
          </svg>
        </>
      )}
      {(id === "palavra" || id === "padrao") && (
        <>
          <p>{id === "palavra" ? t.wordTraceHelp : t.patternHelp}</p>
          {id === "palavra" && (
            <p>
              {t.wordTracePrompt}{" "}
              {t.wordTraceWords[Number(plan.parameters.length) - 3]}
            </p>
          )}
          <svg viewBox="0 0 300 180" aria-hidden="true">
            <polyline
              class="demo-line"
              points={demoPath.map((p) => `${p.x},${p.y}`).join(" ")}
              stroke-dasharray="5 5"
            />
            {demoNodes.map((node) => (
              <g>
                <rect
                  x={node.x - 24}
                  y={node.y - 24}
                  width="48"
                  height="48"
                  rx="12"
                  class="demo-start"
                />
                <text x={node.x} y={node.y + 7} text-anchor="middle">
                  {node.label}
                </text>
              </g>
            ))}
            {!reducedMotion && (
              <circle
                cx={demoCursor.x}
                cy={demoCursor.y}
                r="10"
                class="demo-finger"
              />
            )}
          </svg>
        </>
      )}
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

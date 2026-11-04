import type { ComponentType } from "preact";
import type { MotorEvent, MotorSettings, MotorSummary } from "../../core/motor";
export interface ExercisePlan {
  exercise: string;
  settings: MotorSettings;
  parameters: Record<string, number | string>;
}
export interface ExerciseProps {
  plan: ExercisePlan;
  trial: boolean;
  paused: boolean;
  disabled: boolean;
  reducedMotion: boolean;
  onEvent: (event: MotorEvent) => Promise<void>;
  onFinish: () => void;
}
export interface ExerciseModule {
  id: "trilha" | "alvos" | "sequencia" | "gestos";
  parametros: (difficulty: 1 | 2 | 3) => Record<string, number | string>;
  preparar: (settings: MotorSettings) => ExercisePlan;
  rodar: ComponentType<ExerciseProps>;
  medir: (events: MotorEvent[]) => MotorSummary;
}

import { trilha } from "./Trilha";
import { alvos } from "./Alvos";
import { sequencia } from "./Sequencia";
import { gestos } from "./Gestos";
import { dedilhado } from "./Dedilhado";
import { ritmo } from "./Ritmo";
import { classificar } from "./Classificar";
import { palavra, padrao } from "./TraceSelection";
export const exercises = {
  trilha,
  alvos,
  sequencia,
  gestos,
  dedilhado,
  ritmo,
  classificar,
  palavra,
  padrao,
};
export type ExerciseId = keyof typeof exercises;

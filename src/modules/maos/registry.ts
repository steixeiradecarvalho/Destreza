import { trilha } from "./Trilha";
import { alvos } from "./Alvos";
import { sequencia } from "./Sequencia";
import { gestos } from "./Gestos";
export const exercises = { trilha, alvos, sequencia, gestos };
export type ExerciseId = keyof typeof exercises;

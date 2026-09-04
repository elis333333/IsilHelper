/**
 * Cálculo de notas. Todo puro y probado sin red.
 *
 * Moodle ya calcula el total de cada curso en un ítem con
 * `itemtype: "course"`. Si viene, se usa ese: es la nota oficial y recalcularla
 * por nuestra cuenta solo puede introducir discrepancias. Si no viene, se
 * pondera con `weightraw`, que es lo que hace el propio boletín.
 */

import type { GradeItem } from "./types";

export type CourseGrade = {
  /** 0–100, o `null` si el curso todavía no tiene ninguna nota. */
  percentage: number | null;
  /** De dónde salió: el total de Moodle o una ponderación nuestra. */
  source: "total" | "weighted" | "none";
  /** Cuántas actividades tienen nota puesta. */
  graded: number;
};

function percentageOf(item: GradeItem): number | null {
  const raw = item.graderaw;
  const max = item.grademax;
  if (typeof raw !== "number" || typeof max !== "number" || max <= 0) return null;
  return (raw / max) * 100;
}

/** El ítem que Moodle marca como total del curso. */
function courseTotal(items: GradeItem[]): GradeItem | undefined {
  return items.find((item) => item.itemtype === "course");
}

/** Ponderación con los pesos que informa Moodle, saltando lo no calificado. */
function weightedPercentage(items: GradeItem[]): number | null {
  let weighted = 0;
  let totalWeight = 0;

  for (const item of items) {
    if (item.itemtype === "course") continue;
    const percentage = percentageOf(item);
    const weight = item.weightraw;
    if (percentage === null || typeof weight !== "number" || weight <= 0) continue;
    weighted += percentage * weight;
    totalWeight += weight;
  }

  return totalWeight > 0 ? weighted / totalWeight : null;
}

export function gradedCount(items: GradeItem[]): number {
  return items.filter(
    (item) => item.itemtype !== "course" && percentageOf(item) !== null,
  ).length;
}

export function courseGrade(items: GradeItem[]): CourseGrade {
  const graded = gradedCount(items);

  const total = courseTotal(items);
  if (total) {
    const percentage = percentageOf(total);
    if (percentage !== null) return { percentage, source: "total", graded };
  }

  const weighted = weightedPercentage(items);
  if (weighted !== null) return { percentage: weighted, source: "weighted", graded };

  return { percentage: null, source: "none", graded };
}

/**
 * Promedio entre cursos.
 *
 * Es una media **simple**, no ponderada por créditos: la API de Moodle no
 * expone los créditos de cada curso, así que ponderar exigiría inventarlos. La
 * interfaz lo dice con esas palabras en vez de presentarlo como el promedio
 * oficial del récord académico.
 */
export function overallAverage(grades: CourseGrade[]): number | null {
  const values = grades
    .map((grade) => grade.percentage)
    .filter((value): value is number => value !== null);
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

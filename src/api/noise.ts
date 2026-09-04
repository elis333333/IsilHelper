/**
 * Filtro del ruido documentado en `context/domain.md` §5.
 *
 * Aparecen como módulos del curso pero no son material: encuestas de jotform y
 * el enlace interno al boletín de notas. Dejarlos dentro hace que el detalle
 * de curso parezca lleno de contenido que no sirve.
 */

import type { CourseModule } from "./types";

/** El mismo patrón que ya se usaba en los scripts de Python. */
export const NOISE_PATTERN =
  /ayúdanos a mejorar|ayudanos a mejorar|tus calificaciones|encuesta/i;

export function isNoise(name: string): boolean {
  return NOISE_PATTERN.test(name);
}

export function withoutNoise(modules: CourseModule[]): CourseModule[] {
  return modules.filter((module) => !isNoise(module.name));
}

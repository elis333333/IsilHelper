/**
 * Filtro del ruido documentado en `context/domain.md` §5.
 *
 * Son dos reglas, y la primera hace casi todo el trabajo:
 *
 * 1. **Estructural, por `modname`.** Las etiquetas (`label`) no son material:
 *    son los bloques con los que Moodle maqueta la sección —títulos,
 *    separadores, avisos, texto suelto y hasta cadenas vacías—. Entre 7 y 22
 *    por curso, medidas el 5 de septiembre de 2026. Se descartan por lo que
 *    son, no por cómo se llaman, así que el filtro no depende de que el
 *    profesor titule igual que el ciclo pasado.
 *
 * 2. **Por nombre, y solo para las encuestas.** Las de jotform sí son módulos
 *    de verdad (`url`), indistinguibles de material por su estructura. Ahí no
 *    queda otra que mirar el nombre.
 *
 * El filtro por nombre se redujo a eso el 5 de septiembre de 2026: antes
 * intentaba adivinar por título lo que ahora se sabe por tipo, y se le colaba
 * todo lo que el profesor hubiera titulado de otra forma.
 */

import type { CourseModule } from "./types";

/** Tipos de módulo que Moodle usa para maquetar, no para publicar material. */
const LAYOUT_MODNAMES = new Set(["label"]);

/** Las dos encuestas de jotform de `domain.md` §5. */
export const SURVEY_PATTERN = /ayúdanos a mejorar|ayudanos a mejorar|encuesta/i;

export function isNoise(module: CourseModule): boolean {
  if (module.modname !== undefined && LAYOUT_MODNAMES.has(module.modname)) return true;
  return SURVEY_PATTERN.test(module.name);
}

export function withoutNoise(modules: CourseModule[]): CourseModule[] {
  return modules.filter((module) => !isNoise(module));
}

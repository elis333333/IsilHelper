/**
 * Lo que el buscador puede buscar, sacado de lo que la interfaz ya tiene.
 *
 * Vive aparte del componente por dos razones. La primera es que se prueba: el
 * buscador promete declarar su alcance con honestidad, y un alcance mal
 * contado es peor que no tenerlo —dice "0 cursos" cuando hay once y el
 * estudiante concluye que su curso no existe—. La segunda es que así queda
 * claro qué se lee de la caché y qué se pide.
 *
 * Los cursos y los pendientes son dos peticiones y los pide la propia
 * pantalla. El material de curso **no**: son once llamadas, así que solo entra
 * el de los cursos que el estudiante ya abrió.
 */

import type { QueryClient } from "@tanstack/react-query";
import type { SearchEntry } from "../../lib/search";
import type {
  CourseDetail,
  CourseSummary,
  Loaded,
  PendingList,
} from "../../lib/messages";
import { dueLabel } from "./format";

export type Scope = {
  courses: number;
  pending: number;
  /** Cursos cuyo material está cargado, no cursos abiertos alguna vez. */
  openedCourses: number;
};

export type Index = { entries: SearchEntry[]; scope: Scope };

/** Clave de caché del detalle de curso. La misma que usa `CourseDetail`. */
export const CONTENTS_KEY = "contents";

export function readCachedContents(
  client: QueryClient,
): Array<Loaded<CourseDetail> | undefined> {
  return client
    .getQueriesData<Loaded<CourseDetail>>({ queryKey: [CONTENTS_KEY] })
    .map(([, data]) => data);
}

export function buildIndex(
  courses: Loaded<CourseSummary[]> | undefined,
  pending: Loaded<PendingList> | undefined,
  contents: Array<Loaded<CourseDetail> | undefined>,
): Index {
  const entries: SearchEntry[] = [];
  const scope: Scope = { courses: 0, pending: 0, openedCourses: 0 };

  if (courses?.state === "ok") {
    scope.courses = courses.value.length;
    for (const course of courses.value) {
      entries.push({
        key: `course-${course.id}`,
        kind: "course",
        name: course.fullname,
        courseId: course.id,
        courseName: course.fullname,
        context: null,
        url: null,
      });
    }
  }

  if (pending?.state === "ok") {
    scope.pending = pending.value.items.length;
    for (const item of pending.value.items) {
      entries.push({
        key: `pending-${item.id}`,
        kind: "pending",
        name: item.name,
        courseId: item.courseId,
        courseName: item.courseName,
        context: dueLabel(item.due),
        url: item.url,
      });
    }
  }

  for (const detail of contents) {
    if (detail?.state !== "ok") continue;
    scope.openedCourses += 1;
    for (const section of detail.value.sections) {
      for (const module of section.modules) {
        entries.push({
          key: `module-${detail.value.courseId}-${module.id}`,
          kind: "module",
          name: module.name,
          courseId: detail.value.courseId,
          courseName: detail.value.courseName,
          context: section.name,
          url: module.url,
        });
      }
    }
  }

  return { entries, scope };
}

/** Lo que se enseña arriba del todo. Cuenta lo que de verdad se va a mirar. */
export function scopeLine(scope: Scope): string {
  const material =
    scope.openedCourses === 0
      ? "todavía sin material, porque no has abierto ningún curso"
      : `el material de ${
          scope.openedCourses === 1 ? "un curso abierto" : `${scope.openedCourses} cursos abiertos`
        }`;

  return `Busco en ${scope.courses} cursos, ${scope.pending} pendientes y ${material}.`;
}

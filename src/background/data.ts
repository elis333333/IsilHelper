/**
 * Carga de datos de la Fase 1a. Vive en el service worker a propósito: la
 * pausa de 600 ms entre peticiones es de módulo, así que solo sirve de algo si
 * todas las llamadas salen del mismo contexto.
 */

import { getActionEventsPaged } from "../api/calendar";
import { getCourseContents } from "../api/contents";
import { getGradeItems } from "../api/grades";
import { getUserCourses } from "../api/site";
import { courseGrade, overallAverage } from "../api/average";
import { toPendingItems } from "../api/pending";
import type { ApiError } from "../api/errors";
import { readUserId } from "../lib/storage";
import type {
  CourseDetail,
  PendingList,
  CourseGradeRow,
  CourseSummary,
  FailureReason,
  GradesReport,
  Loaded,
  ModuleView,
} from "../lib/messages";

export function apiFailure(error: ApiError): FailureReason {
  switch (error.kind) {
    case "waf":
      return "waf";
    case "moodle":
      return error.errorcode === "invalidtoken" ? "invalidtoken" : "unexpected";
    case "network":
    case "timeout":
      return "network";
    case "notoken":
      return "invalidtoken";
    case "unexpected":
      return "unexpected";
  }
}

const failed = <T>(error: ApiError): Loaded<T> => ({
  state: "failed",
  reason: apiFailure(error),
});

export async function loadPending(): Promise<Loaded<PendingList>> {
  const paged = await getActionEventsPaged();
  if (!paged.ok) return failed(paged.error);
  return {
    state: "ok",
    value: {
      items: toPendingItems(paged.value.events, new Date()),
      complete: paged.value.complete,
    },
  };
}

export async function loadCourses(): Promise<Loaded<CourseSummary[]>> {
  const userid = await readUserId();
  if (userid === null) return { state: "failed", reason: "invalidtoken" };

  const courses = await getUserCourses(userid);
  if (!courses.ok) return failed(courses.error);

  return {
    state: "ok",
    value: courses.value.map((course) => ({
      id: course.id,
      fullname: course.fullname,
      progress: course.progress ?? null,
    })),
  };
}

function toModuleView(module: {
  id: number;
  name: string;
  modname?: string;
  url?: string;
  completiondata?: { state?: number };
  contents?: unknown[];
}): ModuleView {
  const state = module.completiondata?.state;
  return {
    id: module.id,
    name: module.name,
    kind: module.modname ?? null,
    completed: typeof state === "number" ? state > 0 : null,
    url: module.url ?? null,
    fileCount: module.contents?.length ?? 0,
  };
}

export async function loadContents(
  courseId: number,
  courseName: string,
): Promise<Loaded<CourseDetail>> {
  const sections = await getCourseContents(courseId);
  if (!sections.ok) return failed(sections.error);

  return {
    state: "ok",
    value: {
      courseId,
      courseName,
      sections: sections.value.map((section) => ({
        id: section.id,
        name: section.name,
        modules: (section.modules ?? []).map(toModuleView),
      })),
    },
  };
}

/**
 * Notas de todos los cursos.
 *
 * Son una llamada por curso, así que un fallo suelto **no tumba la tabla**: el
 * curso que no se pudo leer se marca en su fila y el resto se muestra. Es el
 * estado "parcial" del sistema de diseño.
 */
export async function loadGrades(): Promise<Loaded<GradesReport>> {
  const userid = await readUserId();
  if (userid === null) return { state: "failed", reason: "invalidtoken" };

  const courses = await getUserCourses(userid);
  if (!courses.ok) return failed(courses.error);

  const rows: CourseGradeRow[] = [];
  for (const course of courses.value) {
    const items = await getGradeItems(course.id, userid);
    if (!items.ok) {
      rows.push({
        courseId: course.id,
        courseName: course.fullname,
        percentage: null,
        source: "none",
        graded: 0,
        failed: true,
      });
      continue;
    }
    const grade = courseGrade(items.value);
    rows.push({
      courseId: course.id,
      courseName: course.fullname,
      percentage: grade.percentage,
      source: grade.source,
      graded: grade.graded,
      failed: false,
    });
  }

  const usable = rows
    .filter((row) => !row.failed)
    .map((row) => ({ percentage: row.percentage, source: row.source, graded: row.graded }));

  return {
    state: "ok",
    value: {
      rows,
      average: overallAverage(usable),
      failedCount: rows.filter((row) => row.failed).length,
    },
  };
}

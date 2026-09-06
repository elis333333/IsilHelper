/**
 * Carga de datos de la Fase 1a. Vive en el service worker a propósito: la
 * pausa de 600 ms entre peticiones es de módulo, así que solo sirve de algo si
 * todas las llamadas salen del mismo contexto.
 */

import { getActionEventsPaged } from "../api/calendar";
import { getAssignmentAttachments, type AttachmentsByModule } from "../api/assign";
import { getCourseContents } from "../api/contents";
import { collectCourseFiles, type CourseFile } from "../api/files";
import { getGradeItems } from "../api/grades";
import { getUserCourses } from "../api/site";
import { courseGrade, overallAverage } from "../api/average";
import { toPendingItems } from "../api/pending";
import type { ApiError } from "../api/errors";
import { readUserId } from "../lib/storage";
import type { CourseModule } from "../api/types";
import type {
  CourseDetail,
  PendingList,
  CourseGradeRow,
  CourseSummary,
  FailureReason,
  FileView,
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

function toModuleView(module: CourseModule, files: FileView[], externalCount: number): ModuleView {
  const state = module.completiondata?.state;
  return {
    id: module.id,
    name: module.name,
    kind: module.modname ?? null,
    completed: typeof state === "number" ? state > 0 : null,
    url: module.url ?? null,
    files,
    externalCount,
  };
}

/** Agrupa por módulo lo que el inventario devuelve en plano. */
function groupBy<T extends { moduleId: number }>(entries: T[]): Map<number, T[]> {
  const byModule = new Map<number, T[]>();
  for (const entry of entries) {
    const bucket = byModule.get(entry.moduleId);
    if (bucket === undefined) byModule.set(entry.moduleId, [entry]);
    else bucket.push(entry);
  }
  return byModule;
}

/**
 * Detalle de un curso, ya con lo que se puede descargar.
 *
 * La ruta de destino de cada archivo se calcula **aquí** y no en la interfaz,
 * por dos motivos: es donde se conocen a la vez el nombre del curso y el de la
 * sección, y así la identidad del archivo la fija un solo sitio. La interfaz
 * solo reenvía lo que recibe.
 */
export async function loadContents(
  courseId: number,
  courseName: string,
): Promise<Loaded<CourseDetail>> {
  const sections = await getCourseContents(courseId);
  if (!sections.ok) return failed(sections.error);

  // Los adjuntos del profesor no vienen en `core_course_get_contents`, así que
  // cuestan una petición más. Solo se paga cuando el curso tiene tareas.
  const hasAssign = sections.value.some((section) =>
    (section.modules ?? []).some((module) => module.modname === "assign"),
  );

  let attachments: AttachmentsByModule = new Map();
  let attachmentsFailed = false;
  if (hasAssign) {
    const fetched = await getAssignmentAttachments(courseId);
    if (fetched.ok) attachments = fetched.value;
    // Quedarse sin los enunciados no es motivo para dejar al estudiante sin el
    // resto del curso. Se sigue, y la pantalla lo dice.
    else attachmentsFailed = true;
  }

  const inventory = collectCourseFiles(courseName, sections.value, attachments);
  const filesByModule = groupBy(inventory.files);
  const linksByModule = groupBy(inventory.links);

  const toFileView = (file: CourseFile): FileView => ({
    path: file.path,
    name: file.name,
    url: file.url,
    size: file.size,
  });

  return {
    state: "ok",
    value: {
      courseId,
      courseName,
      attachmentsFailed,
      sections: sections.value.map((section) => ({
        id: section.id,
        name: section.name,
        modules: (section.modules ?? []).map((module) =>
          toModuleView(
            module,
            (filesByModule.get(module.id) ?? []).map(toFileView),
            (linksByModule.get(module.id) ?? []).length,
          ),
        ),
      })),
      files: inventory.files.map(toFileView),
      links: inventory.links.map((link) => ({
        url: link.url,
        moduleName: link.moduleName,
        sectionName: link.sectionName,
        kind: link.kind,
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

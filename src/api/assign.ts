/**
 * Adjuntos del profesor en las tareas.
 *
 * `core_course_get_contents` **no los devuelve**: un módulo `assign` llega con
 * `contents` vacío aunque el enunciado y la rúbrica estén colgados ahí. Hay
 * que pedirlos aparte, y por eso esta llamada existe.
 *
 * Cuesta una petición por curso, así que solo se hace cuando el curso tiene
 * alguna tarea. Y si falla, no se propaga: quedarse sin los adjuntos de las
 * evaluaciones no es motivo para dejar al estudiante sin el resto del
 * material.
 */

import { callWebService } from "./client";
import { withToken } from "./call";
import { ok, type Result } from "./result";
import type { ApiError } from "./errors";
import type { AssignmentsResponse, ModuleContent } from "./types";

/** Adjuntos indexados por `cmid`, que es el id con el que aparecen en las
 *  secciones del curso. */
export type AttachmentsByModule = Map<number, ModuleContent[]>;

export function toAttachments(response: AssignmentsResponse): AttachmentsByModule {
  const byModule: AttachmentsByModule = new Map();

  for (const course of response.courses ?? []) {
    for (const assignment of course.assignments ?? []) {
      const files = [
        ...(assignment.introattachments ?? []),
        ...(assignment.introfiles ?? []),
      ].filter((file) => typeof file.fileurl === "string");

      if (files.length > 0) byModule.set(assignment.cmid, files);
    }
  }

  return byModule;
}

export async function getAssignmentAttachments(
  courseId: number,
): Promise<Result<AttachmentsByModule, ApiError>> {
  const response = await withToken((token) =>
    callWebService<AssignmentsResponse>(token, "mod_assign_get_assignments", {
      "courseids[0]": courseId,
    }),
  );
  if (!response.ok) return response;
  return ok(toAttachments(response.value));
}

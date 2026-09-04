/** Secciones y módulos de un curso, ya sin el ruido de `domain.md` §5. */

import { callWebService } from "./client";
import { withToken } from "./call";
import { ok, type Result } from "./result";
import type { ApiError } from "./errors";
import type { CourseSection } from "./types";
import { withoutNoise } from "./noise";

export async function getCourseContents(
  courseid: number,
): Promise<Result<CourseSection[], ApiError>> {
  const response = await withToken((token) =>
    callWebService<CourseSection[]>(token, "core_course_get_contents", { courseid }),
  );
  if (!response.ok) return response;

  return ok(
    response.value.map((section) => ({
      ...section,
      modules: withoutNoise(section.modules ?? []),
    })),
  );
}

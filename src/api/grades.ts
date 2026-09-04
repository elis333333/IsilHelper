/** Notas de un curso. El promedio se calcula en `average.ts`. */

import { callWebService } from "./client";
import { withToken } from "./call";
import { err, ok, type Result } from "./result";
import type { ApiError } from "./errors";
import type { GradeItem, GradeItemsResponse } from "./types";

export async function getGradeItems(
  courseid: number,
  userid: number,
): Promise<Result<GradeItem[], ApiError>> {
  const response = await withToken((token) =>
    callWebService<GradeItemsResponse>(
      token,
      "gradereport_user_get_grade_items",
      { courseid, userid },
    ),
  );
  if (!response.ok) return response;

  const grades = response.value.usergrades?.[0];
  if (!grades) {
    // Sin boletín para este usuario en este curso. No es un fallo de red ni
    // de token: el curso simplemente no tiene notas publicadas.
    return ok([]);
  }
  if (!Array.isArray(grades.gradeitems)) {
    return err({ kind: "unexpected", status: 200, contentType: "application/json" });
  }
  return ok(grades.gradeitems);
}

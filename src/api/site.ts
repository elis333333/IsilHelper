/** Llamadas de la Fase 0: quién soy y qué cursos tengo. */

import { callWebService } from "./client";
import { err, type Result } from "./result";
import type { ApiError } from "./errors";
import type { Course, SiteInfo } from "./types";
import { readToken } from "../lib/storage";

async function withToken<T>(
  call: (token: string) => Promise<Result<T, ApiError>>,
): Promise<Result<T, ApiError>> {
  const token = await readToken();
  if (token === null) return err({ kind: "notoken" });
  return call(token);
}

export function getSiteInfo(): Promise<Result<SiteInfo, ApiError>> {
  return withToken((token) =>
    callWebService<SiteInfo>(token, "core_webservice_get_site_info"),
  );
}

/** `core_enrol_get_users_courses` exige el `userid`, que sale de `site_info`. */
export function getUserCourses(userid: number): Promise<Result<Course[], ApiError>> {
  return withToken((token) =>
    callWebService<Course[]>(token, "core_enrol_get_users_courses", { userid }),
  );
}

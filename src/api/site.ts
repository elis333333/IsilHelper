/** Quién soy y qué cursos tengo. */

import { callWebService } from "./client";
import { withToken } from "./call";
import type { Result } from "./result";
import type { ApiError } from "./errors";
import type { Course, SiteInfo } from "./types";

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

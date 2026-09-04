/** Compone las llamadas de la Fase 0 y traduce los errores de la capa de API
 *  a las causas que la interfaz sabe explicar. */

import { getSiteInfo, getUserCourses } from "../api/site";
import type { ApiError } from "../api/errors";
import type { AuthError } from "./auth";
import { requestToken } from "./auth";
import { clearToken, hasToken } from "../lib/storage";
import type { FailureReason, SessionSnapshot } from "../lib/messages";

function apiFailure(error: ApiError): FailureReason {
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

function authFailure(error: AuthError): FailureReason {
  return error.kind === "nosession" ? "nosession" : "unexpected";
}

export async function readSession(): Promise<SessionSnapshot> {
  if (!(await hasToken())) return { state: "disconnected" };

  const info = await getSiteInfo();
  if (!info.ok) return { state: "failed", reason: apiFailure(info.error) };

  const courses = await getUserCourses(info.value.userid);
  if (!courses.ok) return { state: "failed", reason: apiFailure(courses.error) };

  return {
    state: "connected",
    fullname: info.value.fullname,
    sitename: info.value.sitename,
    courses: courses.value.map((course) => ({
      id: course.id,
      fullname: course.fullname,
      progress: course.progress ?? null,
    })),
  };
}

export async function connect(): Promise<SessionSnapshot> {
  const requested = await requestToken();
  if (!requested.ok) return { state: "failed", reason: authFailure(requested.error) };
  return readSession();
}

export async function disconnect(): Promise<SessionSnapshot> {
  await clearToken();
  return { state: "disconnected" };
}

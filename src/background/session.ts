/** Estado de sesión: quién soy, y traducción de los errores de la capa de API
 *  a las causas que la interfaz sabe explicar. */

import { getSiteInfo, getUserCourses } from "../api/site";
import { getUserProfile } from "../api/profile";
import { fetchAvatar } from "../api/avatar";
import { isGenericAvatar } from "../lib/avatar";
import type { AuthError } from "./auth";
import { requestToken } from "./auth";
import { apiFailure } from "./data";
import {
  clearToken,
  hasToken,
  readProfile,
  readToken,
  writeProfile,
  writeUserId,
  type StoredProfile,
} from "../lib/storage";
import type { FailureReason, SessionSnapshot } from "../lib/messages";

function authFailure(error: AuthError): FailureReason {
  return error.kind === "nosession" ? "nosession" : "unexpected";
}

/**
 * La foto de perfil, que es la única parte del perfil que cuesta una petición
 * aparte.
 *
 * Se baja **aquí y no en la interfaz** porque su URL necesita el token pegado
 * (`domain.md` §4): a la pestaña le cruza la imagen ya hecha `data:`, nunca la
 * URL. Y no se baja siempre: cuando el estudiante no subió ninguna, Moodle
 * sirve el muñeco gris del tema, que no dice quién es nadie y no vale otros
 * 600 ms de pausa.
 *
 * Falla en silencio a propósito. Quedarse sin foto no es un fallo que el
 * estudiante tenga que leer ni arreglar: la cabecera enseña sus iniciales.
 */
async function loadAvatar(url: string | undefined): Promise<string | null> {
  if (url === undefined || url === "" || isGenericAvatar(url)) return null;

  const token = await readToken();
  if (token === null) return null;

  const image = await fetchAvatar(url, token);
  return image.ok ? image.value : null;
}

/** El perfil se pide una sola vez en la vida de la sesión y se guarda. Si
 *  falla, la sesión sigue adelante: la cabecera enseña lo que tenga, porque
 *  quedarse sin correo no es motivo para dejar al estudiante sin cursos. */
async function loadProfile(userid: number): Promise<StoredProfile | null> {
  const stored = await readProfile();
  if (stored !== null) return stored;

  const fetched = await getUserProfile(userid);
  if (!fetched.ok || fetched.value === null) return null;

  const profile: StoredProfile = {
    email: fetched.value.email ?? null,
    department: fetched.value.department ?? null,
    avatar: await loadAvatar(fetched.value.profileimageurl),
  };
  await writeProfile(profile);
  return profile;
}

export async function readSession(): Promise<SessionSnapshot> {
  if (!(await hasToken())) return { state: "disconnected" };

  const info = await getSiteInfo();
  if (!info.ok) return { state: "failed", reason: apiFailure(info.error) };

  // Se guarda para que las demás pantallas no repitan `site_info`.
  await writeUserId(info.value.userid);

  const courses = await getUserCourses(info.value.userid);
  if (!courses.ok) return { state: "failed", reason: apiFailure(courses.error) };

  const profile = await loadProfile(info.value.userid);

  return {
    state: "connected",
    fullname: info.value.fullname,
    sitename: info.value.sitename,
    email: profile?.email ?? null,
    department: profile?.department ?? null,
    avatar: profile?.avatar ?? null,
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

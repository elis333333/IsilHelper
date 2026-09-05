/**
 * Perfil del usuario · `core_user_get_users_by_field`.
 *
 * Devuelve identidad y correo, y nada de matrícula: no hay código de alumno,
 * ni carrera, ni ciclo (`domain.md` §4). Por eso no hay pantalla de perfil ni
 * carnet, solo dos líneas en la cabecera.
 */

import { callWebService } from "./client";
import { withToken } from "./call";
import { err, ok, type Result } from "./result";
import type { ApiError } from "./errors";
import type { UserProfile } from "./types";

/** `null` significa que la plataforma no devolvió a nadie con ese id, que no
 *  es un fallo: es una respuesta vacía. */
export async function getUserProfile(
  userid: number,
): Promise<Result<UserProfile | null, ApiError>> {
  const response = await withToken((token) =>
    callWebService<UserProfile[]>(token, "core_user_get_users_by_field", {
      field: "id",
      "values[0]": userid,
    }),
  );
  if (!response.ok) return response;

  if (!Array.isArray(response.value)) {
    return err({ kind: "unexpected", status: 200, contentType: "application/json" });
  }
  return ok(response.value[0] ?? null);
}

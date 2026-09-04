/**
 * Extracción y parseo del token de web service.
 *
 * `launch.php` redirige a `<esquema>://token=BASE64`, y al decodificar el
 * base64 sale:
 *
 *     firma_md5:::TOKEN:::private_token
 *
 * El token es el **segundo** campo, 32 hexadecimales. El primero es
 * `md5(siteid + passport)` y solo sirve para verificar; el tercero puede no
 * venir. Usar el base64 entero o el primer campo da `invalidtoken`, y el
 * mensaje de Moodle no distingue eso de un token revocado, así que se depura
 * en la dirección equivocada.
 */

import { err, ok, type Result } from "./result";

export type TokenError =
  | { kind: "nomatch" }
  | { kind: "notbase64"; detail: string }
  | { kind: "badformat"; fields: number }
  | { kind: "badlength"; length: number };

const SEPARATOR = ":::";
const MARKER = "token=";
const TOKEN_PATTERN = /^[0-9a-f]{32}$/i;

/**
 * Saca el base64 de la URL de redirección.
 *
 * Ojo: la URL es `<esquema>://token=BASE64`, **sin query string**. Parsearla
 * con `new URL(...).searchParams.get("token")` devuelve `null`, y además el
 * parser pasa el hostname a minúsculas, lo que destruiría un base64 que
 * distingue mayúsculas. Se busca el marcador a mano.
 */
export function extractTokenParam(redirectUrl: string): Result<string, TokenError> {
  const at = redirectUrl.indexOf(MARKER);
  if (at === -1) return err({ kind: "nomatch" });

  const raw = redirectUrl.slice(at + MARKER.length);
  // Por si algún día llegara como query con más parámetros detrás.
  const value = raw.split("&")[0] ?? "";
  return value.length > 0 ? ok(value) : err({ kind: "nomatch" });
}

/** Restaura el relleno `=` que Moodle suele omitir. */
function padBase64(value: string): string {
  return value + "=".repeat((4 - (value.length % 4)) % 4);
}

function decodeBase64(value: string): Result<string, TokenError> {
  try {
    return ok(atob(padBase64(value)));
  } catch (cause) {
    return err({
      kind: "notbase64",
      detail: cause instanceof Error ? cause.name : "no decodificable",
    });
  }
}

/**
 * Del base64 de la redirección al token limpio.
 * Acepta tanto la forma de tres campos como la de dos: el `private_token`
 * final puede no venir y eso no es un error.
 */
export function parseLaunchToken(base64: string): Result<string, TokenError> {
  const decoded = decodeBase64(base64);
  if (!decoded.ok) return decoded;

  const fields = decoded.value.split(SEPARATOR);
  if (fields.length < 2) return err({ kind: "badformat", fields: fields.length });

  const token = fields[1] ?? "";
  if (!TOKEN_PATTERN.test(token)) return err({ kind: "badlength", length: token.length });

  return ok(token);
}

/** Atajo para el camino completo: URL de redirección → token. */
export function tokenFromRedirect(redirectUrl: string): Result<string, TokenError> {
  const param = extractTokenParam(redirectUrl);
  return param.ok ? parseLaunchToken(param.value) : param;
}

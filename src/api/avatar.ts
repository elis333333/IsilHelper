/**
 * Descarga de la foto de perfil.
 *
 * Tres cosas que no son evidentes y que, olvidadas, rompen esto de formas
 * distintas:
 *
 * 1. **La URL apunta a `pluginfile.php`, así que necesita el token pegado**
 *    (`domain.md` §4). Por eso la foto se baja **en el service worker** y
 *    cruza a la interfaz ya convertida en `data:`. Si se le pasara la URL, el
 *    token acabaría escrito en el DOM de la pestaña y en el inspector de
 *    cualquiera: es la regla 4 del proyecto rota en un sitio nuevo, igual que
 *    lo estaba en el historial de descargas.
 * 2. **Un 200 con HTML no es una foto.** Cuando el token no llega, Moodle
 *    devuelve la página de login con estado 200, y un `<img>` con eso dentro
 *    sale roto sin decir por qué.
 * 3. **No hay reintentos.** La foto es lo menos importante de la cabecera y
 *    cada reintento son 600 ms de pausa que retrasan los cursos. Si falla, se
 *    enseñan las iniciales y ya está.
 *
 * Ningún mensaje de error de aquí lleva la URL: la URL lleva el token.
 */

import { realDeps, waitForTurn, type WebServiceDeps } from "./client";
import { err, ok, type Result } from "./result";
import type { ApiError } from "./errors";
import { TIMEOUT_MS } from "../lib/constants";

/** Tope de lo que se guarda como `data:`. El avatar de Moodle es de 100×100 y
 *  pesa unos pocos KB; cualquier cosa muy por encima no es un avatar y no
 *  merece ocupar `storage.local`, que son 10 MB para todo lo demás también. */
const MAX_BYTES = 256 * 1024;

/** Base64 en trozos: `String.fromCharCode(...bytes)` con el array entero
 *  desborda la pila de argumentos en cuanto la imagen crece. */
function toDataUrl(buffer: ArrayBuffer, contentType: string): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let index = 0; index < bytes.length; index += 8192) {
    binary += String.fromCharCode(...bytes.subarray(index, index + 8192));
  }
  const mime = (contentType.split(";")[0] ?? contentType).trim();
  return `data:${mime};base64,${btoa(binary)}`;
}

/**
 * Baja la foto y la devuelve como `data:`, lista para un `src`.
 *
 * `url` es el `profileimageurl` que dio el perfil, **sin token**. El token se
 * pega aquí y no sale de esta función.
 */
export async function fetchAvatar(
  url: string,
  token: string,
  deps: WebServiceDeps = realDeps,
): Promise<Result<string, ApiError>> {
  const separator = url.includes("?") ? "&" : "?";
  const target = `${url}${separator}token=${encodeURIComponent(token)}`;

  await waitForTurn(deps);

  let response: Response;
  try {
    response = await deps.fetch(target, {
      // El token va en la URL, así que la cookie no pinta nada aquí.
      credentials: "omit",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    // El detalle se descarta a propósito: es lo único de la cadena que podría
    // acabar arrastrando la URL, y con ella el token, hasta un mensaje.
    return err({ kind: "network", detail: "no se pudo leer la foto de perfil" });
  }

  if (response.status === 418) return err({ kind: "waf", attempts: 1 });

  const contentType = response.headers.get("Content-Type") ?? "";
  if (response.status !== 200) {
    return err({ kind: "unexpected", status: response.status, contentType });
  }

  // Aquí es donde se caza la página de login servida con estado 200.
  if (!contentType.startsWith("image/")) {
    return err({ kind: "unexpected", status: 200, contentType });
  }

  const buffer = await response.arrayBuffer();
  if (buffer.byteLength === 0 || buffer.byteLength > MAX_BYTES) {
    return err({ kind: "unexpected", status: 200, contentType });
  }

  return ok(toDataUrl(buffer, contentType));
}

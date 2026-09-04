/**
 * Captura del token de web service.
 *
 * `launch.php` responde un 302 hacia `isilhelper://token=BASE64`. Ese destino
 * no es HTTP, así que el `fetch` muere con `ERR_UNKNOWN_URL_SCHEME` y su
 * respuesta llega opaca: **no se lee de la respuesta, se observa la
 * redirección**. Para cuando el `fetch` falla, `onBeforeRedirect` ya disparó.
 *
 * Se dispara desde el propio worker y no desde una pestaña: navegar a
 * `isilhelper://` abriría el diálogo de protocolo externo del navegador, que
 * el estudiante no sabe qué hacer con él.
 *
 * El token no se registra en ningún sitio, ni entero ni parcial.
 */

import { tokenFromRedirect } from "../api/token";
import { writeToken } from "../lib/storage";
import { LAUNCH_ENDPOINT, TIMEOUT_MS, URL_SCHEME } from "../lib/constants";
import { err, ok, type Result } from "../api/result";

export type AuthError =
  /** `launch.php` redirigió al login: no hay sesión en el navegador. */
  | { kind: "nosession" }
  /** Hubo redirección con token, pero no se pudo interpretar. */
  | { kind: "unreadable" }
  /** No hubo ninguna redirección dentro del plazo. */
  | { kind: "noredirect" };

type Capture = Result<string, AuthError>;

let pending: ((capture: Capture) => void) | null = null;

function resolvePending(capture: Capture): void {
  pending?.(capture);
  pending = null;
}

/**
 * Registra el observador de la redirección.
 *
 * **Se llama de forma síncrona en el arranque del worker.** El service worker
 * de MV3 se duerme, y un listener registrado dentro de un callback o después
 * de un `await` se pierde el evento que lo habría despertado.
 */
export function registerTokenCapture(): void {
  chrome.webRequest.onBeforeRedirect.addListener(
    ({ redirectUrl }) => {
      // Sin `token=` en el destino, `launch.php` mandó al login: no hay sesión.
      if (!redirectUrl.includes("token=")) {
        resolvePending(err({ kind: "nosession" }));
        return;
      }
      const parsed = tokenFromRedirect(redirectUrl);
      if (!parsed.ok) {
        resolvePending(err({ kind: "unreadable" }));
        return;
      }
      void writeToken(parsed.value);
      resolvePending(ok(parsed.value));
    },
    { urls: [`${LAUNCH_ENDPOINT}*`] },
  );
}

/**
 * Pide un token nuevo. Devuelve solo si salió bien o qué falló: el valor del
 * token se queda en `storage.local` y no cruza hacia la interfaz.
 */
export async function requestToken(): Promise<Result<void, AuthError>> {
  const url =
    `${LAUNCH_ENDPOINT}?service=moodle_mobile_app&passport=1&urlscheme=${URL_SCHEME}`;

  const captured = new Promise<Capture>((resolve) => {
    pending = resolve;
    setTimeout(() => resolvePending(err({ kind: "noredirect" })), TIMEOUT_MS);
  });

  // `credentials: "include"` es obligatorio aquí: la petición es cross-origin
  // desde la extensión y sin esto no viaja `MoodleSession`, así que launch.php
  // redirige al login y parece un problema de sesión.
  // El fallo es esperado: el destino `isilhelper://` no es HTTP.
  void fetch(url, {
    credentials: "include",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  }).catch(() => undefined);

  const capture = await captured;
  return capture.ok ? ok(undefined) : err(capture.error);
}

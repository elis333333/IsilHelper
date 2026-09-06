/**
 * Único punto de red hacia Drive, igual que `client.ts` lo es hacia Moodle.
 *
 * Pide el HTML de `embeddedfolderview` con la sesión del navegador. **No hay
 * OAuth, ni `client_id`, ni token**: la extensión reutiliza la sesión de
 * Google que el estudiante ya tiene, igual que hace con la de Moodle
 * (`fase-3.md` §8b).
 *
 * Necesita `https://drive.google.com/*` en `host_permissions`, y esa es la
 * única razón por la que ese permiso existe: un `fetch` desde el service
 * worker hacia Drive es cross-origin, y sin permiso CORS bloquea la lectura de
 * la respuesta. El síntoma sería una excepción de red, que se parece
 * demasiado a «Google lo rechazó» y manda a depurar en la dirección
 * equivocada.
 *
 * Bajar los archivos, en cambio, **no necesita permiso ninguno**:
 * `chrome.downloads.download` no lo exige sobre la URL que descarga.
 */

import { err, ok, type Result } from "./result";
import { folderViewUrl } from "./drive-links";
import { parseFolderHtml, type FolderListing } from "./drive-folder";
import { DRIVE_PAUSE_MS, TIMEOUT_MS } from "../lib/constants";

/**
 * Qué salió mal al leer una carpeta.
 *
 * Es un tipo propio y **no se traduce a los fallos de la plataforma**: quien
 * responde aquí es Google, y decirle al estudiante que «el instituto cambió
 * algo» cuando el que cambió fue Drive es mandarlo a arreglar lo que no está
 * roto. El mismo error de atribución que ya se corrigió en las descargas.
 */
export type DriveErrorKind = "login" | "shape" | "http" | "network" | "timeout";

export type DriveError = {
  kind: DriveErrorKind;
  /** Presente en `http`. */
  status?: number;
  /** Presente en `network`. */
  detail?: string;
};

export type DriveDeps = {
  fetch: typeof globalThis.fetch;
  sleep: (ms: number) => Promise<void>;
  now: () => number;
};

export const realDriveDeps: DriveDeps = {
  fetch: (input, init) => globalThis.fetch(input, init),
  sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  now: () => Date.now(),
};

// Pausa serializada para toda la extensión, por lo mismo que la de Moodle:
// una carpeta con veinte subcarpetas son veinte peticiones, y en ráfaga es
// como se consigue que Google empiece a mirar.
let chain: Promise<void> = Promise.resolve();
let lastRequestAt = 0;

function throttle(deps: DriveDeps): Promise<void> {
  const turn = chain.then(async () => {
    const waited = deps.now() - lastRequestAt;
    if (waited < DRIVE_PAUSE_MS) await deps.sleep(DRIVE_PAUSE_MS - waited);
    lastRequestAt = deps.now();
  });
  chain = turn.catch(() => undefined);
  return turn;
}

/** Solo para los tests. */
export function resetDriveThrottle(): void {
  chain = Promise.resolve();
  lastRequestAt = 0;
}

/** El modo de credenciales, en un solo sitio. Sin esto la petición sale sin la
 *  cookie de Google, porque desde la extensión es cross-origin. */
const CREDENTIALS: RequestCredentials = "include";

/** Lee el contenido de una carpeta de Drive. */
export async function fetchFolder(
  folderId: string,
  deps: DriveDeps = realDriveDeps,
): Promise<Result<FolderListing & { ok: true }, DriveError>> {
  await throttle(deps);

  let response: Response;
  try {
    response = await deps.fetch(folderViewUrl(folderId), {
      // La sesión de Google es toda la autenticación que hay. Desde el service
      // worker esto es cross-origin, así que sin esto no viaja la cookie.
      credentials: CREDENTIALS,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (cause) {
    const detail = cause instanceof Error ? `${cause.name}: ${cause.message}` : String(cause);
    if (cause instanceof Error && cause.name === "TimeoutError") return err({ kind: "timeout" });
    return err({ kind: "network", detail });
  }

  if (response.status !== 200) return err({ kind: "http", status: response.status });

  const listing = parseFolderHtml(await response.text());
  // La rotura del parser sube tal cual: son las dos causas que la interfaz
  // sabe explicar por separado.
  if (!listing.ok) return err({ kind: listing.reason });

  return ok(listing);
}

/** Qué pasó y qué puede hacer el estudiante. **Habla de Google**, que es quien
 *  respondió, y nunca de la plataforma del instituto. */
export function explainDriveError(error: DriveError): string {
  switch (error.kind) {
    case "login":
      return "Google pidió iniciar sesión. Entra a drive.google.com con tu cuenta del instituto y vuelve a intentarlo.";
    case "shape":
      return "No pude leer el contenido de esta carpeta. O está vacía, o Google cambió la página que leo para mirar dentro.";
    case "http":
      return error.status === 404
        ? "Esta carpeta ya no existe o no está compartida con tu cuenta."
        : `Google respondió con un error (${error.status ?? "sin código"}). Inténtalo más tarde.`;
    case "network":
      return "No pude comunicarme con Google. Revisa tu conexión y que la extensión tenga permiso para leer drive.google.com.";
    case "timeout":
      return "Google tardó demasiado en responder.";
  }
}

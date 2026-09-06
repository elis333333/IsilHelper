/**
 * Cola de descargas de material de Moodle.
 *
 * Es la razón de ser del proyecto: el instituto revoca el acceso al cerrar el
 * ciclo, y lo que no se bajó se perdió. Esto es el equivalente en extensión de
 * `isil_download.py`.
 *
 * Cinco decisiones sostienen el diseño, y ninguna es cosmética:
 *
 * 1. **El estado vive en `storage.local`, no en memoria.** El service worker
 *    de MV3 se duerme a los ~30 s. Una cola de 55 archivos guardada en una
 *    variable de módulo se pierde a mitad de tanda. Guardada en disco, el
 *    worker puede morir: `chrome.downloads.onChanged` lo despierta cuando algo
 *    termina y la cola sigue donde estaba. De ahí que la reanudación salga
 *    gratis en vez de ser una función aparte.
 *
 * 2. **Toda lectura-modificación-escritura va serializada.** Un evento de
 *    `onChanged` y una petición de la interfaz pueden caer a la vez, y dos
 *    ciclos leyendo el mismo estado se pisan la escritura. Es el mismo patrón
 *    de cadena que usa `client.ts` para la pausa entre peticiones.
 *
 * 3. **Una descarga a la vez, con la pausa de 600 ms.** `chrome.downloads` no
 *    pasa por `client.ts`, así que la pausa que protege del WAF hay que
 *    ponerla aquí. Cincuenta y cinco peticiones en ráfaga son un 418 seguro.
 *
 * 4. **El token se pega al lanzar y no se guarda en ningún sitio.** Ni en la
 *    cola, ni en el registro, ni en los mensajes hacia la interfaz. Y al
 *    terminar se borra la entrada del historial de descargas del navegador con
 *    `erase`, porque ahí quedaría la URL completa —token incluido— a la vista
 *    de cualquiera que abra `chrome://downloads`. El archivo no se toca: solo
 *    desaparece la anotación.
 *
 * 5. **Un 200 con HTML es un fallo, no un archivo.** Cuando el token no llega,
 *    Moodle devuelve la página de login con estado 200 (`domain.md` §4).
 *    `chrome.downloads` la guardaría tan contento con nombre de PDF. Se
 *    comprueba el tipo declarado y, si es HTML, se borra lo bajado y se dice
 *    qué pasó.
 */

import {
  forgetStored,
  markStored,
  readLog,
  readQueue,
  readToken,
  writeQueue,
  type QueueEntry,
  type QueueState,
} from "../lib/storage";
import { PAUSE_MS, TIMEOUT_MS } from "../lib/constants";
import { confirmationUrl } from "../api/drive-confirm";
import type { FileSource, QueuedFile, QueueSnapshot } from "../lib/messages";

/** Reintentos por archivo ante un fallo del servidor. El WAF se quita solo si
 *  se le deja respirar, así que la espera crece con cada intento. */
const MAX_ATTEMPTS = 3;
const RETRY_BACKOFF_MS = 5_000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Marca de la última petición lanzada. Es de módulo a propósito: si el worker
 *  muere, la siguiente descarga tarda de más en empezar, que es el lado seguro
 *  del error. */
let lastLaunchAt = 0;

/**
 * Serializa las mutaciones del estado.
 *
 * Sin esto, un `onChanged` que marca un archivo como hecho y una petición de
 * la interfaz que encola otros diez leen la misma cola y el segundo en escribir
 * borra lo que hizo el primero. **Ninguna tarea serializada puede llamar a otra
 * serializada**: se quedaría esperándose a sí misma.
 */
let chain: Promise<unknown> = Promise.resolve();

function serialize<T>(task: () => Promise<T>): Promise<T> {
  const turn = chain.then(task, task);
  chain = turn.catch(() => undefined);
  return turn;
}

/** Pega el token a un `fileurl` de la plataforma. Vive aquí y no en la cola
 *  guardada: el token no se escribe en disco ni viaja a la interfaz. */
function withToken(url: string, token: string | null): string {
  if (token === null) return url;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}token=${encodeURIComponent(token)}`;
}

function isFinished(item: QueueEntry): boolean {
  return item.status === "done" || item.status === "skipped" || item.status === "failed";
}

function toSnapshot(state: QueueState): QueueSnapshot {
  return {
    items: state.items.map(({ downloadId: _downloadId, ...item }) => item),
    paused: state.paused,
    running: state.items.some((item) => !isFinished(item)),
  };
}

/** Mensajes de `chrome.downloads` traducidos a lo que el estudiante puede
 *  hacer. `Error: request failed` no es aceptable (`CONVENTIONS.md`). */
function explain(reason: string | undefined): string {
  switch (reason) {
    case "SERVER_UNAUTHORIZED":
    case "SERVER_FORBIDDEN":
      return "La plataforma rechazó el permiso para este archivo. Vuelve a conectar tu cuenta.";
    case "SERVER_BAD_CONTENT":
      return "La plataforma respondió algo que no era el archivo. Puede ser el filtro de seguridad; inténtalo más tarde.";
    case "SERVER_FAILED":
    case "SERVER_NO_RANGE":
      return "La plataforma falló al enviar el archivo. Inténtalo de nuevo en un rato.";
    case "NETWORK_FAILED":
    case "NETWORK_TIMEOUT":
    case "NETWORK_DISCONNECTED":
      return "Se cortó la conexión durante la descarga.";
    case "FILE_ACCESS_DENIED":
    case "FILE_NO_SPACE":
    case "FILE_NAME_TOO_LONG":
    case "FILE_TOO_LARGE":
      return "El navegador no pudo escribir el archivo en tu carpeta de descargas.";
    case "USER_CANCELED":
      return "Cancelaste esta descarga.";
    default:
      return "No se pudo descargar. Vuelve a intentarlo.";
  }
}

/** Un fallo del servidor merece otro intento; uno de disco o del usuario, no. */
function worthRetrying(reason: string | undefined): boolean {
  return reason !== undefined && (reason.startsWith("SERVER_") || reason.startsWith("NETWORK_"));
}

// --------------------------------------------------------------------------
// Cierre de una descarga
// --------------------------------------------------------------------------

/** Lo que hay que hacer con un archivo que ya terminó, decidido **antes** de
 *  tocar la cola para no hacer red ni disco dentro del turno serializado. */
type Outcome =
  | { kind: "done"; received: number }
  /** `url` viene cuando hay que reintentar contra otra dirección, que es lo
   *  que pasa al confirmar la advertencia de antivirus de Drive. */
  | { kind: "retry"; url?: string }
  | { kind: "failed"; message: string };

/**
 * Resuelve la advertencia de antivirus de Drive.
 *
 * Para los archivos grandes Google no manda el binario, manda una página que
 * pide confirmar. Se lee, se saca el formulario y se devuelve la dirección con
 * la que repetir la descarga, que es lo que haría el navegador al pulsar el
 * botón.
 *
 * `null` cuando el HTML no es esa página —una pantalla de acceso, por ejemplo—,
 * porque reintentarla daría lo mismo una y otra vez.
 */
async function resolveConfirmation(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      credentials: "include",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) return null;
    return confirmationUrl(await response.text(), url);
  } catch {
    return null;
  }
}

/**
 * Un archivo que llega como HTML no es el archivo, y lo que significa depende
 * de quién lo mandó. Decirle a un estudiante que reconecte su cuenta de Moodle
 * cuando lo que falta es la sesión de Google es mandarlo a arreglar lo que no
 * está roto.
 */
function explainHtml(source: FileSource, attempts: number): string {
  if (source !== "drive") {
    return "La plataforma devolvió una página en vez del archivo. Vuelve a conectar tu cuenta.";
  }
  // Si ya se intentó confirmar y sigue sin bajar, el motivo es el tamaño y no
  // la sesión: decir «vuelve a conectar» mandaría a arreglar lo que no está
  // roto, y encima el archivo de al lado bajó bien con la misma sesión.
  return attempts > 1
    ? "Google no deja bajar este archivo sin confirmar la advertencia de tamaño, y la confirmación tampoco funcionó. Ábrelo a mano en Drive."
    : "Google devolvió una página en vez del archivo. Suele ser la advertencia que muestra con los archivos grandes.";
}

async function judge(
  downloadId: number,
  attempts: number,
  source: FileSource,
  url: string,
): Promise<Outcome | null> {
  const [download] = await chrome.downloads.search({ id: downloadId });
  if (download === undefined) return { kind: "failed", message: explain(undefined) };
  if (download.state === "in_progress") return null;

  if (download.state === "complete") {
    // Moodle devuelve la página de login con estado 200 cuando el token no
    // llega, y Drive la de confirmación de antivirus. Sin esta comprobación se
    // guarda HTML con nombre de PDF.
    if (download.mime.startsWith("text/html")) {
      await chrome.downloads.removeFile(downloadId).catch(() => undefined);

      // En Drive, un HTML suele ser la advertencia de antivirus por tamaño y
      // no una sesión caducada: el archivo siguiente baja bien un segundo
      // después con la misma sesión. Se intenta confirmar antes de rendirse.
      if (source === "drive" && attempts <= MAX_ATTEMPTS) {
        const confirmed = await resolveConfirmation(url);
        if (confirmed !== null) return { kind: "retry", url: confirmed };
      }

      return { kind: "failed", message: explainHtml(source, attempts) };
    }
    return { kind: "done", received: download.bytesReceived };
  }

  const reason = download.error;
  if (worthRetrying(reason) && attempts < MAX_ATTEMPTS) return { kind: "retry" };
  return { kind: "failed", message: explain(reason) };
}

/**
 * Cierra la descarga con el id dado y devuelve si algo cambió.
 *
 * Se llama desde `onChanged` —que es además lo que despierta al worker a mitad
 * de una tanda larga— y también al reconciliar, porque una descarga corta puede
 * terminar antes de que su id llegue a guardarse.
 */
async function settle(downloadId: number): Promise<boolean> {
  const state = await readQueue();
  const item = state.items.find((candidate) => candidate.downloadId === downloadId);
  if (item === undefined || item.status !== "active") return false;

  const outcome = await judge(downloadId, item.attempts, item.source, item.url);
  if (outcome === null) return false;

  if (outcome.kind === "retry") await sleep(RETRY_BACKOFF_MS * item.attempts);

  const changed = await serialize(async () => {
    const fresh = await readQueue();
    const target = fresh.items.find((candidate) => candidate.downloadId === downloadId);
    if (target === undefined || target.status !== "active") return false;

    if (outcome.kind === "done") {
      target.status = "done";
      target.error = null;
      target.received = outcome.received;
    } else if (outcome.kind === "retry") {
      target.status = "pending";
      target.error = null;
      // La confirmación de Drive cambia la dirección: se guarda para que el
      // siguiente intento salga ya confirmado.
      if (outcome.url !== undefined) target.url = outcome.url;
    } else {
      target.status = "failed";
      target.error = outcome.message;
    }

    target.downloadId = null;
    await writeQueue(fresh);
    if (outcome.kind === "done") await markStored([target.path], Date.now());
    return true;
  });

  // La URL con el token queda anotada en el historial del navegador. El
  // archivo se conserva; lo que desaparece es la anotación.
  if (changed) await chrome.downloads.erase({ id: downloadId }).catch(() => undefined);
  return changed;
}

// --------------------------------------------------------------------------
// Motor
// --------------------------------------------------------------------------

/** Reserva el siguiente archivo pendiente, si toca lanzarlo. */
async function claimNext(): Promise<QueueEntry | null> {
  return serialize(async () => {
    const state = await readQueue();
    if (state.paused) return null;
    if (state.items.some((item) => item.status === "active")) return null;

    const next = state.items.find((item) => item.status === "pending");
    if (next === undefined) return null;

    next.status = "active";
    next.attempts += 1;
    next.received = 0;
    next.downloadId = null;
    await writeQueue(state);
    return next;
  });
}

async function fail(path: string, message: string): Promise<void> {
  await serialize(async () => {
    const state = await readQueue();
    const item = state.items.find((candidate) => candidate.path === path);
    if (item === undefined) return;
    item.status = "failed";
    item.error = message;
    item.downloadId = null;
    await writeQueue(state);
  });
}

/** Lanza el siguiente archivo y encadena con el que venga detrás. */
async function pump(): Promise<void> {
  const next = await claimNext();
  if (next === null) return;

  // Drive no necesita el token de Moodle, así que una descarga de Drive no
  // debe fallar por no haberlo.
  const token = await readToken();
  if (token === null && next.source !== "drive") {
    await fail(next.path, "No hay sesión conectada. Conecta tu cuenta y vuelve a intentarlo.");
    return;
  }

  // La pausa que protege del WAF. `chrome.downloads` no pasa por client.ts,
  // así que aquí es donde toca ponerla.
  const waited = Date.now() - lastLaunchAt;
  if (waited < PAUSE_MS) await sleep(PAUSE_MS - waited);
  lastLaunchAt = Date.now();

  // El token se pega ahora y no se guarda. Solo a lo de Moodle: los
  // `fileurl` de la plataforma lo necesitan como parámetro (`domain.md` §4),
  // mientras que Drive se autentica con la sesión de Google del navegador.
  // Mandarle el token de Moodle a Google sería filtrárselo a un tercero.
  const url = next.source === "drive" ? next.url : withToken(next.url, token);

  let downloadId: number;
  try {
    downloadId = await chrome.downloads.download({
      url,
      filename: next.path,
      conflictAction: "overwrite",
      saveAs: false,
    });
  } catch (cause) {
    // El error aquí es de la ruta, no de la red: casi siempre un nombre que el
    // sistema de archivos no acepta.
    await fail(
      next.path,
      cause instanceof Error && cause.message !== ""
        ? `El navegador no aceptó la descarga: ${cause.message}`
        : "El navegador no aceptó la descarga.",
    );
    void pump();
    return;
  }

  await serialize(async () => {
    const state = await readQueue();
    const item = state.items.find((candidate) => candidate.path === next.path);
    if (item !== undefined && item.status === "active") item.downloadId = downloadId;
    await writeQueue(state);
  });

  // Un archivo pequeño puede haber terminado ya, antes de que su id llegara a
  // guardarse: el `onChanged` de ese caso no encontró a quién cerrar. Se
  // comprueba aquí, que es lo que cierra la carrera.
  if (await settle(downloadId)) void pump();
}

/** Devuelve a la cola lo que quedó activo sin descarga viva detrás: el worker
 *  murió entre reservar el archivo y lanzarlo. */
async function reconcile(): Promise<void> {
  const state = await readQueue();
  const active = state.items.find((item) => item.status === "active");
  if (active === undefined) return;

  if (active.downloadId === null) {
    await serialize(async () => {
      const fresh = await readQueue();
      const item = fresh.items.find((candidate) => candidate.path === active.path);
      if (item === undefined || item.status !== "active" || item.downloadId !== null) return;
      item.status = "pending";
      await writeQueue(fresh);
    });
    return;
  }

  await settle(active.downloadId);
}

export function registerDownloadQueue(): void {
  chrome.downloads.onChanged.addListener((delta) => {
    const finished = delta.state?.current;
    if (finished !== "complete" && finished !== "interrupted") return;
    void settle(delta.id).then((changed) => {
      if (changed) void pump();
    });
  });
}

// --------------------------------------------------------------------------
// Control desde la interfaz
// --------------------------------------------------------------------------

/**
 * Añade archivos a la cola.
 *
 * Lo que ya está en el registro entra como `skipped` en vez de descartarse en
 * silencio: el estudiante pidió el curso entero y tiene derecho a ver que esos
 * doce archivos ya los tenía, en vez de una lista de tres que parece que se
 * perdió algo.
 */
export async function enqueue(files: QueuedFile[]): Promise<QueueSnapshot> {
  const snapshot = await serialize(async () => {
    const state = await readQueue();
    const log = await readLog();
    const known = new Set(state.items.map((item) => item.path));

    for (const file of files) {
      if (known.has(file.path)) continue;
      known.add(file.path);
      state.items.push({
        ...file,
        status: file.path in log ? "skipped" : "pending",
        error: null,
        attempts: 0,
        received: 0,
        downloadId: null,
      });
    }

    await writeQueue(state);
    return toSnapshot(state);
  });

  void pump();
  return snapshot;
}

/** El progreso fino se pregunta a `chrome.downloads` en el momento, en vez de
 *  escribirlo en disco en cada byte: la cola solo guarda transiciones. */
export async function queueSnapshot(): Promise<QueueSnapshot> {
  await reconcile();

  const state = await readQueue();
  const active = state.items.find((item) => item.status === "active");

  if (active?.downloadId != null) {
    const [download] = await chrome.downloads.search({ id: active.downloadId });
    if (download !== undefined) {
      active.received = download.bytesReceived;
      if (active.size === null && download.totalBytes > 0) active.size = download.totalBytes;
    }
  }

  // Si el worker murió con algo pendiente, esto lo reanuda al primer vistazo
  // que eche la interfaz.
  if (!state.paused && state.items.some((item) => item.status === "pending")) void pump();

  return toSnapshot(state);
}

export async function pauseQueue(): Promise<QueueSnapshot> {
  const active = await serialize(async () => {
    const state = await readQueue();
    state.paused = true;
    await writeQueue(state);
    return state.items.find((item) => item.status === "active")?.downloadId ?? null;
  });

  if (active !== null) await chrome.downloads.pause(active).catch(() => undefined);
  return toSnapshot(await readQueue());
}

export async function resumeQueue(): Promise<QueueSnapshot> {
  const active = await serialize(async () => {
    const state = await readQueue();
    state.paused = false;
    await writeQueue(state);
    return state.items.find((item) => item.status === "active")?.downloadId ?? null;
  });

  if (active !== null) await chrome.downloads.resume(active).catch(() => undefined);
  void pump();
  return toSnapshot(await readQueue());
}

/** Quita de la lista lo que ya terminó. Lo activo y lo pendiente se quedan:
 *  vaciar una cola en marcha sería tirar el trabajo a medias. */
export async function clearQueue(): Promise<QueueSnapshot> {
  return serialize(async () => {
    const state = await readQueue();
    state.items = state.items.filter((item) => !isFinished(item));
    await writeQueue(state);
    return toSnapshot(state);
  });
}

/** Vuelve a intentar lo que falló, sin tocar lo que ya está bien. */
export async function retryQueue(): Promise<QueueSnapshot> {
  const snapshot = await serialize(async () => {
    const state = await readQueue();
    for (const item of state.items) {
      if (item.status !== "failed") continue;
      item.status = "pending";
      item.error = null;
      item.attempts = 0;
      item.received = 0;
    }
    await writeQueue(state);
    return toSnapshot(state);
  });

  void pump();
  return snapshot;
}

/** Cuáles de estas rutas constan como descargadas. */
export async function storedAmong(paths: string[]): Promise<string[]> {
  const log = await readLog();
  return paths.filter((path) => path in log);
}

/** Olvida rutas del registro para poder volver a bajarlas. Es la salida para
 *  cuando el estudiante borró un archivo a mano y la extensión sigue creyendo
 *  que lo tiene. */
export async function forgetPaths(paths: string[]): Promise<string[]> {
  return serialize(async () => {
    await forgetStored(paths);
    const state = await readQueue();
    // Lo activo no se toca: cancelar una descarga en curso desde aquí dejaría
    // un archivo a medias sin que nadie lo pidiera.
    state.items = state.items.filter(
      (item) => item.status === "active" || !paths.includes(item.path),
    );
    await writeQueue(state);
    return paths;
  });
}

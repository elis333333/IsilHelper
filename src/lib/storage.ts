/**
 * Acceso al almacenamiento local. El token vive aquí y **nunca sale hacia la
 * interfaz**: la UI pregunta si hay sesión, no cuál es el token.
 */

import type { QueueItem } from "./messages";

/** Lo mismo que ve la interfaz, más el id que devuelve `chrome.downloads`.
 *  Ese id es un detalle del worker y no cruza el contrato de mensajes. */
export type QueueEntry = QueueItem & { downloadId: number | null };

// No lleva un `paused` de la cola entera: la pausa es de cada `QueueEntry`
// (`status: "paused"`), no del estado que se guarda aquí. Una bandera aparte
// fue justo el bug que dejaba una cola entera bloqueada porque un archivo
// —de cualquier curso— estuviera en pausa.
export type QueueState = { items: QueueEntry[] };

const TOKEN_KEY = "moodleToken";

export async function readToken(): Promise<string | null> {
  const stored = await chrome.storage.local.get(TOKEN_KEY);
  const value: unknown = stored[TOKEN_KEY];
  return typeof value === "string" && value.length > 0 ? value : null;
}

export async function writeToken(token: string): Promise<void> {
  await chrome.storage.local.set({ [TOKEN_KEY]: token });
}

export async function clearToken(): Promise<void> {
  await chrome.storage.local.remove([TOKEN_KEY, USERID_KEY, PROFILE_KEY]);
}

export async function hasToken(): Promise<boolean> {
  return (await readToken()) !== null;
}

const USERID_KEY = "moodleUserId";

/** Se guarda al leer la sesión para no repetir `site_info` en cada pantalla:
 *  cada llamada de más son 600 ms de pausa contra el WAF. */
export async function writeUserId(userid: number): Promise<void> {
  await chrome.storage.local.set({ [USERID_KEY]: userid });
}

export async function readUserId(): Promise<number | null> {
  const stored = await chrome.storage.local.get(USERID_KEY);
  const value: unknown = stored[USERID_KEY];
  return typeof value === "number" ? value : null;
}

const PROFILE_KEY = "moodleProfile";

/** Lo poco del perfil que la cabecera enseña. Se guarda por lo mismo que el
 *  `userid`: no cambia de un día para otro y cada llamada de más son 600 ms de
 *  pausa contra el WAF.
 *
 *  `avatar` es la foto ya convertida en `data:`, no su URL. La URL lleva el
 *  token pegado (`domain.md` §4) y guardarla aquí sería dejar el token escrito
 *  en un segundo sitio, además de mandarlo a la interfaz en cuanto la cabecera
 *  lo pintara. `null` cuando no hay foto, no se pudo bajar, o Moodle sirve el
 *  muñeco gris: los tres casos acaban en las iniciales. */
export type StoredProfile = {
  email: string | null;
  department: string | null;
  avatar: string | null;
};

function asText(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value : null;
}

export async function readProfile(): Promise<StoredProfile | null> {
  const stored = await chrome.storage.local.get(PROFILE_KEY);
  const value: unknown = stored[PROFILE_KEY];
  if (typeof value !== "object" || value === null) return null;
  const record = value as Record<string, unknown>;

  // Un perfil guardado antes de que existiera la foto no tiene la clave, y no
  // es lo mismo que tenerla en `null`: se pide otra vez, una sola vez, en vez
  // de dejar a quien ya estaba conectado con iniciales para siempre.
  if (!("avatar" in record)) return null;

  return {
    email: asText(record.email),
    department: asText(record.department),
    avatar: asText(record.avatar),
  };
}

export async function writeProfile(profile: StoredProfile): Promise<void> {
  await chrome.storage.local.set({ [PROFILE_KEY]: profile });
}

// --------------------------------------------------------------------------
// Descargas
// --------------------------------------------------------------------------

const QUEUE_KEY = "downloadQueue";
const LOG_KEY = "downloadLog";

/**
 * Estado de la cola, en disco y no en memoria.
 *
 * El service worker de MV3 se duerme a los ~30 s, así que una cola guardada en
 * una variable de módulo se pierde a mitad de una tanda de 55 archivos y el
 * estudiante ve la descarga pararse sin motivo. Guardada aquí, el worker puede
 * morir y despertar cuando `chrome.downloads` avisa de que algo terminó, y
 * seguir donde estaba.
 */
export async function readQueue(): Promise<QueueState> {
  const stored = await chrome.storage.local.get(QUEUE_KEY);
  const value: unknown = stored[QUEUE_KEY];
  if (typeof value !== "object" || value === null) return { items: [] };

  const record = value as Record<string, unknown>;
  return {
    items: Array.isArray(record.items) ? (record.items as QueueEntry[]) : [],
  };
}

export async function writeQueue(state: QueueState): Promise<void> {
  await chrome.storage.local.set({ [QUEUE_KEY]: state });
}

/**
 * Registro de lo ya descargado, por ruta de destino.
 *
 * No hay forma de preguntarle al disco si un archivo sigue ahí —una extensión
 * no lee el sistema de archivos—, así que la extensión lleva su propia cuenta.
 * La consecuencia hay que decirla en voz alta: si el estudiante borra un
 * archivo a mano, la extensión seguirá creyendo que lo tiene. Para eso está
 * "volver a descargar", que olvida la ruta y la encola de nuevo.
 */
export async function readLog(): Promise<Record<string, number>> {
  const stored = await chrome.storage.local.get(LOG_KEY);
  const value: unknown = stored[LOG_KEY];
  if (typeof value !== "object" || value === null) return {};
  return value as Record<string, number>;
}

export async function markStored(paths: string[], at: number): Promise<void> {
  if (paths.length === 0) return;
  const log = await readLog();
  for (const path of paths) log[path] = at;
  await chrome.storage.local.set({ [LOG_KEY]: log });
}

export async function forgetStored(paths: string[]): Promise<void> {
  if (paths.length === 0) return;
  const log = await readLog();
  for (const path of paths) delete log[path];
  await chrome.storage.local.set({ [LOG_KEY]: log });
}

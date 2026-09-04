/**
 * Acceso al almacenamiento local. El token vive aquí y **nunca sale hacia la
 * interfaz**: la UI pregunta si hay sesión, no cuál es el token.
 */

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
  await chrome.storage.local.remove([TOKEN_KEY, "moodleUserId"]);
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

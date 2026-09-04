/** Origen de la plataforma. Ningún otro archivo escribe esta URL a mano. */
export const BASE = "https://platform.ecala.net";

export const REST_ENDPOINT = `${BASE}/webservice/rest/server.php`;
export const LAUNCH_ENDPOINT = `${BASE}/admin/tool/mobile/launch.php`;

/** Esquema propio al que redirige `launch.php` con el token. */
export const URL_SCHEME = "isilhelper";

/** El WAF castiga las ráfagas: 600 ms mínimo entre peticiones. */
export const PAUSE_MS = 600;

/** Timeout explícito en toda petición. */
export const TIMEOUT_MS = 30_000;

/** Reintentos con espera creciente. Viven solo aquí: TanStack Query va con
 *  `retry: false` para no apilar dos capas sobre un WAF que ya castiga. */
export const MAX_RETRIES = 4;

/** Espera tras un 418, creciente: 5 s, 10 s, 15 s. */
export const WAF_BACKOFF_MS = 5_000;

/** Espera tras un fallo de red, creciente: 3 s, 6 s, 9 s. */
export const NETWORK_BACKOFF_MS = 3_000;

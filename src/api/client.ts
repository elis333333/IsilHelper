/**
 * Único punto por el que pasa toda petición a los web services de Moodle.
 * Ningún componente hace `fetch` suelto.
 *
 * Se ocupa de las cuatro cosas que, olvidadas, rompen la implementación:
 *
 *   1. Los errores de Moodle llegan como JSON con **estado 200**. Comprobar
 *      `response.ok` no basta: hay que mirar si aparece `exception`.
 *   2. El WAF responde 418 antes de que la petición llegue a Moodle. Se espera
 *      y se reintenta con espera creciente, nunca en ráfaga.
 *   3. Pausa mínima entre peticiones, serializada para toda la extensión.
 *   4. Timeout explícito.
 *
 * El token viaja en el cuerpo y **no se registra en ningún sitio**, ni entero
 * ni parcial, ni en desarrollo.
 */

import { err, ok, type Result } from "./result";
import type { ApiError } from "./errors";
import { isMoodleException } from "./types";
import {
  MAX_RETRIES,
  NETWORK_BACKOFF_MS,
  PAUSE_MS,
  REST_ENDPOINT,
  TIMEOUT_MS,
  WAF_BACKOFF_MS,
} from "../lib/constants";

/** Dependencias inyectables: en los tests se sustituyen por dobles para que
 *  las esperas no sean reales y no haga falta red. */
export type WebServiceDeps = {
  fetch: typeof globalThis.fetch;
  sleep: (ms: number) => Promise<void>;
  now: () => number;
};

export const realDeps: WebServiceDeps = {
  fetch: (input, init) => globalThis.fetch(input, init),
  sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  now: () => Date.now(),
};

// La pausa se aplica a toda la extensión, no por llamada: dos peticiones
// lanzadas a la vez desde sitios distintos seguirían siendo una ráfaga.
let chain: Promise<void> = Promise.resolve();
let lastRequestAt = 0;

function throttle(deps: WebServiceDeps): Promise<void> {
  const turn = chain.then(async () => {
    const waited = deps.now() - lastRequestAt;
    if (waited < PAUSE_MS) await deps.sleep(PAUSE_MS - waited);
    lastRequestAt = deps.now();
  });
  chain = turn.catch(() => undefined);
  return turn;
}

/**
 * Reserva turno en la pausa global para una petición a la plataforma que no
 * pasa por `callWebService` —hoy, la foto de perfil, que es un binario y no
 * una llamada de web service—.
 *
 * La pausa protege del WAF y es de **toda la extensión**, no de esta función:
 * saltársela por entrar a la plataforma por otra puerta sería exactamente la
 * ráfaga que `domain.md` §2 dice que no hay que hacer.
 */
export function waitForTurn(deps: WebServiceDeps = realDeps): Promise<void> {
  return throttle(deps);
}

/** Solo para los tests: reinicia el estado de la pausa entre casos. */
export function resetThrottle(): void {
  chain = Promise.resolve();
  lastRequestAt = 0;
}

function toApiError(cause: unknown): ApiError {
  if (cause instanceof DOMException && cause.name === "TimeoutError") {
    return { kind: "timeout" };
  }
  if (cause instanceof Error && cause.name === "TimeoutError") {
    return { kind: "timeout" };
  }
  return {
    kind: "network",
    detail: cause instanceof Error ? `${cause.name}: ${cause.message}` : String(cause),
  };
}

/**
 * Llama a una función de web service y devuelve su respuesta ya tipada.
 *
 * El tipo `T` es una promesa del que llama: la respuesta se valida solo hasta
 * descartar que sea un error de Moodle. Por eso `types.ts` declara la forma de
 * lo que se va a leer y no se accede a nada que no esté ahí.
 */
export async function callWebService<T>(
  token: string,
  wsfunction: string,
  params: Record<string, string | number> = {},
  deps: WebServiceDeps = realDeps,
): Promise<Result<T, ApiError>> {
  const body = new URLSearchParams({
    wstoken: token,
    wsfunction,
    moodlewsrestformat: "json",
  });
  for (const [key, value] of Object.entries(params)) body.set(key, String(value));

  let lastError: ApiError = { kind: "network", detail: "sin intentos" };

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    await throttle(deps);

    let response: Response;
    try {
      response = await deps.fetch(REST_ENDPOINT, {
        method: "POST",
        body,
        // Sin credenciales a propósito: esto se autentica con `wstoken` en el
        // cuerpo, no por cookie. Además `server.php` responde
        // `Access-Control-Allow-Origin: *`, y el comodín está prohibido en
        // peticiones con credenciales, así que incluirlas la rompería.
        credentials: "omit",
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch (cause) {
      lastError = toApiError(cause);
      await deps.sleep(NETWORK_BACKOFF_MS * (attempt + 1));
      continue;
    }

    // El WAF corta antes de llegar a Moodle. Esperar y reintentar; nunca
    // insistir de inmediato.
    if (response.status === 418) {
      lastError = { kind: "waf", attempts: attempt + 1 };
      await deps.sleep(WAF_BACKOFF_MS * (attempt + 1));
      continue;
    }

    const contentType = response.headers.get("Content-Type") ?? "";

    if (response.status !== 200) {
      lastError = { kind: "unexpected", status: response.status, contentType };
      await deps.sleep(NETWORK_BACKOFF_MS * (attempt + 1));
      continue;
    }

    const text = await response.text();

    if (!contentType.includes("json")) {
      // Moodle devuelve HTML de login con estado 200 cuando el token no llega.
      return err({ kind: "unexpected", status: response.status, contentType });
    }

    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      return err({ kind: "unexpected", status: response.status, contentType });
    }

    // Estado 200 no significa que haya salido bien.
    if (isMoodleException(data)) {
      return err({
        kind: "moodle",
        errorcode: data.errorcode,
        message: data.message,
      });
    }

    return ok(data as T);
  }

  return err(lastError);
}

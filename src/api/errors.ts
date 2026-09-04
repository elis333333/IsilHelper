/**
 * Los tres fallos que siempre hay que distinguir, más los que aparecen al
 * usarlos de verdad. Cada uno lleva a un mensaje distinto en la interfaz:
 * confundirlos manda al estudiante a arreglar lo que no está roto.
 */
export type ApiError =
  /** HTTP 418: bloqueó el WAF, la petición no llegó a Moodle. */
  | { kind: "waf"; attempts: number }
  /** Moodle contestó con `exception` y estado 200. */
  | { kind: "moodle"; errorcode: string; message: string }
  /** No hubo respuesta: sin red, o el destino no es HTTP. */
  | { kind: "network"; detail: string }
  /** Se agotó el tiempo de la petición. */
  | { kind: "timeout" }
  /** Llegó algo que no era la respuesta esperada de la API. */
  | { kind: "unexpected"; status: number; contentType: string }
  /** No hay token guardado todavía: el estudiante aún no ha conectado. */
  | { kind: "notoken" };

/** `invalidtoken` es el único errorcode con tratamiento propio: significa que
 *  hay que volver a conectar, no que algo se rompió. */
export function isInvalidToken(error: ApiError): boolean {
  return error.kind === "moodle" && error.errorcode === "invalidtoken";
}

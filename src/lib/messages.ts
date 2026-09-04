/** Contrato entre la interfaz y el service worker, tipado en un solo sitio
 *  para que ninguno de los dos lados adivine la forma del otro.
 *
 *  El token nunca cruza por aquí: la interfaz sabe si hay sesión, no cuál es
 *  el token. */

export type BackgroundRequest =
  | { type: "session" }
  | { type: "connect" }
  | { type: "disconnect" };

export type CourseSummary = {
  id: number;
  fullname: string;
  progress: number | null;
};

/** Causas de fallo que la interfaz sabe explicar. Se traducen aquí desde los
 *  errores de la capa de API para que la UI no conozca sus detalles. */
export type FailureReason =
  | "waf"
  | "invalidtoken"
  | "nosession"
  | "network"
  | "unexpected";

export type SessionSnapshot =
  | { state: "disconnected" }
  | {
      state: "connected";
      fullname: string;
      sitename: string;
      courses: CourseSummary[];
    }
  | { state: "failed"; reason: FailureReason };

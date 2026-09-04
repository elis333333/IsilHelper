/** Resultado explícito. La capa de API nunca devuelve `null` para señalar
 *  fallo: o hay valor, o hay un error tipado que dice qué pasó. */
export type Result<T, E> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });

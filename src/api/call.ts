/** Envoltura común: recupera el token guardado y lo pasa a la llamada. El
 *  token no sale de aquí hacia ninguna capa superior. */

import { err, type Result } from "./result";
import type { ApiError } from "./errors";
import { readToken } from "../lib/storage";

export async function withToken<T>(
  call: (token: string) => Promise<Result<T, ApiError>>,
): Promise<Result<T, ApiError>> {
  const token = await readToken();
  if (token === null) return err({ kind: "notoken" });
  return call(token);
}

import type { BackgroundRequest, ResponseFor } from "../../lib/messages";

/** Único punto por el que la interfaz habla con el service worker. El tipo de
 *  la respuesta se deduce del tipo de la petición. */
export async function ask<R extends BackgroundRequest>(
  request: R,
): Promise<ResponseFor<R["type"]>> {
  return (await chrome.runtime.sendMessage(request)) as ResponseFor<R["type"]>;
}

import type { BackgroundRequest, SessionSnapshot } from "../../lib/messages";

/** Único punto por el que la interfaz habla con el service worker. */
export function ask(request: BackgroundRequest): Promise<SessionSnapshot> {
  return chrome.runtime.sendMessage<BackgroundRequest, SessionSnapshot>(request);
}

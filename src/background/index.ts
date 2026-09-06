/**
 * Punto de entrada del service worker.
 *
 * Todo listener se registra de forma SÍNCRONA en el arranque. El worker de MV3
 * se duerme, y un listener añadido dentro de un callback o después de un
 * `await` se pierde el evento que lo habría despertado. Es la causa número uno
 * de "a veces funciona".
 */

import { registerTokenCapture } from "./auth";
import { connect, disconnect, readSession } from "./session";
import { loadContents, loadCourses, loadGrades, loadPending } from "./data";
import {
  clearQueue,
  enqueue,
  forgetPaths,
  pauseQueue,
  queueSnapshot,
  registerDownloadQueue,
  resumeQueue,
  retryQueue,
  storedAmong,
} from "./downloads";
import type { BackgroundRequest, ResponseMap } from "../lib/messages";

registerTokenCapture();

// El listener de descargas es además lo que despierta al worker a mitad de una
// tanda larga: sin él registrado aquí arriba, una cola de 55 archivos se para
// en cuanto MV3 duerme el worker.
registerDownloadQueue();

// La interfaz vive en una pestaña. Sin `default_popup` en el manifest, este
// evento sí dispara al pulsar el ícono.
chrome.action.onClicked.addListener(() => {
  void chrome.tabs.create({ url: chrome.runtime.getURL("src/ui/index.html") });
});

function handle(
  request: BackgroundRequest,
): Promise<ResponseMap[BackgroundRequest["type"]]> {
  switch (request.type) {
    case "session":
      return readSession();
    case "connect":
      return connect();
    case "disconnect":
      return disconnect();
    case "pending":
      return loadPending();
    case "courses":
      return loadCourses();
    case "contents":
      return loadContents(request.courseId, request.courseName);
    case "grades":
      return loadGrades();
    case "enqueue":
      return enqueue(request.files);
    case "queue":
      return queueSnapshot();
    case "pauseQueue":
      return pauseQueue();
    case "resumeQueue":
      return resumeQueue();
    case "clearQueue":
      return clearQueue();
    case "retryQueue":
      return retryQueue();
    case "stored":
      return storedAmong(request.paths);
    case "forgetStored":
      return forgetPaths(request.paths);
  }
}

chrome.runtime.onMessage.addListener(
  (
    request: BackgroundRequest,
    _sender,
    respond: (response: ResponseMap[BackgroundRequest["type"]]) => void,
  ) => {
    handle(request).then(respond);
    return true; // la respuesta es asíncrona
  },
);

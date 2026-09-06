import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ask } from "./messaging";
import type { FileView, QueueItem, QueuedFile, QueueSnapshot } from "../../lib/messages";

/**
 * Lo que la interfaz necesita saber de la cola de descargas.
 *
 * El estado real vive en el service worker, que es quien sobrevive a que se
 * cierre la pestaña. Aquí solo se pregunta, y solo mientras haya algo que
 * mirar: en cuanto la cola termina, el refresco se detiene. Un sondeo que
 * sigue corriendo con la cola vacía es trabajo tirado y, con este WAF de por
 * medio, una costumbre que conviene no coger.
 */

const REFRESH_MS = 800;

export function useQueue() {
  return useQuery({
    queryKey: ["queue"],
    queryFn: () => ask({ type: "queue" }),
    refetchInterval: (query) => (query.state.data?.running === true ? REFRESH_MS : false),
  });
}

/** Qué archivos de esta pantalla constan ya como descargados. Se pregunta por
 *  las rutas del curso abierto y no por el registro entero, que son cientos. */
export function useStored(courseId: number, paths: string[], live: boolean) {
  return useQuery({
    queryKey: ["stored", courseId, paths.length],
    queryFn: () => ask({ type: "stored", paths }),
    refetchInterval: live ? REFRESH_MS * 2 : false,
    enabled: paths.length > 0,
  });
}

type QueueAction =
  | { type: "enqueue"; files: QueuedFile[] }
  | { type: "pauseQueue" }
  | { type: "resumeQueue" }
  | { type: "clearQueue" }
  | { type: "retryQueue" };

/** Todo lo que cambia la cola pasa por aquí, y todo deja el estado fresco en
 *  la caché sin esperar al siguiente sondeo. */
export function useQueueAction() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (action: QueueAction) => ask(action),
    onSuccess: (snapshot: QueueSnapshot) => {
      client.setQueryData(["queue"], snapshot);
    },
  });
}

/** Olvida rutas del registro para poder volver a bajarlas. */
export function useForget() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (paths: string[]) => ask({ type: "forgetStored", paths }),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["stored"] });
      void client.invalidateQueries({ queryKey: ["queue"] });
    },
  });
}

/** Estado de un archivo concreto, mirado desde la interfaz. */
export type FileState = "idle" | "queued" | "active" | "done" | "failed";

export function fileState(
  path: string,
  queue: QueueSnapshot | undefined,
  stored: string[] | undefined,
): FileState {
  const item = queue?.items.find((candidate) => candidate.path === path);
  if (item !== undefined) {
    if (item.status === "active") return "active";
    if (item.status === "pending") return "queued";
    if (item.status === "failed") return "failed";
    return "done"; // `done` y `skipped` responden lo mismo: ya lo tienes
  }
  return stored?.includes(path) === true ? "done" : "idle";
}

/** Lo que la cola necesita de un archivo, más el curso y la sección de los que
 *  salió. La ruta viene calculada del service worker; aquí no se recalcula. */
export function toQueued(
  files: FileView[],
  courseName: string,
  sectionName: string,
): QueuedFile[] {
  return files.map((file) => ({ ...file, courseName, sectionName }));
}

/** Cuenta por estado, para los resúmenes de la pantalla de descargas. */
export function tally(items: QueueItem[]) {
  return {
    total: items.length,
    done: items.filter((item) => item.status === "done").length,
    skipped: items.filter((item) => item.status === "skipped").length,
    failed: items.filter((item) => item.status === "failed").length,
    left: items.filter((item) => item.status === "pending" || item.status === "active").length,
  };
}

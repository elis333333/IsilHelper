import { fileState, toQueued, useForget, useQueue, useQueueAction, useStored } from "../lib/downloads";
import { plural } from "../lib/format";
import type { FileView } from "../../lib/messages";

/**
 * Botón para encolar un grupo de archivos: un curso, una sección o un módulo.
 *
 * Cuando todo el grupo ya está bajado deja de ofrecer la descarga y dice que
 * lo tiene, con la salida para volver a bajarlo. Un botón que hace lo mismo
 * tanto si el archivo está como si no obliga al estudiante a acordarse de qué
 * bajó, que es justo lo que la extensión viene a quitarle de encima.
 */

type Props = {
  files: FileView[];
  courseId: number;
  courseName: string;
  sectionName: string;
  /** Qué se está descargando: "todo el curso", "esta sección". Sin esto el
   *  botón dice solo cuántos archivos son, que es lo que toca en un módulo. */
  what?: string;
  variant?: "principal" | "secundario";
};

export function DownloadAction({
  files,
  courseId,
  courseName,
  sectionName,
  what,
  variant = "secundario",
}: Props) {
  const queue = useQueue();
  const paths = files.map((file) => file.path);
  const stored = useStored(courseId, paths, queue.data?.running === true);
  const action = useQueueAction();
  const forget = useForget();

  if (files.length === 0) return null;

  const states = paths.map((path) => fileState(path, queue.data, stored.data));
  const left = states.filter((state) => state === "idle" || state === "failed").length;
  const working = states.some((state) => state === "active" || state === "queued");

  if (left === 0 && !working) {
    return (
      <span className="accion-hecha">
        <span className="estado estado--exito">
          <span aria-hidden="true">✓</span> Ya lo tienes
        </span>
        <button
          type="button"
          className="enlace"
          onClick={() => forget.mutate(paths)}
          disabled={forget.isPending}
        >
          Volver a descargar
        </button>
      </span>
    );
  }

  const count = plural(left, "archivo", "archivos");
  const label = working ? "En la cola" : `Descargar ${what === undefined ? count : `${what} · ${count}`}`;

  return (
    <button
      type="button"
      className={`btn btn--${variant}`}
      disabled={working || action.isPending}
      onClick={() =>
        action.mutate({
          type: "enqueue",
          files: toQueued(files, courseName, sectionName),
        })
      }
    >
      {label}
    </button>
  );
}

import { fileState, toQueued, useQueue, useQueueAction, useStored } from "../lib/downloads";
import { fileSize } from "../lib/format";
import type { FileView } from "../../lib/messages";

/**
 * Un archivo suelto dentro de un módulo, con su propio botón.
 *
 * El estado va con símbolo y texto además de color: el verde de "guardado" es
 * el mismo verde del botón de descargar, así que sin texto sería ambiguo.
 */

const MARK: Record<string, { symbol: string; label: string; tone: string }> = {
  done: { symbol: "✓", label: "Guardado", tone: "estado--exito" },
  active: { symbol: "↓", label: "Bajando", tone: "estado--info" },
  queued: { symbol: "·", label: "En la cola", tone: "estado--info" },
  failed: { symbol: "!", label: "Falló", tone: "estado--error" },
};

type Props = {
  file: FileView;
  courseId: number;
  courseName: string;
  sectionName: string;
};

export function FileRow({ file, courseId, courseName, sectionName }: Props) {
  const queue = useQueue();
  const stored = useStored(courseId, [file.path], queue.data?.running === true);
  const action = useQueueAction();

  const state = fileState(file.path, queue.data, stored.data);
  const mark = MARK[state];
  const size = fileSize(file.size);

  return (
    <li className="archivo">
      <span className="archivo__nombre">{file.name}</span>
      {size !== null && <span className="archivo__meta">{size}</span>}

      {mark === undefined ? (
        <button
          type="button"
          className="btn btn--secundario"
          disabled={action.isPending}
          onClick={() =>
            action.mutate({
              type: "enqueue",
              files: toQueued([file], courseName, sectionName),
            })
          }
        >
          Descargar
        </button>
      ) : (
        <span className={`estado ${mark.tone}`}>
          <span aria-hidden="true">{mark.symbol}</span> {mark.label}
        </span>
      )}
    </li>
  );
}

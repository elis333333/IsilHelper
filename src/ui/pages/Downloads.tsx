import { tally, useQueue, useQueueAction } from "../lib/downloads";
import { fileSize, plural } from "../lib/format";
import { Loading, Notice } from "../components/Notice";
import { QueueRow } from "../components/QueueRow";

/**
 * La cola de descargas.
 *
 * Es la pantalla que sostiene el propósito del proyecto: archivar el material
 * antes de que el instituto revoque el acceso al cerrar el ciclo. Por eso dice
 * siempre dónde quedaron los archivos y cuántos faltan, en vez de una barra
 * que solo se mueve.
 */
export default function Downloads() {
  const queue = useQueue();
  const action = useQueueAction();

  if (queue.isPending) return <Loading what="Estoy mirando la cola de descargas." />;

  if (queue.isError || queue.data === undefined) {
    return (
      <Notice
        tone="error"
        symbol="!"
        title="No pude leer la cola"
        detail="La extensión no respondió. Cierra esta pestaña y vuelve a abrirla."
      />
    );
  }

  const { items, paused, running } = queue.data;
  const counts = tally(items);

  if (items.length === 0) {
    return (
      <Notice
        symbol="·"
        title="No hay nada en la cola"
        detail="Entra a un curso y usa Descargar todo el curso, o baja los archivos
                que quieras uno a uno."
        hint="Todo cae en tu carpeta de descargas, dentro de IsilHelper."
      />
    );
  }

  const pendingBytes = items
    .filter((item) => item.status === "pending" || item.status === "active")
    .reduce((total, item) => total + (item.size ?? 0), 0);
  const left = fileSize(pendingBytes);

  return (
    <>
      <div className="resumen">
        <p className="resumen__dato">
          <span className="resumen__cifra">{counts.done}</span>
          <span className="resumen__etiqueta">Descargados</span>
        </p>
        <p className="resumen__dato">
          <span className="resumen__cifra">{counts.left}</span>
          <span className="resumen__etiqueta">En cola</span>
        </p>
        {counts.skipped > 0 && (
          <p className="resumen__dato">
            <span className="resumen__cifra">{counts.skipped}</span>
            <span className="resumen__etiqueta">Ya los tenías</span>
          </p>
        )}
        {counts.failed > 0 && (
          <p className="resumen__dato u-overdue">
            <span className="resumen__cifra">{counts.failed}</span>
            <span className="resumen__etiqueta">Fallaron</span>
          </p>
        )}
      </div>

      <p className="parrafo parrafo--apagado">
        Los archivos van a <span className="dato-tecnico">Descargas/IsilHelper/</span>, en
        una carpeta por curso y sección.
        {running && left !== null ? ` Quedan unos ${left} por bajar.` : ""}
      </p>

      {paused && (
        <Notice
          tone="warning"
          symbol="!"
          title={`Tienes ${plural(counts.paused, "archivo en pausa", "archivos en pausa")}`}
          detail="El resto de la cola sigue su curso: pausar uno no detiene los demás.
                  Lo que ya se bajó se queda donde está, y esto puedes retomarlo cuando
                  quieras, incluso después de cerrar esta pestaña."
        />
      )}

      {/* Pausar y reanudar ya no son la misma pregunta: puede haber a la vez
          un archivo bajando —al que pausar tiene sentido— y otro en pausa de
          antes —al que retomar tiene sentido—. Antes de esto los dos botones
          se turnaban con la misma bandera, que era justo lo que hacía que
          pausar un curso bloqueara el siguiente. */}
      <div className="acciones">
        {counts.active > 0 && (
          <button
            type="button"
            className="btn btn--secundario"
            onClick={() => action.mutate({ type: "pauseQueue" })}
            disabled={action.isPending}
          >
            Pausar
          </button>
        )}

        {paused && (
          <button
            type="button"
            className="btn btn--principal"
            onClick={() => action.mutate({ type: "resumeQueue" })}
            disabled={action.isPending}
          >
            Seguir descargando
          </button>
        )}

        {counts.failed > 0 && (
          <button
            type="button"
            className="btn btn--secundario"
            onClick={() => action.mutate({ type: "retryQueue" })}
            disabled={action.isPending}
          >
            Reintentar {plural(counts.failed, "el que falló", "los que fallaron")}
          </button>
        )}

        {counts.total > counts.left && (
          <button
            type="button"
            className="btn btn--secundario"
            onClick={() => action.mutate({ type: "clearQueue" })}
            disabled={action.isPending}
          >
            Limpiar la lista
          </button>
        )}
      </div>

      <ul className="lista" style={{ marginTop: "var(--space-8)" }}>
        {items.map((item) => (
          <QueueRow key={item.path} item={item} />
        ))}
      </ul>
    </>
  );
}

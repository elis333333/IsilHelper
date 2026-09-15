import { useQuery } from "@tanstack/react-query";
import { ask } from "../lib/messaging";
import { dropStaleOverdue, type PendingItem } from "../../api/pending";
import { plural } from "../lib/format";
import { ExamBanner } from "../components/ExamBanner";
import { PendingRow } from "../components/PendingRow";
import { PendingSummary } from "../components/PendingSummary";
import { FailureNotice } from "../components/FailureNotice";
import { Notice } from "../components/Notice";
import { Cargando } from "../components/Puntos";
import type { Loaded, PendingList } from "../../lib/messages";

/**
 * La pantalla que justifica la extensión: los pendientes de los once cursos en
 * una sola lista ordenada por fecha, no agrupada por curso.
 */

/** Lo que la pantalla enseña, que ya no es lo que el worker devuelve. */
type PendingView = {
  items: PendingItem[];
  complete: boolean;
  /** Cuántos se escondieron por viejos. Se dice en voz alta más abajo. */
  hidden: number;
};

/**
 * El filtro de lo vencido hace más de un día, en la capa de datos.
 *
 * Va aquí y no al pintar para que el contador de VENCIDO cuente exactamente lo
 * que la lista enseña, y va en el `select` de esta pantalla y no en el worker
 * para que la caché siga teniendo los eventos enteros: el calendario y el
 * buscador leen la misma clave `["pending"]` y los necesitan completos.
 *
 * Se declara fuera del componente a propósito: TanStack Query memoriza el
 * resultado de `select` por la identidad de la función, y una función nueva en
 * cada render lo recalcularía en cada render.
 */
function toView(data: Loaded<PendingList>): Loaded<PendingView> {
  if (data.state !== "ok") return data;

  const items = dropStaleOverdue(data.value.items, new Date());
  return {
    state: "ok",
    value: {
      items,
      complete: data.value.complete,
      hidden: data.value.items.length - items.length,
    },
  };
}

export default function Pending() {
  const pending = useQuery({
    queryKey: ["pending"],
    queryFn: () => ask({ type: "pending" }),
    select: toView,
  });

  if (pending.isPending) return <Cargando que="Estoy reuniendo tus pendientes de todos los cursos." />;

  if (pending.isError || pending.data?.state === "failed") {
    const reason = pending.data?.state === "failed" ? pending.data.reason : "unexpected";
    return (
      <FailureNotice
        reason={reason}
        onRetry={() => void pending.refetch()}
        retrying={pending.isFetching}
      />
    );
  }

  const { items, complete, hidden } = pending.data.value;
  const now = new Date();

  // Que no quede nada por enseñar tiene dos causas distintas, y decirlas
  // igual manda al estudiante a comprobar lo que no está roto.
  if (items.length === 0) {
    return hidden > 0 ? (
      <Notice
        symbol="·"
        title="No te queda nada por entregar"
        detail={`Todo lo que la plataforma devolvió venció hace más de un día, así que
                 lo dejé fuera: ${plural(hidden, "entrega vencida", "entregas vencidas")}.`}
        hint="Si esperabas ver algo aquí, probablemente sea que los profesores aún no
              han publicado las fechas de lo que viene."
      />
    ) : (
      <Notice
        symbol="·"
        title="No me llega ningún pendiente"
        detail="La plataforma respondió, pero no devolvió ninguna entrega ni evento
                para los próximos días."
        hint="Si estás a mitad de ciclo esto es raro: puede que los profesores no
              hayan publicado fechas, o que la plataforma no las esté exponiendo.
              Conviene comprobarlo en la plataforma antes de confiar en que no
              tienes nada."
      />
    );
  }

  return (
    <>
      <ExamBanner items={items} now={now} />

      <PendingSummary items={items} />

      {/* Una lista truncada sin avisar parece menos trabajo del que hay. */}
      {!complete && (
        <p className="estado estado--advertencia" style={{ marginBottom: "var(--space-6)" }}>
          <span aria-hidden="true">▲</span>
          <span>
            Esta lista puede estar incompleta: la plataforma cortó la respuesta
            antes de darme todo. Vuelve a cargarla en un momento.
          </span>
        </p>
      )}

      <ul className="lista">
        {items.map((item) => (
          <PendingRow key={item.id} item={item} now={now} />
        ))}
      </ul>

      {/* La pantalla dice su alcance, igual que el buscador: esconder sin
          avisar convierte "no lo enseño" en "no existe". */}
      {hidden > 0 && (
        <p className="parrafo parrafo--apagado" style={{ marginTop: "var(--space-6)" }}>
          No enseño {plural(hidden, "entrega que venció", "entregas que vencieron")} hace
          más de un día.
        </p>
      )}
    </>
  );
}

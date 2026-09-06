import { useQuery } from "@tanstack/react-query";
import { ask } from "../lib/messaging";
import { PendingRow } from "../components/PendingRow";
import { PendingSummary } from "../components/PendingSummary";
import { FailureNotice } from "../components/FailureNotice";
import { Notice } from "../components/Notice";
import { Cargando } from "../components/Puntos";

/**
 * La pantalla que justifica la extensión: los pendientes de los once cursos en
 * una sola lista ordenada por fecha, no agrupada por curso.
 */
export default function Pending() {
  const pending = useQuery({
    queryKey: ["pending"],
    queryFn: () => ask({ type: "pending" }),
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

  const { items, complete } = pending.data.value;
  const now = new Date();

  // Vacío y fallo son cosas distintas y se dicen distinto. Una lista vacía a
  // mitad de ciclo casi siempre significa que algo no se publicó, no que no
  // haya nada, así que se dice en voz alta en lugar de celebrarlo.
  if (items.length === 0) {
    return (
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
    </>
  );
}

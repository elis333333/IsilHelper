import { useEffect, useState } from "react";
import type { DayEvent, Placement } from "../lib/calendar";
import { eventTypeLabel, KIND_COLOR } from "../../lib/eventKind";
import { courseTitle } from "../../lib/course-label";
import { dayLabel } from "../../lib/month";
import { remainingLabel } from "../lib/format";

/**
 * El panel que se abre sobre una celda con eventos.
 *
 * Cubre un bloque de 2×2 celdas **dibujándose encima**: es un elemento más de
 * la misma retícula, colocado con `grid-column` y `grid-row`, así que ocupa
 * exactamente el sitio de cuatro celdas sin empujar ninguna. La celda no cambia
 * de tamaño y el mes no se mueve.
 *
 * Hay **uno solo** en toda la pantalla y se reposiciona. Cuarenta y dos paneles
 * escondidos serían cuarenta y dos veces el mismo marcado y un z-index que
 * resolver entre vecinos.
 */

/**
 * El recorte del que sale el panel: exactamente la celda que lo abrió.
 *
 * Se calcula en vez de elegirse entre unas pocas clases fijas, porque con tres
 * filas de alto y anclaje hacia arriba la celda apuntada puede quedar **en el
 * medio** del bloque, no solo arriba o abajo. Con 2×2 había cuatro esquinas
 * posibles; con 2×3 hay seis posiciones, y enumerarlas en CSS sería repetir seis
 * veces la misma cuenta.
 */
function clipFromCell(placement: Placement): string {
  const { columns, rows, columnOffset, rowOffset } = placement;
  const part = (units: number, total: number) => `${(units / total) * 100}%`;

  return [
    part(rowOffset, rows),
    part(columns - 1 - columnOffset, columns),
    part(rows - 1 - rowOffset, rows),
    part(columnOffset, columns),
  ].join(" ");
}

type Props = {
  date: Date;
  events: DayEvent[];
  placement: Placement;
  now: Date;
  /** Se está encogiendo de vuelta a su celda. */
  closing: boolean;
  onOpenEvent: (entry: DayEvent) => void;
  onPointerEnter: () => void;
  onClosed: () => void;
};

export function DayPanel({
  date,
  events,
  placement,
  now,
  closing,
  onOpenEvent,
  onPointerEnter,
  onClosed,
}: Props) {
  const { column, row, columns, rows } = placement;

  /**
   * El crecimiento va por transición y no por `@keyframes`.
   *
   * Con el recorte de partida calculado, una animación con nombre exigiría una
   * regla por cada posición posible. Y una transición además **se interrumpe
   * bien**: si el cursor vuelve al panel a mitad del cierre, sale desde donde
   * estaba en vez de saltar al principio.
   *
   * El fotograma de espera es lo que la hace disparar: montado con el recorte
   * de la celda, y en el siguiente cuadro se suelta. Sin eso el navegador
   * colapsa los dos valores en uno y no hay nada que interpolar.
   */
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div
      className={`panel-dia${closing ? " panel-dia--cerrando" : ""}`}
      style={{
        gridColumn: `${column} / span ${columns}`,
        gridRow: `${row} / span ${rows}`,
        clipPath: entered && !closing ? "inset(0)" : `inset(${clipFromCell(placement)})`,
      }}
      onMouseEnter={onPointerEnter}
      onTransitionEnd={(event) => {
        // Solo el recorte del propio panel: cualquier otra transición de un
        // hijo burbujea hasta aquí y desmontaría el panel a media apertura.
        if (!closing) return;
        if (event.propertyName !== "clip-path") return;
        if (event.target !== event.currentTarget) return;
        onClosed();
      }}
    >
      <p className="panel-dia__fecha">{dayLabel(date)}</p>

      <ul className="panel-dia__lista">
        {events.map((entry) => (
          <li key={entry.item.id}>
            <button
              type="button"
              className="panel-dia__evento"
              style={
                {
                  "--color-tipo": `var(${KIND_COLOR[entry.kind].color})`,
                } as React.CSSProperties
              }
              onClick={() => onOpenEvent(entry)}
            >
              {/* La fase entra aquí y no en la celda: "Se cierra PA 3" y
                  "Vencimiento PA 3" son hitos distintos, y deducir cuál es
                  cuál por la fecha es trabajo que no le toca al estudiante. */}
              <span className="panel-dia__tipo">{eventTypeLabel(entry.kind, entry.pa)}</span>
              <span className="panel-dia__nombre">{entry.item.name}</span>
              <span className="panel-dia__meta">
                {entry.item.courseName === null
                  ? "Sin curso"
                  : courseTitle(entry.item.courseName)}
                {" · "}
                {remainingLabel(entry.due, now)}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

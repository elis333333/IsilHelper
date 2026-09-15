import { Modal } from "./Modal";
import type { DayEvent } from "../lib/calendar";
import { eventTypeLabel, KIND_COLOR } from "../../lib/eventKind";
import { dayLabel } from "../../lib/month";
import { exactDue, remainingLabel } from "../lib/format";

/**
 * El detalle de lo que vence un día.
 *
 * Aquí no se resume nada: el nombre entero, el curso **con** su código —que es
 * como aparece en la plataforma, y es lo que sirve para buscarlo allí—, la
 * fecha con hora exacta y el enlace para abrirlo.
 *
 * **No dice el estado de la entrega.** `mod_assign_get_submission_status` no
 * está en esta rama, así que el dato no existe; enseñar un hueco con etiqueta
 * sería prometer algo que no se tiene.
 */

type Props = {
  date: Date;
  events: DayEvent[];
  now: Date;
  onClose: () => void;
};

export function DayModal({ date, events, now, onClose }: Props) {
  return (
    <Modal title={dayLabel(date)} onClose={onClose}>
      <ul className="detalle">
        {events.map((entry) => (
          <li
            key={entry.item.id}
            className="detalle__evento"
            style={
              { "--color-tipo": `var(${KIND_COLOR[entry.kind].color})` } as React.CSSProperties
            }
          >
            <p className="detalle__tipo">{eventTypeLabel(entry.kind, entry.pa)}</p>
            <p className="detalle__nombre">{entry.item.name}</p>

            <p className="detalle__meta">{entry.item.courseName ?? "Sin curso"}</p>
            <p className="detalle__meta">
              {exactDue(entry.due)} · {remainingLabel(entry.due, now)}
            </p>

            {entry.item.url !== null && (
              <p className="detalle__meta">
                <a href={entry.item.url} target="_blank" rel="noreferrer">
                  Abrirlo en la plataforma
                </a>
              </p>
            )}
          </li>
        ))}
      </ul>
    </Modal>
  );
}

import { cellEvents, type DayEvent } from "../lib/calendar";
import { eventShortLabel, KIND_COLOR } from "../../lib/eventKind";
import { courseShortLabel } from "../../lib/course-label";
import { dayLabel, type MonthDay } from "../../lib/month";
import { plural } from "../lib/format";

/**
 * Una celda del calendario: el día y lo que vence en él.
 *
 * Un día sin nada no lleva ningún adorno ni es pulsable. Es lo que deja que la
 * vista se lea de un vistazo: si todas las celdas tuvieran algo, ninguna
 * destacaría.
 *
 * La línea de cada evento es **tipo + curso abreviado**, no el nombre. El
 * nombre truncado a esta anchura daba "Vencimiento de Pro…" en catorce celdas
 * distintas, que es ocupar sitio sin distinguir nada. El nombre completo lo da
 * el panel.
 */

type Props = {
  day: MonthDay;
  events: DayEvent[];
  today: boolean;
  expanded: boolean;
  onEnter: () => void;
  onFocus: () => void;
  onOpen: () => void;
};

function CellBody({ day, events }: { day: MonthDay; events: DayEvent[] }) {
  const { shown, rest } = cellEvents(events);

  return (
    <>
      {/* El día de hoy se marca con una caja rellena además del color: un
          cambio de forma lo distingue también para quien no vea el acento. */}
      <span className="dia__numero">{day.date.getDate()}</span>

      {shown.length > 0 && (
        <ul className="dia__eventos">
          {shown.map((entry) => (
            <li
              key={entry.item.id}
              className="dia__evento"
              style={
                {
                  "--color-tipo": `var(${KIND_COLOR[entry.kind].color})`,
                } as React.CSSProperties
              }
            >
              <span className="dia__tipo">{eventShortLabel(entry.kind, entry.pa)}</span>
              <span className="dia__curso">
                {courseShortLabel(entry.item.courseName, entry.item.courseShort)}
              </span>
            </li>
          ))}

          {rest > 0 && (
            <li className="dia__mas" aria-hidden="true">
              +{rest}
            </li>
          )}
        </ul>
      )}
    </>
  );
}

export function MonthCell({ day, events, today, expanded, onEnter, onFocus, onOpen }: Props) {
  const classes = [
    "dia",
    day.inMonth ? null : "dia--fuera",
    today ? "dia--hoy" : null,
  ]
    .filter(Boolean)
    .join(" ");

  // Un día vacío no es un control: sin nada que abrir, hacerlo pulsable y
  // alcanzable con el tabulador pondría 25 paradas de teclado por mes que no
  // llevan a ninguna parte.
  if (events.length === 0) {
    return (
      <div className={classes} role="cell" onMouseEnter={onEnter}>
        <div className="dia__interior">
          <CellBody day={day} events={events} />
        </div>
      </div>
    );
  }

  return (
    <div className={`${classes} dia--con-eventos`} role="cell">
      <button
        type="button"
        className="dia__interior dia__accion"
        aria-expanded={expanded}
        aria-label={`${dayLabel(day.date)}, ${plural(events.length, "entrega", "entregas")}`}
        onMouseEnter={onEnter}
        onFocus={onFocus}
        onClick={onOpen}
      >
        <CellBody day={day} events={events} />
      </button>
    </div>
  );
}

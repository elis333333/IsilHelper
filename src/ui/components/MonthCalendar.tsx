import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PendingItem } from "../../api/pending";
import { groupByDay, panelPlacement, type DayEvent } from "../lib/calendar";
import { MonthCell } from "./MonthCell";
import { DayPanel } from "./DayPanel";
import { DayModal } from "./DayModal";
import {
  addMonths,
  dayKey,
  monthGrid,
  monthLabel,
  sameDay,
  startOfMonth,
  WEEKDAYS,
} from "../../lib/month";

/**
 * Vista mensual de todo lo que vence.
 *
 * Es la otra forma de mirar lo mismo que la lista de Pendientes: aquella
 * responde "qué me toca ahora" y esta "cómo viene el mes". Por eso lee la misma
 * caché y no pide nada por su cuenta.
 *
 * Va dentro de Buscar y no en una pestaña propia —decisión de Elis, 14 de
 * setiembre de 2026—, así que hereda el azul de Evolucionar de la sección y no
 * hace falta un sexto color de familia que no existe.
 */

const WEEKDAY_NAMES = [
  "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo",
] as const;

/**
 * Retardo de intención antes de abrir el panel.
 *
 * Sin él, barrer el ratón por la retícula dispara una cascada de paneles: uno
 * por cada celda que el puntero roza de paso. No es un valor del sistema de
 * movimiento —no es una transición, es una espera— así que no sale de los
 * tokens de duración.
 */
const HOVER_DELAY_MS = 120;

type DayModalState = { date: Date; events: DayEvent[] };

export function MonthCalendar({ items }: { items: PendingItem[] }) {
  const today = new Date();
  const [month, setMonth] = useState(() => startOfMonth(today));
  const [hovered, setHovered] = useState<string | null>(null);
  const [modal, setModal] = useState<DayModalState | null>(null);

  const byDay = useMemo(() => groupByDay(items), [items]);
  const weeks = useMemo(() => monthGrid(month.getFullYear(), month.getMonth()), [month]);

  /** Dónde cae cada día en la retícula, para colocar el panel. */
  const positions = useMemo(() => {
    const map = new Map<string, { week: number; column: number }>();
    weeks.forEach((week, weekIndex) =>
      week.forEach((day, column) => map.set(dayKey(day.date), { week: weekIndex, column })),
    );
    return map;
  }, [weeks]);

  /**
   * Lo que está pintado, que no es lo mismo que lo que está apuntado.
   *
   * Al retirar el cursor el panel no desaparece: se encoge hasta la celda de
   * origen con la misma animación en reversa, y para eso tiene que seguir
   * montado mientras dura. `hovered` es la intención; esto es el elemento.
   */
  const [panel, setPanel] = useState<{ key: string; closing: boolean } | null>(null);

  useEffect(() => {
    if (hovered !== null) {
      setPanel({ key: hovered, closing: false });
      return;
    }
    setPanel((current) =>
      current === null || current.closing ? current : { ...current, closing: true },
    );
  }, [hovered]);

  const timer = useRef<number | null>(null);
  const cancel = useCallback(() => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = null;
  }, []);

  const schedule = useCallback(
    (key: string | null) => {
      cancel();
      timer.current = window.setTimeout(() => setHovered(key), HOVER_DELAY_MS);
    },
    [cancel],
  );

  // Un temporizador vivo tras desmontar intentaría pintar sobre nada.
  useEffect(() => cancel, [cancel]);

  // Cambiar de mes con un panel abierto lo dejaría colocado sobre un día que
  // ya no está donde estaba. Se quita entero y sin animación de cierre: el día
  // al que tendría que encogerse ya no está en pantalla, así que nunca llegaría
  // su `animationend` y el estado se quedaría colgado.
  useEffect(() => {
    setHovered(null);
    setPanel(null);
  }, [month]);

  const showing = monthLabel(month);
  const onToday = sameDay(month, startOfMonth(today));

  function onKeyDown(event: React.KeyboardEvent) {
    // Con el modal abierto las teclas son suyas: las flechas cambiarían de mes
    // por debajo y Escape competiría con su propio cierre.
    if (modal !== null) return;

    if (event.key === "Escape") {
      // Cierra el panel sin mover el foco: la celda sigue seleccionada.
      cancel();
      setHovered(null);
    } else if (event.key === "ArrowLeft") setMonth((current) => addMonths(current, -1));
    else if (event.key === "ArrowRight") setMonth((current) => addMonths(current, 1));
    else return;

    event.preventDefault();
  }

  // El panel se dibuja a partir de `panel` y no de `hovered`, porque mientras
  // se cierra ya no hay nada apuntado y sigue habiendo algo en pantalla.
  const panelEvents = panel === null ? [] : byDay.get(panel.key) ?? [];
  const position = panel === null ? undefined : positions.get(panel.key);
  const panelDate = position ? weeks[position.week]![position.column]!.date : null;

  // El alto depende de cuántos eventos hay, así que la colocación necesita
  // saberlo. Toda la aritmética —incluida la de no salirse de la retícula—
  // vive en `panelPlacement`, que se prueba sin navegador.
  const placement =
    position === undefined
      ? null
      : panelPlacement(position.week, position.column, weeks.length, panelEvents.length);

  return (
    <section className="calendario" onKeyDown={onKeyDown} aria-label="Calendario de entregas">
      <header className="calendario__cabecera">
        <h2 className="subtitulo" aria-live="polite">
          {showing}
        </h2>

        <div className="calendario__controles">
          <button
            type="button"
            className="btn btn--secundario btn--icono"
            onClick={() => setMonth((current) => addMonths(current, -1))}
            aria-label="Mes anterior"
          >
            <span aria-hidden="true">‹</span>
          </button>

          <button
            type="button"
            className="btn btn--secundario"
            onClick={() => setMonth(startOfMonth(today))}
            disabled={onToday}
          >
            Hoy
          </button>

          <button
            type="button"
            className="btn btn--secundario btn--icono"
            onClick={() => setMonth((current) => addMonths(current, 1))}
            aria-label="Mes siguiente"
          >
            <span aria-hidden="true">›</span>
          </button>
        </div>
      </header>

      <p className="u-oculto">
        Entregas de {showing}. Con el foco en la retícula, las flechas izquierda y derecha
        cambian de mes.
      </p>

      {/*
        Retícula CSS y no `<table>`: una fila de tabla crece para caber su
        contenido aunque la celda lleve `overflow: hidden`, así que un día con
        cuatro entregas empujaría al resto del mes. `minmax(0, 1fr)` reparte el
        alto en partes iguales y lo que sobra se recorta.

        Las filas siguen siendo elementos de verdad gracias a `subgrid`: heredan
        las columnas de esta retícula, así que el panel —que es hijo de aquí, no
        de una fila— puede colocarse por `grid-column` sobre las celdas que le
        tocan. Sin subgrid habría que elegir entre filas semánticas y un panel
        colocable.

        El cierre del panel cuelga de aquí y no de la celda: el panel se dibuja
        **encima** de la celda que lo abrió, así que al entrar en él la celda
        recibe su `mouseleave` y un cierre ahí lo haría parpadear.
      */}
      <div
        className="calendario__grilla"
        role="table"
        aria-label={`Entregas de ${showing}`}
        tabIndex={0}
        style={{ "--semanas": weeks.length } as React.CSSProperties}
        onMouseLeave={() => {
          cancel();
          setHovered(null);
        }}
      >
        {/*
          La fila lleva su pista escrita a mano, y no es cosmético. Sin
          `grid-row`, la fila se autocoloca, y el algoritmo de la retícula
          coloca primero lo que tiene posición definida —el panel— y luego
          busca hueco para lo demás **evitando lo ocupado**: la fila que el
          panel pisa se iba una pista hacia abajo y aparecía una fila implícita.
          Dos ítems con posición explícita sí pueden solaparse; uno
          autocolocado nunca.
        */}
        <div
          className="calendario__fila calendario__fila--encabezado"
          role="row"
          style={{ gridRow: 1 }}
        >
          {WEEKDAYS.map((label, index) => (
            <span key={label} className="calendario__columna" role="columnheader">
              <span aria-hidden="true">{label}</span>
              <span className="u-oculto">{WEEKDAY_NAMES[index]}</span>
            </span>
          ))}
        </div>

        {weeks.map((week, weekIndex) => (
          <div
            className="calendario__fila"
            role="row"
            key={dayKey(week[0]!.date)}
            style={{ gridRow: weekIndex + 2 }}
          >
            {week.map((day) => {
              const key = dayKey(day.date);
              const events = byDay.get(key) ?? [];

              return (
                <MonthCell
                  key={key}
                  day={day}
                  events={events}
                  today={sameDay(day.date, today)}
                  expanded={hovered === key}
                  onEnter={() => schedule(events.length > 0 ? key : null)}
                  onFocus={() => {
                    // El teclado no espera: quien tabula ya decidió mirar.
                    cancel();
                    setHovered(events.length > 0 ? key : null);
                  }}
                  onOpen={() => {
                    // Se cierra el panel a propósito: así la celda sigue
                    // montada y el modal puede devolverle el foco al cerrarse.
                    cancel();
                    setHovered(null);
                    setModal({ date: day.date, events });
                  }}
                />
              );
            })}
          </div>
        ))}

        {panel !== null && placement !== null && panelDate !== null && panelEvents.length > 0 && (
          <DayPanel
            // La clave es solo el día, no la dirección: al cerrar tiene que ser
            // el **mismo** elemento para que la transición salga desde donde
            // está. Remontarlo lo haría empezar de cero. Cambiar de día sí
            // remonta, que es lo que reinicia el crecimiento en la celda nueva.
            key={panel.key}
            date={panelDate}
            events={panelEvents}
            placement={placement}
            now={today}
            closing={panel.closing}
            onPointerEnter={cancel}
            // Se desmonta cuando la transición de cierre acaba de verdad, no a
            // los 200 ms de reloj: con `prefers-reduced-motion` la regla global
            // la deja en 0,01 ms y esperar sería dejarlo 200 ms en pantalla.
            onClosed={() => setPanel((current) => (current?.closing ? null : current))}
            // Aquí **no** se cierra el panel: el botón pulsado vive dentro, y
            // desmontarlo dejaría al modal sin nodo al que devolver el foco.
            onOpenEvent={(entry) => setModal({ date: panelDate, events: [entry] })}
          />
        )}
      </div>

      {modal !== null && (
        <DayModal
          date={modal.date}
          events={modal.events}
          now={today}
          onClose={() => setModal(null)}
        />
      )}
    </section>
  );
}

/**
 * De la lista de pendientes a lo que pinta el calendario.
 *
 * El calendario lee **la misma caché que Pendientes**, sin filtrar: la clave
 * `["pending"]` trae los eventos enteros, incluido lo vencido hace semanas, y
 * eso aquí es justo lo que hace falta. Una vista mensual que esconde lo del
 * martes pasado está rota por definición.
 *
 * El filtro de 24 horas vive en el `select` de la pantalla de Pendientes y no
 * toca la caché, precisamente para que esto siga viendo el ciclo completo.
 */

import type { PendingItem } from "../../api/pending";
import { classifyEvent, compareByPriority, type EventKind, type PaDetail } from "../../lib/eventKind";
import { dayKeyOf } from "../../lib/month";

export type DayEvent = {
  item: PendingItem;
  kind: EventKind;
  priority: number;
  pa: PaDetail | null;
  /** Repetido desde `item` para poder ordenar sin volver a entrar al objeto. */
  due: number;
};

export type EventsByDay = Map<string, DayEvent[]>;

/**
 * Indexa los eventos por día, ya ordenados por urgencia de tipo.
 *
 * El orden se fija aquí y no al pintar porque la celda solo enseña tres: si el
 * recorte se hiciera sobre una lista sin ordenar, lo que quedaría fuera del
 * "+N" sería lo que el array trajera primero, y podría esconder una integral
 * detrás de tres foros.
 */
export function groupByDay(items: PendingItem[]): EventsByDay {
  const byDay: EventsByDay = new Map();

  for (const item of items) {
    const { kind, priority, pa } = classifyEvent(item.name, item.kind);
    const entry: DayEvent = { item, kind, priority, pa, due: item.due };

    const key = dayKeyOf(item.due);
    const bucket = byDay.get(key);
    if (bucket === undefined) byDay.set(key, [entry]);
    else bucket.push(entry);
  }

  for (const bucket of byDay.values()) bucket.sort(compareByPriority);

  return byDay;
}

// --------------------------------------------------------------------------
// Colocación del panel
// --------------------------------------------------------------------------

/** El panel siempre mide dos celdas de ancho. Solo cambia el alto. */
export const PANEL_COLUMNS = 2;

export type Placement = {
  /** Columna de la retícula donde empieza el bloque, de 1 a 7. */
  column: number;
  /** Fila de la retícula donde empieza. La 1 es el encabezado de días. */
  row: number;
  columns: number;
  rows: number;
  /** Dónde cae la celda apuntada dentro del bloque, para saber desde qué
   *  esquina —o desde qué punto medio— tiene que crecer el panel. */
  columnOffset: number;
  rowOffset: number;
};

/** Un evento cabe en 2×2; varios piden una fila más para no recortarse. */
export function panelRows(eventCount: number): number {
  return eventCount > 1 ? 3 : 2;
}

/**
 * Dónde va el panel de un día.
 *
 * La regla que manda es que **el bloque nunca puede pasar de la última línea de
 * la retícula**: si lo hiciera, la retícula crearía una fila implícita y todo
 * el mes se desplazaría. Por eso se ancla hacia dentro en los bordes, y no por
 * estética.
 *
 * Con tres filas de alto el margen se estrecha: ya no basta con mirar la última
 * fila, porque un bloque que empieza en la penúltima también se saldría. De ahí
 * `week > weekCount - rows`, que vale para los dos altos sin casos especiales.
 */
export function panelPlacement(
  week: number,
  column: number,
  weekCount: number,
  eventCount: number,
  columnCount = 7,
): Placement {
  const rows = panelRows(eventCount);

  const left = column === columnCount - 1;
  const start = left ? column : column + 1;

  // La fila 1 de la retícula es el encabezado, así que la semana `w` vive en
  // la pista `w + 2` y la última línea es `weekCount + 2`.
  const up = week > weekCount - rows;
  const row = up ? weekCount + 2 - rows : week + 2;

  return {
    column: start,
    row,
    columns: PANEL_COLUMNS,
    rows,
    columnOffset: left ? 1 : 0,
    rowOffset: week + 2 - row,
  };
}

/** Cuántos eventos caben en una celda antes de resumir con un "+N". */
export const MAX_PER_CELL = 3;

export type CellEvents = {
  shown: DayEvent[];
  /** Cuántos quedaron fuera. 0 cuando caben todos. */
  rest: number;
};

/**
 * Lo que se enseña en una celda.
 *
 * Con exactamente cuatro eventos se enseñan los cuatro y no tres más un "+1":
 * un "+1" ocupa la misma línea que el evento que esconde, así que esconderlo no
 * ahorra nada y cuesta un clic.
 */
export function cellEvents(events: DayEvent[]): CellEvents {
  if (events.length <= MAX_PER_CELL + 1) return { shown: events, rest: 0 };
  return { shown: events.slice(0, MAX_PER_CELL), rest: events.length - MAX_PER_CELL };
}

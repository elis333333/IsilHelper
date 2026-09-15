/**
 * Clasificación de los pendientes.
 *
 * La API los devuelve como eventos sueltos de todos los cursos. Lo que hace
 * útil la pantalla es ordenarlos por fecha y separarlos por urgencia, no por
 * curso: agrupar por curso es exactamente lo que hoy obliga a abrir once
 * pestañas.
 *
 * Todo aquí es puro y se prueba sin red ni reloj del sistema: el "ahora" se
 * pasa como argumento.
 */

import type { CalendarEvent } from "./types";
import { classifyEvent } from "../lib/eventKind";

export type Urgency = "overdue" | "today" | "week" | "later";

export type PendingItem = {
  id: number;
  name: string;
  /** Segundos Unix. */
  due: number;
  urgency: Urgency;
  courseId: number | null;
  courseName: string | null;
  /** El `shortname` de Moodle, si vino. Es la abreviatura preferida para donde
   *  no cabe el nombre largo; puede no servir, y `courseShortLabel` decide. */
  courseShort: string | null;
  /** Tipo de actividad (`assign`, `quiz`, …) cuando Moodle lo informa. */
  kind: string | null;
  url: string | null;
};

const DAY_MS = 86_400_000;

/** Medianoche local del día de `at`. Se calcula en local a propósito: el
 *  estudiante piensa en "hoy" según su reloj, no en UTC. */
export function startOfDay(at: Date): Date {
  return new Date(at.getFullYear(), at.getMonth(), at.getDate());
}

export function classify(dueSeconds: number, now: Date): Urgency {
  const due = dueSeconds * 1000;
  const todayStart = startOfDay(now).getTime();
  const tomorrowStart = todayStart + DAY_MS;

  if (due < todayStart) return "overdue";
  if (due < tomorrowStart) return "today";
  // "Esta semana" son los siete días siguientes, contados desde mañana.
  if (due < tomorrowStart + 7 * DAY_MS) return "week";
  return "later";
}

function courseOf(event: CalendarEvent): {
  id: number | null;
  name: string | null;
  short: string | null;
} {
  if (!event.course) return { id: null, name: null, short: null };
  return {
    id: event.course.id,
    name: event.course.fullname ?? event.course.shortname ?? null,
    short: event.course.shortname ?? null,
  };
}

/**
 * De eventos crudos a pendientes ordenados por fecha.
 *
 * Descarta los que no traen `timesort`, porque sin fecha no se pueden ordenar
 * ni clasificar y colarlos al final sería inventar una prioridad.
 */
export function toPendingItems(events: CalendarEvent[], now: Date): PendingItem[] {
  return events
    .filter((event) => typeof event.timesort === "number" && event.timesort > 0)
    .map((event) => {
      const course = courseOf(event);
      return {
        id: event.id,
        name: event.name,
        due: event.timesort,
        // Moodle marca `overdue` por su cuenta; si viene, se respeta.
        urgency: event.overdue === true ? "overdue" : classify(event.timesort, now),
        courseId: course.id,
        courseName: course.name,
        courseShort: course.short,
        kind: event.modulename ?? null,
        url: event.action?.url ?? event.url ?? event.viewurl ?? null,
      } satisfies PendingItem;
    })
    .sort((a, b) => a.due - b.due);
}

/** Cuántos hay en cada grupo, para el resumen de cabecera. */
export function countByUrgency(items: PendingItem[]): Record<Urgency, number> {
  const counts: Record<Urgency, number> = { overdue: 0, today: 0, week: 0, later: 0 };
  for (const item of items) counts[item.urgency] += 1;
  return counts;
}

/** Cuánto tiempo sigue a la vista lo que ya venció. */
export const OVERDUE_WINDOW_HOURS = 24;

/**
 * Quita de la lista lo que venció hace más de un día.
 *
 * La pantalla enseñaba cosas vencidas hacía ocho días, y eso no es información:
 * es ruido que empuja hacia abajo lo que todavía se puede entregar. Un día de
 * margen es lo que hace falta para que algo que venció anoche siga a la vista
 * esta mañana.
 *
 * **Se aplica en la capa de datos y no al pintar**, para que el contador de
 * VENCIDO cuente exactamente lo que la lista enseña. Un resumen que dice 9 y
 * una lista que enseña 1 es peor que no tener resumen.
 *
 * Lo que no hace es tocar la caché: el calendario y el buscador leen los mismos
 * eventos sin filtrar, porque un calendario que esconde lo del martes pasado
 * está roto por definición.
 */
export function dropStaleOverdue(items: PendingItem[], now: Date): PendingItem[] {
  const floor = now.getTime() - OVERDUE_WINDOW_HOURS * 3_600_000;
  return items.filter((item) => item.due * 1000 >= floor);
}

export type ExamCount = {
  /** `ei + pa`. No es todo lo pendiente: solo lo que es evaluación. */
  total: number;
  ei: number;
  pa: number;
};

/**
 * Las evaluaciones —integrales y procesos de aprendizaje— de esta semana.
 *
 * Cuenta **eventos, no evaluaciones distintas**: en los cursos VIR un mismo
 * Proceso de Aprendizaje puede traer dos fechas —cuando vence y cuando se
 * cierra— y las dos son cosas que hay que hacer en un día concreto. Fundirlas
 * en una escondería una de las dos.
 *
 * **Los dos bordes son los de la lista, y eso no es una comodidad: es la
 * corrección de un fallo real.** La primera versión tenía aritmética propia
 * —`[ahora, ahora + 7 días]` en milisegundos— y en la primera captura contra la
 * cuenta real la franja decía «1 proceso de aprendizaje» mientras la tarjeta
 * decía 3 y la lista enseñaba dos PA marcados ESTA SEMANA. La causa era el
 * borde superior: un PA que vence a las 23:59 del séptimo día queda fuera de
 * una ventana medida desde las 18:00, aunque la lista lo agrupe por día y lo
 * etiquete ESTA SEMANA. Dos criterios para la misma palabra en la misma
 * pantalla.
 *
 * Ahora no hay dos criterios porque no hay aritmética propia:
 *
 * - Arriba, `urgency !== "later"`, que es literalmente la etiqueta que la fila
 *   enseña. Si algún día cambia el reparto de `classify`, esto lo sigue solo.
 * - Abajo, `dropStaleOverdue`, el mismo filtro que decide qué filas se ven. Lo
 *   que está visible en la lista está contado en la franja, incluida una
 *   integral que venció hace dos horas: la franja se vende como el aviso único
 *   sobre evaluaciones, y callar lo que está a la vista es mentir por omisión.
 *
 * Se vuelve a filtrar por cuenta propia aunque la pantalla ya le pase la lista
 * filtrada. Es idempotente, y así la cuenta no depende de que quien llame se
 * acuerde.
 */
export function countUpcomingExams(items: PendingItem[], now: Date): ExamCount {
  const counts: ExamCount = { total: 0, ei: 0, pa: 0 };

  for (const item of dropStaleOverdue(items, now)) {
    if (item.urgency === "later") continue;

    const { kind } = classifyEvent(item.name, item.kind);
    if (kind === "EI") counts.ei += 1;
    else if (kind === "PA") counts.pa += 1;
    else continue;

    counts.total += 1;
  }

  return counts;
}

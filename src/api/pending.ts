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

export type Urgency = "overdue" | "today" | "week" | "later";

export type PendingItem = {
  id: number;
  name: string;
  /** Segundos Unix. */
  due: number;
  urgency: Urgency;
  courseId: number | null;
  courseName: string | null;
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

function courseOf(event: CalendarEvent): { id: number | null; name: string | null } {
  if (!event.course) return { id: null, name: null };
  return {
    id: event.course.id,
    name: event.course.fullname ?? event.course.shortname ?? null,
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

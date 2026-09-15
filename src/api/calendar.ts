/**
 * Pendientes de todos los cursos.
 *
 * Se pide desde 30 días atrás para que lo vencido reciente también aparezca:
 * una entrega que se pasó hace tres días sigue importando, y esconderla es
 * justo lo que hace la plataforma hoy.
 *
 * **Va paginado.** La función devuelve como mucho `limitnum` eventos y espera
 * que se pida la siguiente página con `aftereventid`. Sin paginar la lista
 * sale corta sin avisar de nada, que en esta pantalla equivale a mentir por
 * omisión: el estudiante ve menos pendientes de los que tiene.
 */

import { callWebService } from "./client";
import { withToken } from "./call";
import { ok, type Result } from "./result";
import type { ApiError } from "./errors";
import type { ActionEventsResponse, CalendarEvent } from "./types";
import { collectPages } from "./paginate";
import { CYCLE_START_ISO } from "../lib/constants";

const FUNCTION = "core_calendar_get_action_events_by_timesort";

/**
 * La ventana móvil que había antes. Sigue existiendo para cubrir el tramo en
 * que el inicio de ciclo aún no ha llegado o acaba de llegar: en los primeros
 * días de septiembre, 30 días atrás alcanzan más lejos que el propio inicio.
 */
const LOOKBACK_DAYS = 30;

/**
 * Desde cuándo se piden los eventos: **el inicio del ciclo**, o 30 días atrás
 * si eso fuera anterior.
 *
 * Antes eran 30 días fijos, que le bastaban a la lista de pendientes pero no
 * al calendario: un mes que cayera fuera de esa ventana salía vacío, y un
 * calendario vacío no se distingue de un calendario roto. La ampliación no le
 * cuesta nada a Pendientes, porque esa pantalla ya esconde lo vencido hace más
 * de un día.
 *
 * Cabe de sobra en el tope de 500 eventos: un ciclo de 11 cursos ronda el
 * centenar. Si alguna vez no cupiera, `complete` se pondría en `false` y la
 * pantalla ya lo dice.
 *
 * **La ventana crece si nadie actualiza `CYCLE_START_ISO`.** Empezado el ciclo
 * siguiente sin tocar la constante, esto seguiría pidiendo desde septiembre de
 * 2026, cada vez más atrás. No se corrige con código porque no hay forma de
 * saber desde aquí cuándo empieza un ciclo —la API no lo dice—, y el tope de
 * 500 eventos con su `complete: false` es lo que avisa si algún día estorba.
 */
export function lookbackFrom(now: Date): number {
  const cycleStart = Math.floor(Date.parse(CYCLE_START_ISO) / 1000);
  const rolling = Math.floor(now.getTime() / 1000) - LOOKBACK_DAYS * 86_400;
  return Math.min(cycleStart, rolling);
}

/** Moodle rechaza `limitnum` por encima de 50. */
export const PAGE_SIZE = 50;
/** Tope de seguridad: 500 eventos son de sobra para un ciclo. */
export const MAX_PAGES = 10;

export type PendingEvents = {
  events: CalendarEvent[];
  pages: number;
  /** `false` si se cortó por error o por el tope: la lista es parcial. */
  complete: boolean;
};

export async function getActionEventsPaged(
  now: Date = new Date(),
): Promise<Result<PendingEvents, ApiError>> {
  const timesortfrom = lookbackFrom(now);

  const collected = await collectPages<CalendarEvent>(
    async (after) => {
      const params: Record<string, string | number> = {
        timesortfrom,
        limitnum: PAGE_SIZE,
      };
      if (after !== undefined) params.aftereventid = after;

      const response = await withToken((token) =>
        callWebService<ActionEventsResponse>(token, FUNCTION, params),
      );
      if (!response.ok) return response;

      const events = response.value.events ?? [];
      return ok({
        items: events,
        lastId: response.value.lastid ?? events.at(-1)?.id,
      });
    },
    PAGE_SIZE,
    MAX_PAGES,
  );

  // Solo se propaga el error si no se pudo traer nada. Con datos parciales es
  // más útil enseñarlos marcados que no enseñar nada.
  if (collected.items.length === 0 && collected.error) {
    return { ok: false, error: collected.error };
  }

  return ok({
    events: collected.items,
    pages: collected.pages,
    complete: collected.complete,
  });
}

export async function getActionEvents(
  now: Date = new Date(),
): Promise<Result<CalendarEvent[], ApiError>> {
  const paged = await getActionEventsPaged(now);
  return paged.ok ? ok(paged.value.events) : paged;
}

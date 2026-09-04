/**
 * Pendientes de todos los cursos en una sola llamada.
 *
 * Se pide desde 30 días atrás para que lo vencido reciente también aparezca:
 * una entrega que se pasó hace tres días sigue importando, y esconderla es
 * justo lo que hace la plataforma hoy.
 */

import { callWebService } from "./client";
import { withToken } from "./call";
import type { Result } from "./result";
import type { ApiError } from "./errors";
import type { ActionEventsResponse, CalendarEvent } from "./types";
import { ok } from "./result";

const LOOKBACK_DAYS = 30;
const LIMIT = 50;

export async function getActionEvents(
  now: Date = new Date(),
): Promise<Result<CalendarEvent[], ApiError>> {
  const from = Math.floor(now.getTime() / 1000) - LOOKBACK_DAYS * 86_400;

  const response = await withToken((token) =>
    callWebService<ActionEventsResponse>(
      token,
      "core_calendar_get_action_events_by_timesort",
      { timesortfrom: from, limitnum: LIMIT },
    ),
  );

  if (!response.ok) return response;
  // La función envuelve la lista en `events`; si algún día no viniera, una
  // lista vacía es más honesto que reventar.
  return ok(response.value.events ?? []);
}
